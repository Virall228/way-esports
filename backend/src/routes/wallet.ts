import express from 'express';
import Wallet from '../models/Wallet';
import User from '../models/User';
import ReferralService from '../services/referralService';
import { idempotency } from '../middleware/idempotency';

const router = express.Router();
const SUPPORTED_WITHDRAW_NETWORKS = ['USDT-TRC20', 'USDT-ERC20', 'USDT-BEP20'] as const;
type SupportedWithdrawNetwork = (typeof SUPPORTED_WITHDRAW_NETWORKS)[number];

const resolveUserId = (req: any): string | null => {
  const value = req.user?._id || req.user?.id;
  return value ? value.toString() : null;
};

const addSubscriptionPeriod = (user: any, days: number) => {
  const now = new Date();
  const activeUntil = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) > now
    ? new Date(user.subscriptionExpiresAt)
    : now;

  const nextExpiry = new Date(activeUntil.getTime() + days * 24 * 60 * 60 * 1000);
  user.isSubscribed = true;
  user.subscriptionExpiresAt = nextExpiry;
  return nextExpiry;
};

const normalizeNetwork = (value: unknown): SupportedWithdrawNetwork => {
  const raw = typeof value === 'string' ? value.trim().toUpperCase() : '';
  const map: Record<string, SupportedWithdrawNetwork> = {
    TRC20: 'USDT-TRC20',
    'USDT-TRC20': 'USDT-TRC20',
    ERC20: 'USDT-ERC20',
    'USDT-ERC20': 'USDT-ERC20',
    BEP20: 'USDT-BEP20',
    'USDT-BEP20': 'USDT-BEP20'
  };
  return map[raw] || 'USDT-TRC20';
};

const normalizeWalletAddress = (value: unknown): string => {
  const address = typeof value === 'string' ? value.trim() : '';
  return address;
};

const isValidWalletAddress = (address: string, network: SupportedWithdrawNetwork): boolean => {
  if (!address) return false;
  if (address.length < 16 || address.length > 160) return false;
  if (/\s/.test(address)) return false;

  if (network === 'USDT-TRC20') {
    return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
  }

  if (network === 'USDT-ERC20' || network === 'USDT-BEP20') {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  return false;
};

router.get('/withdraw/networks', (_req, res) => {
  return res.json({
    success: true,
    data: SUPPORTED_WITHDRAW_NETWORKS
  });
});

// Get wallet balance (alias for compatibility)
router.get('/balance', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      wallet = await new Wallet({ user: user._id }).save();
    }

    res.json({
      success: true,
      balance: wallet.balance,
      withdrawalLimit: wallet.withdrawalLimit,
      data: wallet
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balance'
    });
  }
});

// Get wallet details
router.get('/', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      wallet = await new Wallet({ user: user._id }).save();
    }

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet'
    });
  }
});

// Get transaction history
router.get('/transactions', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const wallet = await Wallet.findOne({ user: user._id })
      .select('transactions')
      .sort({ 'transactions.date': -1 });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    res.json({
      success: true,
      data: wallet.transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// Add payment method
router.post('/payment-methods', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    wallet.paymentMethods.push(req.body);
    await wallet.save();

    res.status(201).json({
      success: true,
      data: wallet.paymentMethods
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add payment method'
    });
  }
});

// Update payment method
router.put('/payment-methods/:id', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const wallet = await Wallet.findOneAndUpdate(
      {
        user: user._id,
        'paymentMethods._id': req.params.id
      },
      {
        $set: {
          'paymentMethods.$': req.body
        }
      },
      { new: true }
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    res.json({
      success: true,
      data: wallet.paymentMethods
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update payment method'
    });
  }
});

// Delete payment method
router.delete('/payment-methods/:id', async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const wallet = await Wallet.findOneAndUpdate(
      { user: user._id },
      {
        $pull: {
          paymentMethods: { _id: req.params.id }
        }
      },
      { new: true }
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    res.json({
      success: true,
      data: wallet.paymentMethods
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete payment method'
    });
  }
});

