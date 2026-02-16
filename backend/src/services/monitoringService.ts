import mongoose from 'mongoose';
import { monitorEventLoopDelay } from 'node:perf_hooks';
import { NextFunction, Request, Response } from 'express';

interface RouteStats {
  count: number;
  errors: number;
  totalMs: number;
}

interface MonitoringState {
  startedAt: number;
  requests: number;
  errors: number;
  routes: Map<string, RouteStats>;
}

const state: MonitoringState = {
  startedAt: Date.now(),
  requests: 0,
  errors: 0,
  routes: new Map<string, RouteStats>()
};

const eventLoop = monitorEventLoopDelay({ resolution: 20 });
eventLoop.enable();

let intervalHandle: NodeJS.Timeout | null = null;

const normalizedRouteKey = (req: Request): string => {
  const method = req.method.toUpperCase();
  const rawPath = req.route?.path?.toString() || req.path || req.originalUrl || '/';
  const normalizedPath = rawPath
    .replace(/[0-9a-fA-F]{24}/g, ':id')
    .replace(/\d+/g, ':num');
  return `${method} ${normalizedPath}`;
};

const getRouteStats = (key: string): RouteStats => {
  const existing = state.routes.get(key);
  if (existing) return existing;
  const next: RouteStats = { count: 0, errors: 0, totalMs: 0 };
  state.routes.set(key, next);
  return next;
};

export const requestMetricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const key = normalizedRouteKey(req);
    const stats = getRouteStats(key);

    state.requests += 1;
    stats.count += 1;
    stats.totalMs += durationMs;

    if (res.statusCode >= 500) {
      state.errors += 1;
      stats.errors += 1;
    }
  });

  next();
};

const topRoutes = (maxItems = 15) => {
  return [...state.routes.entries()]
    .map(([route, stats]) => ({
      route,
      count: stats.count,
      errors: stats.errors,
      avgMs: stats.count ? Number((stats.totalMs / stats.count).toFixed(2)) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);
};

export const getMetricsSnapshot = () => {
  const uptimeSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
  const memory = process.memoryUsage();
  const mongoReady = mongoose.connection.readyState === 1;
  const errorRate = state.requests ? state.errors / state.requests : 0;

  return {
    status: mongoReady ? 'ok' : 'degraded',
    uptimeSeconds,
    process: {
      pid: process.pid,
      version: process.version,
      env: process.env.NODE_ENV || 'development'
    },
    mongo: {
      readyState: mongoose.connection.readyState,
      status: mongoReady ? 'connected' : 'disconnected'
    },
    requests: {
      total: state.requests,
      errors: state.errors,
      errorRate: Number((errorRate * 100).toFixed(2))
    },
    memory: {
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external
    },
    eventLoop: {
      meanMs: Number((eventLoop.mean / 1e6).toFixed(2)),
      p95Ms: Number((eventLoop.percentile(95) / 1e6).toFixed(2)),
      maxMs: Number((eventLoop.max / 1e6).toFixed(2))
    },
    topRoutes: topRoutes()
  };
};

export const startMonitoring = () => {
  if (intervalHandle) return;

  const maxErrorRate = Number(process.env.ALERT_ERROR_RATE_PERCENT || 5);
  const maxEventLoopLagMs = Number(process.env.ALERT_EVENT_LOOP_LAG_MS || 300);
  const intervalMs = Number(process.env.MONITORING_INTERVAL_MS || 60_000);

  intervalHandle = setInterval(() => {
    const snapshot = getMetricsSnapshot();
    if (snapshot.mongo.status !== 'connected') {
      console.error('[monitoring] MongoDB is disconnected');
    }

    if (snapshot.requests.errorRate >= maxErrorRate) {
      console.error(
        `[monitoring] High error rate: ${snapshot.requests.errorRate}% (threshold ${maxErrorRate}%)`
      );
    }

    if (snapshot.eventLoop.p95Ms >= maxEventLoopLagMs) {
      console.error(
        `[monitoring] Event loop lag is high: p95=${snapshot.eventLoop.p95Ms}ms (threshold ${maxEventLoopLagMs}ms)`
      );
    }
  }, intervalMs);
};

