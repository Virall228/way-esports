import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, getAllUsers, authenticateTelegram } from '../controllers/userController';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { telegramAuthMiddleware } from '../middleware/telegramAuth';
import { requestEmailOtp, verifyEmailOtp, logoutSession } from '../controllers/emailAuthController';

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

// Email passwordless auth (OTP)
router.post(
  '/email/request-otp',
  [body('email').isEmail().normalizeEmail()],
  requestEmailOtp
);

router.post(
  '/email/verify-otp',
  [body('email').isEmail().normalizeEmail(), body('code').isLength({ min: 4, max: 10 })],
  verifyEmailOtp
);

router.post('/logout', authenticateJWT, logoutSession);

// Protected routes
router.get('/profile', authenticateJWT, getProfile);

// Admin routes
router.get('/users', authenticateJWT, isAdmin, getAllUsers);

export default router;
