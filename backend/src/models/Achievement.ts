import mongoose, { Document, Schema } from 'mongoose';

export type AchievementCriteriaType = 'wins_gte' | 'matches_played_gte' | 'tournaments_played_gte';

export interface IAchievementCriteria {
  type: AchievementCriteriaType;
  value: number;
}

export interface IAchievement extends Document {
  key: string;
  name: string;
  description: string;
  icon?: string;
  isActive: boolean;
  criteria: IAchievementCriteria;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
    criteria: {
      type: {
        type: String,
        enum: ['wins_gte', 'matches_played_gte', 'tournaments_played_gte'],
        required: true
      },
      value: { type: Number, required: true }
    }
  },
  { timestamps: true }
);

achievementSchema.index({ isActive: 1 });

export default mongoose.model<IAchievement>('Achievement', achievementSchema);
