import mongoose, { Document, Schema } from 'mongoose';

export type RewardType = 'currency' | 'badge' | 'item' | 'achievement';
export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface IRewardRequirements {
  type: string;
  value: number;
}

export interface IReward extends Document<mongoose.Types.ObjectId> {
  name: string;
  description: string;
  type: RewardType;
  rarity: RewardRarity;
  value: number;
  icon?: string;
  isActive: boolean;
  gameId?: string;
  requirements?: IRewardRequirements;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const rewardSchema = new Schema<IReward>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: ['currency', 'badge', 'item', 'achievement'] },
    rarity: { type: String, required: true, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
    value: { type: Number, required: true, default: 0 },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
    gameId: { type: String },
    requirements: {
      type: {
        type: String
      },
      value: {
        type: Number
      }
    },
    expiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

rewardSchema.index({ isActive: 1, createdAt: -1 });
rewardSchema.index({ gameId: 1, isActive: 1 });
rewardSchema.index({ type: 1, rarity: 1 });

export default mongoose.model<IReward>('Reward', rewardSchema);
