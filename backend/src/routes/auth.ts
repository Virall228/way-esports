import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getProfile,
  getAllUsers,
  authenticateTelegram,
  updateUser,
  registerWithEmailPassword,
  loginWithEmailPassword,
  authenticateGoogle,
  authenticateApple
} from '../controllers/userController';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { telegramAuthMiddleware } from '../middleware/telegramAuth';
import { requestEmailOtp, verifyEmailOtp, logoutSession } from '../controllers/emailAuthController';
import { idempotency } from '../middleware/idempotency';

const router = Router();

// Public routes
router.post(
  '/register',
  idempotency({ required: true }),
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

router.post(
  '/email/register',
  idempotency({ required: true }),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 })
  ],
  registerWithEmailPassword
);

router.post(
  '/email/login',
  [
    body('password').isLength({ min: 8 }),
    body().custom((value) => {
      const raw = value?.identifier ?? value?.email ?? value?.username;
      if (!raw || typeof raw !== 'string' || !raw.trim()) {
        throw new Error('identifier (or email/username) is required');
      }
      return true;
    })
  ],
  loginWithEmailPassword
);

router.post(
  '/google',
  [body('idToken').isString().notEmpty()],
  authenticateGoogle
);

router.post(
  '/apple',
  [body('identityToken').isString().notEmpty()],
  authenticateApple
);

// Telegram Mini App authentication endpoint
// Accepts initData from Telegram WebApp and authenticates/registers user
router.post('/telegram', telegramAuthMiddleware, authenticateTelegram);

// Email passwordless auth (OTP)
router.post(
  '/email/request-otp',
  idempotency({ required: true, ttlSeconds: 10 * 60 }),
  [body('email').isEmail().normalizeEmail()],
  requestEmailOtp
);

router.post(
  '/email/verify-otp',
  idempotency({ required: true, ttlSeconds: 10 * 60 }),
  [body('email').isEmail().normalizeEmail(), body('code').isLength({ min: 4, max: 10 })],
  verifyEmailOtp
);

router.post('/logout', authenticateJWT, logoutSession);

// Protected routes
router.get('/profile', authenticateJWT, getProfile);

// Admin routes
router.get('/users', authenticateJWT, isAdmin, getAllUsers);
router.put('/users/:id', authenticateJWT, isAdmin, updateUser);

export default router;
