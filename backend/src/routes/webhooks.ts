import express from 'express';
import crypto from 'crypto';
import User from '../models/User';

// Временные заглушки для сервисов
const ReferralService = {
  checkAndAwardReferrerBonus: async (userId: string) => {
    console.log(`Would check and award bonus for ${userId}`);
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

/**
 * Handle successful subscription creation
 */
async function handleSubscriptionCreated(subscription: any) {
  const customerId = subscription.customer;
  const userId = extractUserIdFromCustomerId(customerId);
  
  if (!userId) {
    logError(`Cannot extract user ID from customer ID: ${customerId}`);
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    logError(`User not found for subscription: ${userId}`);
    return;
  }

  // Update user subscription
  user.isSubscribed = true;
  user.subscriptionExpiresAt = new Date(subscription.current_period_end * 1000);
  
  // Add transaction record
  user.wallet.transactions.push({
    type: 'subscription',
    amount: subscription.plan.amount / 100,
    description: 'Subscription activated',
    date: new Date()
  });

  await user.save();

  logPaymentEvent('subscription_created', {
    userId,
    subscriptionId: subscription.id,
    amount: subscription.plan.amount / 100
  });

  // Send notification
  await sendNotification(user, 'subscription_activated', {
    amount: subscription.plan.amount / 100,
    nextBilling: new Date(subscription.current_period_end * 1000)
  });
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: any) {
  const customerId = invoice.customer;
  const userId = extractUserIdFromCustomerId(customerId);
  
  if (!userId) return;

  logPaymentEvent('payment_succeeded', {
    userId,
    amount: invoice.amount_paid / 100,
    invoiceId: invoice.id
  });

  const user = await User.findById(userId);
  if (user) {
    await sendNotification(user, 'payment_successful', {
      amount: invoice.amount_paid / 100,
      date: new Date(invoice.created * 1000)
    });
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: any) {
  const customerId = invoice.customer;
  const userId = extractUserIdFromCustomerId(customerId);
  
  if (!userId) return;

  logPaymentEvent('payment_failed', {
    userId,
    amount: invoice.amount_due / 100,
    invoiceId: invoice.id
  });

  const user = await User.findById(userId);
  if (user) {
    await sendNotification(user, 'payment_failed', {
      amount: invoice.amount_due / 100,
      nextRetry: new Date(invoice.next_payment_attempt * 1000)
    });
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription: any) {
  const customerId = subscription.customer;
  const userId = extractUserIdFromCustomerId(customerId);
  
  if (!userId) return;

  const user = await User.findById(userId);
  if (!user) return;

  user.isSubscribed = false;
  await user.save();

  logPaymentEvent('subscription_cancelled', {
    userId,
    subscriptionId: subscription.id
  });

  await sendNotification(user, 'subscription_cancelled', {
    endDate: new Date(subscription.current_period_end * 1000)
  });
}

/**
 * CloudPayments success handler
 */
async function handleCloudPaymentSuccess(data: any) {
  const userId = data.AccountId;
  const user = await User.findById(userId);
  
  if (!user) return;

  user.isSubscribed = true;
  user.subscriptionExpiresAt = new Date(data.NextTransactionDate);
  
  user.wallet.transactions.push({
    type: 'subscription',
    amount: data.Price,
    description: 'Subscription activated',
    date: new Date()
  });

  await user.save();

  logPaymentEvent('cloudpayment_success', {
    userId,
    amount: data.Price,
    transactionId: data.TransactionId
  });

  await sendNotification(user, 'subscription_activated', {
    amount: data.Price,
    nextBilling: new Date(data.NextTransactionDate)
  });
}

/**
 * Extract user ID from Stripe customer ID
 * Assumes customer ID format: user_${userId}
 */
function extractUserIdFromCustomerId(customerId: string): string | null {
  if (customerId.startsWith('user_')) {
    return customerId.replace('user_', '');
  }
  return null;
}

/**
 * Send notification to user
 */
async function sendNotification(user: any, type: string, data: any) {
  try {
    // Email notification
    if (process.env.EMAIL_SERVICE_ENABLED === 'true') {
      // TODO: Implement email service
      console.log(`Email notification sent to ${user.username}: ${type}`, data);
    }

    // Telegram notification
    if (process.env.TELEGRAM_BOT_TOKEN && user.telegramId) {
      // TODO: Implement telegram notification
      console.log(`Telegram notification sent to ${user.telegramId}: ${type}`, data);
    }
  } catch (error) {
    logError(`Notification failed for user ${user._id}: ${(error as Error).message}`);
  }
}

export default router;
