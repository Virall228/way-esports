import mongoose, { Document, Schema } from 'mongoose';

export interface IMatchStatsResultRow {
  userId?: mongoose.Types.ObjectId;
  ingameNickname: string;
  ingameId: string;
  stats: {
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
    isMvp: boolean;
  };
}

export interface IMatchStats extends Document<mongoose.Types.ObjectId> {
  matchId?: mongoose.Types.ObjectId;
  tournamentId: mongoose.Types.ObjectId;
  gameType: string;
  results: IMatchStatsResultRow[];
  screenshotUrl?: string;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const matchStatsRowSchema = new Schema<IMatchStatsResultRow>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    ingameNickname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    ingameId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    stats: {
      kills: { type: Number, default: 0, min: 0 },
      deaths: { type: Number, default: 0, min: 0 },
      assists: { type: Number, default: 0, min: 0 },
      damage: { type: Number, default: 0, min: 0 },
      isMvp: { type: Boolean, default: false }
    }
  },
  { _id: false }
);

const matchStatsSchema = new Schema<IMatchStats>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match'
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true
    },
    gameType: {
      type: String,
      required: true,
      trim: true
    },
    results: {
      type: [matchStatsRowSchema],
      default: []
    },
    screenshotUrl: {
      type: String,
      trim: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

matchStatsSchema.index({ tournamentId: 1, createdAt: -1 });
matchStatsSchema.index({ matchId: 1, createdAt: -1 });
matchStatsSchema.index({ 'results.userId': 1, createdAt: -1 });

export default mongoose.model<IMatchStats>('MatchStats', matchStatsSchema);
