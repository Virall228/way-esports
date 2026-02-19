import mongoose, { Document, Schema } from 'mongoose';

export interface IWallet extends Document<mongoose.Types.ObjectId> {
  user: mongoose.Types.ObjectId;
  balance: number;
  transactions: {
    type: 'deposit' | 'withdrawal' | 'prize' | 'fee';
    amount: number;
    description: string;
    status: 'pending' | 'completed' | 'failed';
    reference?: string;
    walletAddress?: string;
    network?: string;
    txHash?: string;
    processedAt?: Date;
    date: Date;
  }[];
  paymentMethods: {
    type: 'bank' | 'crypto' | 'card';
    details: {
      name?: string;
      accountNumber?: string;
      bankName?: string;
      walletAddress?: string;
      cardLast4?: string;
    };
    isDefault: boolean;
  }[];
  withdrawalLimit: {
    daily: number;
    monthly: number;
  };
  lastWithdrawal?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema = new Schema<IWallet>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: [{
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'prize', 'fee'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    reference: String,
    walletAddress: {
      type: String,
      trim: true,
      maxlength: 160
    },
    network: {
      type: String,
      trim: true,
      maxlength: 32
    },
    txHash: {
      type: String,
      trim: true,
      maxlength: 160
    },
    processedAt: {
      type: Date
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  paymentMethods: [{
    type: {
      type: String,
      enum: ['bank', 'crypto', 'card'],
      required: true
    },
    details: {
      name: String,
      accountNumber: String,
      bankName: String,
      walletAddress: String,
      cardLast4: String
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  withdrawalLimit: {
    daily: {
      type: Number,
      default: 1000
    },
    monthly: {
      type: Number,
      default: 10000
    }
  },
  lastWithdrawal: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
walletSchema.index({ user: 1 }, { unique: true });
walletSchema.index({ 'transactions.date': -1 });
walletSchema.index({ 'transactions.status': 1 });

// Pre-save middleware to ensure only one default payment method
walletSchema.pre('save', function(next) {
  const defaultMethods = this.paymentMethods.filter(method => method.isDefault);
  if (defaultMethods.length > 1) {
    const lastDefault = defaultMethods[defaultMethods.length - 1];
    this.paymentMethods.forEach(method => {
      if (method !== lastDefault) {
        method.isDefault = false;
      }
    });
  }
  next();
});

export default mongoose.model<IWallet>('Wallet', walletSchema); 
