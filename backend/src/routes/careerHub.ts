import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { buildCareerHubDashboard, claimCareerMission, touchCareerHubView } from '../services/careerHubService';

const router = express.Router();

const getUserId = (req: any): string => String(req?.user?._id || req?.user?.id || '').trim();

const sendCareerHubError = (res: express.Response, error: any, fallbackMessage: string) => {
  const statusCode = Number(error?.statusCode || 500);
  return res.status(statusCode).json({
    success: false,
    error: error?.message || fallbackMessage
  });
};

router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const data = await buildCareerHubDashboard(userId);
    await touchCareerHubView(userId);
    return res.json({ success: true, data });
  } catch (error: any) {
    return sendCareerHubError(res, error, 'Failed to load Career Hub');
  }
});

router.post('/me/refresh', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const data = await buildCareerHubDashboard(userId);
    await touchCareerHubView(userId);
    return res.json({ success: true, data });
  } catch (error: any) {
    return sendCareerHubError(res, error, 'Failed to refresh Career Hub');
  }
});

router.post('/me/missions/:missionId/claim', authenticateJWT, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const missionId = String(req.params.missionId || '').trim();
    if (!missionId) {
      return res.status(400).json({ success: false, error: 'Mission ID is required' });
    }

    const data = await claimCareerMission(userId, missionId);
    return res.json({ success: true, data });
  } catch (error: any) {
    return sendCareerHubError(res, error, 'Failed to claim mission reward');
  }
});

export default router;
