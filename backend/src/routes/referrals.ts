import express from 'express';
import { authenticateJWT, isAdmin } from '../middleware/auth';
import ReferralService from '../services/referralService';

const router = express.Router();
const DEFAULT_SUBSCRIPTION_PAYMENT_ADDRESS =
  process.env.SUBSCRIPTION_USDT_TRC20_ADDRESS ||
  process.env.USDT_TRC20_ADDRESS ||
  'TAoLXyWNAZoxYCkYu4iEuk6N6jUhhDyXHU';

/**
 * GET /api/referrals/stats
 * Get referral statistics for current user
 */
router.get('/stats', authenticateJWT, async (req, res) => {
  try {
    const userId = (req as any).user?._id?.toString?.() || (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const stats = await ReferralService.getReferralStats(userId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/referrals/public-settings
 * Get public referral settings (for billing UI)
 */
router.get('/public-settings', async (_req, res) => {
  try {
    const settings = await ReferralService.getReferralSettings();
    res.json({
      referralBonusThreshold: settings?.referralBonusThreshold ?? 3,
      refereeBonus: settings?.refereeBonus ?? 1,
      referrerBonus: settings?.referrerBonus ?? 1,
      subscriptionPrice: settings?.subscriptionPrice ?? 9.99,
      subscriptionPaymentNetwork: 'USDT-TRC20',
      subscriptionPaymentAddress: DEFAULT_SUBSCRIPTION_PAYMENT_ADDRESS
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/referrals/settings
 * Get referral settings (admin only)
 */
router.get('/settings', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const settings = await ReferralService.getReferralSettings();
    res.json(settings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/referrals/settings
 * Update referral settings (admin only)
 */
router.put('/settings', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const settings = await ReferralService.updateReferralSettings(req.body);
    res.json(settings);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/referrals/add-free-entries
 * Manually add free entries to a user (admin only)
 */
router.post('/add-free-entries', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const { userId, count, reason } = req.body;
    
    if (!userId || !count || !reason) {
      return res.status(400).json({ 
        error: 'userId, count, and reason are required' 
      });
    }

    await ReferralService.addFreeEntries(userId, count, reason);
    res.json({ message: 'Free entries added successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/referrals/all
 * Get all referrals (admin only)
 */
router.get('/all', authenticateJWT, isAdmin, async (req, res) => {
  try {
    const referrals = await ReferralService.getAllReferrals();
    res.json(referrals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/referrals/process
 * Process referral (used during registration)
 */
router.post('/process', async (req, res) => {
  try {
    const { referralCode, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    await ReferralService.processReferral(referralCode, userId);
    res.json({ message: 'Referral processed successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
