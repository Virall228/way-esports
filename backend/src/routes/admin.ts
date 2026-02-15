import express from 'express';
import mongoose from 'mongoose';
import { getDashboardStats, getAnalytics, updateEntity, deleteEntity } from '../controllers/adminController';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import User from '../models/User';
import Team from '../models/Team';
import ContactMessage from '../models/ContactMessage';
import Wallet from '../models/Wallet';

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

// All admin routes are protected by JWT and Admin role
router.use(authenticateJWT, isAdmin);
router.use((req, res, next) => {
  const primaryAdminTelegramId = getPrimaryAdminTelegramId();
  if (!primaryAdminTelegramId) return next();

  const currentTelegramId = Number((req.user as any)?.telegramId || 0);
  if (currentTelegramId !== primaryAdminTelegramId) {
    return res.status(403).json({ success: false, error: 'Primary admin access only' });
  }

  return next();
});

router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

// Get all users (for admin panel)
router.get('/users', async (req, res) => {
  try {
    const users: any[] = await User.find().select('-password').sort({ createdAt: -1 }).lean();
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

    res.json({ success: true, data: normalizedUsers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create user (admin)
router.post('/users', async (req, res) => {
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
router.post('/users/:id/wallet/adjust', async (req, res) => {
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
    const rawLimit = toNumber(req.query.limit, 300);
    const limit = Math.min(Math.max(Math.trunc(rawLimit), 1), 1000);

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

    res.json({
      success: true,
      data: filtered.slice(0, limit)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch wallet transactions' });
  }
});

// Approve/deny payment or refund requests
router.patch('/wallet/transactions/:userId/:transactionId', async (req, res) => {
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
    const teams = await Team.find()
      .populate('captain', 'username')
      .populate('members', 'username')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: teams });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all contact messages (admin panel)
router.get('/contacts', async (req, res) => {
  try {
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Universal CRUD
router.patch('/:entity/:id', updateEntity);
router.delete('/:entity/:id', deleteEntity);

export default router;
