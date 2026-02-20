import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import { suggestTeamByRoles } from '../services/matchmakingEngine';

const router = express.Router();

router.post('/suggest-team', authenticateJWT, async (req, res) => {
  try {
    const playerIds = Array.isArray(req.body?.playerIds) ? req.body.playerIds : [];
    const result = await suggestTeamByRoles({ playerIds });
    return res.json({ success: true, data: result });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to suggest team' });
  }
});

export default router;

