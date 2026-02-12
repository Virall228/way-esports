import { Request, Response } from 'express';
import User from '../models/User';
import Tournament from '../models/Tournament';
import News from '../models/News';
import Team from '../models/Team';

/**
 * Get public platform statistics for the Home page
 */
export const getPublicStats = async (req: Request, res: Response) => {
    try {
        const [
            totalUsers,
            activeTournaments,
            activeTeams,
            newsArticles,
            prizePoolSummary
        ] = await Promise.all([
            User.countDocuments(),
            Tournament.countDocuments({ status: { $in: ['upcoming', 'ongoing'] } }),
            Team.countDocuments({ status: 'active' }),
            News.countDocuments(),
            Tournament.aggregate([
                { $match: { prizePool: { $exists: true } } },
                { $group: { _id: null, total: { $sum: '$prizePool' } } }
            ])
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                activeTournaments,
                activeTeams,
                newsArticles,
                totalPrizePool: prizePoolSummary[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Public stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch platform statistics' });
    }
};
