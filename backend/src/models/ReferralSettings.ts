import mongoose, { Document, Schema } from 'mongoose';

export interface IReferralSettings extends Document {
  referralsNeededForBonus: number;
  bonusType: 'free_entry' | 'discount';
  bonusValue: number;
  newUserBonus: number;
  subscriptionPrice: number;
  updatedAt: Date;
}

const referralSettingsSchema = new Schema<IReferralSettings>({
  referralsNeededForBonus: {
    type: Number,
    default: 3,
    min: 1
  },
  bonusType: {
    type: String,
    enum: ['free_entry', 'discount'],
    default: 'free_entry'
  },
  bonusValue: {
    type: Number,
    default: 1,
    min: 1
  },
  newUserBonus: {
    type: Number,
    default: 1,
    min: 0
  },
  subscriptionPrice: {
    type: Number,
    default: 9.99,
    min: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
referralSettingsSchema.pre('save', async function (next) {
  const model = this.constructor as mongoose.Model<IReferralSettings>;
  const count = await model.countDocuments();
  if (count > 0 && this.isNew) {
    throw new Error('Only one referral settings document can exist');
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.model<IReferralSettings>('ReferralSettings', referralSettingsSchema);
