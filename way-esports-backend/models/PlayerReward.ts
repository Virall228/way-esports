import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerReward extends Document {
  userId: mongoose.Types.ObjectId;
  rewardId: mongoose.Types.ObjectId;
  gameId: string;
  earnedAt: Date;
  claimedAt?: Date;
  expiresAt?: Date;
  status: 'earned' | 'claimed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const PlayerRewardSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rewardId: {
      type: Schema.Types.ObjectId,
      ref: 'Reward',
      required: true,
    },
    gameId: {
      type: String,
      required: true,
      enum: ['valorant-mobile'],
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
    claimedAt: Date,
    expiresAt: Date,
    status: {
      type: String,
      enum: ['earned', 'claimed', 'expired'],
      default: 'earned',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
PlayerRewardSchema.index({ userId: 1, gameId: 1 });
PlayerRewardSchema.index({ rewardId: 1 });
PlayerRewardSchema.index({ status: 1 });
PlayerRewardSchema.index({ expiresAt: 1 });

// Method to check if reward is expired
PlayerRewardSchema.methods.isExpired = function(): boolean {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to claim reward
PlayerRewardSchema.methods.claim = function(): void {
  if (this.status !== 'earned') {
    throw new Error('Reward cannot be claimed');
  }
  
  if (this.isExpired()) {
    this.status = 'expired';
    throw new Error('Reward has expired');
  }

  this.status = 'claimed';
  this.claimedAt = new Date();
};

export const PlayerReward = mongoose.model<IPlayerReward>('PlayerReward', PlayerRewardSchema); 