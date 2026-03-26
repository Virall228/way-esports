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
import cacheService from '../services/cacheService';
import botPushService from '../services/botPushService';
import BotNotification from '../models/BotNotification';
import PlayerPromotionProfile from '../models/PlayerPromotionProfile';
import { buildPromotionSnapshot } from '../services/playerPromotionService';

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

const getAdminListCacheTtlSeconds = (): number => {
  const ttlMs = Number(process.env.ADMIN_LIST_CACHE_MS || 10000);
  const safeMs = Number.isFinite(ttlMs) ? Math.max(1000, ttlMs) : 10000;
  return Math.max(1, Math.ceil(safeMs / 1000));
};

const buildAdminListCacheKey = (scope: string, query: Record<string, unknown>): string => {
  const normalized = Object.keys(query || {})
    .sort()
    .map((key) => {
      const value = query[key];
      if (Array.isArray(value)) return `${key}=${value.join(',')}`;
      if (value === undefined || value === null) return `${key}=`;
      return `${key}=${String(value)}`;
    })
    .join('&');

  return `admin:list:${scope}:${normalized}`;
};

let opsStreamPayloadCache: { expiresAt: number; payload: any } | null = null;
let opsStreamInFlight: Promise<any> | null = null;
let tournamentRequestsSnapshotCache: { expiresAt: number; payload: any; signature: string } | null = null;
let tournamentRequestsInFlight: Promise<{ payload: any; signature: string }> | null = null;

const getOpsStreamPayloadCached = async (): Promise<any> => {
  const now = Date.now();
  const ttlMsRaw = Number(process.env.OPS_STREAM_SNAPSHOT_CACHE_MS || 3000);
  const ttlMs = Number.isFinite(ttlMsRaw) ? Math.max(500, ttlMsRaw) : 3000;

  if (opsStreamPayloadCache && opsStreamPayloadCache.expiresAt > now) {
    return opsStreamPayloadCache.payload;
  }

  if (opsStreamInFlight) {
    return opsStreamInFlight;
  }

  opsStreamInFlight = (async () => {
    const payload = {
      timestamp: new Date().toISOString(),
      metrics: getMetricsSnapshot(),
      queue: await getQueueStats()
    };

    opsStreamPayloadCache = {
      expiresAt: Date.now() + ttlMs,
      payload
    };

    return payload;
  })();

  try {
    return await opsStreamInFlight;
  } finally {
    opsStreamInFlight = null;
  }
};

