import { Request, Response } from 'express';
import User from '../models/User';
import Tournament from '../models/Tournament';
import News from '../models/News';

/**
 * Get dashboard statistics for admin panel
 * USES REAL DATA FROM DB
 */
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const [
            totalUsers,
            activeTournaments,
            newsArticles,
            prizePoolSummary
        ] = await Promise.all([
            User.countDocuments(),
            Tournament.countDocuments({ status: 'active' }),
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
                newsArticles,
                totalPrizePool: prizePoolSummary[0]?.total || 0
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard statistics' });
    }
};

/**
 * Get detailed analytics for chart visualization
 */
export const getAnalytics = async (req: Request, res: Response) => {
    try {
        // Aggregation for registrations by day (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const userGrowth = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Subscriptions count
        const activeSubscriptions = await User.countDocuments({
            isSubscribed: true,
            subscriptionExpiresAt: { $gt: new Date() }
        });

        res.json({
            success: true,
            data: {
                userGrowth,
                activeSubscriptions
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
};
