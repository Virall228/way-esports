import { NextFunction, Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

const REDACTED_KEYS = [
  'password',
  'passwordHash',
  'token',
  'jwt',
  'sessionToken',
  'code',
  'otp'
];

const redactValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      if (REDACTED_KEYS.includes(key)) {
        next[key] = '[REDACTED]';
      } else {
        next[key] = redactValue(val);
      }
    });
    return next;
  }

  return value;
};

const mapAction = (method: string): 'create' | 'update' | 'delete' | 'custom' => {
  if (method === 'POST') return 'create';
  if (method === 'PUT' || method === 'PATCH') return 'update';
  if (method === 'DELETE') return 'delete';
  return 'custom';
};

export const adminAuditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const startedAt = Date.now();
  const actor: any = (req as any).user || {};

  res.on('finish', () => {
    const payload = redactValue({
      params: req.params,
      query: req.query,
      body: req.body
    });

    AuditLog.create({
      actorId: actor?._id || undefined,
      actorRole: actor?.role || undefined,
      actorTelegramId: actor?.telegramId || undefined,
      action: mapAction(req.method),
      entity: req.params?.entity || req.path.split('/').filter(Boolean)[0] || 'admin',
      entityId: req.params?.id || req.params?.userId || undefined,
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      requestId: req.header('x-request-id') || undefined,
      ip: req.ip || req.socket.remoteAddress || undefined,
      userAgent: req.header('user-agent') || undefined,
      durationMs: Date.now() - startedAt,
      payload
    }).catch((error: unknown) => {
      console.error('Failed to write audit log:', error);
    });
  });

  return next();
};

