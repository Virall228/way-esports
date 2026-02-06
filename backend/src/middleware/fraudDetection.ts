import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Referral from '../models/Referral';

// Временные заглушки
const logSecurityEvent = (event: string, data: any, userId?: string) => {
  console.log(`Security: ${event}`, data, userId);
};

const logWarning = (event: string, data: any, userId?: string) => {
  console.warn(`Warning: ${event}`, data, userId);
};

// Mock service getter to replace dynamic require
const getService = (id: string) => {
  if (id === '../models/Referral') return Referral;
  if (id === '../models/SecurityEvent') return { countDocuments: async () => 0 };
  return {};
};

interface FraudDetectionConfig {
  maxReferralsPerIP: number;
  maxReferralsPerTimeWindow: number;
  timeWindowMinutes: number;
  maxSameDeviceReferrals: number;
  requireEmailVerification: boolean;
  requireTournamentParticipation: boolean;
}

const config: FraudDetectionConfig = {
  maxReferralsPerIP: 5,
  maxReferralsPerTimeWindow: 10,
  timeWindowMinutes: 60,
  maxSameDeviceReferrals: 3,
  requireEmailVerification: true,
  requireTournamentParticipation: true
};

// Track referrals by IP, device, etc.
const referralTracker = new Map<string, { count: number; lastReferral: number }>();

/**
 * Detect and prevent referral fraud
 */
export const detectReferralFraud = async (req: Request, res: Response, next: NextFunction) => {
  const { referralCode } = req.body;
  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'];
  const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;

  if (!referralCode || !userId) {
    return next();
  }

  try {
    // 1. Check IP-based rate limiting
    const ipKey = `ip:${clientIP}`;
    const ipStats = referralTracker.get(ipKey) || { count: 0, lastReferral: 0 };

    const now = Date.now();
    const timeWindow = config.timeWindowMinutes * 60 * 1000;

    // Reset if outside time window
    if (now - ipStats.lastReferral > timeWindow) {
      ipStats.count = 0;
    }

    if (ipStats.count >= config.maxReferralsPerIP) {
      logSecurityEvent('referral_ip_rate_limit', {
        ip: clientIP,
        count: ipStats.count,
        userId
      });

      return res.status(429).json({
        error: 'Too many referrals from this IP address',
        retryAfter: Math.ceil((timeWindow - (now - ipStats.lastReferral)) / 1000)
      });
    }

    // 2. Check device fingerprinting
    const deviceFingerprint = generateDeviceFingerprint(req);
    const deviceKey = `device:${deviceFingerprint}`;
    const deviceStats = referralTracker.get(deviceKey) || { count: 0, lastReferral: 0 };

    if (now - deviceStats.lastReferral > timeWindow) {
      deviceStats.count = 0;
    }

    if (deviceStats.count >= config.maxSameDeviceReferrals) {
      logSecurityEvent('referral_device_rate_limit', {
        fingerprint: deviceFingerprint,
        count: deviceStats.count,
        userId
      });

      return res.status(429).json({
        error: 'Too many referrals from this device'
      });
    }

    // 3. Validate referral code format
    if (!isValidReferralCode(referralCode)) {
      logSecurityEvent('invalid_referral_code_format', {
        code: referralCode,
        userId
      });

      return res.status(400).json({
        error: 'Invalid referral code format'
      });
    }

    // 4. Check if referral code exists and is valid
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      logSecurityEvent('invalid_referral_code', {
        code: referralCode,
        userId
      });

      return res.status(404).json({
        error: 'Invalid referral code'
      });
    }

    // 5. Check self-referral
    if (referrer._id.toString() === userId) {
      logSecurityEvent('self_referral_attempt', {
        code: referralCode,
        userId
      });

      return res.status(400).json({
        error: 'Cannot use your own referral code'
      });
    }

    // 6. Check for existing referral
    const existingReferral = await Referral.findOne({
      referee: userId,
      referrer: referrer._id
    });

    if (existingReferral) {
      logSecurityEvent('duplicate_referral_attempt', {
        referrerId: referrer._id,
        refereeId: userId,
        existingStatus: existingReferral.status
      });

      return res.status(409).json({
        error: 'Referral already exists'
      });
    }

    // 7. Check if user has required verification
    const refereeUser = await User.findById(userId);
    if (!refereeUser) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (config.requireEmailVerification && !(refereeUser as any).emailVerified) {
      logSecurityEvent('referral_without_email_verification', {
        userId,
        referralCode
      });

      return res.status(403).json({
        error: 'Email verification required to use referral code'
      });
    }

    // 8. Check if referrer is in good standing
    if (referrer.isBanned) {
      logSecurityEvent('referral_from_banned_user', {
        referrerId: referrer._id,
        refereeId: userId
      });

      return res.status(403).json({
        error: 'Invalid referral code'
      });
    }

    // Update tracking
    ipStats.count++;
    ipStats.lastReferral = now;
    referralTracker.set(ipKey, ipStats);

    deviceStats.count++;
    deviceStats.lastReferral = now;
    referralTracker.set(deviceKey, deviceStats);

    // Add fraud detection data to request
    (req as any).fraudDetection = {
      passed: true,
      clientIP,
      deviceFingerprint,
      referrerId: referrer._id
    };

    next();
  } catch (error) {
    logSecurityEvent('fraud_detection_error', {
      error: (error as Error).message,
      userId,
      referralCode
    });

    return res.status(500).json({
      error: 'Fraud detection failed'
    });
  }
};

