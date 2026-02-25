import express from 'express';
import mongoose from 'mongoose';
import { getDashboardStats, getAnalytics, updateEntity, deleteEntity } from '../controllers/adminController';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import User from '../models/User';
import Team from '../models/Team';
import Tournament from '../models/Tournament';
import ContactMessage from '../models/ContactMessage';
import Wallet from '../models/Wallet';
import AuditLog from '../models/AuditLog';
import AuthLog from '../models/AuthLog';
import { adminAuditMiddleware } from '../middleware/adminAudit';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import { idempotency } from '../middleware/idempotency';
import { getMetricsSnapshot } from '../services/monitoringService';
import { getQueueStats } from '../services/queue';
import { listJsonBackups, runJsonBackup } from '../services/backupService';

const router = express.Router();

type UserTransactionStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'refund_pending'
  | 'refunded'
  | 'refund_denied';

const USER_TRANSACTION_STATUS_SET = new Set<UserTransactionStatus>([
  'pending',
  'completed',
  'failed',
  'refund_pending',
  'refunded',
  'refund_denied'
]);

const USER_TRANSACTION_TYPE_SET = new Set([
  'deposit',
  'withdrawal',
  'prize',
  'fee',
  'subscription',
  'referral'
]);

const toWalletStatus = (status: UserTransactionStatus): 'pending' | 'completed' | 'failed' => {
  if (status === 'pending' || status === 'refund_pending') return 'pending';
  if (status === 'failed') return 'failed';
  return 'completed';
};

const toWalletType = (
  type: string,
  amount: number
): 'deposit' | 'withdrawal' | 'prize' | 'fee' => {
  if (type === 'prize') return 'prize';
  if (type === 'fee') return 'fee';
  if (type === 'withdrawal') return 'withdrawal';
  if (type === 'deposit') return 'deposit';
  return amount >= 0 ? 'deposit' : 'withdrawal';
};

const toNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildAuthLogQuery = (queryParams: Record<string, unknown>) => {
  const event = typeof queryParams.event === 'string' ? queryParams.event.trim() : '';
  const method = typeof queryParams.method === 'string' ? queryParams.method.trim() : '';
  const status = typeof queryParams.status === 'string' ? queryParams.status.trim() : '';
  const userId = typeof queryParams.userId === 'string' ? queryParams.userId.trim() : '';
  const search = typeof queryParams.search === 'string' ? queryParams.search.trim() : '';

  const query: Record<string, unknown> = {};

  if (event) query.event = event;
  if (method) query.method = method;
  if (status) query.status = status;
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    query.userId = new mongoose.Types.ObjectId(userId);
  }

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i');
    query.$or = [
      { identifier: regex },
      { reason: regex },
      { ip: regex },
      { userAgent: regex }
    ];
  }

  return query;
};

const csvEscape = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
};

const ensureWalletDoc = async (userId: mongoose.Types.ObjectId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await new Wallet({ user: userId }).save();
  }
  return wallet;
};

