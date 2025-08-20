import { Document, Model } from 'mongoose';

export interface IDeviceBlacklist extends Document {
  deviceId: string;
  reason: string;
  bannedAt: Date;
  bannedBy: string;
}

export interface IDeviceVerification extends Document {
  deviceId: string;
  userId: string;
  verificationCode: string;
  expiresAt: Date;
  isVerified: boolean;
}

export interface IAchievement extends Document {
  name: string;
  description: string;
  icon: string;
  points: number;
  criteria: {
    type: string;
    value: number;
  };
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface IPlayerReward extends Document {
  playerId: string;
  achievementId: string;
  points: number;
  earnedAt: Date;
  isClaimed: boolean;
}

export interface ITeamReward extends Document {
  teamId: string;
  achievementId: string;
  points: number;
  earnedAt: Date;
  isClaimed: boolean;
}
