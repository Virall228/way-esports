import mongoose, { Document, Schema } from 'mongoose';

export interface IToken {
  token: string;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  profileLogo?: string;
  teams: mongoose.Types.ObjectId[];
  role: 'user' | 'admin' | 'developer';
  isBanned: boolean;
  stats: {
    wins: number;
    losses: number;
    tournamentsPlayed: number;
    tournamentsWon: number;
  };
  achievements: string[];
  tokens: IToken[];
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
  
  // Methods
  generateAuthToken(): Promise<string>;
  getTeam(): Promise<any>;
  addAchievement(achievementId: string): Promise<boolean>;
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
    enum: ['user', 'admin', 'developer'],
    default: 'user'
  },
  isBanned: {
    type: Boolean,
    default: false
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

// Methods
userSchema.methods.generateAuthToken = async function(): Promise<string> {
  // Simple token generation - in real app, use JWT
  return `token_${this._id}_${Date.now()}`;
};

userSchema.methods.getTeam = async function(): Promise<any> {
  return this.teams.length > 0 ? this.teams[0] : null;
};

userSchema.methods.addAchievement = async function(achievementId: string): Promise<boolean> {
  if (!this.achievements.includes(achievementId)) {
    this.achievements.push(achievementId);
    return true;
  }
  return false;
};

export default mongoose.model<IUser>('User', userSchema); 