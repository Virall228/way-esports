import Redis from 'ioredis';
import Tournament from '../models/Tournament';
import User from '../models/User';
import { logError, logInfo } from './loggingService';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key: string;
}

class CacheService {
  private redis: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    const redisDisabled = this.isRedisDisabled();
    if (redisDisabled) {
      logInfo('redis_disabled');
      return;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    this.redis.on('connect', () => {
      this.isConnected = true;
      logInfo('redis_connected');
    });

    this.redis.on('error', (error) => {
      this.isConnected = false;
      logError('redis_error', error);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      logInfo('redis_disconnected');
    });

    // Connect to Redis
    this.connect();
  }

  private async connect() {
    if (!this.redis) return;
    try {
      await this.redis.connect();
    } catch (error) {
      logError('redis_connection_failed', error as Error);
      // Continue without Redis - will use fallback
    }
  }

  /**
   * Get cached data or fetch and cache it
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = { ttl: 300, key }
  ): Promise<T | null> {
    if (!this.isConnected || !this.redis) {
      // Fallback: fetch directly from database
      try {
        return await fetchFn();
      } catch (error) {
        logError('cache_fallback_failed', error as Error, { key });
        return null;
      }
    }

    try {
      // Try to get from cache
      const cached = await this.redis.get(key);
      if (cached) {
        logInfo('cache_hit', { key });
        return JSON.parse(cached);
      }

      // Cache miss - fetch data
      logInfo('cache_miss', { key });
      const data = await fetchFn();

      if (data !== null && data !== undefined) {
        // Cache the data
        await this.redis.setex(key, options.ttl || 300, JSON.stringify(data));
        logInfo('cache_set', { key, ttl: options.ttl || 300 });
      }

      return data;
    } catch (error) {
      logError('cache_operation_failed', error as Error, { key });
      // Fallback to direct fetch
      try {
        return await fetchFn();
      } catch (fetchError) {
        logError('cache_fallback_failed', fetchError as Error, { key });
        return null;
      }
    }
  }

  /**
   * Get tournaments with caching
   */
  async getTournaments(filters: any = {}): Promise<any[]> {
    const cacheKey = `tournaments:${JSON.stringify(filters)}`;

    const result = await this.getOrSet(
      cacheKey,
      async () => {
        const query: any = {};

        if (filters.game) query.game = filters.game;
        if (filters.status) query.status = filters.status;

        const tournaments = await Tournament.find(query)
          .populate('registeredTeams', 'name tag logo members')
          .populate('matches', 'team1 team2 status startTime')
          .sort({ startDate: 1 })
          .lean();

        // Transform for frontend compatibility
        return tournaments.map((t: any) => ({
          id: String(t._id),
          name: t.name,
          title: t.name,
          game: t.game,
          status: t.status,
          startDate: t.startDate,
          date: t.startDate ? new Date(t.startDate).toLocaleDateString() : 'TBD',
          prizePool: Number(t.prizePool || 0),
          participants: Number(t.participants ?? t.currentParticipants ?? 0),
          maxParticipants: Number(t.maxParticipants ?? t.maxTeams ?? 0),
          skillLevel: t.skillLevel || 'All Levels',
          registeredTeams: t.registeredTeams || []
        }));
      },
      { ttl: 60, key: cacheKey } // Cache for 1 minute
    );
    return result || [];
  }

  /**
   * Get tournament by ID with caching
   */
  async getTournamentById(tournamentId: string): Promise<any | null> {
    const cacheKey = `tournament:${tournamentId}`;

    return this.getOrSet(
      cacheKey,
      async () => {
        const tournament = await Tournament.findById(tournamentId)
          .populate('registeredTeams', 'name tag logo members')
          .populate('matches', 'team1 team2 status startTime')
          .lean();

        if (!tournament) return null;

        return {
          id: String(tournament._id),
          name: tournament.name,
          title: tournament.name,
          game: tournament.game,
          status: tournament.status,
          startDate: tournament.startDate,
          date: tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : 'TBD',
          prizePool: Number(tournament.prizePool || 0),
          participants: Number((tournament as any).participants ?? tournament.currentParticipants ?? 0),
          maxParticipants: Number(tournament.maxParticipants ?? (tournament as any).maxTeams ?? 0),
          skillLevel: tournament.skillLevel || 'All Levels',
          registeredTeams: tournament.registeredTeams || []
        };
      },
      { ttl: 120, key: cacheKey } // Cache for 2 minutes
    );
  }

