import mongoose, { Document, Schema } from 'mongoose';

export interface IMatchRoomAccessLog extends Document<mongoose.Types.ObjectId> {
  matchId: mongoose.Types.ObjectId;
  tournamentId?: mongoose.Types.ObjectId;
  requestedBy?: mongoose.Types.ObjectId;
  requesterRole?: string;
  source: 'match_room' | 'admin_prepare_single' | 'admin_prepare_bulk';
  status: 'success' | 'denied' | 'error';
  reason?: string;
  roomId?: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const matchRoomAccessLogSchema = new Schema<IMatchRoomAccessLog>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
      index: true
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament',
      index: true
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    requesterRole: {
      type: String,
      trim: true,
      default: 'user'
    },
    source: {
      type: String,
      enum: ['match_room', 'admin_prepare_single', 'admin_prepare_bulk'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['success', 'denied', 'error'],
      required: true,
      index: true
    },
    reason: {
      type: String,
      trim: true,
      maxlength: 280
    },
    roomId: {
      type: String,
      trim: true,
      maxlength: 32
    },
    ip: {
      type: String,
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

matchRoomAccessLogSchema.index({ createdAt: -1 });
matchRoomAccessLogSchema.index({ matchId: 1, createdAt: -1 });

export default mongoose.model<IMatchRoomAccessLog>('MatchRoomAccessLog', matchRoomAccessLogSchema);

