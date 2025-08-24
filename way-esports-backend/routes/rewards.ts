import express from 'express';
import { auth } from '../middleware/auth';
import { adminAuth } from '../middleware/adminAuth';
import Reward from '../models/Reward';
import PlayerReward from '../models/PlayerReward';
import TeamReward from '../models/TeamReward';

const router = express.Router();

// Get available rewards for player
router.get('/valorant-mobile/rewards/available', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const rewards = await Reward.find({
      gameId: 'valorant-mobile',
      isActive: true,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    });

    res.json({
      status: 'success',
      rewards
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error fetching available rewards',
      error: (error as Error).message
    });
  }
});

// Get player's rewards
router.get('/valorant-mobile/rewards/player', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const playerRewards = await PlayerReward.find({
      userId: req.user._id,
      gameId: 'valorant-mobile'
    })
    .populate('rewardId')
    .sort({ earnedAt: -1 });

    res.json({
      status: 'success',
      rewards: playerRewards
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error fetching player rewards',
      error: (error as Error).message
    });
  }
});

// Get team's rewards
router.get('/valorant-mobile/rewards/team/:teamId', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const teamRewards = await TeamReward.find({
      teamId: req.params.teamId,
      gameId: 'valorant-mobile',
      'distribution.userId': req.user._id
    })
    .populate('rewardId')
    .sort({ earnedAt: -1 });

    res.json({
      status: 'success',
      rewards: teamRewards
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error fetching team rewards',
      error: (error as Error).message
    });
  }
});

// Withdraw currency reward
router.post('/valorant-mobile/rewards/player/withdraw/:rewardId', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const { amount } = req.body;

    const playerReward = await PlayerReward.findOne({
      userId: req.user._id,
      rewardId: req.params.rewardId,
      gameId: 'valorant-mobile',
      status: 'earned'
    }).populate('rewardId');

    if (!playerReward) {
      return res.status(404).json({
        status: 'error',
        message: 'Reward not found or cannot be withdrawn'
      });
    }

    // Check if reward supports withdrawals
    const reward = playerReward.rewardId as any;
    if (typeof reward === 'object' && reward.type === 'currency' && reward.currencyDetails) {
      const validation = reward.validateWithdrawal(amount);
      if (!validation.valid) {
        return res.status(400).json({
          status: 'error',
          message: validation.message
        });
      }

      const withdrawalFee = reward.calculateWithdrawalFee(amount);
      const netAmount = amount - withdrawalFee;

      // Update reward balance
      reward.currencyDetails.amount -= amount;
      await reward.save();

      // If balance is 0, mark as claimed
      if (reward.currencyDetails.amount === 0) {
        playerReward.status = 'claimed';
        playerReward.claimedAt = new Date();
        await playerReward.save();
      }

      // TODO: Integrate with payment processing service
      // This is where you would integrate with your payment processing service
      // to actually send the money to the user's account

      res.json({
        status: 'success',
        message: 'Withdrawal processed successfully',
        withdrawal: {
          amount,
          fee: withdrawalFee,
          netAmount,
          timestamp: new Date(),
        }
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'This reward does not support withdrawals'
      });
    }
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error processing withdrawal',
      error: (error as Error).message
    });
  }
});

// Claim player reward
router.post('/valorant-mobile/rewards/player/claim/:rewardId', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const playerReward = await PlayerReward.findOne({
      userId: req.user._id,
      rewardId: req.params.rewardId,
      gameId: 'valorant-mobile',
      status: 'earned'
    }).populate('rewardId');

    if (!playerReward) {
      return res.status(404).json({
        status: 'error',
        message: 'Reward not found or cannot be claimed'
      });
    }

    playerReward.claim();
    await playerReward.save();

    res.json({
      status: 'success',
      message: 'Reward claimed successfully',
      reward: playerReward
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error claiming reward',
      error: (error as Error).message
    });
  }
});

// Claim team reward share
router.post('/valorant-mobile/rewards/team/claim/:rewardId', auth, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
  try {
    const teamReward = await TeamReward.findOne({
      rewardId: req.params.rewardId,
      gameId: 'valorant-mobile',
      'distribution.userId': req.user._id,
      status: 'earned'
    }).populate('rewardId');

    if (!teamReward) {
      return res.status(404).json({
        status: 'error',
        message: 'Team reward not found or cannot be claimed'
      });
    }

    teamReward.claimShare(req.user._id);
    await teamReward.save();

    res.json({
      status: 'success',
      message: 'Team reward share claimed successfully',
      reward: teamReward
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error claiming team reward share',
      error: (error as Error).message
    });
  }
});

// Admin routes

// Create new reward
router.post('/valorant-mobile/rewards', adminAuth, async (req, res) => {
  try {
    const reward = new Reward({
      ...req.body,
      gameId: 'valorant-mobile'
    });

    await reward.save();

    res.status(201).json({
      status: 'success',
      message: 'Reward created successfully',
      reward
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error creating reward',
      error: (error as Error).message
    });
  }
});

// Update reward
router.put('/valorant-mobile/rewards/:rewardId', adminAuth, async (req, res) => {
  try {
    const reward = await Reward.findByIdAndUpdate(
      req.params.rewardId,
      { ...req.body, gameId: 'valorant-mobile' },
      { new: true }
    );

    if (!reward) {
      return res.status(404).json({
        status: 'error',
        message: 'Reward not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Reward updated successfully',
      reward
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error updating reward',
      error: (error as Error).message
    });
  }
});

// Grant reward to player
router.post('/valorant-mobile/rewards/grant/player', adminAuth, async (req, res) => {
  try {
    const { userId, rewardId, expiresAt } = req.body;

    const playerReward = new PlayerReward({
      userId,
      rewardId,
      gameId: 'valorant-mobile',
      expiresAt
    });

    await playerReward.save();

    res.status(201).json({
      status: 'success',
      message: 'Reward granted to player successfully',
      reward: playerReward
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error granting reward to player',
      error: (error as Error).message
    });
  }
});

// Grant reward to team
router.post('/valorant-mobile/rewards/grant/team', adminAuth, async (req, res) => {
  try {
    const { teamId, rewardId, distribution, expiresAt } = req.body;

    const teamReward = new TeamReward({
      teamId,
      rewardId,
      gameId: 'valorant-mobile',
      distribution,
      expiresAt
    });

    await teamReward.save();

    res.status(201).json({
      status: 'success',
      message: 'Reward granted to team successfully',
      reward: teamReward
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: 'Error granting reward to team',
      error: (error as Error).message
    });
  }
});

export default router; 