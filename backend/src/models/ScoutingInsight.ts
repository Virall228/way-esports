import mongoose, { Document, Schema } from 'mongoose';

export interface IScoutingInsight extends Document<mongoose.Types.ObjectId> {
  user: mongoose.Types.ObjectId;
  weekKey: string;
  score: number;
  impactRating: number;
  tag: 'Hidden Gem' | 'Prospect';
  summary: string;
  source: 'heuristic' | 'gemini';
  createdAt: Date;
  updatedAt: Date;
}

const scoutingInsightSchema = new Schema<IScoutingInsight>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekKey: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    impactRating: { type: Number, required: true, min: 0, max: 100 },
    tag: { type: String, enum: ['Hidden Gem', 'Prospect'], default: 'Prospect' },
    summary: { type: String, required: true, trim: true, maxlength: 1000 },
    source: { type: String, enum: ['heuristic', 'gemini'], default: 'heuristic' }
  },
  { timestamps: true }
);

scoutingInsightSchema.index({ weekKey: 1, score: -1 });
scoutingInsightSchema.index({ user: 1, weekKey: 1 }, { unique: true });

export default mongoose.model<IScoutingInsight>('ScoutingInsight', scoutingInsightSchema);

