import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, getAllUsers } from '../controllers/userController';
import { authenticateJWT, isAdmin } from '../middleware/auth';

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

// Protected routes
router.get('/profile', authenticateJWT, getProfile);

// Admin routes
router.get('/users', authenticateJWT, isAdmin, getAllUsers);

export default router;
