import express from 'express';
import { getTopProspects, refreshWeeklyTopProspects, getAnomalyAlerts } from '../services/scoutingEngine';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { getScoutProviderStatus } from '../services/aiScoutingProvider';
import UserStats from '../models/UserStats';
import User from '../models/User';
import cacheService from '../services/cacheService';
import { createInMemoryLimiter } from '../middleware/rateLimiter';
import { scoutingUtils } from '../services/scoutingEngine';

const router = express.Router();
const publicScoutingLimiter = createInMemoryLimiter({
  keyPrefix: 'scouting_public',
  max: 90,
  windowMs: 60_000,
  identity: 'ip'
});
const adminScoutingLimiter = createInMemoryLimiter({
  keyPrefix: 'scouting_admin',
  max: 180,
  windowMs: 60_000,
  identity: 'user'
});

router.get('/top-prospects', publicScoutingLimiter, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit || 10)));
    const weekKey = scoutingUtils.getWeekKey();
    const cacheKey = `scouting:top:${weekKey}:limit:${limit}`;
    const insights = await cacheService.getOrSet(
      cacheKey,
      () => getTopProspects(limit),
      { key: cacheKey, ttl: 45 }
    ) || [];
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

router.post('/refresh', authenticateJWT, isAdmin, adminScoutingLimiter, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.body?.limit || 10)));
    const data = await refreshWeeklyTopProspects(limit);
    await cacheService.invalidatePattern('scouting:top:*');
    return res.json({ success: true, data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to refresh prospects' });
  }
});

router.get('/provider-status', authenticateJWT, isAdmin, (_req, res) => {
  return res.json({ success: true, data: getScoutProviderStatus() });
});

router.get('/anomalies', authenticateJWT, isAdmin, adminScoutingLimiter, async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
    const rows = await getAnomalyAlerts(limit);
    return res.json({ success: true, data: rows });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load anomaly alerts' });
  }
});

router.get('/watchlist', authenticateJWT, isAdmin, adminScoutingLimiter, async (req, res) => {
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

router.post('/watchlist', authenticateJWT, isAdmin, adminScoutingLimiter, async (req, res) => {
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

router.get('/explain/:userId', authenticateJWT, isAdmin, adminScoutingLimiter, async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim();
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId is required' });
    }

    const [user, stats] = await Promise.all([
      User.findById(userId).select('username primaryRole gameProfiles').lean(),
      UserStats.findOne({ user: userId }).lean()
    ]);

    if (!user || !stats) {
      return res.status(404).json({ success: false, error: 'Scouting data not found' });
    }

    const aiming = Number((stats as any).skills?.aiming || 0);
    const positioning = Number((stats as any).skills?.positioning || 0);
    const utility = Number((stats as any).skills?.utility || 0);
    const clutch = Number((stats as any).skills?.clutchFactor || 0);
    const teamplay = Number((stats as any).skills?.teamplay || 0);
    const leadership = Number((stats as any).behavioral?.leadership || 0);
    const chill = Number((stats as any).behavioral?.chill || 0);
    const conflictScore = Number((stats as any).behavioral?.conflictScore || 0);
    const impactRating = Number((stats as any).impactRating || 0);

    const components = [
      { key: 'aiming', value: aiming, weight: 0.28, contribution: aiming * 0.28 },
      { key: 'positioning', value: positioning, weight: 0.2, contribution: positioning * 0.2 },
      { key: 'utility', value: utility, weight: 0.16, contribution: utility * 0.16 },
      { key: 'clutchFactor', value: clutch, weight: 0.2, contribution: clutch * 0.2 },
      { key: 'teamplay', value: teamplay, weight: 0.16, contribution: teamplay * 0.16 },
      { key: 'leadershipBoost', value: leadership, weight: 0.08, contribution: leadership * 0.08 },
      { key: 'chillBoost', value: chill, weight: 0.05, contribution: chill * 0.05 },
      { key: 'conflictPenalty', value: conflictScore, weight: -0.15, contribution: conflictScore * -0.15 }
    ];

    const ranked = [...components].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
    const topDrivers = ranked.slice(0, 4).map((item) => ({
      key: item.key,
      value: Number(item.value.toFixed(2)),
      contribution: Number(item.contribution.toFixed(2))
    }));

    const rank = Array.isArray((user as any).gameProfiles) ? (user as any).gameProfiles?.[0]?.rank || 'unknown' : 'unknown';
    const narrative = `Impact ${impactRating.toFixed(1)} formed by top drivers: ${topDrivers.map((x) => `${x.key}(${x.contribution >= 0 ? '+' : ''}${x.contribution})`).join(', ')}.`;

    return res.json({
      success: true,
      data: {
        userId,
        username: (user as any).username || 'unknown',
        role: (user as any).primaryRole || 'Flex',
        rank,
        impactRating: Number(impactRating.toFixed(2)),
        topDrivers,
        narrative
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to explain scouting score' });
  }
});

export default router;
