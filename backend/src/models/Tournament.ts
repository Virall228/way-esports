import mongoose, { Document, Schema } from 'mongoose';

export interface ITournament extends Document {
  name: string;
  game: 'Critical Ops' | 'CS2' | 'PUBG Mobile';
  startDate: Date;
  endDate: Date;
  prizePool: number;
  maxTeams: number;
  maxPlayers?: number;
  registeredTeams: mongoose.Types.ObjectId[];
  registeredPlayers: mongoose.Types.ObjectId[];
  status: 'upcoming' | 'ongoing' | 'completed';
  format: 'single_elimination' | 'double_elimination' | 'round_robin';
  type: 'solo' | 'team';
  description: string;
  rules: string;
  createdBy: mongoose.Types.ObjectId;
  isRegistrationOpen: boolean;
  matches: mongoose.Types.ObjectId[];
  bracket?: {
    matches: mongoose.Types.ObjectId[];
  };
  winner?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  canStart(): boolean;
  generateBracket(): void;
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
  maxPlayers: { type: Number },
  registeredTeams: [{
    type: Schema.Types.ObjectId,
    ref: 'Team'
  }],
  registeredPlayers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
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
  type: {
    type: String,
    required: true,
    enum: ['solo', 'team'],
    default: 'team'
  },
  description: { type: String, required: true },
  rules: { type: String, required: true },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isRegistrationOpen: {
    type: Boolean,
    default: true
  },
  matches: [{
    type: Schema.Types.ObjectId,
    ref: 'Match'
  }],
  bracket: {
    matches: [{
      type: Schema.Types.ObjectId,
      ref: 'Match'
    }]
  },
  winner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Methods
tournamentSchema.methods.canStart = function(): boolean {
  return this.status === 'upcoming' && 
         ((this.type === 'team' && this.registeredTeams.length >= 2) ||
          (this.type === 'solo' && this.registeredPlayers.length >= 2));
};

tournamentSchema.methods.generateBracket = function(): void {
  // Simple bracket generation logic
  if (this.type === 'team') {
    // Generate team bracket
    this.bracket = { matches: [] };
  } else {
    // Generate solo bracket
    this.bracket = { matches: [] };
  }
};

// Indexes
tournamentSchema.index({ game: 1, status: 1 });
tournamentSchema.index({ startDate: 1 });

export default mongoose.model<ITournament>('Tournament', tournamentSchema); 