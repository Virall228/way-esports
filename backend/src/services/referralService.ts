import mongoose from 'mongoose';
import User from '../models/User';

// Временно используем заглушки для моделей
const Referral = mongoose.models.Referral || mongoose.model('Referral', new mongoose.Schema({
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'completed', 'rewarded'], default: 'pending' },
  rewardType: { type: String, enum: ['free_entry', 'subscription'], default: 'free_entry' },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}));

const ReferralSettings = mongoose.models.ReferralSettings || mongoose.model('ReferralSettings', new mongoose.Schema({
  referralBonusThreshold: { type: Number, default: 3 },
  refereeBonus: { type: Number, default: 1 },
  referrerBonus: { type: Number, default: 1 },
  subscriptionPrice: { type: Number, default: 9.99 },
  createdAt: { type: Date, default: Date.now }
}));

/**
 * Referral Service - manages referral system logic
 */
export class ReferralService {
  /**
   * Process referral when a new user registers
   */
  static async processReferral(referralCode: string, newUserId: string): Promise<void> {
    if (!referralCode) return;

    try {
      // Find referrer by code
      const referrer = await User.findOne({ referralCode });
      if (!referrer) {
        console.log(`Invalid referral code: ${referralCode}`);
        return;
      }

      // Check if referral already exists
      const existingReferral = await Referral.findOne({
        referrer: referrer._id,
        referee: newUserId
      });

      if (existingReferral) {
        console.log('Referral already processed');
        return;
      }

      // Create referral record
      const referral = new Referral({
        referrer: referrer._id,
        referee: newUserId,
        status: 'completed',
        rewardType: 'free_entry',
        completedAt: new Date()
      });

      await referral.save();

      // Update new user with referral info
      const newUser = await User.findById(newUserId);
      if (newUser) {
        newUser.referredBy = referralCode;
        await newUser.save();
      }

      // Give new user their bonus
      const settings = await ReferralSettings.findOne();
      const newUserBonus = settings?.refereeBonus || 1;
      
      if (newUser && newUserBonus > 0) {
        await newUser.addFreeEntry(newUserBonus);
        console.log(`Gave ${newUserBonus} free entries to new user ${newUser.username}`);
      }

      // Check if referrer earned a bonus
      await this.checkReferrerBonus(referrer._id.toString());

      console.log(`Referral processed: ${referralCode} -> ${newUserId}`);
    } catch (error) {
      console.error('Error processing referral:', error);
      throw error;
    }
  }

  /**
   * Check if referrer earned a bonus based on completed referrals
   */
  static async checkReferrerBonus(referrerId: string): Promise<void> {
    try {
      const settings = await ReferralSettings.findOne();
      if (!settings) return;

      const referralsNeeded = settings.referralBonusThreshold;
      const bonusValue = settings.referrerBonus;

      // Count completed referrals for this referrer
      const completedReferrals = await Referral.countDocuments({
        referrer: referrerId,
        status: 'completed'
      });

      // Count already rewarded referrals
      const rewardedReferrals = await Referral.countDocuments({
        referrer: referrerId,
        status: 'rewarded'
      });

      // Calculate how many bonuses the referrer should have received
      const totalBonusesEarned = Math.floor(completedReferrals / referralsNeeded);
      const bonusesAlreadyGiven = Math.floor(rewardedReferrals / referralsNeeded);
      const bonusesToGive = totalBonusesEarned - bonusesAlreadyGiven;

      if (bonusesToGive > 0) {
        const referrer = await User.findById(referrerId);
        if (referrer) {
          await referrer.addFreeEntry(bonusesToGive * bonusValue);
          
          // Mark referrals as rewarded
          const referralsToMark = await Referral.find({
            referrer: referrerId,
            status: 'completed'
          }).limit(bonusesToGive * referralsNeeded);

          for (const referral of referralsToMark) {
            referral.status = 'rewarded';
            await referral.save();
          }

          console.log(`Gave ${bonusesToGive * bonusValue} free entries to referrer ${referrer.username}`);
        }
      }
    } catch (error) {
      console.error('Error checking referrer bonus:', error);
      throw error;
    }
  }

  /**
   * Get referral statistics for a user
   */
  static async getReferralStats(userId: string): Promise<any> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const completedReferrals = await Referral.countDocuments({
        referrer: userId,
        status: 'completed'
      });

      const rewardedReferrals = await Referral.countDocuments({
        referrer: userId,
        status: 'rewarded'
      });

      const settings = await ReferralSettings.findOne();
      const referralsNeeded = settings?.referralBonusThreshold || 3;
      const bonusValue = settings?.referrerBonus || 1;

      const totalBonusesEarned = Math.floor(completedReferrals / referralsNeeded);
      const pendingReferrals = completedReferrals - rewardedReferrals;
      const referralsUntilNextBonus = referralsNeeded - (completedReferrals % referralsNeeded);

      return {
        referralCode: user.referralCode,
        completedReferrals,
        rewardedReferrals,
        pendingReferrals,
        totalBonusesEarned,
        referralsUntilNextBonus: referralsUntilNextBonus === referralsNeeded ? 0 : referralsUntilNextBonus,
        freeEntriesCount: user.freeEntriesCount,
        isSubscribed: user.isSubscribed,
        subscriptionExpiresAt: user.subscriptionExpiresAt
      };
    } catch (error) {
      console.error('Error getting referral stats:', error);
      throw error;
    }
  }

  /**
   * Get referral settings (admin only)
   */
  static async getReferralSettings(): Promise<any> {
    try {
      let settings = await ReferralSettings.findOne();
      
      if (!settings) {
        // Create default settings if none exist
        settings = new ReferralSettings({
          referralsNeededForBonus: 3,
          bonusType: 'free_entry',
          bonusValue: 1,
          newUserBonus: 1,
          subscriptionPrice: 9.99
        });
        await settings.save();
      }

      return settings;
    } catch (error) {
      console.error('Error getting referral settings:', error);
      throw error;
    }
  }

  /**
   * Update referral settings (admin only)
   */
  static async updateReferralSettings(updates: any): Promise<any> {
    try {
      const settings = await ReferralSettings.findOne();
      
      if (!settings) {
        throw new Error('Referral settings not found');
      }

      Object.assign(settings, updates);
      await settings.save();

      return settings;
    } catch (error) {
      console.error('Error updating referral settings:', error);
      throw error;
    }
  }

  /**
   * Manually add free entries to a user (admin only)
   */
  static async addFreeEntries(userId: string, count: number, reason: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.addFreeEntry(count);
      
      // Add admin transaction record
      user.wallet.transactions.push({
        type: 'referral',
        amount: 0,
        description: `Admin: ${reason}`,
        date: new Date()
      });
      
      await user.save();
      
      console.log(`Admin added ${count} free entries to user ${user.username}`);
    } catch (error) {
      console.error('Error adding free entries:', error);
      throw error;
    }
  }

  /**
   * Get all referrals (admin only)
   */
  static async getAllReferrals(): Promise<any[]> {
    try {
      const referrals = await Referral.find()
        .populate('referrerId', 'username email')
        .populate('refereeId', 'username email')
        .sort({ createdAt: -1 });

      return referrals;
    } catch (error) {
      console.error('Error getting all referrals:', error);
      throw error;
    }
  }
}

export default ReferralService;
