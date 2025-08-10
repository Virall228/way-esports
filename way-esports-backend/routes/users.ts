import express from 'express';
import { User } from '../models/User';
import { auth, admin } from '../middleware/auth';

const router = express.Router();

// Ban a user (Admin)
router.put('/users/:id/ban', auth, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: true }, { new: true });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Unban a user (Admin)
router.put('/users/:id/unban', auth, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: false }, { new: true });
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Получить историю достижений пользователя
router.get('/users/:id/achievements', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('achievementHistory.achievement');
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(user.achievementHistory);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Начислить достижение пользователю (админ/тест)
router.post('/users/:id/achievements/:achievementId', auth, admin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ error: 'User not found' });
    }
    const added = await user.addAchievement(req.params.achievementId);
    if (added) {
      res.send({ success: true, message: 'Achievement added' });
    } else {
      res.send({ success: false, message: 'User already has this achievement' });
    }
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router; 