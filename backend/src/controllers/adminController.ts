import { Request, Response } from 'express';
import User from '../models/User';
import Tournament from '../models/Tournament';
import News from '../models/News';
import Team from '../models/Team';

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
            Tournament.countDocuments({ status: { $in: ['upcoming', 'ongoing'] } }),
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
        const now = new Date();
        const activeSubscriptions = await User.countDocuments({
            isSubscribed: true,
            $or: [
                { subscriptionExpiresAt: { $exists: false } },
                { subscriptionExpiresAt: null },
                { subscriptionExpiresAt: { $gt: now } }
            ]
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

/**
 * Universal update for any entity
 */
export const updateEntity = async (req: Request, res: Response) => {
    try {
        const { entity, id } = req.params;
        const updates = req.body;

        let Model;
        const finalUpdates = { ...updates };

        switch (entity) {
            case 'users':
                Model = User;
                if (updates.balance !== undefined) {
                    finalUpdates['wallet.balance'] = Number(updates.balance);
                    delete finalUpdates.balance;
                }
                break;
            case 'teams': Model = Team; break;
            case 'tournaments': Model = Tournament; break;
            case 'news': Model = News; break;
            default: return res.status(400).json({ success: false, error: 'Invalid entity type' });
        }

        const item = await (Model as any).findByIdAndUpdate(id, { $set: finalUpdates }, { new: true, runValidators: true });

        if (!item) {
            return res.status(404).json({ success: false, error: `${entity} not found` });
        }

        res.json({ success: true, data: item });
    } catch (error: any) {
        console.error('Admin update error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to update entity' });
    }
};

/**
 * Universal delete for any entity
 */
export const deleteEntity = async (req: Request, res: Response) => {
    try {
        const { entity, id } = req.params;

        let Model;
        switch (entity) {
            case 'users': Model = User; break;
            case 'teams': Model = Team; break;
            case 'tournaments': Model = Tournament; break;
            case 'news': Model = News; break;
            default: return res.status(400).json({ success: false, error: 'Invalid entity type' });
        }

        const item = await (Model as any).findByIdAndDelete(id);

        if (!item) {
            return res.status(404).json({ success: false, error: `${entity} not found` });
        }

        res.json({ success: true, message: `${entity} deleted successfully` });
    } catch (error: any) {
        console.error('Admin delete error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to delete entity' });
    }
};
