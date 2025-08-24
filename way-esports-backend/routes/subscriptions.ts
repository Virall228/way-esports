import express, { Request, Response } from 'express';
// import { body, validationResult } from 'express-validator';
import { Subscription } from '../models/Subscription';
import { mockAuth } from '../middleware/mockAuth';

const router = express.Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
  } | any;
}

// Mock auth middleware for demo
const auth = (req: AuthRequest, res: Response, next: express.NextFunction) => {
  // In real app, this would verify JWT token
  req.user = { id: 'demo_user_id', username: 'DemoUser' };
  next();
};

// Get all subscription plans (public)
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = Subscription.getPlans();
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription plans'
    });
  }
});

// Get current user's subscription
router.get('/current', mockAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    }).populate('user', 'username email');
    
    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'No active subscription found'
      });
    }
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error getting current subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current subscription'
    });
  }
});

// Get user's subscription history
router.get('/history', mockAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const subscriptions = await Subscription.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username email');
    
    const total = await Subscription.countDocuments({ user: userId });
    
    res.json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting subscription history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription history'
    });
  }
});

// Create new subscription
router.post('/', mockAuth, async (req: AuthRequest, res: Response) => {
  try {
    // Validation removed for now
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Validation failed',
    //     errors: errors.array()
    //   });
    // }
    
    const userId = req.user?.id;
    const { plan, paymentMethod, transactionId } = req.body;
    
    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription'
      });
    }
    
    // Get plan details
    const plans = Subscription.getPlans();
    const planDetails = plans[plan];
    
    if (!planDetails) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }
    
    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + planDetails.duration);
    
    // Create subscription
    const subscription = new Subscription({
      user: userId,
      plan,
      price: planDetails.price,
      paymentMethod,
      transactionId: transactionId || `demo_${Date.now()}`,
      startDate,
      endDate,
      features: planDetails.features,
      status: 'active' // In real app, this would be 'pending' until payment is confirmed
    });
    
    await subscription.save();
    
    res.status(201).json({
      success: true,
      data: subscription,
      message: 'Subscription created successfully'
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription'
    });
  }
});

// Cancel subscription
router.post('/cancel', mockAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { reason } = req.body;
    
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    await subscription.cancel(reason);
    
    res.json({
      success: true,
      data: subscription,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
});

// Update subscription settings
router.put('/settings', mockAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { autoRenew } = req.body;
    
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gt: new Date() }
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }
    
    subscription.autoRenew = autoRenew;
    await subscription.save();
    
    res.json({
      success: true,
      data: subscription,
      message: 'Subscription settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating subscription settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription settings'
    });
  }
});

export default router;