  /**
   * Get user referral stats with caching
   */
  async getUserReferralStats(userId: string): Promise<any | null> {
    const cacheKey = `user_referral_stats:${userId}`;

    return this.getOrSet(
      cacheKey,
      async () => {
        const user = await User.findById(userId)
          .select('isSubscribed subscriptionExpiresAt freeEntriesCount referralCode')
          .lean();

        if (!user) return null;

        // Get referral statistics
        const Referral = require('../models/Referral').default;
        const referrals = await Referral.find({ referrer: userId })
          .select('status createdAt rewardType')
          .lean();

        const stats = {
          totalReferrals: referrals.length,
          pendingReferrals: referrals.filter((r: any) => r.status === 'pending').length,
          completedReferrals: referrals.filter((r: any) => r.status === 'completed').length,
          totalEarned: referrals.filter((r: any) => r.rewardType === 'free_entry').length
        };

        return {
          isSubscribed: user.isSubscribed,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          freeEntriesCount: user.freeEntriesCount,
          referralCode: user.referralCode,
          referralsMade: stats.totalReferrals,
          referralStats: stats
        };
      },
      { ttl: 30, key: cacheKey } // Cache for 30 seconds
    );
  }

  /**
   * Get referral settings with caching
   */
  async getReferralSettings(): Promise<any | null> {
    const cacheKey = 'referral_settings';

    return this.getOrSet(
      cacheKey,
      async () => {
        const ReferralSettings = require('../models/ReferralSettings').default;
        let settings = await ReferralSettings.findOne().lean();

        // Create default settings if none exist
        if (!settings) {
          settings = await ReferralSettings.create({
            referralBonusThreshold: 3,
            refereeBonus: 1,
            referrerBonus: 1,
            subscriptionPrice: 9.99
          });
        }

        return settings;
      },
      { ttl: 300, key: cacheKey } // Cache for 5 minutes
    );
  }

  /**
   * Invalidate cache for specific key
   */
  async invalidate(key: string): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      await this.redis.del(key);
      logInfo('cache_invalidated', { key });
    } catch (error) {
      logError('cache_invalidation_failed', error as Error, { key });
    }
  }

  /**
   * Invalidate multiple cache keys by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isConnected || !this.redis) return;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logInfo('cache_pattern_invalidated', { pattern, keysCount: keys.length });
      }
    } catch (error) {
      logError('cache_pattern_invalidation_failed', error as Error, { pattern });
    }
  }

  /**
   * Invalidate tournament-related caches
   */
  async invalidateTournamentCaches(): Promise<void> {
    await this.invalidatePattern('tournaments:*');
    await this.invalidatePattern('tournament:*');
  }

  /**
   * Invalidate user-related caches
   */
  async invalidateUserCaches(userId: string): Promise<void> {
    await this.invalidatePattern(`user_referral_stats:${userId}`);
    await this.invalidatePattern(`user_stats:${userId}`);
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    if (!this.isConnected || !this.redis) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');

      return {
        connected: true,
        memory: this.parseRedisInfo(info),
        keyspace: this.parseRedisInfo(keyspace)
      };
    } catch (error) {
      logError('cache_stats_failed', error as Error);
      return { connected: false };
    }
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const lines = info.split('\r\n');
    const result: Record<string, any> = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
    }

    return result;
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.isConnected && this.redis) {
      await this.redis.quit();
      this.isConnected = false;
    }
  }

  private isRedisDisabled(): boolean {
    const value = (process.env.REDIS_DISABLED || process.env.NO_REDIS || '').toString().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
