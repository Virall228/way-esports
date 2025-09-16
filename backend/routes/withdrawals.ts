import express from 'express';
import Withdrawal from '../models/Withdrawal';
import Reward from '../models/Reward';
import { auth, admin, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Request a withdrawal (User)
router.post('/withdrawals/request', auth, async (req: AuthRequest, res) => {
  const { rewardId, amount } = req.body;

  try {
    const reward = await Reward.findById(rewardId);
    if (!reward) {
      return res.status(404).send({ error: 'Reward not found.' });
    }

    const validation = reward.validateWithdrawal(amount);
    if (!validation.valid) {
      return res.status(400).send({ error: validation.message });
    }

    const withdrawal = new Withdrawal({
      user: req.user?._id,
      reward: rewardId,
      amount,
    });

    await withdrawal.save();
    res.status(201).send(withdrawal);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all withdrawal requests (Admin)
router.get('/withdrawals', auth, admin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({})
      .populate('user', 'username')
      .populate('reward', 'name');
    res.send(withdrawals);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a withdrawal request status (Admin)
router.patch('/withdrawals/:id', auth, admin, async (req, res) => {
  const { status, rejectionReason, transactionId } = req.body;
  const allowedUpdates = ['status', 'rejectionReason', 'transactionId'];
  const updates = Object.keys(req.body);
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: 'Invalid updates!' });
  }

  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).send();
    }

    updates.forEach(update => (withdrawal[update] = req.body[update]));

    if (status) {
      withdrawal.processedAt = new Date();
    }
    
    await withdrawal.save();
    res.send(withdrawal);
  } catch (error) {
    res.status(400).send(error);
  }
});


export default router; 