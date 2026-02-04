import express from 'express';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import PrizeDistributionService from '../services/prizeDistribution';
import Tournament from '../models/Tournament';
import User from '../models/User';

const router = express.Router();

/**
 * GET /api/prizes/tournament/:id/status
 * Get prize distribution status for a tournament
 */
router.get('/tournament/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const status = await PrizeDistributionService.getPrizeStatus(id);
    res.json(status);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/prizes/tournament/:id/distribute
 * Manually trigger prize distribution (admin only)
 */
router.post('/tournament/:id/distribute', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await PrizeDistributionService.manualDistribution(id);
    res.json({ message: 'Prize distribution completed successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/prizes/pending
 * Get all tournaments with pending prize distributions (admin only)
 */
router.get('/pending', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const pending = await PrizeDistributionService.getPendingDistributions();
    res.json(pending);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/prizes/user/history
 * Get user's prize transaction history
 */
router.get('/user/history', authenticateJWT, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findById(userId)
      .select('wallet.transactions stats')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const prizeTransactions = user.wallet.transactions
      .filter((transaction: any) => transaction.type === 'prize')
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalPrizes = prizeTransactions.reduce((sum: number, transaction: any) => sum + transaction.amount, 0);

    res.json({
      totalPrizes,
      prizeCount: prizeTransactions.length,
      transactions: prizeTransactions,
      stats: {
        tournamentsPlayed: user.stats.tournamentsPlayed,
        tournamentsWon: user.stats.tournamentsWon
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/prizes/leaderboard
 * Get prize leaderboard (top prize earners)
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const topEarners = await User.aggregate([
      {
        $match: {
          'wallet.transactions.type': 'prize'
        }
      },
      {
        $addFields: {
          totalPrizes: {
            $sum: {
              $filter: {
                input: '$wallet.transactions',
                cond: { $eq: ['$$this.type', 'prize'] }
              }
            }
          },
          prizeCount: {
            $size: {
              $filter: {
                input: '$wallet.transactions',
                cond: { $eq: ['$$this.type', 'prize'] }
              }
            }
          }
        }
      },
      {
        $project: {
          username: 1,
          totalPrizes: 1,
          prizeCount: 1,
          'stats.tournamentsWon': 1,
          'stats.tournamentsPlayed': 1,
          photoUrl: 1
        }
      },
      {
        $sort: { totalPrizes: -1 }
      },
      {
        $limit: limit
      }
    ]);

    res.json(topEarners);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/prizes/tournament/:id/winners
 * Get prize distribution details for a tournament
 */
router.get('/tournament/:id/winners', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tournament = await Tournament.findById(id)
      .populate({
        path: 'registeredTeams',
        select: 'name players captain',
        populate: {
          path: 'players',
          select: 'username photoUrl'
        }
      })
      .populate({
        path: 'registeredPlayers',
        select: 'username photoUrl'
      });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const winners = await PrizeDistributionService['getTournamentWinners'](tournament);
    
    res.json({
      tournament: {
        name: tournament.name,
        game: tournament.game,
        prizePool: tournament.prizePool,
        status: tournament.status,
        prizeStatus: tournament.prizeStatus,
        prizeDistribution: tournament.prizeDistribution
      },
      winners: winners.map((winner, index) => ({
        position: index + 1,
        prize: tournament.prizeDistribution?.[Object.keys(tournament.prizeDistribution)[index]] || 0,
        ...winner
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
