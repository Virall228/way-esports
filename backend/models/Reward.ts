import mongoose, { Document, Schema } from 'mongoose';

export interface IReward extends Document {
  name: string;
  description: string;
  type: 'achievement' | 'tournament' | 'daily' | 'referral' | 'currency';
  points: number;
  icon?: string;
  isActive: boolean;
  gameId?: 'valorant-mobile' | 'cs2' | 'pubg-mobile';
  requirements?: {
    type: string;
    value: number;
  };
  currencyDetails?: {
    amount: number;
    currency: string;
  };
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  validateWithdrawal(amount: number): { valid: boolean; message: string };
  calculateWithdrawalFee(amount: number): number;
}

const rewardSchema = new Schema<IReward>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['achievement', 'tournament', 'daily', 'referral', 'currency'],
  },
  points: {
    type: Number,
    required: true,
    default: 0,
  },
  icon: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  gameId: {
    type: String,
    enum: ['valorant-mobile', 'cs2', 'pubg-mobile'],
  },
  requirements: {
    type: {
      type: String,
    },
    value: {
      type: Number,
    },
  },
  currencyDetails: {
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
  },
  expiresAt: Date,
}, {
  timestamps: true,
});

// Indexes
rewardSchema.index({ type: 1 });
rewardSchema.index({ gameId: 1 });
rewardSchema.index({ isActive: 1 });

// Methods
rewardSchema.methods.validateWithdrawal = function(amount: number): { valid: boolean; message: string } {
  if (this.type !== 'currency') {
    return { valid: false, message: 'This reward does not support withdrawals' };
  }
  
  if (!this.currencyDetails || this.currencyDetails.amount < amount) {
    return { valid: false, message: 'Insufficient balance' };
  }
  
  if (amount <= 0) {
    return { valid: false, message: 'Amount must be positive' };
  }
  
  return { valid: true, message: 'Withdrawal is valid' };
};

rewardSchema.methods.calculateWithdrawalFee = function(amount: number): number {
  // Simple fee calculation - 5% fee
  return Math.round(amount * 0.05);
};

export default mongoose.model<IReward>('Reward', rewardSchema);
