import mongoose, { Document, Schema } from 'mongoose';

export interface IWithdrawal extends Document {
  user: mongoose.Types.ObjectId;
  reward: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: 'bank' | 'crypto' | 'paypal';
  paymentDetails: {
    accountNumber?: string;
    bankName?: string;
    cryptoAddress?: string;
    paypalEmail?: string;
  };
  reason?: string;
  processedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  [key: string]: any; // Index signature for dynamic updates
}

const withdrawalSchema = new Schema<IWithdrawal>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reward: {
    type: Schema.Types.ObjectId,
    ref: 'Reward',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank', 'crypto', 'paypal'],
  },
  paymentDetails: {
    accountNumber: String,
    bankName: String,
    cryptoAddress: String,
    paypalEmail: String,
  },
  reason: String,
  processedAt: Date,
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
withdrawalSchema.index({ user: 1 });
withdrawalSchema.index({ reward: 1 });
withdrawalSchema.index({ status: 1 });
withdrawalSchema.index({ createdAt: 1 });

export default mongoose.model<IWithdrawal>('Withdrawal', withdrawalSchema);
