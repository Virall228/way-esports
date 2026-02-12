import express from 'express';
import { getDashboardStats, getAnalytics } from '../controllers/adminController';
import { authenticateJWT, isAdmin } from '../middleware/auth';

const router = express.Router();

// All admin routes are protected by JWT and Admin Role
router.use(authenticateJWT, isAdmin);

router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

// Get all users (for admin panel)
router.get('/users', async (req, res) => {
    try {
        const User = (await import('../models/User')).default;
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, data: users });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Create user (admin)
router.post('/users', async (req, res) => {
    try {
        const User = (await import('../models/User')).default;
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
            isBanned: !!isBanned
        };

        if (balance !== undefined) {
            payload.wallet = {
                balance: Number(balance || 0),
                transactions: []
            };
        }

        const user = await new User(payload).save();
        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        if (error?.code === 11000) {
            return res.status(400).json({ success: false, error: 'Duplicate user data' });
        }
        res.status(500).json({ success: false, error: error.message || 'Failed to create user' });
    }
});

// Get all teams (for admin panel)
router.get('/teams', async (req, res) => {
    try {
        const Team = (await import('../models/Team')).default;
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
        const ContactMessage = (await import('../models/ContactMessage')).default;
        const messages = await ContactMessage.find()
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, data: messages });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Universal CRUD
import { updateEntity, deleteEntity } from '../controllers/adminController';
router.patch('/:entity/:id', updateEntity);
router.delete('/:entity/:id', deleteEntity);

export default router;
