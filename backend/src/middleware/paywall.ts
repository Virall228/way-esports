import { Request, Response, NextFunction } from 'express';
import User from '../models/User';

/**
 * Middleware to check if a user has access to premium features (tournaments)
 * Either via an active subscription or a free entry.
 */
export const checkTournamentAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = req.user as any;
        if (!user) {
            return res.status(401).json({ success: false, error: 'Authentication required' });
        }

        // Refresh user from DB to get latest status
        const dbUser = await User.findById(user._id);
        if (!dbUser) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        // If user is admin/developer, they have bypass
        if (dbUser.role === 'admin' || dbUser.role === 'developer') {
            return next();
        }

        // 1. Check active subscription
        const now = new Date();
        const hasActiveSub = dbUser.isSubscribed && dbUser.subscriptionExpiresAt && dbUser.subscriptionExpiresAt > now;

        if (hasActiveSub) {
            return next();
        }

        // 2. Check free entries
        if (dbUser.freeEntriesCount && dbUser.freeEntriesCount > 0) {
            // We don't deduct here, we just check. Deduction happens on successful join.
            return next();
        }

        // No access
        return res.status(403).json({
            success: false,
            error: 'Access denied. Active subscription or free entry required.',
            requirePayment: true
        });
    } catch (error) {
        console.error('Paywall middleware error:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
};
