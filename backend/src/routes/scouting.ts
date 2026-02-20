import express from 'express';
import { getTopProspects, refreshWeeklyTopProspects, getAnomalyAlerts } from '../services/scoutingEngine';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { getScoutProviderStatus } from '../services/aiScoutingProvider';
import UserStats from '../models/UserStats';
import User from '../models/User';

const router = express.Router();

router.get('/top-prospects', async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 10)));
    const insights = await getTopProspects(limit);
    const rows = insights.map((item: any) => ({
      id: item._id?.toString?.() || '',
      userId: item.user?._id?.toString?.() || item.user?.toString?.() || '',
      username: item.user?.username || 'unknown',
      role: item.user?.primaryRole || 'Flex',
      score: item.score,
      impactRating: item.impactRating,
      tag: item.tag,
      summary: item.summary,
      weekKey: item.weekKey
    }));
    return res.json({ success: true, data: rows });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load prospects' });
  }
});

router.post('/refresh', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.body?.limit || 10)));
    const data = await refreshWeeklyTopProspects(limit);
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to refresh prospects' });
  }
});

router.get('/provider-status', authenticateJWT, isAdmin, (_req, res) => {
  return res.json({ success: true, data: getScoutProviderStatus() });
});

router.get('/anomalies', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const rows = await getAnomalyAlerts(limit);
    return res.json({ success: true, data: rows });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load anomaly alerts' });
  }
});

router.get('/watchlist', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 50)));
    const rows = await UserStats.find({ watchlist: true })
      .populate('user', 'username role primaryRole')
      .sort({ watchlistAddedAt: -1 })
      .limit(limit);

    const data = rows.map((row: any) => ({
      userId: row.user?._id?.toString?.() || row.user?.toString?.() || '',
      username: row.user?.username || 'unknown',
      role: row.user?.primaryRole || row.primaryRole || 'Flex',
      impactRating: Number(row.impactRating || 0),
      reason: row.watchlistReason || '',
      addedAt: row.watchlistAddedAt
    }));
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load watchlist' });
  }
});

router.post('/watchlist', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const userId = String(req.body?.userId || '').trim();
    const reason = String(req.body?.reason || 'AI anomaly alert').trim().slice(0, 280);
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const user = await User.findById(userId).select('_id');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const stats = await UserStats.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          watchlist: true,
          watchlistReason: reason,
          watchlistAddedAt: new Date()
        },
        $setOnInsert: {
          primaryRole: 'Flex',
          skills: {
            aiming: 50,
            positioning: 50,
            utility: 50,
            clutchFactor: 50,
            teamplay: 50
          },
          behavioral: {
            chill: 55,
            leadership: 50,
            conflictScore: 0
          },
          trend30d: []
        }
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      data: {
        userId,
        watchlist: Boolean(stats?.watchlist),
        reason: stats?.watchlistReason || reason
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to add watchlist entry' });
  }
});

export default router;
