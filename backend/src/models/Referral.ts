import mongoose, { Document, Schema } from 'mongoose';

export interface IReferral extends Document<mongoose.Types.ObjectId> {
  referrerId: mongoose.Types.ObjectId;
  refereeId: mongoose.Types.ObjectId;
  referralCode: string;
  status: 'pending' | 'completed' | 'rewarded';
  rewardType: 'free_entry' | 'discount';
  createdAt: Date;
  completedAt?: Date;
}

const referralSchema = new Schema<IReferral>({
  referrerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  refereeId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referralCode: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rewarded'],
    default: 'pending'
  },
  rewardType: {
    type: String,
    enum: ['free_entry', 'discount'],
    default: 'free_entry'
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
referralSchema.index({ referrerId: 1, status: 1 });
referralSchema.index({ refereeId: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ createdAt: 1 });

export default mongoose.model<IReferral>('Referral', referralSchema);
