import express from 'express';
import Reward from '../models/Reward';
import PlayerReward from '../models/PlayerReward';
import { authenticateJWT, isAdmin } from '../middleware/auth';

const router = express.Router();

const isExpired = (expiresAt: any) => {
  if (!expiresAt) return false;
  const d = new Date(expiresAt);
  return Number.isFinite(d.getTime()) && d.getTime() < Date.now();
};

// Get all available rewards
router.get('/', async (req, res) => {
  try {
    const { game } = req.query;
    const query: any = {
      isActive: true,
      $or: [{ expiresAt: { $gt: new Date() } }, { expiresAt: null }, { expiresAt: { $exists: false } }]
    };

    if (game) {
      query.gameId = game;
    }

    const rewards = await Reward.find(query).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: rewards
    });
  } catch (error: any) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch rewards'
    });
  }
});

// Get current user's claimed rewards
router.get('/me/claimed', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any)?._id || (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const claimed = await PlayerReward.find({ userId })
      .populate('rewardId')
      .sort({ earnedAt: -1 })
      .lean();

    res.json({ success: true, data: claimed });
  } catch (error: any) {
    console.error('Error fetching user claimed rewards:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to fetch user rewards' });
  }
});

// Admin: list all rewards
router.get('/admin', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const items = await Reward.find({}).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (error: any) {
    console.error('Error fetching admin rewards:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to fetch rewards' });
  }
});

// Admin: create
router.post('/admin', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const item = await new Reward(req.body).save();
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error creating reward:', error);
    res.status(400).json({ success: false, error: error?.message || 'Failed to create reward' });
  }
});

// Admin: update
router.put('/admin/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const item = await Reward.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, error: 'Reward not found' });
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error updating reward:', error);
    res.status(400).json({ success: false, error: error?.message || 'Failed to update reward' });
  }
});

// Admin: delete
router.delete('/admin/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const item = await Reward.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Reward not found' });
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error deleting reward:', error);
    res.status(500).json({ success: false, error: error?.message || 'Failed to delete reward' });
  }
});

// Get reward by ID
router.get('/:id', async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id).lean();

    if (!reward) {
      return res.status(404).json({
        success: false,
        error: 'Reward not found'
      });
    }

    res.json({
      success: true,
      data: reward
    });
  } catch (error: any) {
    console.error('Error fetching reward:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reward'
    });
  }
});

// Claim reward
router.post('/:id/claim', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any)?._id || (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const reward: any = await Reward.findById(req.params.id).lean();

    if (!reward) {
      return res.status(404).json({
        success: false,
        error: 'Reward not found'
      });
    }

    if (!reward.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Reward is not active'
      });
    }

    if (isExpired(reward.expiresAt)) {
      return res.status(400).json({
        success: false,
        error: 'Reward has expired'
      });
    }

    // Check if user already claimed this reward
    const existingReward = await PlayerReward.findOne({
      userId,
      rewardId: req.params.id
    });

    if (existingReward) {
      return res.status(400).json({
        success: false,
        error: 'Reward already claimed'
      });
    }

    // Create player reward
    const playerReward = new PlayerReward({
      userId,
      rewardId: req.params.id,
      gameId: reward.gameId,
      status: 'claimed',
      earnedAt: new Date(),
      claimedAt: new Date(),
      expiresAt: reward.expiresAt || undefined
    });

    await playerReward.save();

    res.json({
      success: true,
      data: playerReward
    });
  } catch (error: any) {
    console.error('Error claiming reward:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to claim reward'
    });
  }
});

export default router;

