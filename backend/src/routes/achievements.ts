import express from 'express';
import Achievement from '../models/Achievement';
import User from '../models/User';
import { authenticateJWT, isAdmin } from '../middleware/auth';

const router = express.Router();

// Public: list active achievements
router.get('/', async (req, res) => {
  try {
    const items = await Achievement.find({ isActive: true }).sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch achievements' });
  }
});

// Admin: list all
router.get('/admin', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const items = await Achievement.find({}).sort({ createdAt: 1 }).lean();
    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching admin achievements:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch achievements' });
  }
});

router.post('/admin', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const item = await new Achievement(req.body).save();
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error creating achievement:', error);
    res.status(400).json({ success: false, error: error?.message || 'Failed to create achievement' });
  }
});

router.put('/admin/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const item = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error: any) {
    console.error('Error updating achievement:', error);
    res.status(400).json({ success: false, error: error?.message || 'Failed to update achievement' });
  }
});

router.delete('/admin/:id', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const item = await Achievement.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ success: false, error: 'Failed to delete achievement' });
  }
});

// Get user's achievements (with progress)
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const userId = (req.user as any)?._id?.toString();
    if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const achievements = await Achievement.find({ isActive: true }).lean();
    const earned = new Set<string>((user.achievements || []).map((a: any) => a.toString()));

    const wins = Number(user.stats?.wins) || 0;
    const matchesPlayed = Number(user.stats?.wins || 0) + Number(user.stats?.losses || 0);
    const tournamentsPlayed = Number(user.stats?.tournamentsPlayed) || 0;

    const withProgress = achievements.map((a: any) => {
      const id = a._id?.toString();
      const earnedAt = earned.has(id);
      let progress = 0;
      const type = a.criteria?.type;
      const value = Number(a.criteria?.value) || 0;

      if (type === 'wins_gte') progress = Math.min(100, (wins / value) * 100);
      if (type === 'matches_played_gte') progress = Math.min(100, (matchesPlayed / value) * 100);
      if (type === 'tournaments_played_gte') progress = Math.min(100, (tournamentsPlayed / value) * 100);

      return {
        ...a,
        earned: earnedAt,
        progress: Math.round(progress),
        current:
          type === 'wins_gte' ? wins
          : type === 'matches_played_gte' ? matchesPlayed
          : type === 'tournaments_played_gte' ? tournamentsPlayed
          : 0
      };
    });

    res.json({ success: true, data: withProgress });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch achievements' });
  }
});

export default router;
