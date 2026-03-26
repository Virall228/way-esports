import mongoose, { Document, Schema } from 'mongoose';

export type PromotionVisibility = 'private' | 'scouts' | 'public';
export type PromotionFocus = 'balanced' | 'ranked' | 'tournament' | 'trial';

export interface IPlayerPromotionProfile extends Document<mongoose.Types.ObjectId> {
  user: mongoose.Types.ObjectId;
  slug: string;
  enabled: boolean;
  visibility: PromotionVisibility;
  headline?: string;
  scoutPitch?: string;
  targetGames: string[];
  targetRoles: string[];
  targetTeams: string[];
  focus: PromotionFocus;
  adminUnlocked: boolean;
  adminUnlockedAt?: Date;
  adminUnlockedBy?: mongoose.Types.ObjectId;
  adminOverrideNote?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords: string[];
  lastSnapshotGeneratedAt?: Date;
  lastLeaderboardScore?: number;
  lastBestGame?: string;
  lastBestRole?: string;
  createdAt: Date;
  updatedAt: Date;
}

const playerPromotionProfileSchema = new Schema<IPlayerPromotionProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true
    },
    enabled: {
      type: Boolean,
      default: false
    },
    visibility: {
      type: String,
      enum: ['private', 'scouts', 'public'],
      default: 'scouts'
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 120
    },
    scoutPitch: {
      type: String,
      trim: true,
      maxlength: 600
    },
    targetGames: [{
      type: String,
      trim: true,
      maxlength: 40
    }],
    targetRoles: [{
      type: String,
      trim: true,
      maxlength: 40
    }],
    targetTeams: [{
      type: String,
      trim: true,
      maxlength: 80
    }],
    focus: {
      type: String,
      enum: ['balanced', 'ranked', 'tournament', 'trial'],
      default: 'balanced'
    },
    adminUnlocked: {
      type: Boolean,
      default: false
    },
    adminUnlockedAt: {
      type: Date
    },
    adminUnlockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    adminOverrideNote: {
      type: String,
      trim: true,
      maxlength: 240
    },
    seoTitle: {
      type: String,
      trim: true,
      maxlength: 120
    },
    seoDescription: {
      type: String,
      trim: true,
      maxlength: 180
    },
    seoKeywords: [{
      type: String,
      trim: true,
      maxlength: 40
    }],
    lastSnapshotGeneratedAt: {
      type: Date
    },
    lastLeaderboardScore: {
      type: Number,
      min: 0,
      max: 100
    },
    lastBestGame: {
      type: String,
      trim: true,
      maxlength: 40
    },
    lastBestRole: {
      type: String,
      trim: true,
      maxlength: 40
    }
  },
  { timestamps: true }
);

playerPromotionProfileSchema.index({ enabled: 1, visibility: 1, lastLeaderboardScore: -1 });
playerPromotionProfileSchema.index({ slug: 1 }, { unique: true });

export default mongoose.model<IPlayerPromotionProfile>(
  'PlayerPromotionProfile',
  playerPromotionProfileSchema
);
