import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  profileLogo?: string;
  teams: mongoose.Types.ObjectId[];
  role: 'user' | 'admin' | 'moderator';
  wallet: {
    balance: number;
    transactions: {
      type: 'deposit' | 'withdrawal' | 'prize' | 'fee';
      amount: number;
      description: string;
      date: Date;
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
}

const userSchema = new Schema<IUser>({
  telegramId: {
    type: Number,
    required: true,
    unique: true
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
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  wallet: {
    balance: {
      type: Number,
      default: 0
    },
    transactions: [{
      type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'prize', 'fee']
      },
      amount: Number,
      description: String,
      date: {
        type: Date,
        default: Date.now
      }
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
userSchema.index({ telegramId: 1 }, { unique: true });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });

export default mongoose.model<IUser>('User', userSchema); 