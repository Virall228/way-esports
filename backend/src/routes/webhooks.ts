import express from 'express';
import crypto from 'crypto';
import User from '../models/User';
import notificationService from '../services/notificationService';

// Referral Service Implementation (or import from separate service file if exists, but implementing here for now as per plan)
const ReferralService = {
  checkAndAwardReferrerBonus: async (userId: string) => {
    try {
      const user: any = await User.findById(userId);
      if (!user || !user.referredBy) return;

      // Find referrer
      const referrer: any = await User.findOne({ referralCode: user.referredBy });
      if (!referrer) return;

      // Check if already awarded (simple check via existing transactions)
      const alreadyAwarded = referrer.wallet.transactions.some((t: any) =>
        t.type === 'referral' && t.description.includes(user.username)
      );

      if (alreadyAwarded) return;

      // Award bonus (e.g., 1 free entry or small cash amount)
      await referrer.addFreeEntry(1);

      // Notify referrer
      await notificationService.sendToUser(
        referrer,
        'Referral Bonus!',
        `Your friend ${user.username} just subscribed! You received 1 free tournament entry.`
      );

      // Notify referee? Maybe just referrer.

    } catch (error) {
      console.error('Error awarding referral bonus:', error);
    }
  }
};

const logPaymentEvent = (event: string, data: any) => {
  console.log(`Payment event: ${event}`, data);
};

const logError = (event: string, error?: Error, data?: any) => {
  console.error(`Error: ${event}`, error, data);
};

const router = express.Router();

/**
 * Stripe webhook handler for subscription payments
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logError('Stripe webhook secret not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  let event;

  try {
    event = require('stripe')(process.env.STRIPE_SECRET_KEY).webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    logError(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logError(`Webhook processing failed: ${(error as Error).message}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * CloudPayments webhook handler
 */
router.post('/cloudpayments', async (req, res) => {
  const { Data, Signature } = req.body;
  const webhookSecret = process.env.CLOUDPAYMENTS_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logError('CloudPayments webhook secret not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  // Verify signature
  const expectedSignature = crypto
    .createHash('sha256')
    .update(Data + webhookSecret)
    .digest('hex');

  if (Signature !== expectedSignature) {
    logError('CloudPayments webhook signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    const data = JSON.parse(Data);

    switch (data.Type) {
      case 'Subscription.OnSuccess':
        await handleCloudPaymentSuccess(data);
        break;

      case 'Subscription.OnFail':
        await handleCloudPaymentFail(data);
        break;

      case 'Subscription.OnCancel':
        await handleCloudPaymentCancel(data);
        break;

      default:
        console.log(`Unhandled CloudPayments event: ${data.Type}`);
    }

    res.json({ success: true });
  } catch (error) {
    logError(`CloudPayments webhook processing failed: ${(error as Error).message}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handlers implementation

async function handleSubscriptionCreated(subscription: any) {
  const customerId = subscription.customer;
  const userId = extractUserIdFromCustomerId(customerId);
  if (!userId) return;

  const user = await User.findById(userId);
  if (!user) return;

  // Subscribe user
  user.isSubscribed = true;
  user.subscriptionExpiresAt = new Date(subscription.current_period_end * 1000);
  await user.save();

  // Check referral
  await ReferralService.checkAndAwardReferrerBonus(userId);

  await notificationService.sendToUser(user, 'Subscription Activated', `Your subscription is now active! Expires: ${user.subscriptionExpiresAt}`);

  logPaymentEvent('subscription_created', { userId, subId: subscription.id });
}

async function handleSubscriptionUpdated(subscription: any) {
  // Similar to created, update expiry
  const userId = extractUserIdFromCustomerId(subscription.customer);
  if (!userId) return;

  // Logic to update expiry
  await User.findByIdAndUpdate(userId, {
    subscriptionExpiresAt: new Date(subscription.current_period_end * 1000)
  });
}

async function handleSubscriptionCancelled(subscription: any) {
  const userId = extractUserIdFromCustomerId(subscription.customer);
  if (!userId) return;

  await User.findByIdAndUpdate(userId, { isSubscribed: false });
  const user = await User.findById(userId);
  if (user) {
    await notificationService.sendToUser(user, 'Subscription Cancelled', 'Your subscription has been cancelled.');
  }
}

async function handlePaymentSucceeded(invoice: any) {
  const userId = extractUserIdFromCustomerId(invoice.customer);
  if (!userId) return;
  // Send invoice email/notification
  const user = await User.findById(userId);
  if (user) {
    await notificationService.sendToUser(user, 'Payment Successful', `Payment of ${(invoice.amount_paid / 100)} ${invoice.currency} was successful.`);
  }
}

async function handlePaymentFailed(invoice: any) {
  const userId = extractUserIdFromCustomerId(invoice.customer);
  if (!userId) return;
  // Notify user to update payment method
  const user = await User.findById(userId);
  if (user) {
    await notificationService.sendToUser(user, 'Payment Failed', `Payment of ${(invoice.amount_due / 100)} ${invoice.currency} failed. Please update your payment method.`);
  }
}

async function handleCloudPaymentSuccess(data: any) {
  const userId = data.AccountId;
  const user = await User.findById(userId);
  if (!user) return;

  user.isSubscribed = true;
  user.subscriptionExpiresAt = new Date(data.NextTransactionDate); // ISO string usually works for Date constructor
  await user.save();

  await ReferralService.checkAndAwardReferrerBonus(userId);

  await notificationService.sendToUser(user, 'Subscription Activated', `Your subscription is now active via CloudPayments!`);
}

async function handleCloudPaymentFail(data: any) {
  const userId = data.AccountId;
  const user = await User.findById(userId);
  if (user) {
    await notificationService.sendToUser(user, 'Payment Failed', `CloudPayments transaction failed.`);
  }
}

async function handleCloudPaymentCancel(data: any) {
  const userId = data.AccountId;
  await User.findByIdAndUpdate(userId, { isSubscribed: false });
}


function extractUserIdFromCustomerId(customerId: string): string | null {
  if (customerId.startsWith('user_')) {
    return customerId.replace('user_', '');
  }
  return null;
}

export default router;