/**
 * Validate referral completion (after user meets requirements)
 */
export const validateReferralCompletion = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req.user as any)?._id?.toString() || (req.user as any)?.id;

  if (!userId) {
    return next();
  }

  try {
    // Find pending referrals for this user
    const pendingReferrals = await Referral.find({
      referee: userId,
      status: 'pending'
    }).populate('referrer');

    for (const referral of pendingReferrals as any[]) {
      const refereeUser = await User.findById(userId);
      const referrerUser = referral.referrer;

      if (!refereeUser || !referrerUser) continue;

      // Check if user meets completion criteria
      const isCompleted = await checkReferralCompletionCriteria(refereeUser, referrerUser);

      if (isCompleted) {
        // Mark referral as completed
        await Referral.findByIdAndUpdate(referral._id, {
          status: 'completed',
          completedAt: new Date()
        });

        // Award bonuses
        const ReferralService = require('../services/referralService').default;
        await ReferralService.checkAndAwardReferrerBonus(referrerUser._id.toString());

        logSecurityEvent('referral_completed', {
          referrerId: referrerUser._id,
          refereeId: userId,
          referralId: referral._id
        });
      }
    }

    next();
  } catch (error) {
    console.error('referral_completion_validation_error', error, { userId });
    next(); // Don't block the request for validation errors
  }
};

/**
 * Check if user meets referral completion criteria
 */
async function checkReferralCompletionCriteria(refereeUser: any, referrerUser: any): Promise<boolean> {
  // Criteria 1: Email verification
  if (config.requireEmailVerification && !(refereeUser as any).emailVerified) {
    return false;
  }

  // Criteria 2: Tournament participation
  if (config.requireTournamentParticipation) {
    const Tournament = require('../models/Tournament').default;
    const hasParticipated = await Tournament.exists({
      registeredTeams: { $in: [refereeUser._id] }
    });

    if (!hasParticipated) {
      return false;
    }
  }

  // Criteria 3: Account age (at least 24 hours old)
  const accountAge = Date.now() - new Date(refereeUser.createdAt).getTime();
  const minAccountAge = 24 * 60 * 60 * 1000; // 24 hours

  if (accountAge < minAccountAge) {
    return false;
  }

  // Criteria 4: No suspicious activity
  const securityService = getService('../models/SecurityEvent');
  let recentSecurityEvents = 0;

  if (securityService) {
    recentSecurityEvents = await (securityService as any).countDocuments({
      userId: refereeUser._id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
  }

  if (recentSecurityEvents > 0) {
    return false;
  }

  return true;
}

/**
 * Get client IP address
 */
function getClientIP(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string) ||
    (req.headers['x-real-ip'] as string) ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Generate device fingerprint from request headers
 */
function generateDeviceFingerprint(req: Request): string {
  const headers = req.headers;
  const fingerprint = [
    headers['user-agent'] || '',
    headers['accept-language'] || '',
    headers['accept-encoding'] || '',
    headers['accept'] || '',
    headers['sec-ch-ua'] || '',
    headers['sec-ch-ua-platform'] || ''
  ].join('|');

  // Simple hash (in production, use a proper hashing function)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(16);
}

/**
 * Validate referral code format
 */
function isValidReferralCode(code: string): boolean {
  // Should be 6-8 characters, alphanumeric, uppercase
  const regex = /^[A-Z0-9]{6,8}$/;
  return regex.test(code);
}

/**
 * Cleanup old tracking data
 */
setInterval(() => {
  const now = Date.now();
  const timeWindow = config.timeWindowMinutes * 60 * 1000;

  for (const [key, stats] of referralTracker.entries()) {
    if (now - stats.lastReferral > timeWindow * 2) {
      referralTracker.delete(key);
    }
  }
}, config.timeWindowMinutes * 60 * 1000);

export { config as fraudDetectionConfig };
