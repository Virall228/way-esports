import express from 'express';
import { getTopProspects, refreshWeeklyTopProspects } from '../services/scoutingEngine';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { getScoutProviderStatus } from '../services/aiScoutingProvider';

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

export default router;
