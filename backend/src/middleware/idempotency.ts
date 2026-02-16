import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import IdempotencyKey from '../models/IdempotencyKey';

interface IdempotencyOptions {
  required?: boolean;
  ttlSeconds?: number;
  keyHeader?: string;
  scope?: (req: Request) => string;
  userKey?: (req: Request) => string;
}

const DEFAULT_HEADER = 'x-idempotency-key';
const DEFAULT_TTL_SECONDS = 60 * 60;
const MIN_KEY_LENGTH = 8;
const MAX_KEY_LENGTH = 128;
const MAX_STORED_BODY_BYTES = 64 * 1024;

const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) return '';

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    const encoded = entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`);
    return `{${encoded.join(',')}}`;
  }

  return JSON.stringify(value);
};

const hashPayload = (value: unknown): string =>
  crypto.createHash('sha256').update(stableStringify(value)).digest('hex');

const truncatePayload = (payload: unknown): unknown => {
  if (payload === null || payload === undefined) return payload;

  try {
    const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
    if (Buffer.byteLength(text, 'utf8') <= MAX_STORED_BODY_BYTES) {
      return typeof payload === 'string' ? payload : JSON.parse(text);
    }

    const clipped = text.slice(0, MAX_STORED_BODY_BYTES);
    return {
      truncated: true,
      preview: clipped
    };
  } catch {
    return { truncated: true };
  }
};

const getDefaultUserKey = (req: Request): string => {
  const userId = (req as any)?.user?._id?.toString?.() || (req as any)?.user?.id?.toString?.();
  if (userId) return `user:${userId}`;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `anonymous:${ip}`;
};

const sendReplay = (res: Response, code?: number, payload?: unknown) => {
  res.setHeader('X-Idempotent-Replay', 'true');
  const statusCode = Number.isFinite(code) && Number(code) > 0 ? Number(code) : 200;

  if (payload === undefined) {
    return res.status(statusCode).json({ success: true, replay: true });
  }

  if (typeof payload === 'string') {
    return res.status(statusCode).send(payload);
  }

  return res.status(statusCode).json(payload);
};

const handleExistingRecord = (res: Response, existing: any, requestHash: string): boolean => {
  if (!existing) return false;

  if (existing.requestHash !== requestHash) {
    res.status(409).json({
      success: false,
      error: 'Idempotency key already used with different payload'
    });
    return true;
  }

  if (existing.status === 'completed') {
    sendReplay(res, existing.responseCode, existing.responseBody);
    return true;
  }

  if (existing.status === 'processing') {
    res.status(409).json({
      success: false,
      error: 'Request with this idempotency key is already processing'
    });
    return true;
  }

  return false;
};

export const idempotency = (options: IdempotencyOptions = {}) => {
  const {
    required = false,
    ttlSeconds = DEFAULT_TTL_SECONDS,
    keyHeader = DEFAULT_HEADER,
    scope = (req: Request) => `${req.method}:${req.baseUrl}${req.path}`,
    userKey = getDefaultUserKey
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const rawHeader = req.header(keyHeader) || req.header(keyHeader.toLowerCase());
    const key = (rawHeader || '').trim();

    if (!key) {
      if (required) {
        return res.status(400).json({
          success: false,
          error: `Missing ${keyHeader} header`
        });
      }
      return next();
    }

    if (key.length < MIN_KEY_LENGTH || key.length > MAX_KEY_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `${keyHeader} must be ${MIN_KEY_LENGTH}-${MAX_KEY_LENGTH} chars`
      });
    }

    const requestScope = scope(req);
    const requestUserKey = userKey(req);
    const requestHash = hashPayload({
      body: req.body || {},
      query: req.query || {},
      params: req.params || {}
    });

    try {
      const existing = await IdempotencyKey.findOne({
        key,
        scope: requestScope,
        userKey: requestUserKey
      })
        .select('status requestHash responseCode responseBody')
        .lean();

      if (handleExistingRecord(res, existing, requestHash)) {
        return;
      }

      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      let created: any;

      try {
        created = await IdempotencyKey.create({
          key,
          scope: requestScope,
          userKey: requestUserKey,
          requestHash,
          status: 'processing',
          expiresAt
        });
      } catch (createError: any) {
        if (createError?.code === 11000) {
          const duplicate = await IdempotencyKey.findOne({
            key,
            scope: requestScope,
            userKey: requestUserKey
          })
            .select('status requestHash responseCode responseBody')
            .lean();

          if (handleExistingRecord(res, duplicate, requestHash)) {
            return;
          }
        }

        throw createError;
      }

      let capturedBody: unknown;

      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      (res as any).json = (body: unknown) => {
        capturedBody = body;
        return originalJson(body);
      };

      (res as any).send = (body: unknown) => {
        capturedBody = body;
        return originalSend(body);
      };

      res.on('finish', () => {
        const nextStatus = res.statusCode >= 500 ? 'failed' : 'completed';
        const safeBody = truncatePayload(capturedBody);

        IdempotencyKey.findByIdAndUpdate(created._id, {
          $set: {
            status: nextStatus,
            responseCode: res.statusCode,
            responseBody: safeBody,
            expiresAt: new Date(Date.now() + ttlSeconds * 1000)
          }
        }).catch((updateError: unknown) => {
          console.error('Failed to update idempotency key:', updateError);
        });
      });

      return next();
    } catch (error) {
      console.error('Idempotency middleware error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process idempotent request'
      });
    }
  };
};