// Request withdrawal
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, paymentMethodId } = req.body;
    const walletAddress = normalizeWalletAddress(req.body?.walletAddress);
    const network = normalizeNetwork(req.body?.network);

    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: 'Wallet not found'
      });
    }

    if (!isValidWalletAddress(walletAddress, network)) {
      return res.status(400).json({
        success: false,
        error: `Invalid wallet address for ${network}`
      });
    }

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be a positive number'
      });
    }

    // Check balance
    if (wallet.balance < normalizedAmount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    // Check withdrawal limits
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailyWithdrawals = wallet.transactions.filter(
      t => t.type === 'withdrawal' &&
      t.status !== 'failed' &&
      t.date >= today
    ).reduce((sum, t) => sum + t.amount, 0);

    const monthlyWithdrawals = wallet.transactions.filter(
      t => t.type === 'withdrawal' &&
      t.status !== 'failed' &&
      t.date >= monthStart
    ).reduce((sum, t) => sum + t.amount, 0);

    if (dailyWithdrawals + normalizedAmount > wallet.withdrawalLimit.daily) {
      return res.status(400).json({
        success: false,
        error: 'Daily withdrawal limit exceeded'
      });
    }

    if (monthlyWithdrawals + normalizedAmount > wallet.withdrawalLimit.monthly) {
      return res.status(400).json({
        success: false,
        error: 'Monthly withdrawal limit exceeded'
      });
    }

    // Create withdrawal transaction
    const reference = `WD${Date.now()}`;
    wallet.transactions.push({
      type: 'withdrawal',
      amount: normalizedAmount,
      description: `Withdrawal request (${network})`,
      status: 'pending',
      reference,
      walletAddress,
      network,
      date: new Date()
    });

    wallet.balance -= normalizedAmount;
    wallet.lastWithdrawal = new Date();
    await wallet.save();

    user.wallet.transactions.push({
      type: 'withdrawal',
      amount: normalizedAmount,
      description: `Withdrawal request (${network})`,
      status: 'pending',
      reference,
      walletAddress,
      network,
      date: new Date()
    } as any);
    user.wallet.balance = wallet.balance;
    await user.save();

    res.json({
      success: true,
      data: {
        balance: wallet.balance,
        withdrawalRequest: {
          amount: normalizedAmount,
          walletAddress,
          network
        },
        transactions: wallet.transactions
      }
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process withdrawal'
    });
  }
});

// Create subscription payment request
router.post('/subscribe', idempotency({ required: true }), async (req, res) => {
  try {
    const userId = resolveUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user: any = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const pendingSubscriptionTx = (user.wallet?.transactions || []).find((tx: any) => (
      tx?.type === 'subscription' && tx?.status === 'pending'
    ));

    if (pendingSubscriptionTx) {
      return res.status(409).json({
        success: false,
        error: 'You already have a pending subscription request'
      });
    }

    const settings: any = await ReferralService.getReferralSettings();
    const subscriptionPrice = Number(settings?.subscriptionPrice || 9.99);
    const paymentMethod = typeof req.body?.paymentMethod === 'string' && req.body.paymentMethod.trim()
      ? req.body.paymentMethod.trim()
      : 'manual';
    const autoActivate = Boolean(req.body?.autoActivate) && paymentMethod === 'wallet';

    const tx = {
      type: 'subscription',
      amount: Math.max(subscriptionPrice, 0),
      description: autoActivate
        ? 'Subscription payment (auto approved)'
        : 'Subscription payment request',
      status: (autoActivate ? 'completed' : 'pending') as 'pending' | 'completed',
      reference: `SUB-${Date.now()}`,
      date: new Date()
    };

    user.wallet.transactions.push(tx);

    let subscriptionExpiresAt: Date | null = null;
    if (autoActivate) {
      subscriptionExpiresAt = addSubscriptionPeriod(user, 30);
    }

    await user.save();

    let wallet = await Wallet.findOne({ user: user._id });
    if (!wallet) {
      wallet = await new Wallet({ user: user._id }).save();
    }

    wallet.transactions.push({
      type: 'deposit',
      amount: Math.max(subscriptionPrice, 0),
      description: tx.description,
      status: tx.status === 'completed' ? 'completed' : 'pending',
      reference: tx.reference,
      date: tx.date
    });

    await wallet.save();

    return res.status(201).json({
      success: true,
      data: {
        transactionReference: tx.reference,
        status: tx.status,
        amount: tx.amount,
        subscriptionExpiresAt
      }
    });
  } catch (error) {
    console.error('Error creating subscription request:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create subscription request'
    });
  }
});

export default router; 
