import express from 'express';
import Wallet from '../models/Wallet';
import User from '../models/User';

const router = express.Router();

// Get wallet details
router.get('/', async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.id });
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
    const user = await User.findOne({ telegramId: req.user.id });
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
    const user = await User.findOne({ telegramId: req.user.id });
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
    const user = await User.findOne({ telegramId: req.user.id });
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
    const user = await User.findOne({ telegramId: req.user.id });
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

    const user = await User.findOne({ telegramId: req.user.id });
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

    // Check balance
    if (wallet.balance < amount) {
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

    if (dailyWithdrawals + amount > wallet.withdrawalLimit.daily) {
      return res.status(400).json({
        success: false,
        error: 'Daily withdrawal limit exceeded'
      });
    }

    if (monthlyWithdrawals + amount > wallet.withdrawalLimit.monthly) {
      return res.status(400).json({
        success: false,
        error: 'Monthly withdrawal limit exceeded'
      });
    }

    // Create withdrawal transaction
    wallet.transactions.push({
      type: 'withdrawal',
      amount,
      description: 'Withdrawal request',
      status: 'pending',
      reference: `WD${Date.now()}`,
      date: new Date()
    });

    wallet.balance -= amount;
    wallet.lastWithdrawal = new Date();
    await wallet.save();

    res.json({
      success: true,
      data: wallet
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process withdrawal'
    });
  }
});

export default router; 