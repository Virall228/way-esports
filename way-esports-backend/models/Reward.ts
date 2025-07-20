import mongoose, { Schema, Document } from 'mongoose';

export interface IReward extends Document {
  name: string;
  description: string;
  type: 'currency' | 'item' | 'badge' | 'title' | 'skin';
  value: number;
  currencyDetails?: {
    amount: number;
    currency: 'USD';
    minWithdrawal?: number;
    maxWithdrawal?: number;
    withdrawalFee?: number;
  };
  imageUrl?: string;
  gameId: string;
  requirements: {
    minRank?: number;
    minLevel?: number;
    minWins?: number;
    achievementId?: mongoose.Types.ObjectId;
    tournamentId?: mongoose.Types.ObjectId;
  };
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RewardSchema = new Schema(
  {
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
      enum: ['currency', 'item', 'badge', 'title', 'skin'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    currencyDetails: {
      amount: {
        type: Number,
        min: 0,
        get: (v: number) => parseFloat(v.toFixed(2)), // Always return 2 decimal places
      },
      currency: {
        type: String,
        enum: ['USD'],
        default: 'USD',
      },
      minWithdrawal: {
        type: Number,
        min: 0,
        default: 10, // $10 minimum withdrawal
      },
      maxWithdrawal: {
        type: Number,
        min: 0,
      },
      withdrawalFee: {
        type: Number,
        min: 0,
        max: 100, // percentage
        default: 2, // 2% default fee
      },
    },
    imageUrl: String,
    gameId: {
      type: String,
      required: true,
      enum: ['valorant-mobile'],
    },
    requirements: {
      minRank: Number,
      minLevel: Number,
      minWins: Number,
      achievementId: {
        type: Schema.Types.ObjectId,
        ref: 'Achievement',
      },
      tournamentId: {
        type: Schema.Types.ObjectId,
        ref: 'Tournament',
      },
    },
    expiresAt: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
RewardSchema.index({ gameId: 1, type: 1 });
RewardSchema.index({ 'requirements.minRank': 1 });
RewardSchema.index({ isActive: 1, expiresAt: 1 });

// Method to calculate withdrawal fee
RewardSchema.methods.calculateWithdrawalFee = function(amount: number): number {
  if (!this.currencyDetails || this.type !== 'currency') return 0;
  return parseFloat((amount * (this.currencyDetails.withdrawalFee / 100)).toFixed(2));
};

// Method to validate withdrawal amount
RewardSchema.methods.validateWithdrawal = function(amount: number): { valid: boolean; message?: string } {
  if (!this.currencyDetails || this.type !== 'currency') {
    return { valid: false, message: 'Not a currency reward' };
  }

  if (amount < this.currencyDetails.minWithdrawal) {
    return { 
      valid: false, 
      message: `Minimum withdrawal amount is $${this.currencyDetails.minWithdrawal}` 
    };
  }

  if (this.currencyDetails.maxWithdrawal && amount > this.currencyDetails.maxWithdrawal) {
    return { 
      valid: false, 
      message: `Maximum withdrawal amount is $${this.currencyDetails.maxWithdrawal}` 
    };
  }

  if (amount > this.currencyDetails.amount) {
    return { 
      valid: false, 
      message: `Insufficient balance. Available: $${this.currencyDetails.amount}` 
    };
  }

  return { valid: true };
};

export const Reward = mongoose.model<IReward>('Reward', RewardSchema); 