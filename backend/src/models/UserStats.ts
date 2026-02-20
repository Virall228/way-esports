import mongoose, { Document, Schema } from 'mongoose';

export type PlayerRole = 'Entry' | 'Sniper' | 'Support' | 'Lurker' | 'Flex';

export interface IUserStats extends Document<mongoose.Types.ObjectId> {
  user: mongoose.Types.ObjectId;
  primaryRole: PlayerRole;
  skills: {
    aiming: number;
    positioning: number;
    utility: number;
    clutchFactor: number;
    teamplay: number;
  };
  behavioral: {
    chill: number;
    leadership: number;
    conflictScore: number;
  };
  impactRating: number;
  trend30d: Array<{
    date: Date;
    rating: number;
  }>;
  hiddenGem: boolean;
  hiddenGemReason?: string;
  watchlist: boolean;
  watchlistReason?: string;
  watchlistAddedAt?: Date;
  updatedAt: Date;
  createdAt: Date;
}

const trendPointSchema = new Schema(
  {
    date: { type: Date, required: true },
    rating: { type: Number, default: 0, min: 0, max: 100 }
  },
  { _id: false }
);

const userStatsSchema = new Schema<IUserStats>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    primaryRole: {
      type: String,
      enum: ['Entry', 'Sniper', 'Support', 'Lurker', 'Flex'],
      default: 'Flex'
    },
    skills: {
      aiming: { type: Number, default: 50, min: 0, max: 100 },
      positioning: { type: Number, default: 50, min: 0, max: 100 },
      utility: { type: Number, default: 50, min: 0, max: 100 },
      clutchFactor: { type: Number, default: 50, min: 0, max: 100 },
      teamplay: { type: Number, default: 50, min: 0, max: 100 }
    },
    behavioral: {
      chill: { type: Number, default: 50, min: 0, max: 100 },
      leadership: { type: Number, default: 50, min: 0, max: 100 },
      conflictScore: { type: Number, default: 0, min: 0, max: 100 }
    },
    impactRating: { type: Number, default: 0, min: 0, max: 100 },
    trend30d: { type: [trendPointSchema], default: [] },
    hiddenGem: { type: Boolean, default: false },
    hiddenGemReason: { type: String, trim: true, maxlength: 280 },
    watchlist: { type: Boolean, default: false },
    watchlistReason: { type: String, trim: true, maxlength: 280 },
    watchlistAddedAt: { type: Date }
  },
  { timestamps: true }
);

userStatsSchema.index({ impactRating: -1 });
userStatsSchema.index({ hiddenGem: 1, impactRating: -1 });
userStatsSchema.index({ primaryRole: 1 });

export default mongoose.model<IUserStats>('UserStats', userStatsSchema);
