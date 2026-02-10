import User from '../models/User';
import Wallet from '../models/Wallet';
import express from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate';

const router = express.Router();

const getUserFilter = (req: any): { _id: any } | null => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) return null;
  return { _id: userId };
};

// Get user profile
router.get('/', async (req, res) => {
  try {
    const userFilter = getUserFilter(req);
    if (!userFilter) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOne(userFilter)
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
const updateProfileValidators = [
  body('username').optional().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
  body('photoUrl').optional().isString().withMessage('Photo URL must be a string'),
  body('profileLogo').optional().isString().withMessage('Profile logo must be a string'),
  body('email').optional().isEmail().withMessage('Invalid email format')
];

const updateProfileHandler = async (req: any, res: any) => {
  try {
    const userFilter = getUserFilter(req);
    if (!userFilter) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const allowedUpdates = [
      'username',
      'firstName',
      'lastName',
      'bio',
      'gameProfiles',
      'profileLogo',
      'photoUrl',
      'email'
    ];
    const updates = Object.keys(req.body || {});
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        error: 'Invalid updates'
      });
    }

    const user = await User.findOneAndUpdate(
      userFilter,
      { $set: req.body },
      { new: true, runValidators: true }
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
  } catch (error: any) {
    console.error('Error updating profile:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Username already taken' });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

// Update user profile (PATCH/PUT)
router.patch('/', updateProfileValidators, validateRequest, updateProfileHandler);
router.put('/', updateProfileValidators, validateRequest, updateProfileHandler);

// Get public user profile by ID or username
router.get('/:identifier/public', async (req, res) => {
  try {
    const { identifier } = req.params;
    const isId = identifier.match(/^[0-9a-fA-F]{24}$/);

    const query = isId ? { _id: identifier } : { username: identifier };

    const user = await User.findOne(query)
      .populate('teams', 'name tag logo')
      .select('username firstName lastName bio profileLogo teams stats gameProfiles achievements createdAt');

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
    console.error('Error fetching public profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch public profile'
    });
  }
});

// Upload profile logo
router.post('/upload-logo', async (req, res) => {
  try {
    const userFilter = getUserFilter(req);
    if (!userFilter) {
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
      userFilter,
      { profileLogo: logoUrl, photoUrl: logoUrl },
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
    const userFilter = getUserFilter(req);
    if (!userFilter) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOne(userFilter)
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
    const userFilter = getUserFilter(req);
    if (!userFilter) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOneAndUpdate(
      {
        ...userFilter,
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
    const userFilter = getUserFilter(req);
    if (!userFilter) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOne(userFilter)
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
    const userFilter = getUserFilter(req);
    if (!userFilter) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOne(userFilter);

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
    const userFilter = getUserFilter(req);
    if (!userFilter) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    const user = await User.findOne(userFilter)
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
    const userFilter = getUserFilter(req);
    if (!userFilter) {
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
      userFilter,
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
