import mongoose, { Document, Schema } from 'mongoose';

export type MatchEventType = 'kill' | 'death' | 'utility' | 'clutch' | 'assist' | 'objective';

export interface IMatchEvent extends Document<mongoose.Types.ObjectId> {
  matchId: mongoose.Types.ObjectId;
  tournamentId?: mongoose.Types.ObjectId;
  playerId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  eventType: MatchEventType;
  coordinateX: number;
  coordinateY: number;
  map?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const matchEventSchema = new Schema<IMatchEvent>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: 'Match', required: true },
    tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament' },
    playerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' },
    eventType: {
      type: String,
      enum: ['kill', 'death', 'utility', 'clutch', 'assist', 'objective'],
      required: true
    },
    coordinateX: { type: Number, required: true, min: 0, max: 1 },
    coordinateY: { type: Number, required: true, min: 0, max: 1 },
    map: { type: String, trim: true, maxlength: 80 },
    metadata: { type: Schema.Types.Mixed, default: undefined }
  },
  { timestamps: true }
);

matchEventSchema.index({ playerId: 1, createdAt: -1 });
matchEventSchema.index({ matchId: 1, playerId: 1 });
matchEventSchema.index({ tournamentId: 1, createdAt: -1 });
matchEventSchema.index({ eventType: 1, createdAt: -1 });

export default mongoose.model<IMatchEvent>('MatchEvent', matchEventSchema);

