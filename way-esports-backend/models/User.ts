import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Team } from './Team';

export interface IToken {
  token: string;
}

export interface IUser extends Document {
  telegramId: number;
  username: string;
  email?: string;
  password?: string;
  photoUrl?: string;
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
  createdAt: Date;
  updatedAt: Date;
  generateAuthToken(): Promise<string>;
  getTeam(): Promise<any>;
  addAchievement(achievementId: string): Promise<boolean>;
}

const UserSchema = new Schema(
  {
    telegramId: {
      type: Number,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    photoUrl: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'developer'],
      default: 'user',
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      tournamentsPlayed: { type: Number, default: 0 },
      tournamentsWon: { type: Number, default: 0 },
    },
    achievements: [String],
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    achievementHistory: [
      {
        achievement: {
          type: Schema.Types.ObjectId,
          ref: 'Achievement',
          required: true
        },
        receivedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password') && user.password) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});

// Generate JWT token
UserSchema.methods.generateAuthToken = async function (): Promise<string> {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET || 'your-secret-key',
    {
      expiresIn: '7d',
    }
  );

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

// Get user's team
UserSchema.methods.getTeam = async function () {
  const user = this;
  const team = await Team.findOne({
    'players.userId': user._id,
  });
  return team;
};

// Добавить достижение пользователю
UserSchema.methods.addAchievement = async function(achievementId: string): Promise<boolean> {
  if (this.achievementHistory.some((a: any) => a.achievement.toString() === achievementId)) {
    return false;
  }
  this.achievementHistory.push({ achievement: achievementId, receivedAt: new Date() });
  await this.save();
  return true;
};

// Remove sensitive data when converting to JSON
UserSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

// Virtual for win rate
UserSchema.virtual('winRate').get(function () {
  if (this.stats && this.stats.wins != null && this.stats.losses != null) {
    const totalGames = this.stats.wins + this.stats.losses;
    return totalGames > 0 ? (this.stats.wins / totalGames) * 100 : 0;
  }
  return 0;
});

export const User = mongoose.model<IUser>('User', UserSchema); 