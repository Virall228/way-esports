import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  code: string;
  name: string;
  description: string;
  iconUrl?: string;
  type: 'system' | 'tournament' | 'custom';
  condition: {
    type: string;
    value: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  iconUrl: { type: String },
  type: { 
    type: String, 
    enum: ['system', 'tournament', 'custom'], 
    default: 'system' 
  },
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

// Indexes
achievementSchema.index({ code: 1 }, { unique: true });
achievementSchema.index({ type: 1 });

export default mongoose.model<IAchievement>('Achievement', achievementSchema);










