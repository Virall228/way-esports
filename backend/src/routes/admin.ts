import express from 'express';
import { getDashboardStats, getAnalytics } from '../controllers/adminController';
import { authenticateJWT, isAdmin } from '../middleware/auth';

const router = express.Router();

// All admin routes are protected by JWT and Admin Role
router.use(authenticateJWT, isAdmin);

router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);

export default router;
