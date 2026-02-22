import express from 'express';
import { getPlanPricing, BillingCycle, PlanId } from '../config/pricing';

const router = express.Router();

router.post('/checkout-session', async (req: any, res) => {
  try {
    const planId = String(req.body?.plan_id || '').trim() as PlanId;
    const billingCycle = String(req.body?.billing_cycle || '').trim() as BillingCycle;
    const incomingPriceId = String(req.body?.price_id || '').trim();
    const incomingSeats = Number(req.body?.seats || 0);

    if (!planId || !billingCycle) {
      return res.status(400).json({ success: false, error: 'plan_id and billing_cycle are required' });
    }

    const pricing = getPlanPricing(planId, billingCycle);
    if (!pricing) {
      return res.status(400).json({ success: false, error: 'Unsupported plan or billing cycle' });
    }

    if (!incomingPriceId && !pricing.priceId) {
      return res.status(400).json({ success: false, error: 'Missing price_id for checkout' });
    }

    const seats = incomingSeats > 0 ? incomingSeats : pricing.seats;
    const payload = {
      plan_id: pricing.planId,
      billing_cycle: pricing.billingCycle,
      price_id: incomingPriceId || pricing.priceId,
      seats,
      amount: pricing.amount
    };

    return res.json({
      success: true,
      data: payload
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to create checkout session' });
  }
});

export default router;

