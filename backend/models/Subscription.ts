import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  plan: 'basic' | 'premium' | 'pro';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  price: number;
  currency: string;
  paymentMethod: 'card' | 'paypal' | 'crypto' | 'wallet';
  transactionId?: string;
  features: string[];
  autoRenew: boolean;
  cancelledAt?: Date;
  cancelReason?: string;
  isActive: boolean;
  cancel(reason?: string): Promise<ISubscription>;
  renew(months?: number): Promise<ISubscription>;
}

export interface ISubscriptionModel extends mongoose.Model<ISubscription> {
  getPlans(): any;
  hasActiveSubscription(userId: string, plan?: string): Promise<boolean>;
}

const subscriptionSchema = new Schema<ISubscription>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'pro'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'paypal', 'crypto', 'wallet'],
    required: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  features: [{
    type: String
  }],
  autoRenew: {
    type: Boolean,
    default: true
  },
  cancelledAt: {
    type: Date
  },
  cancelReason: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function(this: ISubscription) {
  return this.status === 'active' && this.endDate > new Date();
});

// Method to cancel subscription
subscriptionSchema.methods.cancel = function(this: ISubscription, reason?: string) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  this.autoRenew = false;
  return this.save();
};

// Method to renew subscription
subscriptionSchema.methods.renew = function(this: ISubscription, months: number = 1) {
  const newEndDate = new Date(this.endDate);
  newEndDate.setMonth(newEndDate.getMonth() + months);
  this.endDate = newEndDate;
  this.status = 'active';
  return this.save();
};

// Static method to get subscription plans
subscriptionSchema.statics.getPlans = function() {
  return {
    basic: {
      name: 'Basic',
      price: 9.99,
      duration: 1, // months
      features: [
        'Access to basic tournaments',
        'Profile customization',
        'Basic statistics',
        'Community access'
      ],
      color: '#ff6b00',
      description: 'Perfect for casual gamers'
    },
    premium: {
      name: 'Premium',
      price: 19.99,
      duration: 1,
      features: [
        'All Basic features',
        'Priority tournament registration',
        'Advanced statistics',
        'Custom profile themes',
        'Exclusive tournaments',
        'Discord VIP access'
      ],
      color: '#ffd700',
      popular: true,
      description: 'Most popular choice for competitive players'
    },
    pro: {
      name: 'Pro',
      price: 39.99,
      duration: 1,
      features: [
        'All Premium features',
        'Tournament creation',
        'Team management tools',
        'Advanced analytics',
        'Priority support',
        'Custom branding',
        'API access'
      ],
      color: '#ff1493',
      description: 'For professional teams and organizers'
    }
  };
};

// Static method to check if user has active subscription
subscriptionSchema.statics.hasActiveSubscription = async function(userId: string, plan?: string) {
  const query: any = {
    user: userId,
    status: 'active',
    endDate: { $gt: new Date() }
  };
  
  if (plan) {
    query.plan = plan;
  }
  
  const subscription = await this.findOne(query);
  return !!subscription;
};

export const Subscription = mongoose.model<ISubscription, ISubscriptionModel>('Subscription', subscriptionSchema);