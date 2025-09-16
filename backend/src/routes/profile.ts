import express from 'express';
import User from '../models/User';
import Wallet from '../models/Wallet';

const router = express.Router();

// Get user profile
router.get('/', async (req, res) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOne({ telegramId: req.user.id })
      .populate('teams')
      .select('-wallet.transactions');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get wallet information
    const wallet = await Wallet.findOne({ user: user._id })
      .select('balance withdrawalLimit lastWithdrawal');

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        wallet
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
});

// Update user profile
router.put('/', async (req, res) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    const allowedUpdates = ['gameProfiles', 'profileLogo'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        error: 'Invalid updates'
      });
    }

    const user = await User.findOneAndUpdate(
      { telegramId: req.user.id },
      req.body,
      { new: true }
    ).populate('teams');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Upload profile logo
router.post('/upload-logo', async (req, res) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    const { logoUrl } = req.body;
    
    if (!logoUrl) {
      return res.status(400).json({
        success: false,
        error: 'Logo URL is required'
      });
    }

    const user = await User.findOneAndUpdate(
      { telegramId: req.user.id },
      { profileLogo: logoUrl },
      { new: true }
    ).populate('teams');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error uploading profile logo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile logo'
    });
  }
});

// Get user notifications
router.get('/notifications', async (req, res) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOne({ telegramId: req.user.id })
      .select('notifications')
      .sort({ 'notifications.date': -1 });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Mark notification as read
router.put('/notifications/:id', async (req, res) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOneAndUpdate(
      {
        telegramId: req.user.id,
        'notifications._id': req.params.id
      },
      {
        $set: {
          'notifications.$.read': true
        }
      },
      { new: true }
    ).select('notifications');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: user.notifications
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Get user game profiles
router.get('/game-profiles', async (req, res) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOne({ telegramId: req.user.id })
      .select('gameProfiles');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.gameProfiles
    });
  } catch (error) {
    console.error('Error fetching game profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game profiles'
    });
  }
});

// Update game profile
router.put('/game-profiles/:game', async (req, res) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOne({ telegramId: req.user.id });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const gameProfileIndex = user.gameProfiles.findIndex(
      profile => profile.game === req.params.game
    );

    if (gameProfileIndex === -1) {
      user.gameProfiles.push({
        game: req.params.game as any,
        ...req.body
      });
    } else {
      user.gameProfiles[gameProfileIndex] = {
        ...user.gameProfiles[gameProfileIndex],
        ...req.body
      };
    }

    await user.save();

    res.json({
      success: true,
      data: user.gameProfiles
    });
  } catch (error) {
    console.error('Error updating game profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update game profile'
    });
  }
});

// Get user achievements
router.get('/achievements', async (req, res) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOne({ telegramId: req.user.id })
      .select('achievements');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.achievements || []
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
        error: 'Failed to fetch achievements'
    });
  }
});

// Add achievement to user
router.post('/achievements', async (req, res) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    const { achievement } = req.body;
    
    if (!achievement) {
      return res.status(400).json({
        success: false,
        error: 'Achievement is required'
      });
    }

    const user = await User.findOneAndUpdate(
      { telegramId: req.user.id },
      { $addToSet: { achievements: achievement } },
      { new: true }
    ).select('achievements');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.achievements || []
    });
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add achievement'
    });
  }
});

export default router; 