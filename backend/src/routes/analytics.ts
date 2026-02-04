import express from 'express';
import User from '../models/User';
import Referral from '../models/Referral';
import Tournament from '../models/Tournament';
import { logInfo } from '../services/loggingService';

const router = express.Router();

/**
 * Track funnel conversion events
 */
router.post('/track', async (req, res) => {
  try {
    const { event, userId, data, sessionId, source } = req.body;

    if (!event || !userId) {
      return res.status(400).json({ error: 'Event and userId required' });
    }

    // Validate event type
    const validEvents = [
      'page_view',
      'referral_link_click',
      'registration_start',
      'registration_complete',
      'subscription_page_view',
      'subscription_start',
      'subscription_complete',
      'tournament_page_view',
      'tournament_registration_start',
      'tournament_registration_complete',
      'payment_initiated',
      'payment_success',
      'payment_failed'
    ];

    if (!validEvents.includes(event)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    // Store analytics event
    await storeAnalyticsEvent({
      event,
      userId,
      data,
      sessionId,
      source,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // Update funnel metrics
    await updateFunnelMetrics(event, userId, data);

    logInfo('analytics_event_tracked', { event, userId, data });

    res.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking failed:', error);
    res.status(500).json({ error: 'Analytics tracking failed' });
  }
});

/**
 * Get funnel conversion metrics
 */
router.get('/funnel', async (req, res) => {
  try {
    const { timeframe = '7d', cohort } = req.query;

    const metrics = await getFunnelMetrics(timeframe as string, cohort as string);
    res.json(metrics);
  } catch (error) {
    console.error('Failed to get funnel metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * Get referral performance metrics
 */
router.get('/referrals', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    const metrics = await getReferralMetrics(timeframe as string);
    res.json(metrics);
  } catch (error) {
    console.error('Failed to get referral metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * Get subscription conversion metrics
 */
router.get('/subscriptions', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    const metrics = await getSubscriptionMetrics(timeframe as string);
    res.json(metrics);
  } catch (error) {
    console.error('Failed to get subscription metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * Get tournament engagement metrics
 */
router.get('/tournaments', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    const metrics = await getTournamentMetrics(timeframe as string);
    res.json(metrics);
  } catch (error) {
    console.error('Failed to get tournament metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * Store analytics event in database
 */
async function storeAnalyticsEvent(eventData: any) {
  // In a real implementation, this would store in a dedicated analytics collection
  // For now, we'll just log it
  logInfo('analytics_event_stored', eventData);
}

/**
 * Update funnel metrics
 */
async function updateFunnelMetrics(event: string, userId: string, data: any) {
  // Update user's funnel progress
  const user = await User.findById(userId);
  if (!user) return;

  const funnelProgress = (user as any).funnelProgress || {};

  switch (event) {
    case 'page_view':
      funnelProgress.firstVisit = funnelProgress.firstVisit || new Date();
      break;
    
    case 'referral_link_click':
      funnelProgress.referralClick = new Date();
      funnelProgress.referralSource = data.referralCode;
      break;
    
    case 'registration_complete':
      funnelProgress.registrationComplete = new Date();
      break;
    
    case 'subscription_complete':
      funnelProgress.subscriptionComplete = new Date();
      funnelProgress.subscriptionValue = data.amount;
      break;
    
    case 'tournament_registration_complete':
      funnelProgress.firstTournamentRegistration = new Date();
      break;
  }

  await User.findByIdAndUpdate(userId, { funnelProgress });
}

/**
 * Get funnel conversion metrics
 */
async function getFunnelMetrics(timeframe: string, cohort?: string) {
  const days = parseInt(timeframe) || 7;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const matchStage: any = {
    createdAt: { $gte: startDate }
  };

  if (cohort) {
    matchStage['funnelProgress.referralSource'] = cohort;
  }

  const pipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        visitedSite: { $sum: { $cond: ['$funnelProgress.firstVisit', 1, 0] } },
        clickedReferral: { $sum: { $cond: ['$funnelProgress.referralClick', 1, 0] } },
        completedRegistration: { $sum: { $cond: ['$funnelProgress.registrationComplete', 1, 0] } },
        completedSubscription: { $sum: { $cond: ['$funnelProgress.subscriptionComplete', 1, 0] } },
        registeredForTournament: { $sum: { $cond: ['$funnelProgress.firstTournamentRegistration', 1, 0] } },
        totalRevenue: { $sum: '$funnelProgress.subscriptionValue' }
      }
    }
  ];

  const result = await User.aggregate(pipeline);
  const metrics = result[0] || { totalUsers: 0 };

  return {
    timeframe,
    cohort,
    funnel: {
      visitors: metrics.totalUsers || 0,
      referralClicks: metrics.clickedReferral || 0,
      registrations: metrics.completedRegistration || 0,
      subscriptions: metrics.completedSubscription || 0,
      tournamentRegistrations: metrics.registeredForTournament || 0,
      revenue: metrics.totalRevenue || 0
    },
    conversionRates: {
      visitToReferral: metrics.totalUsers ? (metrics.clickedReferral / metrics.totalUsers) * 100 : 0,
      referralToRegistration: metrics.clickedReferral ? (metrics.completedRegistration / metrics.clickedReferral) * 100 : 0,
      registrationToSubscription: metrics.completedRegistration ? (metrics.completedSubscription / metrics.completedRegistration) * 100 : 0,
      registrationToTournament: metrics.completedRegistration ? (metrics.registeredForTournament / metrics.completedRegistration) * 100 : 0
    }
  };
}

/**
 * Get referral performance metrics
 */
async function getReferralMetrics(timeframe: string) {
  const days = parseInt(timeframe) || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const referrals = await Referral.find({
    createdAt: { $gte: startDate }
  }).populate('referrer referee');

  const metrics = {
    totalReferrals: referrals.length,
    pendingReferrals: referrals.filter(r => r.status === 'pending').length,
    completedReferrals: referrals.filter(r => r.status === 'completed').length,
    rewardedReferrals: referrals.filter(r => r.status === 'rewarded').length,
    conversionRate: 0,
    topReferrers: [] as any[],
    referralValue: 0
  };

  metrics.conversionRate = metrics.totalReferrals ? (metrics.completedReferrals / metrics.totalReferrals) * 100 : 0;

  // Calculate top referrers
  const referrerStats = new Map<string, { count: number; completed: number; username: string }>();
  
  referrals.forEach(referral => {
    const referrerId = (referral.referrer as any)._id.toString();
    const existing = referrerStats.get(referrerId) || { count: 0, completed: 0, username: (referral.referrer as any).username };
    
    existing.count++;
    if (referral.status === 'completed') {
      existing.completed++;
    }
    
    referrerStats.set(referrerId, existing);
  });

  metrics.topReferrers = Array.from(referrerStats.entries())
    .map(([id, stats]) => ({ userId: id, ...stats }))
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 10);

  // Calculate referral value (based on subscription revenue from referred users)
  const referredUsers = referrals.map(r => (r.referee as any)._id.toString());
  const referredUserSubscriptions = await User.find({
    _id: { $in: referredUsers },
    isSubscribed: true
  });

  metrics.referralValue = referredUserSubscriptions.length * 9.99; // Assuming $9.99 per subscription

  return metrics;
}

/**
 * Get subscription conversion metrics
 */
async function getSubscriptionMetrics(timeframe: string) {
  const days = parseInt(timeframe) || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const users = await User.find({
    'funnelProgress.subscriptionComplete': { $gte: startDate }
  });

  const metrics = {
    newSubscriptions: users.length,
    totalRevenue: users.reduce((sum, user) => sum + (user.funnelProgress?.subscriptionValue || 9.99), 0),
    averageRevenuePerUser: 0,
    subscriptionSources: {} as Record<string, number>,
    churnRate: 0
  };

  metrics.averageRevenuePerUser = users.length ? metrics.totalRevenue / users.length : 0;

  // Analyze subscription sources
  users.forEach(user => {
    const source = user.funnelProgress?.referralSource || 'direct';
    metrics.subscriptionSources[source] = (metrics.subscriptionSources[source] || 0) + 1;
  });

  // Calculate churn rate (simplified)
  const totalActiveUsers = await User.countDocuments({ isSubscribed: true });
  const churnedUsers = await User.countDocuments({
    isSubscribed: false,
    'funnelProgress.subscriptionComplete': { $exists: true }
  });

  metrics.churnRate = totalActiveUsers ? (churnedUsers / totalActiveUsers) * 100 : 0;

  return metrics;
}

/**
 * Get tournament engagement metrics
 */
async function getTournamentMetrics(timeframe: string) {
  const days = parseInt(timeframe) || 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const tournaments = await Tournament.find({
    startDate: { $gte: startDate }
  });

  const metrics = {
    totalTournaments: tournaments.length,
    totalRegistrations: 0,
    averageRegistrationsPerTournament: 0,
    tournamentByGame: {} as Record<string, number>,
    tournamentFillRate: 0,
    uniqueParticipants: new Set<string>()
  };

  tournaments.forEach(tournament => {
    const registrations = tournament.registeredTeams?.length || 0;
    metrics.totalRegistrations += registrations;
    
    // Track by game
    const game = tournament.game || 'unknown';
    metrics.tournamentByGame[game] = (metrics.tournamentByGame[game] || 0) + 1;
    
    // Track unique participants
    tournament.registeredTeams?.forEach((participant: any) => {
      metrics.uniqueParticipants.add(participant.toString());
    });
  });

  metrics.averageRegistrationsPerTournament = tournaments.length ? metrics.totalRegistrations / tournaments.length : 0;
  metrics.tournamentFillRate = tournaments.reduce((sum, t) => {
    const maxParticipants = t.maxParticipants || 100;
    const currentParticipants = t.registeredTeams?.length || 0;
    return sum + (currentParticipants / maxParticipants);
  }, 0) / tournaments.length;

  // Convert Set to count
  (metrics as any).uniqueParticipants = metrics.uniqueParticipants.size;

  return metrics;
}

export default router;
