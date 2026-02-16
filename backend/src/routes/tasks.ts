import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { addTask, getQueueStats } from '../services/queue';
import { idempotency } from '../middleware/idempotency';

const router = express.Router();

router.use(authenticateJWT, isAdmin);

router.post(
  '/bulk-register',
  idempotency({ required: true }),
  [
    body('tournamentId').isMongoId().withMessage('tournamentId must be a valid MongoID'),
    body('teamIds').isArray({ min: 1 }).withMessage('teamIds must be a non-empty array'),
    body('teamIds.*').isMongoId().withMessage('Each teamId must be a valid MongoID')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { tournamentId, teamIds } = req.body;
      const normalizedTeamIds = [...new Set((teamIds || []).map((id: string) => id.toString()))];

      const job = await addTask(
        'bulkRegisterTeams',
        { tournamentId, teamIds: normalizedTeamIds },
        { jobId: `bulk:${tournamentId}:${normalizedTeamIds.join(',')}` }
      );

      return res.status(202).json({
        success: true,
        data: job
      });
    } catch (error: any) {
      if (error?.message?.includes('Job is already waiting')) {
        return res.status(202).json({
          success: true,
          message: 'Bulk registration task is already queued'
        });
      }

      console.error('Failed to enqueue bulk registration task:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to enqueue task'
      });
    }
  }
);

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await getQueueStats();
    return res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch queue stats'
    });
  }
});

export default router;