const getPrimaryAdminTelegramId = (): number | null => {
  const raw = process.env.BOOTSTRAP_ADMIN_TELEGRAM_ID || process.env.ADMIN_TELEGRAM_ID;
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const isPrimaryAdminOnlyMode = (): boolean => {
  const raw = (process.env.PRIMARY_ADMIN_ONLY || '').toLowerCase().trim();
  return raw === '1' || raw === 'true' || raw === 'yes';
};

// All admin routes are protected by JWT and Admin role
router.use(authenticateJWT, isAdmin);
router.use((req, res, next) => {
  if (!isPrimaryAdminOnlyMode()) {
    return next();
  }

  const primaryAdminTelegramId = getPrimaryAdminTelegramId();
  if (!primaryAdminTelegramId) return next();

  const currentTelegramId = Number((req.user as any)?.telegramId || 0);
  if (currentTelegramId !== primaryAdminTelegramId) {
    return res.status(403).json({ success: false, error: 'Primary admin access only' });
  }

  return next();
});
router.use(adminAuditMiddleware);

router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/ops/metrics', async (_req, res) => {
  try {
    return res.json({
      success: true,
      data: getMetricsSnapshot()
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch metrics' });
  }
});

router.get('/ops/queue', async (_req, res) => {
  try {
    const stats = await getQueueStats();
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch queue stats' });
  }
});

router.get('/ops/backups', async (_req, res) => {
  try {
    const backups = await listJsonBackups();
    return res.json({
      success: true,
      data: backups
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to list backups' });
  }
});

router.get('/ops/audit-timeline', async (req, res) => {
  try {
    const hoursRaw = Number(req.query?.hours || 24);
    const bucketRaw = Number(req.query?.bucketMinutes || 60);
    const hours = Math.min(Math.max(Number.isFinite(hoursRaw) ? hoursRaw : 24, 1), 24 * 14);
    const allowedBuckets = new Set([5, 15, 30, 60, 120, 240]);
    const bucketMinutes = allowedBuckets.has(bucketRaw) ? bucketRaw : 60;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const bucketMs = bucketMinutes * 60 * 1000;

    const rows = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $project: {
          statusCode: { $ifNull: ['$statusCode', 0] },
          bucketTs: {
            $toDate: {
              $multiply: [
                bucketMs,
                {
                  $floor: {
                    $divide: [{ $toLong: '$createdAt' }, bucketMs]
                  }
                }
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: '$bucketTs',
          total: { $sum: 1 },
          success: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$statusCode', 200] }, { $lt: ['$statusCode', 300] }] },
                1,
                0
              ]
            }
          },
          clientError: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$statusCode', 400] }, { $lt: ['$statusCode', 500] }] },
                1,
                0
              ]
            }
          },
          serverError: {
            $sum: {
              $cond: [
                { $gte: ['$statusCode', 500] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const points = rows.map((row: any) => ({
      ts: row?._id instanceof Date ? row._id.toISOString() : new Date(row?._id).toISOString(),
      total: Number(row?.total || 0),
      success: Number(row?.success || 0),
      clientError: Number(row?.clientError || 0),
      serverError: Number(row?.serverError || 0)
    }));

    const totals = points.reduce(
      (acc, point) => {
        acc.total += point.total;
        acc.success += point.success;
        acc.clientError += point.clientError;
        acc.serverError += point.serverError;
        return acc;
      },
      { total: 0, success: 0, clientError: 0, serverError: 0 }
    );

    return res.json({
      success: true,
      data: {
        hours,
        bucketMinutes,
        since: since.toISOString(),
        totals,
        points
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch audit timeline' });
  }
});

router.get('/ops/errors-top', async (req, res) => {
  try {
    const hoursRaw = Number(req.query?.hours || 24);
    const limitRaw = Number(req.query?.limit || 10);
    const hours = Math.min(Math.max(Number.isFinite(hoursRaw) ? hoursRaw : 24, 1), 24 * 14);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 10, 1), 100);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const rows = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: since },
          statusCode: { $gte: 400 }
        }
      },
      {
        $group: {
          _id: {
            method: { $ifNull: ['$method', 'GET'] },
            path: { $ifNull: ['$path', '/unknown'] },
            statusCode: { $ifNull: ['$statusCode', 500] }
          },
          count: { $sum: 1 },
          lastSeenAt: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1, lastSeenAt: -1 } },
      { $limit: limit }
    ]);

    return res.json({
      success: true,
      data: {
        hours,
        since: since.toISOString(),
        limit,
        items: rows.map((row: any) => ({
          method: String(row?._id?.method || 'GET'),
          path: String(row?._id?.path || '/unknown'),
          statusCode: Number(row?._id?.statusCode || 500),
          count: Number(row?.count || 0),
          lastSeenAt: row?.lastSeenAt instanceof Date ? row.lastSeenAt.toISOString() : null
        }))
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch top errors' });
  }
});

router.get('/ops/errors-samples', async (req, res) => {
  try {
    const hoursRaw = Number(req.query?.hours || 24);
    const limitRaw = Number(req.query?.limit || 20);
    const method = typeof req.query?.method === 'string' ? req.query.method.trim().toUpperCase() : '';
    const path = typeof req.query?.path === 'string' ? req.query.path.trim() : '';
    const statusCodeRaw = Number(req.query?.statusCode || 0);

    if (!method || !path || !Number.isFinite(statusCodeRaw) || statusCodeRaw < 100) {
      return res.status(400).json({ success: false, error: 'method, path, statusCode are required' });
    }

    const hours = Math.min(Math.max(Number.isFinite(hoursRaw) ? hoursRaw : 24, 1), 24 * 14);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 20, 1), 100);
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const rows = await AuditLog.find({
      createdAt: { $gte: since },
      method,
      path,
      statusCode: statusCodeRaw
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('createdAt actorRole actorId statusCode method path entity entityId ip payload')
      .lean();

    return res.json({
      success: true,
      data: {
        hours,
        limit,
        total: rows.length,
        items: rows.map((row: any) => ({
          id: String(row?._id || ''),
          createdAt: row?.createdAt instanceof Date ? row.createdAt.toISOString() : row?.createdAt || null,
          actorRole: String(row?.actorRole || ''),
          statusCode: Number(row?.statusCode || 0),
          method: String(row?.method || ''),
          path: String(row?.path || ''),
          entity: String(row?.entity || ''),
          entityId: row?.entityId ? String(row.entityId) : '',
          ip: String(row?.ip || ''),
          payload: row?.payload || null
        }))
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch error samples' });
  }
});

router.get('/ops/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let closed = false;

  const writeEvent = async () => {
    if (closed) return;

    try {
      const payload = {
        timestamp: new Date().toISOString(),
        metrics: getMetricsSnapshot(),
        queue: await getQueueStats()
      };
      res.write(`event: snapshot\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (error: any) {
      const fallback = {
        timestamp: new Date().toISOString(),
        error: error?.message || 'stream_snapshot_failed'
      };
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify(fallback)}\n\n`);
    }
  };

  await writeEvent();

  const intervalMs = Math.max(3000, Number(process.env.OPS_STREAM_INTERVAL_MS || 10000));
  const interval = setInterval(() => {
    writeEvent().catch((error) => {
      console.error('ops stream write error', error);
    });
  }, intervalMs);

  const heartbeat = setInterval(() => {
    if (!closed) {
      res.write(': keep-alive\n\n');
    }
  }, 15000);

  req.on('close', () => {
    closed = true;
    clearInterval(interval);
    clearInterval(heartbeat);
    res.end();
  });
});

router.get('/tournaments/requests/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let closed = false;
  let previousSignature = '';

  const writeSnapshot = async () => {
    if (closed) return;
    try {
      const rows = await Tournament.find({})
        .select('_id name registrationRequests updatedAt')
        .lean();

      const pendingByTournament = rows
        .map((row: any) => {
          const pendingCount = Array.isArray(row?.registrationRequests)
            ? row.registrationRequests.filter((request: any) => request?.status === 'pending').length
            : 0;
          return {
            tournamentId: String(row?._id || ''),
            name: String(row?.name || ''),
            pendingCount,
            updatedAt: row?.updatedAt ? new Date(row.updatedAt).toISOString() : null
          };
        })
        .filter((item) => item.pendingCount > 0)
        .sort((a, b) => b.pendingCount - a.pendingCount);

      const totalPending = pendingByTournament.reduce((sum, item) => sum + item.pendingCount, 0);
      const payload = {
        timestamp: new Date().toISOString(),
        totalPending,
        pendingByTournament
      };

      const signature = JSON.stringify({
        totalPending,
        pendingByTournament: pendingByTournament.map((item) => ({
          tournamentId: item.tournamentId,
          pendingCount: item.pendingCount,
          updatedAt: item.updatedAt
        }))
      });

      if (signature !== previousSignature) {
        previousSignature = signature;
        res.write('event: snapshot\n');
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      }
    } catch (error: any) {
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ timestamp: new Date().toISOString(), error: error?.message || 'stream_failed' })}\n\n`);
    }
  };

  await writeSnapshot();
  const interval = setInterval(() => {
    writeSnapshot().catch(() => {});
  }, 10000);

  const heartbeat = setInterval(() => {
    if (!closed) {
      res.write(': keep-alive\n\n');
    }
  }, 15000);

  req.on('close', () => {
    closed = true;
    clearInterval(interval);
    clearInterval(heartbeat);
    res.end();
  });
});

router.post('/ops/backups/run', idempotency({ required: true }), async (_req, res) => {
  try {
    const startedAt = Date.now();
    const result = await runJsonBackup();
    return res.status(201).json({
      success: true,
      data: {
        snapshotDir: result.snapshotDir,
        collections: result.manifest.collections.length,
        durationMs: Date.now() - startedAt
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to create backup' });
  }
});

router.get('/audit', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 50,
      maxLimit: 200
    });
    const action = typeof req.query.action === 'string' ? req.query.action.trim() : '';
    const entity = typeof req.query.entity === 'string' ? req.query.entity.trim() : '';
    const actorId = typeof req.query.actorId === 'string' ? req.query.actorId.trim() : '';
    const actorRole = typeof req.query.actorRole === 'string' ? req.query.actorRole.trim() : '';
    const pathContains = typeof req.query.pathContains === 'string' ? req.query.pathContains.trim() : '';
    const aiEnabled = typeof req.query.aiEnabled === 'string' ? req.query.aiEnabled.trim().toLowerCase() : '';
    const from = typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (actorRole) query.actorRole = actorRole;
    if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
      query.actorId = new mongoose.Types.ObjectId(actorId);
    }
    if (pathContains) query.path = new RegExp(pathContains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (aiEnabled === 'true' || aiEnabled === 'false') {
      query['payload.aiEnabled'] = aiEnabled === 'true';
    }
    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) createdAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) createdAt.$lte = toDate;
      }
      if (Object.keys(createdAt).length > 0) {
        query.createdAt = createdAt;
      }
    }

    const [total, rows] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return res.json({
      success: true,
      data: rows,
      pagination: buildPaginationMeta(page, limit, total)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch audit logs' });
  }
});

router.get('/audit/export.csv', async (req, res) => {
  try {
    const action = typeof req.query.action === 'string' ? req.query.action.trim() : '';
    const entity = typeof req.query.entity === 'string' ? req.query.entity.trim() : '';
    const actorId = typeof req.query.actorId === 'string' ? req.query.actorId.trim() : '';
    const actorRole = typeof req.query.actorRole === 'string' ? req.query.actorRole.trim() : '';
    const pathContains = typeof req.query.pathContains === 'string' ? req.query.pathContains.trim() : '';
    const aiEnabled = typeof req.query.aiEnabled === 'string' ? req.query.aiEnabled.trim().toLowerCase() : '';
    const from = typeof req.query.from === 'string' ? req.query.from.trim() : '';
    const to = typeof req.query.to === 'string' ? req.query.to.trim() : '';
    const rawLimit = toNumber(req.query.limit, 5000);
    const limit = Math.min(Math.max(Math.trunc(rawLimit), 1), 10000);

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (actorRole) query.actorRole = actorRole;
    if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
      query.actorId = new mongoose.Types.ObjectId(actorId);
    }
    if (pathContains) query.path = new RegExp(pathContains.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (aiEnabled === 'true' || aiEnabled === 'false') {
      query['payload.aiEnabled'] = aiEnabled === 'true';
    }
    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) {
        const fromDate = new Date(from);
        if (!Number.isNaN(fromDate.getTime())) createdAt.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        if (!Number.isNaN(toDate.getTime())) createdAt.$lte = toDate;
      }
      if (Object.keys(createdAt).length > 0) {
        query.createdAt = createdAt;
      }
    }

    const rows = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const headers = [
      'createdAt',
      'action',
      'entity',
      'entityId',
      'statusCode',
      'actorRole',
      'actorTelegramId',
      'method',
      'path',
      'ip',
      'durationMs'
    ];

    const lines = [
      headers.join(','),
      ...rows.map((row: any) =>
        [
          csvEscape(row.createdAt),
          csvEscape(row.action),
          csvEscape(row.entity),
          csvEscape(row.entityId || ''),
          csvEscape(row.statusCode),
          csvEscape(row.actorRole || ''),
          csvEscape(row.actorTelegramId || ''),
          csvEscape(row.method || ''),
          csvEscape(row.path || ''),
          csvEscape(row.ip || ''),
          csvEscape(row.durationMs || '')
        ].join(',')
      )
    ];

    const csv = `${lines.join('\n')}\n`;
    const fileName = `audit_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(csv);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to export audit CSV' });
  }
});

router.get('/auth-logs', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 100,
      maxLimit: 500
    });
    const query = buildAuthLogQuery(req.query as Record<string, unknown>);

    const [total, rows] = await Promise.all([
      AuthLog.countDocuments(query),
      AuthLog.find(query)
        .populate('userId', 'username email telegramId role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);

    return res.json({
      success: true,
      data: rows,
      pagination: buildPaginationMeta(page, limit, total)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch auth logs' });
  }
});

router.get('/auth-logs/export.csv', async (req, res) => {
  try {
    const rawLimit = toNumber(req.query.limit, 5000);
    const limit = Math.min(Math.max(Math.trunc(rawLimit), 1), 10000);
    const query = buildAuthLogQuery(req.query as Record<string, unknown>);

    const rows = await AuthLog.find(query)
      .populate('userId', 'username email telegramId role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const headers = [
      'createdAt',
      'event',
      'status',
      'method',
      'userId',
      'username',
      'email',
      'telegramId',
      'role',
      'identifier',
      'reason',
      'ip',
      'userAgent'
    ];

    const lines = [
      headers.join(','),
      ...rows.map((row: any) => {
        const userData = row?.userId || {};
        return [
          csvEscape(row.createdAt),
          csvEscape(row.event),
          csvEscape(row.status),
          csvEscape(row.method),
          csvEscape(userData?._id || ''),
          csvEscape(userData?.username || ''),
          csvEscape(userData?.email || ''),
          csvEscape(userData?.telegramId || ''),
          csvEscape(userData?.role || ''),
          csvEscape(row.identifier || ''),
          csvEscape(row.reason || ''),
          csvEscape(row.ip || ''),
          csvEscape(row.userAgent || '')
        ].join(',');
      })
    ];

    const csv = `${lines.join('\n')}\n`;
    const fileName = `auth_logs_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(csv);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to export auth log CSV' });
  }
});

// Get all users (for admin panel)
router.get('/users', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 25,
      maxLimit: 200
    });
    const roleFilter = typeof req.query.role === 'string' ? req.query.role.trim() : '';
    const subscribedFilter = typeof req.query.subscribed === 'string' ? req.query.subscribed.trim() : '';
    const bannedFilter = typeof req.query.banned === 'string' ? req.query.banned.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const query: any = {};

    if (roleFilter) {
      query.role = roleFilter;
    }

    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      const searchOr: any[] = [
        { username: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex }
      ];
      if (/^\d{3,20}$/.test(search)) {
        searchOr.push({ telegramId: Number(search) });
      }
      query.$or = searchOr;
    }

    if (subscribedFilter === 'yes') {
      query.isSubscribed = true;
    } else if (subscribedFilter === 'no') {
      query.isSubscribed = false;
    }

    if (bannedFilter === 'yes') {
      query.isBanned = true;
    } else if (bannedFilter === 'no') {
      query.isBanned = false;
    }

    const [total, users, filteredSubscribed, filteredBanned] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password -passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ ...query, isSubscribed: true }),
      User.countDocuments({ ...query, isBanned: true })
    ]);
    const userIds = users.map((item: any) => item?._id).filter(Boolean);

    const wallets: any[] = await Wallet.find({ user: { $in: userIds } })
      .select('user balance')
      .lean();

    const balanceByUser = new Map<string, number>(
      wallets.map((wallet: any) => [wallet.user.toString(), Number(wallet.balance || 0)])
    );

    const normalizedUsers = users.map((item: any) => {
      const id = item?._id?.toString?.() || '';
      const walletBalanceFromWallet = balanceByUser.get(id);
      const fallbackBalance = Number(item?.wallet?.balance || 0);

      return {
        ...item,
        wallet: {
          ...(item.wallet || {}),
          balance: walletBalanceFromWallet ?? fallbackBalance
        }
      };
    });

    res.json({
      success: true,
      data: normalizedUsers,
      pagination: buildPaginationMeta(page, limit, total),
      summary: {
        filteredTotal: total,
        filteredSubscribed,
        filteredBanned
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export filtered users (CSV)
router.get('/users/export.csv', async (req, res) => {
  try {
    const roleFilter = typeof req.query.role === 'string' ? req.query.role.trim() : '';
    const subscribedFilter = typeof req.query.subscribed === 'string' ? req.query.subscribed.trim() : '';
    const bannedFilter = typeof req.query.banned === 'string' ? req.query.banned.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const query: any = {};

    if (roleFilter) query.role = roleFilter;
    if (subscribedFilter === 'yes') query.isSubscribed = true;
    else if (subscribedFilter === 'no') query.isSubscribed = false;
    if (bannedFilter === 'yes') query.isBanned = true;
    else if (bannedFilter === 'no') query.isBanned = false;

    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      const searchOr: any[] = [
        { username: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex }
      ];
      if (/^\d{3,20}$/.test(search)) {
        searchOr.push({ telegramId: Number(search) });
      }
      query.$or = searchOr;
    }

    const users: any[] = await User.find(query)
      .select('-password -passwordHash')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const userIds = users.map((item: any) => item?._id).filter(Boolean);
    const wallets: any[] = await Wallet.find({ user: { $in: userIds } })
      .select('user balance')
      .lean();
    const balanceByUser = new Map<string, number>(
      wallets.map((wallet: any) => [wallet.user.toString(), Number(wallet.balance || 0)])
    );

    const header = [
      'id',
      'username',
      'firstName',
      'lastName',
      'email',
      'telegramId',
      'role',
      'isSubscribed',
      'subscriptionExpiresAt',
      'freeEntriesCount',
      'bonusEntries',
      'walletBalance',
      'isBanned',
      'createdAt'
    ];

    const lines = [
      header.join(','),
      ...users.map((u: any) => {
        const id = u?._id?.toString?.() || '';
        const walletBalance = balanceByUser.get(id) ?? Number(u?.wallet?.balance || 0);
        return [
          csvEscape(id),
          csvEscape(u?.username || ''),
          csvEscape(u?.firstName || ''),
          csvEscape(u?.lastName || ''),
          csvEscape(u?.email || ''),
          csvEscape(u?.telegramId || ''),
          csvEscape(u?.role || 'user'),
          csvEscape(Boolean(u?.isSubscribed)),
          csvEscape(u?.subscriptionExpiresAt || ''),
          csvEscape(Number(u?.freeEntriesCount || 0)),
          csvEscape(Number(u?.bonusEntries || 0)),
          csvEscape(walletBalance),
          csvEscape(Boolean(u?.isBanned)),
          csvEscape(u?.createdAt || '')
        ].join(',');
      })
    ];

    const csv = `${lines.join('\n')}\n`;
    const fileName = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.status(200).send(csv);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to export users CSV' });
  }
});

// Create user (admin)
router.post('/users', idempotency({ required: true }), async (req, res) => {
  try {
    const {
      username,
      firstName,
      lastName,
      email,
      role,
      bio,
      isSubscribed,
      subscriptionExpiresAt,
      freeEntriesCount,
      bonusEntries,
      balance,
      isBanned
    } = req.body || {};

    if (!username || !firstName) {
      return res.status(400).json({ success: false, error: 'username and firstName are required' });
    }

    const startingBalance = toNumber(balance, 0);
    const payload: any = {
      username,
      firstName,
      lastName,
      email,
      role: role || 'user',
      bio,
      isSubscribed: !!isSubscribed,
      subscriptionExpiresAt: isSubscribed ? subscriptionExpiresAt || null : null,
      freeEntriesCount: Number(freeEntriesCount || 0),
      bonusEntries: Number(bonusEntries || 0),
      isBanned: !!isBanned,
      wallet: {
        balance: startingBalance,
        transactions: []
      }
    };

    const user = await new User(payload).save();

    await Wallet.updateOne(
      { user: user._id },
      {
        $setOnInsert: {
          user: user._id,
          balance: Math.max(0, startingBalance),
          transactions: []
        }
      },
      { upsert: true }
    );

    res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(400).json({ success: false, error: 'Duplicate user data' });
    }
    res.status(500).json({ success: false, error: error.message || 'Failed to create user' });
  }
});

// Admin subscription management
router.patch('/users/:id/subscription', async (req, res) => {
  try {
    const { id } = req.params;
    const { isSubscribed, subscriptionExpiresAt, freeEntriesCount, bonusEntries } = req.body || {};

    const user: any = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (typeof isSubscribed === 'boolean') {
      user.isSubscribed = isSubscribed;
    }

    if (subscriptionExpiresAt !== undefined) {
      user.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
    }

    if (freeEntriesCount !== undefined) {
      user.freeEntriesCount = Number(freeEntriesCount || 0);
    }

    if (bonusEntries !== undefined) {
      user.bonusEntries = Number(bonusEntries || 0);
    }

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        isSubscribed: user.isSubscribed,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        freeEntriesCount: user.freeEntriesCount,
        bonusEntries: user.bonusEntries
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update subscription' });
  }
});

// Manual wallet adjustment (credit/debit)
router.post('/users/:id/wallet/adjust', idempotency({ required: true }), async (req, res) => {
  try {
    const { id } = req.params;
    const amount = toNumber(req.body?.amount, Number.NaN);
    const reason = typeof req.body?.reason === 'string' && req.body.reason.trim()
      ? req.body.reason.trim()
      : 'Manual admin adjustment';
    const txTypeInput = typeof req.body?.type === 'string' ? req.body.type.trim() : '';

    if (!Number.isFinite(amount) || amount === 0) {
      return res.status(400).json({ success: false, error: 'amount must be a non-zero number' });
    }

    const user: any = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.wallet.balance + amount < 0) {
      return res.status(400).json({ success: false, error: 'Insufficient balance for this debit operation' });
    }

    const userTxType = USER_TRANSACTION_TYPE_SET.has(txTypeInput)
      ? txTypeInput
      : amount > 0
        ? 'deposit'
        : 'withdrawal';

    const absoluteAmount = Math.abs(amount);
    const reference = `ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    user.wallet.balance += amount;
    user.wallet.transactions.push({
      type: userTxType as any,
      amount: absoluteAmount,
      description: reason,
      status: 'completed',
      date: new Date(),
      reference
    });
    await user.save();

    const wallet = await ensureWalletDoc(user._id);
    wallet.balance = Math.max(0, wallet.balance + amount);
    wallet.transactions.push({
      type: toWalletType(userTxType, amount),
      amount: absoluteAmount,
      description: reason,
      status: 'completed',
      reference,
      date: new Date()
    });
    await wallet.save();

    res.json({
      success: true,
      data: {
        userId: user._id.toString(),
        userBalance: user.wallet.balance,
        walletBalance: wallet.balance
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to adjust wallet balance' });
  }
});

// Flattened wallet/payment transaction list for admin review
router.get('/wallet/transactions', async (req, res) => {
  try {
    const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const typeFilter = typeof req.query.type === 'string' ? req.query.type.trim() : '';
    const searchFilter = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 100,
      maxLimit: 500
    });

    const users: any[] = await User.find({}, 'username firstName lastName email telegramId wallet').lean();
    const wallets: any[] = await Wallet.find({}, 'user balance transactions')
      .populate('user', 'username email telegramId')
      .lean();
    const rows: any[] = [];

    users.forEach((entry: any) => {
      const transactions: any[] = Array.isArray(entry?.wallet?.transactions) ? entry.wallet.transactions : [];

      transactions.forEach((tx: any) => {
        const id = tx?._id?.toString?.() || '';
        if (!id) return;

        rows.push({
          id,
          userId: entry?._id?.toString?.() || '',
          source: 'user',
          username: entry?.username || '',
          email: entry?.email || '',
          telegramId: Number(entry?.telegramId || 0),
          type: tx?.type || '',
          amount: Number(tx?.amount || 0),
          status: tx?.status || '',
          description: tx?.description || '',
          walletAddress: tx?.walletAddress || '',
          network: tx?.network || '',
          txHash: tx?.txHash || '',
          processedAt: tx?.processedAt || null,
          date: tx?.date || entry?.updatedAt || new Date(),
          reference: tx?.reference || '',
          balance: Number(entry?.wallet?.balance || 0)
        });
      });
    });

    wallets.forEach((walletEntry: any) => {
      const userRef = walletEntry?.user;
      const userId = userRef?._id?.toString?.() || userRef?.toString?.() || '';
      if (!userId) return;

      const transactions: any[] = Array.isArray(walletEntry?.transactions) ? walletEntry.transactions : [];
      transactions.forEach((tx: any) => {
        const id = tx?._id?.toString?.() || '';
        if (!id) return;

        rows.push({
          id,
          userId,
          source: 'wallet',
          username: userRef?.username || '',
          email: userRef?.email || '',
          telegramId: Number(userRef?.telegramId || 0),
          type: tx?.type || '',
          amount: Number(tx?.amount || 0),
          status: tx?.status || '',
          description: tx?.description || '',
          walletAddress: tx?.walletAddress || '',
          network: tx?.network || '',
          txHash: tx?.txHash || '',
          processedAt: tx?.processedAt || null,
          date: tx?.date || walletEntry?.updatedAt || new Date(),
          reference: tx?.reference || '',
          balance: Number(walletEntry?.balance || 0)
        });
      });
    });

    const filtered = rows.filter((row: any) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (typeFilter && row.type !== typeFilter) return false;
      if (searchFilter) {
        const payload = [
          row.username,
          row.email,
          row.telegramId,
          row.walletAddress,
          row.network,
          row.txHash,
          row.description,
          row.reference,
          row.source,
          row.type,
          row.status,
          Number(row.amount || 0).toFixed(2)
        ]
          .filter((value) => value !== undefined && value !== null)
          .join(' ')
          .toLowerCase();
        if (!payload.includes(searchFilter)) return false;
      }
      return true;
    });

    filtered.sort((a: any, b: any) => {
      const left = new Date(a.date).getTime();
      const right = new Date(b.date).getTime();
      return right - left;
    });

    const total = filtered.length;
    const paged = filtered.slice(skip, skip + limit);

    res.json({
      success: true,
      data: paged,
      pagination: buildPaginationMeta(page, limit, total)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch wallet transactions' });
  }
});

// Approve/deny payment or refund requests
router.patch('/wallet/transactions/:userId/:transactionId', idempotency({ required: true }), async (req, res) => {
  try {
    const { userId, transactionId } = req.params;
    const statusValue = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    const source = typeof req.body?.source === 'string' ? req.body.source.trim() : 'user';
    const adminNote = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
    const payoutTxHash = typeof req.body?.txHash === 'string' ? req.body.txHash.trim() : '';
    const manualBalanceDelta = toNumber(req.body?.balanceDelta, 0);
    const subscriptionDays = Math.max(1, Math.trunc(toNumber(req.body?.subscriptionDays, 30)));

    if (source === 'wallet') {
      const nextWalletStatus = (
        statusValue === 'refund_denied'
          ? 'failed'
          : statusValue === 'refunded'
            ? 'completed'
            : statusValue
      ) as 'pending' | 'completed' | 'failed';

      if (!new Set(['pending', 'completed', 'failed']).has(nextWalletStatus)) {
        return res.status(400).json({ success: false, error: 'Invalid wallet transaction status value' });
      }

      const wallet: any = await Wallet.findOne({ user: userId });
      if (!wallet) {
        return res.status(404).json({ success: false, error: 'Wallet not found' });
      }

      const tx = wallet.transactions.find((item: any) => {
        const txId = item?._id?.toString?.();
        return txId === transactionId || item?.reference === transactionId;
      });

      if (!tx) {
        return res.status(404).json({ success: false, error: 'Wallet transaction not found' });
      }

      const prevWalletStatus = tx.status as 'pending' | 'completed' | 'failed';
      const amount = Number(tx.amount || 0);
      let balanceDelta = manualBalanceDelta;

      if (prevWalletStatus === 'pending' && tx.type === 'withdrawal' && nextWalletStatus === 'failed') {
        balanceDelta += amount;
      }

      if (wallet.balance + balanceDelta < 0) {
        return res.status(400).json({ success: false, error: 'Balance delta would produce negative wallet balance' });
      }

      tx.status = nextWalletStatus;
      if (tx.type === 'withdrawal' && nextWalletStatus === 'completed') {
        tx.processedAt = new Date();
        if (payoutTxHash) tx.txHash = payoutTxHash;
      }
      if (adminNote) {
        tx.description = `${tx.description} | Admin: ${adminNote}`;
      }

      if (balanceDelta !== 0) {
        wallet.balance += balanceDelta;
        wallet.transactions.push({
          type: balanceDelta > 0 ? 'deposit' : 'withdrawal',
          amount: Math.abs(balanceDelta),
          description: `Admin adjustment for wallet transaction ${transactionId}`,
          status: 'completed',
          reference: `ADM-WALLET-${Date.now()}`,
          date: new Date()
        });
      }

      await wallet.save();

      const userSync: any = await User.findById(userId);
      if (userSync) {
        const userTx = userSync.wallet.transactions.find((item: any) => {
          const txId = item?._id?.toString?.();
          return txId === transactionId || item?.reference === tx.reference;
        });
        if (userTx) {
          userTx.status = statusValue as any;
          if (userTx.type === 'withdrawal' && nextWalletStatus === 'completed') {
            userTx.processedAt = tx.processedAt || new Date();
            if (payoutTxHash) userTx.txHash = payoutTxHash;
          }
          if (adminNote) {
            userTx.description = `${userTx.description} | Admin: ${adminNote}`;
          }
        }

        if (balanceDelta !== 0) {
          userSync.wallet.balance += balanceDelta;
          userSync.wallet.transactions.push({
            type: balanceDelta > 0 ? 'deposit' : 'withdrawal',
            amount: Math.abs(balanceDelta),
            description: `Admin wallet sync for transaction ${transactionId}`,
            status: 'completed',
            date: new Date()
          });
        }
        await userSync.save();
      }

      return res.json({
        success: true,
        data: {
          source: 'wallet',
          userId,
          transaction: tx,
          walletBalance: wallet.balance,
          userBalance: userSync?.wallet?.balance
        }
      });
    }

    if (!USER_TRANSACTION_STATUS_SET.has(statusValue as UserTransactionStatus)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const user: any = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const tx = user.wallet.transactions.find((item: any) => {
      const txId = item?._id?.toString?.();
      return txId === transactionId || item?.reference === transactionId;
    });

    if (!tx) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    const prevStatus = (tx.status || '') as UserTransactionStatus;
    const nextStatus = statusValue as UserTransactionStatus;
    const amount = Number(tx.amount || 0);
    let balanceDelta = manualBalanceDelta;

    if (prevStatus === 'pending' && tx.type === 'withdrawal' && nextStatus === 'failed') {
      balanceDelta += amount;
    }

    if (prevStatus !== 'refunded' && nextStatus === 'refunded') {
      balanceDelta += amount;
    }

    if (user.wallet.balance + balanceDelta < 0) {
      return res.status(400).json({ success: false, error: 'Balance delta would produce negative balance' });
    }

    tx.status = nextStatus;
    if (tx.type === 'withdrawal' && nextStatus === 'completed') {
      tx.processedAt = new Date();
      if (payoutTxHash) tx.txHash = payoutTxHash;
    }

    if (adminNote) {
      tx.description = `${tx.description} | Admin: ${adminNote}`;
    }

    if ((nextStatus === 'refunded' || nextStatus === 'refund_denied') && adminNote) {
      tx.refundReason = adminNote;
    }

    if (nextStatus === 'refund_pending' && !tx.refundRequestedAt) {
      tx.refundRequestedAt = new Date();
    }

    if (balanceDelta !== 0) {
      user.wallet.balance += balanceDelta;
    }

    if (tx.type === 'subscription') {
      if (nextStatus === 'completed' && prevStatus !== 'completed') {
        const now = new Date();
        const baseDate = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now
          ? new Date(user.subscriptionExpiresAt)
          : now;

        const nextExpiry = new Date(baseDate.getTime() + subscriptionDays * 24 * 60 * 60 * 1000);
        user.isSubscribed = true;
        user.subscriptionExpiresAt = nextExpiry;
      }

      if (nextStatus === 'refunded' && prevStatus !== 'refunded') {
        user.isSubscribed = false;
        user.subscriptionExpiresAt = new Date();
      }
    }

    await user.save();

    const wallet = await ensureWalletDoc(user._id);
    const transactionReference = typeof tx.reference === 'string' ? tx.reference : '';

    if (transactionReference) {
      const walletTx = wallet.transactions.find((item: any) => item.reference === transactionReference);
      if (walletTx) {
        walletTx.status = toWalletStatus(nextStatus);
        if (walletTx.type === 'withdrawal' && nextStatus === 'completed') {
          walletTx.processedAt = tx.processedAt || new Date();
          if (payoutTxHash) walletTx.txHash = payoutTxHash;
        }
      }
    }

    if (balanceDelta !== 0) {
      wallet.balance = Math.max(0, wallet.balance + balanceDelta);
      wallet.transactions.push({
        type: balanceDelta > 0 ? 'deposit' : 'withdrawal',
        amount: Math.abs(balanceDelta),
        description: `Admin transaction review adjustment for ${transactionId}`,
        status: 'completed',
        reference: `ADM-TX-${Date.now()}`,
        date: new Date()
      });
    }

    await wallet.save();

    res.json({
      success: true,
      data: {
        userId: user._id.toString(),
        transaction: tx,
        userBalance: user.wallet.balance,
        walletBalance: wallet.balance
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to update transaction status' });
  }
});

// Get all teams (for admin panel)
router.get('/teams', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 25,
      maxLimit: 200
    });
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const query: any = {};

    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      query.$or = [{ name: regex }, { tag: regex }, { game: regex }];
    }

    const [total, teams] = await Promise.all([
      Team.countDocuments(query),
      Team.find(query)
        .populate('captain', 'username')
        .populate('members', 'username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
    ]);
    res.json({
      success: true,
      data: teams,
      pagination: buildPaginationMeta(page, limit, total),
      summary: {
        filteredTotal: total
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all contact messages (admin panel)
router.get('/contacts', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 50,
      maxLimit: 200
    });
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const query: any = {};
    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { message: regex }
      ];
    }

    const total = await ContactMessage.countDocuments(query);
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json({
      success: true,
      data: messages,
      pagination: buildPaginationMeta(page, limit, total),
      summary: {
        filteredTotal: total
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Universal CRUD
router.patch('/:entity/:id', updateEntity);
router.delete('/:entity/:id', deleteEntity);

export default router;
