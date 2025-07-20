import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawal extends Document {
  user: mongoose.Types.ObjectId;
  reward: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  rejectionReason?: string;
  transactionId?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalSchema = new Schema(
  {
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
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    rejectionReason: String,
    transactionId: String,
    processedAt: Date,
  },
  {
    timestamps: true,
  }
);

WithdrawalSchema.index({ user: 1, status: 1 });
WithdrawalSchema.index({ status: 1 });

export const Withdrawal = mongoose.model<IWithdrawal>('Withdrawal', WithdrawalSchema); 