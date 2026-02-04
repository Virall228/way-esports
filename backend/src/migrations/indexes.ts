import mongoose from 'mongoose';
import Session from '../models/Session';
import EmailOtp from '../models/EmailOtp';
import User from '../models/User';
import Achievement from '../models/Achievement';
import Match from '../models/Match';
import Tournament from '../models/Tournament';
import Team from '../models/Team';
import News from '../models/News';
import Reward from '../models/Reward';
import PlayerReward from '../models/PlayerReward';
import Wallet from '../models/Wallet';

/**
 * MongoDB Index Migrations
 * 
 * This script ensures all required indexes exist for optimal performance
 * and TTL (time-to-live) behavior for temporary collections.
 */

export async function createIndexes(): Promise<void> {
  try {
    console.log('🔧 Creating MongoDB indexes...');

    // Sessions collection - TTL for expired sessions
    await Session.createIndexes();
    console.log('✅ Session indexes ensured (including TTL on expiresAt)');

    // Email OTP collection - TTL for expired OTPs
    await EmailOtp.createIndexes();
    console.log('✅ EmailOtp indexes ensured (including TTL on expiresAt)');

    // Users collection - unique indexes for auth and lookups
    await User.createIndexes();
    console.log('✅ User indexes ensured (telegramId, email)');

    // Achievements collection - unique keys and active flag
    await Achievement.createIndexes();
    console.log('✅ Achievement indexes ensured (key, isActive)');

    // Matches collection - compound indexes for tournament queries
    await Match.createIndexes();
    console.log('✅ Match indexes ensured (tournament, status, startTime)');

    // Tournaments collection - status and date indexes for listings
    await Tournament.createIndexes();
    console.log('✅ Tournament indexes ensured (status, startDate, game)');

    // Teams collection - tag uniqueness and game filtering
    await Team.createIndexes();
    console.log('✅ Team indexes ensured (tag, game, captain)');

    // News collection - publish date and category for listings
    await News.createIndexes();
    console.log('✅ News indexes ensured (publishDate, category, status)');

    // Rewards collection - active rewards lookup
    await Reward.createIndexes();
    console.log('✅ Reward indexes ensured (isActive, type)');

    // Player rewards collection - user reward tracking
    await PlayerReward.createIndexes();
    console.log('✅ PlayerReward indexes ensured (user, reward, claimedAt)');

    // Wallet collection - user wallet lookup
    await Wallet.createIndexes();
    console.log('✅ Wallet indexes ensured (user)');

    console.log('🎉 All MongoDB indexes created/verified successfully');
  } catch (error) {
    console.error('❌ Failed to create indexes:', error);
    throw error;
  }
}

/**
 * Drop all custom indexes (keeps default _id index)
 * Useful for testing or index resets
 */
export async function dropCustomIndexes(): Promise<void> {
  try {
    console.log('🗑️ Dropping custom indexes...');

    const collections = [
      Session,
      EmailOtp,
      User,
      Achievement,
      Match,
      Tournament,
      Team,
      News,
      Reward,
      PlayerReward,
      Wallet
    ];

    for (const Model of collections) {
      try {
        await Model.collection.dropIndexes();
        console.log(`✅ Dropped custom indexes for ${Model.modelName}`);
      } catch (error: any) {
        if (error.codeName === 'NamespaceNotFound') {
          console.log(`ℹ️ Collection ${Model.modelName} does not exist yet`);
        } else {
          console.warn(`⚠️ Warning dropping indexes for ${Model.modelName}:`, error.message);
        }
      }
    }

    console.log('🎉 All custom indexes dropped');
  } catch (error) {
    console.error('❌ Failed to drop indexes:', error);
    throw error;
  }
}

/**
 * Get index information for all collections
 */
export async function getIndexStats(): Promise<void> {
  try {
    console.log('📊 Index Statistics:');
    
    const collections = [
      { model: Session, name: 'sessions' },
      { model: EmailOtp, name: 'email-otps' },
      { model: User, name: 'users' },
      { model: Achievement, name: 'achievements' },
      { model: Match, name: 'matches' },
      { model: Tournament, name: 'tournaments' },
      { model: Team, name: 'teams' },
      { model: News, name: 'news' },
      { model: Reward, name: 'rewards' },
      { model: PlayerReward, name: 'player-rewards' },
      { model: Wallet, name: 'wallets' }
    ];

    for (const { model, name } of collections) {
      try {
        const indexes = await model.collection.listIndexes().toArray();
        console.log(`\n📚 ${name.toUpperCase()} indexes:`);
        indexes.forEach(index => {
          const ttlInfo = index.expireAfterSeconds ? ` (TTL: ${index.expireAfterSeconds}s)` : '';
          const uniqueInfo = index.unique ? ' (UNIQUE)' : '';
          console.log(`  - ${index.name}: ${JSON.stringify(index.key)}${ttlInfo}${uniqueInfo}`);
        });
      } catch (error: any) {
        if (error.codeName === 'NamespaceNotFound') {
          console.log(`\n📚 ${name.toUpperCase()}: Collection does not exist yet`);
        } else {
          console.warn(`\n⚠️ Error getting indexes for ${name}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to get index stats:', error);
    throw error;
  }
}

/**
 * Run this as a standalone script
 */
if (require.main === module) {
  const mongoose = require('mongoose');
  const config = require('../config/config');

  async function run() {
    try {
      await mongoose.connect(config.database.url);
      console.log('🔗 Connected to MongoDB');

      await createIndexes();
      await getIndexStats();

      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
      process.exit(0);
    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    }
  }

  run();
}
