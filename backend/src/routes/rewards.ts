import express from 'express';
import Reward from '../../models/Reward';
import PlayerReward from '../../models/PlayerReward';
import TeamReward from '../../models/TeamReward';

const router = express.Router();

// Get all available rewards
router.get('/', async (req, res) => {
  try {
    const { game } = req.query;
    const query: any = {
      isActive: true,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    };

    if (game) {
      query.gameId = game;
    }

    const rewards = await Reward.find(query).sort({ createdAt: -1 });

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

// Get reward by ID
router.get('/:id', async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);

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
router.post('/:id/claim', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const reward = await Reward.findById(req.params.id);

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

    if (reward.expiresAt && reward.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Reward has expired'
      });
    }

    // Check if user already claimed this reward
    const userId = (req.user as any)._id || (req.user as any).id;
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
      status: 'earned',
      earnedAt: new Date()
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

// Get user's claimed rewards
router.get('/user/claimed', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const userId = (req.user as any)._id || (req.user as any).id;
    const playerRewards = await PlayerReward.find({
      userId
    })
      .populate('rewardId')
      .sort({ earnedAt: -1 });

    res.json({
      success: true,
      data: playerRewards
    });
  } catch (error: any) {
    console.error('Error fetching user rewards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user rewards'
    });
  }
});

export default router;

