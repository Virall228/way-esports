import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, getAllUsers, authenticateTelegram } from '../controllers/userController';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { telegramAuthMiddleware } from '../middleware/telegramAuth';

const router = Router();

// Public routes
router.post(
  '/register',
  [
    body('telegramId').not().isEmpty(),
    body('username').not().isEmpty().trim(),
    body('firstName').not().isEmpty().trim(),
    body('lastName').optional().trim(),
    body('photoUrl').optional().isString()
  ],
  register
);

router.post(
  '/login',
  [
    body('telegramId').not().isEmpty()
  ],
  login
);

// Telegram Mini App authentication endpoint
// Accepts initData from Telegram WebApp and authenticates/registers user
router.post('/telegram', telegramAuthMiddleware, authenticateTelegram);

// Protected routes
router.get('/profile', authenticateJWT, getProfile);

// Admin routes
router.get('/users', authenticateJWT, isAdmin, getAllUsers);

export default router;