const getTournamentRequestsSnapshotCached = async (
  maxRows: number
): Promise<{ payload: any; signature: string }> => {
  const now = Date.now();
  const ttlMsRaw = Number(process.env.TOURNAMENT_REQUESTS_STREAM_CACHE_MS || 3000);
  const ttlMs = Number.isFinite(ttlMsRaw) ? Math.max(500, ttlMsRaw) : 3000;

  if (
    tournamentRequestsSnapshotCache &&
    tournamentRequestsSnapshotCache.expiresAt > now &&
    Array.isArray(tournamentRequestsSnapshotCache.payload?.pendingByTournament) &&
    tournamentRequestsSnapshotCache.payload.pendingByTournament.length <= maxRows
  ) {
    return {
      payload: tournamentRequestsSnapshotCache.payload,
      signature: tournamentRequestsSnapshotCache.signature
    };
  }

  if (tournamentRequestsInFlight) {
    return tournamentRequestsInFlight;
  }

  tournamentRequestsInFlight = (async () => {
    const [aggRows, totalRow] = await Promise.all([
      Tournament.aggregate([
        { $unwind: '$registrationRequests' },
        { $match: { 'registrationRequests.status': 'pending' } },
        {
          $group: {
            _id: '$_id',
            name: { $first: '$name' },
            updatedAt: { $max: '$updatedAt' },
            pendingCount: { $sum: 1 }
          }
        },
        { $sort: { pendingCount: -1, updatedAt: -1 } },
        { $limit: maxRows },
        {
          $project: {
            _id: 0,
            tournamentId: { $toString: '$_id' },
            name: 1,
            updatedAt: 1,
            pendingCount: 1
          }
        }
      ]),
      Tournament.aggregate([
        { $unwind: '$registrationRequests' },
        { $match: { 'registrationRequests.status': 'pending' } },
        { $group: { _id: null, totalPending: { $sum: 1 } } }
      ])
    ]);

    const pendingByTournament = (aggRows || []).map((row: any) => ({
      tournamentId: String(row?.tournamentId || ''),
      name: String(row?.name || ''),
      pendingCount: Number(row?.pendingCount || 0),
      updatedAt: row?.updatedAt ? new Date(row.updatedAt).toISOString() : null
    }));

    const totalPending = Number(totalRow?.[0]?.totalPending || 0);
    const payload = {
      timestamp: new Date().toISOString(),
      totalPending,
      pendingByTournament
    };

    const signature = JSON.stringify({
      totalPending,
      pendingByTournament: pendingByTournament.map((item: any) => ({
        tournamentId: item.tournamentId,
        pendingCount: item.pendingCount,
        updatedAt: item.updatedAt
      }))
    });

    tournamentRequestsSnapshotCache = {
      expiresAt: Date.now() + ttlMs,
      payload,
      signature
    };

    return { payload, signature };
  })();

  try {
    return await tournamentRequestsInFlight;
  } finally {
    tournamentRequestsInFlight = null;
  }
};

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

const writeCsvHeader = (res: any, fileName: string, headers: string[]) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.write(`${headers.join(',')}\n`);
};

