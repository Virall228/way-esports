import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getProfile, getAllUsers } from '../controllers/userController';
import { authenticateJWT, isAdmin } from '../middleware/auth';

const router = Router();

// Public routes
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').not().isEmpty().trim().escape()
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').not().isEmpty()
  ],
  login
);

// Protected routes
router.get('/profile', authenticateJWT, getProfile);

// Admin routes
router.get('/users', authenticateJWT, isAdmin, getAllUsers);

export default router;
