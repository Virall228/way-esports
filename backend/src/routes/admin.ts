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

// Universal CRUD
import { updateEntity, deleteEntity } from '../controllers/adminController';
router.patch('/:entity/:id', updateEntity);
router.delete('/:entity/:id', deleteEntity);

export default router;
