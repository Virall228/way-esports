import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  code: string; // уникальный код достижения
  name: string;
  description: string;
  iconUrl?: string;
  type: 'system' | 'tournament' | 'custom';
  condition: {
    type: string; // например: 'wins', 'tournaments', 'first_place'
    value: number; // сколько нужно для получения
  };
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  iconUrl: { type: String },
  type: { type: String, enum: ['system', 'tournament', 'custom'], default: 'system' },
  condition: {
    type: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  }
}, {
  timestamps: true
});

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema); 