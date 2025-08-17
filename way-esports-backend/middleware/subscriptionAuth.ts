import { Request, Response, NextFunction } from 'express';
import { Subscription } from '../models/Subscription';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export const requireActiveSubscription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        requiresAuth: true
      });
    }

    // Check if user has an active subscription
    const activeSubscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (!activeSubscription) {
      return res.status(403).json({
        success: false,
        message: 'Active subscription required',
        requiresSubscription: true,
        redirectTo: '/subscription'
      });
    }

    // Add subscription info to request for further use
    (req as any).subscription = activeSubscription;
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking subscription status'
    });
  }
};

export const checkSubscriptionStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      (req as any).hasActiveSubscription = false;
      return next();
    }

    // Check if user has an active subscription
    const activeSubscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    (req as any).hasActiveSubscription = !!activeSubscription;
    (req as any).subscription = activeSubscription;
    
    next();
  } catch (error) {
    console.error('Subscription status check error:', error);
    (req as any).hasActiveSubscription = false;
    next();
  }
};