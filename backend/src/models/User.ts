import mongoose, { Document, Schema } from 'mongoose';

export interface IToken {
  token: string;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  telegramId?: number;
  email?: string;
  newsletter_subscriber?: boolean;
  username: string;
  firstName: string;
  lastName?: string;
  bio?: string;
  photoUrl?: string;
  profileLogo?: string;
  teams: mongoose.Types.ObjectId[];
  role: 'user' | 'admin' | 'developer';
  isBanned: boolean;

  // Subscription fields
  isSubscribed: boolean;
  subscriptionExpiresAt?: Date;
  freeEntriesCount: number;
  bonusEntries: number;
  referralCode?: string;
  referredBy?: string;
  participatingTournaments: mongoose.Types.ObjectId[];

  stats: {
    wins: number;
    losses: number;
    tournamentsPlayed: number;
    tournamentsWon: number;
  };
  funnelProgress?: {
    step: string;
    lastActive: Date;
    completedSteps: string[];
    referralSource?: string;
    subscriptionValue?: number;
  };
  achievements: string[];
  tokens: IToken[];
  wallet: {
    balance: number;
    transactions: {
      _id?: mongoose.Types.ObjectId;
      type: 'deposit' | 'withdrawal' | 'prize' | 'fee' | 'subscription' | 'referral';
      amount: number;
      description: string;
      date: Date;
      status?: 'pending' | 'completed' | 'failed' | 'refund_pending' | 'refunded' | 'refund_denied';
      refundReason?: string;
      refundRequestedAt?: Date;
    }[];
  };
  gameProfiles: {
    game: 'Critical Ops' | 'CS2' | 'PUBG Mobile';
    username: string;
    rank?: string;
    stats?: {
      kills: number;
      deaths: number;
      assists: number;
      matches: number;
      wins: number;
    };
  }[];
  notifications: {
    type: 'tournament' | 'match' | 'team' | 'system';
    title: string;
    message: string;
    read: boolean;
    date: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;

  // Methods
  generateAuthToken(): Promise<string>;
  getTeam(): Promise<any>;
  addAchievement(achievementId: string): Promise<boolean>;
  hasActiveSubscription(): boolean;
  canJoinTournament(): boolean;
  useFreeEntry(): Promise<boolean>;
  addFreeEntry(count: number): Promise<void>;
  generateReferralCode(): string;
}

const userSchema = new Schema<IUser>({
  telegramId: {
    type: Number,
    required: false
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  newsletter_subscriber: {
    type: Boolean,
    default: false
  },
  username: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: String,
  photoUrl: String,
  profileLogo: String,
  teams: [{
    type: Schema.Types.ObjectId,
    ref: 'Team'
  }],
  role: {
    type: String,
    enum: ['user', 'admin', 'developer'],
    default: 'user'
  },
  isBanned: {
    type: Boolean,
    default: false
  },

  // Subscription fields
  isSubscribed: {
    type: Boolean,
    default: false
  },
  subscriptionExpiresAt: {
    type: Date
  },
  freeEntriesCount: {
    type: Number,
    default: 0
  },
  bonusEntries: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String
  },
  referredBy: {
    type: String,
    trim: true
  },
  participatingTournaments: [{
    type: Schema.Types.ObjectId,
    ref: 'Tournament'
  }],
  bio: {
    type: String,
    trim: true,
    maxlength: 500
  },
  stats: {
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    tournamentsPlayed: { type: Number, default: 0 },
    tournamentsWon: { type: Number, default: 0 }
  },
  achievements: [String],
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    transactions: [{
      type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'prize', 'fee', 'subscription', 'referral']
      },
      amount: Number,
      description: String,
      date: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refund_pending', 'refunded', 'refund_denied'],
        default: 'completed'
      },
      refundReason: String,
      refundRequestedAt: Date
    }]
  },
  gameProfiles: [{
    game: {
      type: String,
      enum: ['Critical Ops', 'CS2', 'PUBG Mobile']
    },
    username: String,
    rank: String,
    stats: {
      kills: {
        type: Number,
        default: 0
      },
      deaths: {
        type: Number,
        default: 0
      },
      assists: {
        type: Number,
        default: 0
      },
      matches: {
        type: Number,
        default: 0
      },
      wins: {
        type: Number,
        default: 0
      }
    }
  }],
  notifications: [{
    type: {
      type: String,
      enum: ['tournament', 'match', 'team', 'system']
    },
    title: String,
    message: String,
    read: {
      type: Boolean,
      default: false
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
userSchema.index({ telegramId: 1 }, { unique: true, sparse: true });
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
userSchema.index({ isSubscribed: 1 });
userSchema.index({ participatingTournaments: 1 });

// Pre-save middleware to generate referral code
userSchema.pre('save', function (next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = this.generateReferralCode();
  }
  next();
});

// Methods
userSchema.methods.generateAuthToken = async function (): Promise<string> {
  // Simple token generation - in real app, use JWT
  return `token_${this._id}_${Date.now()}`;
};

userSchema.methods.getTeam = async function (): Promise<any> {
  return this.teams.length > 0 ? this.teams[0] : null;
};

userSchema.methods.addAchievement = async function (achievementId: string): Promise<boolean> {
  if (!this.achievements.includes(achievementId)) {
    this.achievements.push(achievementId);
    return true;
  }
  return false;
};

userSchema.methods.hasActiveSubscription = function (): boolean {
  if (!this.isSubscribed) return false;
  if (!this.subscriptionExpiresAt) return true; // Lifetime subscription
  return this.subscriptionExpiresAt > new Date();
};

userSchema.methods.canJoinTournament = function (): boolean {
  return this.hasActiveSubscription() || this.freeEntriesCount > 0 || this.bonusEntries > 0;
};

userSchema.methods.useFreeEntry = async function (): Promise<boolean> {
  if (this.freeEntriesCount <= 0 && this.bonusEntries <= 0) return false;

  if (this.freeEntriesCount > 0) {
    this.freeEntriesCount -= 1;
  } else {
    this.bonusEntries -= 1;
  }

  // Add transaction record
  this.wallet.transactions.push({
    type: 'referral',
    amount: 0,
    description: 'Used tournament entry',
    date: new Date()
  });

  await this.save();
  return true;
};

userSchema.methods.addFreeEntry = async function (count: number): Promise<void> {
  this.freeEntriesCount += count;

  // Add transaction record
  this.wallet.transactions.push({
    type: 'referral',
    amount: 0,
    description: `Received ${count} free tournament entr${count > 1 ? 'ies' : 'y'}`,
    date: new Date()
  });

  await this.save();
};

userSchema.methods.generateReferralCode = function (): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export default mongoose.model<IUser>('User', userSchema); 
