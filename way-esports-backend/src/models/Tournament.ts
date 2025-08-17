import mongoose, { Document, Schema } from 'mongoose';

export interface ITournament extends Document {
  name: string;
  game: 'Critical Ops' | 'CS2' | 'PUBG Mobile';
  startDate: Date;
  endDate: Date;
  prizePool: number;
  maxTeams: number;
  registeredTeams: mongoose.Types.ObjectId[];
  status: 'upcoming' | 'ongoing' | 'completed';
  format: 'single_elimination' | 'double_elimination' | 'round_robin';
  description: string;
  rules: string;
  createdBy: mongoose.Types.ObjectId;
  matches: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const tournamentSchema = new Schema<ITournament>({
  name: { type: String, required: true },
  game: { 
    type: String, 
    required: true,
    enum: ['Critical Ops', 'CS2', 'PUBG Mobile']
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  prizePool: { type: Number, required: true },
  maxTeams: { type: Number, required: true },
  registeredTeams: [{
    type: Schema.Types.ObjectId,
    ref: 'Team'
  }],
  status: {
    type: String,
    required: true,
    enum: ['upcoming', 'ongoing', 'completed'],
    default: 'upcoming'
  },
  format: {
    type: String,
    required: true,
    enum: ['single_elimination', 'double_elimination', 'round_robin']
  },
  description: { type: String, required: true },
  rules: { type: String, required: true },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  matches: [{
    type: Schema.Types.ObjectId,
    ref: 'Match'
  }]
}, {
  timestamps: true
});

// Indexes
tournamentSchema.index({ game: 1, status: 1 });
tournamentSchema.index({ startDate: 1 });

export default mongoose.model<ITournament>('Tournament', tournamentSchema); 