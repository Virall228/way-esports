import express from 'express';
import mongoose from 'mongoose';
import { getDashboardStats, getAnalytics, updateEntity, deleteEntity } from '../controllers/adminController';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import User from '../models/User';
import Team from '../models/Team';
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
    const regex = new RegExp(search, 'i');
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

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
      query.actorId = new mongoose.Types.ObjectId(actorId);
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
    const rawLimit = toNumber(req.query.limit, 5000);
    const limit = Math.min(Math.max(Math.trunc(rawLimit), 1), 10000);

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (actorId && mongoose.Types.ObjectId.isValid(actorId)) {
      query.actorId = new mongoose.Types.ObjectId(actorId);
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
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const query: any = {};

    if (roleFilter) {
      query.role = roleFilter;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { username: regex },
        { firstName: regex },
        { lastName: regex },
        { email: regex }
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password -passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
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
      pagination: buildPaginationMeta(page, limit, total)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
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
        const payload = `${row.username} ${row.email} ${row.telegramId}`.toLowerCase();
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
    const manualBalanceDelta = toNumber(req.body?.balanceDelta, 0);

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
      if (userSync && balanceDelta !== 0) {
        userSync.wallet.balance += balanceDelta;
        userSync.wallet.transactions.push({
          type: balanceDelta > 0 ? 'deposit' : 'withdrawal',
          amount: Math.abs(balanceDelta),
          description: `Admin wallet sync for transaction ${transactionId}`,
          status: 'completed',
          date: new Date()
        });
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

    await user.save();

    const wallet = await ensureWalletDoc(user._id);
    const transactionReference = typeof tx.reference === 'string' ? tx.reference : '';

    if (transactionReference) {
      const walletTx = wallet.transactions.find((item: any) => item.reference === transactionReference);
      if (walletTx) {
        walletTx.status = toWalletStatus(nextStatus);
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
      const regex = new RegExp(search, 'i');
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
      pagination: buildPaginationMeta(page, limit, total)
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
    const total = await ContactMessage.countDocuments({});
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    res.json({
      success: true,
      data: messages,
      pagination: buildPaginationMeta(page, limit, total)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Universal CRUD
router.patch('/:entity/:id', updateEntity);
router.delete('/:entity/:id', deleteEntity);

export default router;
