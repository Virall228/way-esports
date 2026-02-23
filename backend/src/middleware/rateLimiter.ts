import { NextFunction, Request, Response } from 'express';

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

const now = () => Date.now();

const makeKey = (prefix: string, req: Request, identity: 'ip' | 'user') => {
  if (identity === 'user') {
    const userId = (req as any).user?._id?.toString?.() || (req as any).user?.id;
    if (userId) return `${prefix}:u:${userId}`;
  }
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return `${prefix}:ip:${ip}`;
};

export const createInMemoryLimiter = (options: {
  keyPrefix: string;
  max: number;
  windowMs: number;
  identity?: 'ip' | 'user';
}) => {
  const { keyPrefix, max, windowMs, identity = 'ip' } = options;
  return (req: Request, res: Response, next: NextFunction) => {
    const key = makeKey(keyPrefix, req, identity);
    const current = store.get(key);
    const ts = now();

    if (!current || current.resetAt <= ts) {
      store.set(key, { count: 1, resetAt: ts + windowMs });
      return next();
    }

    if (current.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - ts) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        retryAfter
      });
    }

    current.count += 1;
    store.set(key, current);
    return next();
  };
};

// Global API limiter: generous default, per-IP.
export const apiLimiter = createInMemoryLimiter({
  keyPrefix: 'api',
  max: Number(process.env.RATE_LIMIT_API_MAX || 1200),
  windowMs: Number(process.env.RATE_LIMIT_API_WINDOW_MS || 60_000),
  identity: 'ip'
});

// Auth limiter: tighter for brute-force protection.
export const authLimiter = createInMemoryLimiter({
  keyPrefix: 'auth',
  max: Number(process.env.RATE_LIMIT_AUTH_MAX || 40),
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS || 60_000),
  identity: 'ip'
});

export const createAccountLimiter = createInMemoryLimiter({
  keyPrefix: 'create_account',
  max: Number(process.env.RATE_LIMIT_CREATE_ACCOUNT_MAX || 15),
  windowMs: Number(process.env.RATE_LIMIT_CREATE_ACCOUNT_WINDOW_MS || 60_000),
  identity: 'ip'
});

 