const writeCsvRow = (res: any, values: unknown[]) => {
  res.write(`${values.map((value) => csvEscape(value)).join(',')}\n`);
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

router.use((req, res, next) => {
  if (req.method === 'GET') return next();

  res.on('finish', () => {
    if (res.statusCode >= 400) return;

    cacheService.invalidatePattern('admin:list:*').catch(() => {});
    cacheService.invalidate('admin:stats:dashboard:v1').catch(() => {});
    cacheService.invalidate('admin:stats:analytics:v1').catch(() => {});
  });

  return next();
});

router.get('/player-promotion/profiles', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 20,
      maxLimit: 100
    });
    const search = String(req.query?.search || '').trim();
    const visibility = String(req.query?.visibility || 'all').trim().toLowerCase();
    const status = String(req.query?.status || 'all').trim().toLowerCase();

    const query: any = {};
    if (visibility === 'private' || visibility === 'scouts' || visibility === 'public') {
      query.visibility = visibility;
    }
    if (status === 'enabled') query.enabled = true;
    if (status === 'disabled') query.enabled = false;

    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      const matchedUserIds = await User.find({
        $or: [
          { username: { $regex: regex } },
          { firstName: { $regex: regex } },
          { lastName: { $regex: regex } }
        ]
      }).distinct('_id');

      query.$or = [
        { slug: { $regex: regex } },
        { headline: { $regex: regex } },
        { scoutPitch: { $regex: regex } },
        ...(matchedUserIds.length ? [{ user: { $in: matchedUserIds } }] : [])
      ];
    }

    const [total, rows, enabledCount, publicCount] = await Promise.all([
      PlayerPromotionProfile.countDocuments(query),
      PlayerPromotionProfile.find(query)
        .populate('user', 'username firstName lastName primaryRole isSubscribed subscriptionExpiresAt profileLogo photoUrl')
        .sort({ updatedAt: -1, lastLeaderboardScore: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PlayerPromotionProfile.countDocuments({ enabled: true }),
      PlayerPromotionProfile.countDocuments({ visibility: 'public', enabled: true })
    ]);

    return res.json({
      success: true,
      data: (rows || []).map((row: any) => ({
        id: String(row?._id || ''),
        userId: String(row?.user?._id || row?.user || ''),
        username: String(row?.user?.username || 'unknown'),
        firstName: String(row?.user?.firstName || ''),
        lastName: String(row?.user?.lastName || ''),
        primaryRole: String(row?.user?.primaryRole || 'Flex'),
        avatarUrl: String(row?.user?.profileLogo || row?.user?.photoUrl || ''),
        enabled: Boolean(row?.enabled),
        visibility: String(row?.visibility || 'scouts'),
        adminUnlocked: Boolean(row?.adminUnlocked),
        adminOverrideNote: String(row?.adminOverrideNote || ''),
        slug: String(row?.slug || ''),
        headline: String(row?.headline || ''),
        scoutPitch: String(row?.scoutPitch || ''),
        focus: String(row?.focus || 'balanced'),
        targetGames: Array.isArray(row?.targetGames) ? row.targetGames : [],
        targetRoles: Array.isArray(row?.targetRoles) ? row.targetRoles : [],
        leaderboardScore: Number(row?.lastLeaderboardScore || 0),
        bestGame: String(row?.lastBestGame || ''),
        bestRole: String(row?.lastBestRole || ''),
        lastSnapshotGeneratedAt: row?.lastSnapshotGeneratedAt || null,
        updatedAt: row?.updatedAt || null
      })),
      pagination: buildPaginationMeta(page, limit, total),
      summary: {
        total,
        enabledCount,
        publicCount,
        filteredTotal: total
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load promotion profiles' });
  }
});

router.patch('/player-promotion/profiles/:id', async (req, res) => {
  try {
    const profile = await PlayerPromotionProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Promotion profile not found' });
    }

    if (typeof req.body?.enabled === 'boolean') profile.enabled = req.body.enabled;
    if (typeof req.body?.visibility === 'string' && ['private', 'scouts', 'public'].includes(req.body.visibility)) {
      profile.visibility = req.body.visibility as any;
    }
    if (typeof req.body?.headline === 'string') profile.headline = req.body.headline.trim().slice(0, 120);
    if (typeof req.body?.scoutPitch === 'string') profile.scoutPitch = req.body.scoutPitch.trim().slice(0, 600);
    if (typeof req.body?.focus === 'string' && ['balanced', 'ranked', 'tournament', 'trial'].includes(req.body.focus)) {
      profile.focus = req.body.focus as any;
    }
    if (typeof req.body?.adminUnlocked === 'boolean') {
      profile.adminUnlocked = req.body.adminUnlocked;
      profile.adminUnlockedAt = req.body.adminUnlocked ? new Date() : undefined;
      profile.adminUnlockedBy = req.body.adminUnlocked ? (req.user as any)?._id : undefined;
    }
    if (typeof req.body?.adminOverrideNote === 'string') {
      profile.adminOverrideNote = req.body.adminOverrideNote.trim().slice(0, 240);
    }

    await profile.save();
    return res.json({ success: true, data: { id: String(profile._id) } });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to update promotion profile' });
  }
});

router.post('/player-promotion/profiles/:id/refresh', async (req, res) => {
  try {
    const profile = await PlayerPromotionProfile.findById(req.params.id).select('user').lean();
    if (!profile?.user) {
      return res.status(404).json({ success: false, error: 'Promotion profile not found' });
    }

    const data = await buildPromotionSnapshot(String(profile.user));
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to refresh promotion snapshot' });
  }
});

router.post('/player-promotion/profiles/bulk-update', async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map((item: unknown) => String(item || '').trim()).filter(Boolean)
      : [];
    if (!ids.length) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }

    const patch: any = {};
    if (typeof req.body?.enabled === 'boolean') patch.enabled = req.body.enabled;
    if (typeof req.body?.adminUnlocked === 'boolean') {
      patch.adminUnlocked = req.body.adminUnlocked;
      patch.adminUnlockedAt = req.body.adminUnlocked ? new Date() : null;
      patch.adminUnlockedBy = req.body.adminUnlocked ? (req.user as any)?._id : null;
    }
    if (typeof req.body?.visibility === 'string' && ['private', 'scouts', 'public'].includes(req.body.visibility)) {
      patch.visibility = req.body.visibility;
    }

    if (!Object.keys(patch).length) {
      return res.status(400).json({ success: false, error: 'No valid bulk patch fields supplied' });
    }

    const result = await PlayerPromotionProfile.updateMany(
      { _id: { $in: ids.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
      { $set: patch }
    );

    return res.json({
      success: true,
      data: {
        matchedCount: Number((result as any)?.matchedCount || 0),
        modifiedCount: Number((result as any)?.modifiedCount || 0)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to bulk update promotion profiles' });
  }
});

router.post('/player-promotion/profiles/bulk-refresh', async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map((item: unknown) => String(item || '').trim()).filter(Boolean)
      : [];
    if (!ids.length) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }

    const profiles = await PlayerPromotionProfile.find({
      _id: { $in: ids.filter((id) => mongoose.Types.ObjectId.isValid(id)) }
    })
      .select('user')
      .lean();

    await Promise.all(
      profiles.map((profile: any) => buildPromotionSnapshot(String(profile.user)))
    );

    return res.json({
      success: true,
      data: {
        refreshedCount: profiles.length
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to bulk refresh promotion profiles' });
  }
});

router.get('/bot/outbox', async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 25,
      maxLimit: 200
    });
    const status = String(req.query?.status || 'all').trim().toLowerCase();
    const search = String(req.query?.search || '').trim();
    const eventType = String(req.query?.eventType || '').trim();

    const query: any = {};
    if (status === 'pending' || status === 'sent' || status === 'failed') query.status = status;
    if (eventType) query.eventType = eventType;
    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      query.$or = [{ title: regex }, { message: regex }, { eventType: regex }];
      const asNum = Number(search);
      if (Number.isFinite(asNum) && asNum > 0) query.$or.push({ telegramId: asNum }, { chatId: asNum });
    }

    const [total, rows] = await Promise.all([
      BotNotification.countDocuments(query),
      BotNotification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
    ]);

    return res.json({
      success: true,
      data: (rows || []).map((row: any) => ({
        id: String(row._id),
        userId: row.userId ? String(row.userId) : null,
        telegramId: Number(row.telegramId || 0),
        chatId: Number(row.chatId || 0),
        eventType: String(row.eventType || ''),
        title: String(row.title || ''),
        message: String(row.message || ''),
        status: String(row.status || 'pending'),
        attempts: Number(row.attempts || 0),
        sendAt: row.sendAt ? new Date(row.sendAt).toISOString() : null,
        sentAt: row.sentAt ? new Date(row.sentAt).toISOString() : null,
        lastError: row.lastError || '',
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null
      })),
      pagination: buildPaginationMeta(page, limit, total)
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch bot outbox' });
  }
});

