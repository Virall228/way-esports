import mongoose, { Document, Schema } from 'mongoose';

export type PlayerRewardStatus = 'earned' | 'claimed' | 'expired';

export interface IPlayerReward extends Document<mongoose.Types.ObjectId> {
  userId: mongoose.Types.ObjectId;
  rewardId: mongoose.Types.ObjectId;
  gameId?: string;
  status: PlayerRewardStatus;
  earnedAt: Date;
  claimedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const playerRewardSchema = new Schema<IPlayerReward>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rewardId: { type: Schema.Types.ObjectId, ref: 'Reward', required: true, index: true },
    gameId: { type: String },
    status: { type: String, enum: ['earned', 'claimed', 'expired'], default: 'earned', index: true },
    earnedAt: { type: Date, default: Date.now, index: true },
    claimedAt: { type: Date },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

playerRewardSchema.index({ userId: 1, rewardId: 1 }, { unique: true });

export default mongoose.model<IPlayerReward>('PlayerReward', playerRewardSchema);
