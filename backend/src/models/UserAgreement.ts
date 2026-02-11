import mongoose, { Document, Schema } from 'mongoose';

export interface IUserAgreement extends Document<mongoose.Types.ObjectId> {
  userId: mongoose.Types.ObjectId;
  termsVersion: string;
  ipAddress: string;
  userAgent: string;
  acceptedAt: Date;
  isWithdrawn: boolean;
  withdrawnAt?: Date;
  withdrawalReason?: string;
}

const userAgreementSchema = new Schema<IUserAgreement>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  termsVersion: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  acceptedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  isWithdrawn: {
    type: Boolean,
    default: false
  },
  withdrawnAt: {
    type: Date
  },
  withdrawalReason: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index for user and terms version
userAgreementSchema.index({ userId: 1, termsVersion: 1 }, { unique: true });

export default mongoose.model<IUserAgreement>('UserAgreement', userAgreementSchema);
