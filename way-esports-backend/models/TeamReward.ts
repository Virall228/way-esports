import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamReward extends Document {
  teamId: mongoose.Types.ObjectId;
  rewardId: mongoose.Types.ObjectId;
  gameId: string;
  earnedAt: Date;
  claimedAt?: Date;
  claimedBy?: mongoose.Types.ObjectId;
  expiresAt?: Date;
  status: 'earned' | 'claimed' | 'expired';
  distribution: {
    userId: mongoose.Types.ObjectId;
    share: number;
    claimedAt?: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const TeamRewardSchema = new Schema(
  {
    teamId: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
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
    claimedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: Date,
    status: {
      type: String,
      enum: ['earned', 'claimed', 'expired'],
      default: 'earned',
    },
    distribution: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      share: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      claimedAt: Date,
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
TeamRewardSchema.index({ teamId: 1, gameId: 1 });
TeamRewardSchema.index({ rewardId: 1 });
TeamRewardSchema.index({ status: 1 });
TeamRewardSchema.index({ expiresAt: 1 });
TeamRewardSchema.index({ 'distribution.userId': 1 });

// Method to check if reward is expired
TeamRewardSchema.methods.isExpired = function(): boolean {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Method to claim team member's share
TeamRewardSchema.methods.claimShare = function(userId: mongoose.Types.ObjectId): void {
  if (this.status !== 'earned') {
    throw new Error('Reward cannot be claimed');
  }
  
  if (this.isExpired()) {
    this.status = 'expired';
    throw new Error('Reward has expired');
  }

  const memberShare = this.distribution.find(d => d.userId.equals(userId));
  if (!memberShare) {
    throw new Error('User is not eligible for this reward');
  }

  if (memberShare.claimedAt) {
    throw new Error('Share already claimed');
  }

  memberShare.claimedAt = new Date();

  // Check if all shares are claimed
  const allClaimed = this.distribution.every(d => d.claimedAt);
  if (allClaimed) {
    this.status = 'claimed';
    this.claimedAt = new Date();
    this.claimedBy = userId;
  }
};

// Validate total share is 100%
TeamRewardSchema.pre('save', function(next) {
  if (this.distribution) {
    const totalShare = this.distribution.reduce((sum, d) => sum + d.share, 0);
    if (totalShare !== 100) {
      next(new Error('Total distribution share must be 100%'));
    }
  }
  next();
});

export const TeamReward = mongoose.model<ITeamReward>('TeamReward', TeamRewardSchema); 