import mongoose, { Document, Schema } from 'mongoose';
import { SUPPORTED_GAMES, type SupportedGame } from '../config/games';

export interface IMatch extends Document<mongoose.Types.ObjectId> {
  tournament: mongoose.Types.ObjectId;
  team1: mongoose.Types.ObjectId;
  team2: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  winner?: mongoose.Types.ObjectId;
  score: {
    team1: number;
    team2: number;
  };
  game: SupportedGame;
  round: string;
  map?: string;
  stats?: {
    team1: {
      kills: number;
      deaths: number;
      assists: number;
      roundsWon: number;
      plantedBombs?: number;
      defusedBombs?: number;
    };
    team2: {
      kills: number;
      deaths: number;
      assists: number;
      roundsWon: number;
      plantedBombs?: number;
      defusedBombs?: number;
    };
  };
  roomCredentials?: {
    roomId: string;
    password: string;
    generatedAt: Date;
    visibleAt: Date;
    expiresAt?: Date;
  };
  payoutProcessed?: boolean;
  payoutProcessedAt?: Date;
  reminder60SentAt?: Date;
  reminder30SentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>({
  tournament: {
    type: Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  team1: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  team2: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'Team'
  },
  score: {
    team1: {
      type: Number,
      default: 0
    },
    team2: {
      type: Number,
      default: 0
    }
  },
  game: {
    type: String,
    enum: [...SUPPORTED_GAMES],
    required: true
  },
  round: {
    type: String,
    required: true
  },
  map: {
    type: String
  },
  stats: {
    team1: {
      kills: { type: Number, default: 0 },
      deaths: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      roundsWon: { type: Number, default: 0 },
      plantedBombs: { type: Number },
      defusedBombs: { type: Number }
    },
    team2: {
      kills: { type: Number, default: 0 },
      deaths: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      roundsWon: { type: Number, default: 0 },
      plantedBombs: { type: Number },
      defusedBombs: { type: Number }
    }
  },
  roomCredentials: {
    roomId: { type: String, trim: true },
    password: { type: String, trim: true },
    generatedAt: { type: Date },
    visibleAt: { type: Date },
    expiresAt: { type: Date }
  },
  payoutProcessed: {
    type: Boolean,
    default: false
  },
  payoutProcessedAt: {
    type: Date
  },
  reminder60SentAt: {
    type: Date
  },
  reminder30SentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
matchSchema.index({ tournament: 1, startTime: 1 });
matchSchema.index({ tournament: 1, status: 1, startTime: 1 });
matchSchema.index({ tournament: 1, status: 1, winner: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ game: 1 });
matchSchema.index({ 'roomCredentials.roomId': 1 }, { sparse: true });
matchSchema.index({ tournament: 1, 'roomCredentials.roomId': 1, 'roomCredentials.password': 1 }, { sparse: true });

export default mongoose.model<IMatch>('Match', matchSchema); 
