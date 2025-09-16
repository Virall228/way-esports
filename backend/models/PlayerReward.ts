import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayerReward extends Document {
  userId: mongoose.Types.ObjectId;
  rewardId: mongoose.Types.ObjectId;
  gameId: string;
  status: 'earned' | 'claimed' | 'expired';
  earnedAt: Date;
  claimedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  claim(): void;
}

const playerRewardSchema = new Schema<IPlayerReward>({
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
  status: {
    type: String,
    enum: ['earned', 'claimed', 'expired'],
    default: 'earned',
  },
  earnedAt: {
    type: Date,
    default: Date.now,
  },
  claimedAt: Date,
  expiresAt: Date,
}, {
  timestamps: true,
});

// Indexes
playerRewardSchema.index({ userId: 1, gameId: 1 });
playerRewardSchema.index({ rewardId: 1 });
playerRewardSchema.index({ status: 1 });
playerRewardSchema.index({ earnedAt: 1 });

// Methods
playerRewardSchema.methods.claim = function(): void {
  if (this.status !== 'earned') {
    throw new Error('Reward cannot be claimed');
  }
  
  if (this.expiresAt && new Date() > this.expiresAt) {
    this.status = 'expired';
    throw new Error('Reward has expired');
  }
  
  this.status = 'claimed';
  this.claimedAt = new Date();
};

export default mongoose.model<IPlayerReward>('PlayerReward', playerRewardSchema);