router.post('/bot/outbox/retry-failed', idempotency({ required: true }), async (req, res) => {
  try {
    const limitRaw = Number(req.body?.limit || 100);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(500, limitRaw)) : 100;
    const idsRaw = Array.isArray(req.body?.ids) ? req.body.ids.map((v: any) => String(v)).filter(Boolean) : [];

    let ids: string[] = idsRaw;
    if (!ids.length) {
      const failedRows = await BotNotification.find({ status: 'failed' })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .select('_id')
        .lean();
      ids = failedRows.map((row: any) => String(row._id));
    }

    if (!ids.length) return res.json({ success: true, data: { modified: 0 } });

    const result = await BotNotification.updateMany(
      { _id: { $in: ids } },
      { $set: { status: 'pending', sendAt: new Date() }, $unset: { lastError: 1 } }
    );

    return res.json({
      success: true,
      data: {
        matched: Number((result as any)?.matchedCount || 0),
        modified: Number((result as any)?.modifiedCount || 0)
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to retry failed outbox items' });
  }
});

router.post('/bot/outbox/:id/retry', idempotency({ required: true }), async (req, res) => {
  try {
    const id = String(req.params?.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid outbox id' });
    }

    const updated: any = await BotNotification.findByIdAndUpdate(
      id,
      { $set: { status: 'pending', sendAt: new Date() }, $unset: { lastError: 1 } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ success: false, error: 'Outbox item not found' });

    return res.json({
      success: true,
      data: {
        id: String(updated._id),
        status: String(updated.status || 'pending'),
        sendAt: updated.sendAt ? new Date(updated.sendAt).toISOString() : null
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to retry outbox item' });
  }
});

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
      const payload = await getOpsStreamPayloadCached();
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
  const maxRowsRaw = Number(req.query?.limit || process.env.TOURNAMENT_REQUESTS_STREAM_LIMIT || 100);
  const maxRows = Math.max(10, Math.min(500, Number.isFinite(maxRowsRaw) ? maxRowsRaw : 100));

  const writeSnapshot = async () => {
    if (closed) return;
    try {
      const { payload, signature } = await getTournamentRequestsSnapshotCached(maxRows);

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
  const intervalMs = Math.max(3000, Number(process.env.TOURNAMENT_REQUESTS_STREAM_INTERVAL_MS || 10000));
  const interval = setInterval(() => {
    writeSnapshot().catch(() => {});
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
    const cacheKey = buildAdminListCacheKey('audit', req.query as Record<string, unknown>);
    const cached = await cacheService.getJson<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

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

    const payload = {
      success: true,
      data: rows,
      pagination: buildPaginationMeta(page, limit, total)
    };

    await cacheService.setJson(cacheKey, payload, getAdminListCacheTtlSeconds());
    return res.json(payload);
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
    const fileName = `audit_${new Date().toISOString().slice(0, 10)}.csv`;
    writeCsvHeader(res, fileName, headers);

    const cursor = AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .cursor();

    for await (const row of cursor as any) {
      writeCsvRow(res, [
        row?.createdAt || '',
        row?.action || '',
        row?.entity || '',
        row?.entityId || '',
        row?.statusCode || '',
        row?.actorRole || '',
        row?.actorTelegramId || '',
        row?.method || '',
        row?.path || '',
        row?.ip || '',
        row?.durationMs || ''
      ]);
    }

    return res.status(200).end();
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to export audit CSV' });
  }
});

router.get('/auth-logs', async (req, res) => {
  try {
    const cacheKey = buildAdminListCacheKey('auth-logs', req.query as Record<string, unknown>);
    const cached = await cacheService.getJson<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

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

    const payload = {
      success: true,
      data: rows,
      pagination: buildPaginationMeta(page, limit, total)
    };

    await cacheService.setJson(cacheKey, payload, getAdminListCacheTtlSeconds());
    return res.json(payload);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to fetch auth logs' });
  }
});

router.get('/auth-logs/export.csv', async (req, res) => {
  try {
    const rawLimit = toNumber(req.query.limit, 5000);
    const limit = Math.min(Math.max(Math.trunc(rawLimit), 1), 10000);
    const query = buildAuthLogQuery(req.query as Record<string, unknown>);

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

    const fileName = `auth_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    writeCsvHeader(res, fileName, headers);

    const pipeline: any[] = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: { path: '$userData', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          createdAt: 1,
          event: 1,
          status: 1,
          method: 1,
          identifier: 1,
          reason: 1,
          ip: 1,
          userAgent: 1,
          userId: '$userData._id',
          username: '$userData.username',
          email: '$userData.email',
          telegramId: '$userData.telegramId',
          role: '$userData.role'
        }
      }
    ];

    const cursor: any = (AuthLog.aggregate(pipeline).allowDiskUse(true).cursor({ batchSize: 500 }) as any).exec();
    while (true) {
      const row = await cursor.next();
      if (!row) break;

      writeCsvRow(res, [
        row?.createdAt || '',
        row?.event || '',
        row?.status || '',
        row?.method || '',
        row?.userId || '',
        row?.username || '',
        row?.email || '',
        row?.telegramId || '',
        row?.role || '',
        row?.identifier || '',
        row?.reason || '',
        row?.ip || '',
        row?.userAgent || ''
      ]);
    }

    return res.status(200).end();
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to export auth log CSV' });
  }
});

// Get all users (for admin panel)
router.get('/users', async (req, res) => {
  try {
    const cacheKey = buildAdminListCacheKey('users', req.query as Record<string, unknown>);
    const cached = await cacheService.getJson<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

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

    const payload = {
      success: true,
      data: normalizedUsers,
      pagination: buildPaginationMeta(page, limit, total),
      summary: {
        filteredTotal: total,
        filteredSubscribed,
        filteredBanned
      }
    };

    await cacheService.setJson(cacheKey, payload, getAdminListCacheTtlSeconds());
    return res.json(payload);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/users/wallpapers', async (req, res) => {
  try {
    const cacheKey = buildAdminListCacheKey('users-wallpapers', req.query as Record<string, unknown>);
    const cached = await cacheService.getJson<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status.trim() : 'active';
    const limitRaw = Number(req.query.limit || 200);
    const limit = Math.max(1, Math.min(500, Number.isFinite(limitRaw) ? limitRaw : 200));

    const query: any = {
      'profileWallpaper.url': { $exists: true, $nin: ['', null] }
    };
    if (status === 'active' || status === 'removed') {
      query['profileWallpaper.status'] = status;
    }
    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i');
      query.$or = [{ username: regex }, { firstName: regex }, { lastName: regex }, { email: regex }];
    }

    const users = await User.find(query)
      .select('username firstName lastName email role profileWallpaper')
      .sort({ 'profileWallpaper.uploadedAt': -1, updatedAt: -1 })
      .limit(limit)
      .lean();

    const payload = {
      success: true,
      data: users.map((user: any) => ({
        id: String(user._id),
        username: user.username || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'user',
        profileWallpaper: user.profileWallpaper || null
      }))
    };

    await cacheService.setJson(cacheKey, payload, getAdminListCacheTtlSeconds());
    return res.json(payload);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load wallpapers' });
  }
});

router.delete('/users/:id/wallpaper', async (req: any, res) => {
  try {
    const userId = String(req.params.id || '').trim();
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 280) : '';

    const user: any = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.profileWallpaper = {
      ...(user.profileWallpaper || {}),
      url: '',
      status: 'removed',
      removedAt: new Date(),
      removedBy: req.user?._id || req.user?.id,
      moderationNote: note || 'Removed by admin moderation'
    };
    await user.save();

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to remove wallpaper' });
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

    const headers = [
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
    const fileName = `users_${new Date().toISOString().slice(0, 10)}.csv`;
    writeCsvHeader(res, fileName, headers);

    const pipeline: any[] = [
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $limit: 5000 },
      {
        $lookup: {
          from: 'wallets',
          localField: '_id',
          foreignField: 'user',
          as: 'walletDoc'
        }
      },
      { $unwind: { path: '$walletDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          username: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          telegramId: 1,
          role: 1,
          isSubscribed: 1,
          subscriptionExpiresAt: 1,
          freeEntriesCount: 1,
          bonusEntries: 1,
          isBanned: 1,
          createdAt: 1,
          walletBalance: { $ifNull: ['$walletDoc.balance', { $ifNull: ['$wallet.balance', 0] }] }
        }
      }
    ];

    const cursor: any = (User.aggregate(pipeline).allowDiskUse(true).cursor({ batchSize: 500 }) as any).exec();
    while (true) {
      const row = await cursor.next();
      if (!row) break;

      writeCsvRow(res, [
        row?._id?.toString?.() || '',
        row?.username || '',
        row?.firstName || '',
        row?.lastName || '',
        row?.email || '',
        row?.telegramId || '',
        row?.role || 'user',
        Boolean(row?.isSubscribed),
        row?.subscriptionExpiresAt || '',
        Number(row?.freeEntriesCount || 0),
        Number(row?.bonusEntries || 0),
        Number(row?.walletBalance || 0),
        Boolean(row?.isBanned),
        row?.createdAt || ''
      ]);
    }

    return res.status(200).end();
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

    await botPushService.notifyUser({
      userId: user._id,
      eventType: amount > 0 ? 'wallet_topup' : 'wallet_debit',
      title: amount > 0 ? 'Wallet credited' : 'Wallet adjusted',
      message: amount > 0
        ? `$${absoluteAmount.toFixed(2)} has been added to your wallet.`
        : `$${absoluteAmount.toFixed(2)} has been deducted from your wallet.`,
      payload: {
        amount: absoluteAmount,
        type: userTxType,
        reference
      }
    });

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
    const cacheKey = buildAdminListCacheKey('wallet-transactions', req.query as Record<string, unknown>);
    const cached = await cacheService.getJson<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const statusFilter = typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const typeFilter = typeof req.query.type === 'string' ? req.query.type.trim() : '';
    const sourceFilter = typeof req.query.source === 'string' ? req.query.source.trim() : '';
    const searchFilter = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>, {
      defaultLimit: 100,
      maxLimit: 500
    });
    const txMatch: Record<string, unknown> = {};
    if (statusFilter) txMatch['transactions.status'] = statusFilter;
    if (typeFilter) txMatch['transactions.type'] = typeFilter;

    const projectRow = {
      id: { $toString: '$transactions._id' },
      userId: '$userId',
      source: '$source',
      username: { $ifNull: ['$username', ''] },
      email: { $ifNull: ['$email', ''] },
      telegramId: { $ifNull: ['$telegramId', 0] },
      type: { $ifNull: ['$transactions.type', ''] },
      amount: { $ifNull: ['$transactions.amount', 0] },
      status: { $ifNull: ['$transactions.status', ''] },
      description: { $ifNull: ['$transactions.description', ''] },
      walletAddress: { $ifNull: ['$transactions.walletAddress', ''] },
      network: { $ifNull: ['$transactions.network', ''] },
      txHash: { $ifNull: ['$transactions.txHash', ''] },
      processedAt: '$transactions.processedAt',
      date: { $ifNull: ['$transactions.date', '$updatedAt'] },
      reference: { $ifNull: ['$transactions.reference', ''] },
      balance: { $ifNull: ['$balance', 0] },
      amountText: { $toString: { $ifNull: ['$transactions.amount', 0] } }
    };

    const walletPipeline: any[] = [
      { $unwind: '$transactions' },
      ...(Object.keys(txMatch).length > 0 ? [{ $match: txMatch }] : []),
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDoc'
        }
      },
      { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          userId: {
            $cond: [
              { $ifNull: ['$userDoc._id', false] },
              { $toString: '$userDoc._id' },
              { $toString: '$user' }
            ]
          },
          source: 'wallet',
          username: '$userDoc.username',
          email: '$userDoc.email',
          telegramId: '$userDoc.telegramId',
          balance: '$balance'
        }
      },
      { $project: projectRow }
    ];

    const userPipeline: any[] = [
      { $unwind: '$wallet.transactions' },
      {
        $addFields: {
          transactions: '$wallet.transactions'
        }
      },
      ...(Object.keys(txMatch).length > 0 ? [{ $match: txMatch }] : []),
      {
        $addFields: {
          userId: { $toString: '$_id' },
          source: 'user',
          balance: { $ifNull: ['$wallet.balance', 0] }
        }
      },
      { $project: projectRow }
    ];

    const source = sourceFilter === 'wallet' || sourceFilter === 'user' ? sourceFilter : 'all';
    const pipeline: any[] = source === 'wallet' ? [...walletPipeline] : [...userPipeline];
    if (source === 'all') {
      pipeline.push({ $unionWith: { coll: 'wallets', pipeline: walletPipeline } });
    } else if (source === 'wallet') {
      // already set
    } else {
      // already set to user pipeline
    }

    if (searchFilter) {
      const searchRegex = new RegExp(escapeRegExp(searchFilter), 'i');
      pipeline.push({
        $match: {
          $or: [
            { username: searchRegex },
            { email: searchRegex },
            { walletAddress: searchRegex },
            { network: searchRegex },
            { txHash: searchRegex },
            { description: searchRegex },
            { reference: searchRegex },
            { source: searchRegex },
            { type: searchRegex },
            { status: searchRegex },
            { amountText: searchRegex },
            { userId: searchRegex }
          ]
        }
      });
    }

    pipeline.push(
      { $sort: { date: -1 } },
      {
        $facet: {
          meta: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limit }]
        }
      }
    );

    const agg = await User.aggregate(pipeline);
    const bucket = agg?.[0] || {};
    const total = Number(bucket?.meta?.[0]?.total || 0);
    const paged = Array.isArray(bucket?.data) ? bucket.data : [];

    const payload = {
      success: true,
      data: paged,
      pagination: buildPaginationMeta(page, limit, total)
    };

    await cacheService.setJson(cacheKey, payload, getAdminListCacheTtlSeconds());
    return res.json(payload);
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

        if (tx.type === 'withdrawal' && (nextWalletStatus === 'completed' || nextWalletStatus === 'failed')) {
          await botPushService.notifyUser({
            userId: userSync._id,
            eventType: nextWalletStatus === 'completed' ? 'withdrawal_completed' : 'withdrawal_rejected',
            title: nextWalletStatus === 'completed' ? 'Withdrawal completed' : 'Withdrawal update',
            message: nextWalletStatus === 'completed'
              ? `Your withdrawal of $${amount.toFixed(2)} has been completed.`
              : `Your withdrawal of $${amount.toFixed(2)} was rejected${adminNote ? `: ${adminNote}` : '.'}`,
            payload: {
              amount,
              status: nextWalletStatus,
              txHash: payoutTxHash || '',
              reference: tx.reference || ''
            }
          });
        }
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

    if (tx.type === 'withdrawal' && (nextStatus === 'completed' || nextStatus === 'failed')) {
      await botPushService.notifyUser({
        userId: user._id,
        eventType: nextStatus === 'completed' ? 'withdrawal_completed' : 'withdrawal_rejected',
        title: nextStatus === 'completed' ? 'Withdrawal completed' : 'Withdrawal update',
        message: nextStatus === 'completed'
          ? `Your withdrawal of $${amount.toFixed(2)} has been completed.`
          : `Your withdrawal of $${amount.toFixed(2)} was rejected${adminNote ? `: ${adminNote}` : '.'}`,
        payload: {
          amount,
          status: nextStatus,
          txHash: payoutTxHash || '',
          reference: tx.reference || ''
        }
      });
    }

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
    const cacheKey = buildAdminListCacheKey('teams', req.query as Record<string, unknown>);
    const cached = await cacheService.getJson<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

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
    const payload = {
      success: true,
      data: teams,
      pagination: buildPaginationMeta(page, limit, total),
      summary: {
        filteredTotal: total
      }
    };

    await cacheService.setJson(cacheKey, payload, getAdminListCacheTtlSeconds());
    return res.json(payload);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all contact messages (admin panel)
router.get('/contacts', async (req, res) => {
  try {
    const cacheKey = buildAdminListCacheKey('contacts', req.query as Record<string, unknown>);
    const cached = await cacheService.getJson<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

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
    const payload = {
      success: true,
      data: messages,
      pagination: buildPaginationMeta(page, limit, total),
      summary: {
        filteredTotal: total
      }
    };

    await cacheService.setJson(cacheKey, payload, getAdminListCacheTtlSeconds());
    return res.json(payload);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Universal CRUD
router.patch('/:entity/:id', updateEntity);
router.delete('/:entity/:id', deleteEntity);

export default router;
