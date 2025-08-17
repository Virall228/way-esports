import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  tag: string;
  logo?: string;
  game: 'Critical Ops' | 'CS2' | 'PUBG Mobile';
  captain: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  achievements: {
    tournamentId: mongoose.Types.ObjectId;
    position: number;
    prize: number;
    date: Date;
  }[];
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    totalPrizeMoney: number;
  };
  status: 'active' | 'inactive' | 'disbanded';
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>({
  name: {
    type: String,
    required: true,
    unique: true
  },
  tag: {
    type: String,
    required: true,
    unique: true,
    maxlength: 5
  },
  logo: {
    type: String
  },
  game: {
    type: String,
    enum: ['Critical Ops', 'CS2', 'PUBG Mobile'],
    required: true
  },
  captain: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  achievements: [{
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament'
    },
    position: Number,
    prize: Number,
    date: Date
  }],
  stats: {
    totalMatches: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    },
    totalPrizeMoney: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'disbanded'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
teamSchema.index({ game: 1, status: 1 });
teamSchema.index({ name: 1 }, { unique: true });
teamSchema.index({ tag: 1 }, { unique: true });

// Pre-save middleware to calculate win rate
teamSchema.pre('save', function(next) {
  if (this.stats.totalMatches > 0) {
    this.stats.winRate = (this.stats.wins / this.stats.totalMatches) * 100;
  }
  next();
});

export default mongoose.model<ITeam>('Team', teamSchema); 