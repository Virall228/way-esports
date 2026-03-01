import mongoose, { Document, Schema } from 'mongoose';

export interface ITournamentRegistration extends Document<mongoose.Types.ObjectId> {
  userId: mongoose.Types.ObjectId;
  teamId: mongoose.Types.ObjectId;
  tournamentId: mongoose.Types.ObjectId;
  game?: string;
  ingameNickname: string;
  ingameId: string;
  role: 'owner' | 'member';
  status: 'pending' | 'active' | 'rejected' | 'left' | 'removed';
  createdAt: Date;
  updatedAt: Date;
}

const tournamentRegistrationSchema = new Schema<ITournamentRegistration>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teamId: {
    type: Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  tournamentId: {
    type: Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true
  },
  game: {
    type: String,
    trim: true
  },
  ingameNickname: {
    type: String,
    trim: true,
    maxlength: 80,
    required: true
  },
  ingameId: {
    type: String,
    trim: true,
    maxlength: 80,
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'member'],
    default: 'member'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'left', 'removed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

tournamentRegistrationSchema.index({ userId: 1, tournamentId: 1 }, { unique: true });
tournamentRegistrationSchema.index({ teamId: 1, tournamentId: 1 });
tournamentRegistrationSchema.index({ tournamentId: 1, status: 1 });
tournamentRegistrationSchema.index({ tournamentId: 1, ingameId: 1 });

export default mongoose.model<ITournamentRegistration>('TournamentRegistration', tournamentRegistrationSchema);
