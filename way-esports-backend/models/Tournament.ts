import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  team1?: mongoose.Types.ObjectId;
  team2?: mongoose.Types.ObjectId;
  player1?: mongoose.Types.ObjectId;
  player2?: mongoose.Types.ObjectId;
  score1: number;
  score2: number;
  winner?: mongoose.Types.ObjectId;
  winnerType?: 'team' | 'player';
  status: 'pending' | 'in_progress' | 'completed';
  scheduledTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  round: number;
  matchNumber: number;
}

export interface IBracket extends Document {
  rounds: number;
  matches: IMatch[];
}

export interface ITournament extends Document {
  name: string;
  game: string;
  startDate: Date;
  endDate: Date;
  maxTeams: number;
  maxPlayers?: number; // For solo tournaments
  prizePool: number;
  description: string;
  rules: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin';
  type: 'team' | 'solo' | 'mixed'; // Tournament type
  status: 'registration' | 'in_progress' | 'completed' | 'cancelled';
  registeredTeams: mongoose.Types.ObjectId[];
  registeredPlayers: mongoose.Types.ObjectId[]; // For solo players
  bracket: IBracket;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema({
  team1: { type: Schema.Types.ObjectId, ref: 'Team' },
  team2: { type: Schema.Types.ObjectId, ref: 'Team' },
  player1: { type: Schema.Types.ObjectId, ref: 'User' },
  player2: { type: Schema.Types.ObjectId, ref: 'User' },
  score1: { type: Number, default: 0 },
  score2: { type: Number, default: 0 },
  winner: { type: Schema.Types.ObjectId },
  winnerType: { 
    type: String, 
    enum: ['team', 'player'],
    required: function() { return this.winner != null; }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  },
  scheduledTime: Date,
  actualStartTime: Date,
  actualEndTime: Date,
  round: { type: Number, required: true },
  matchNumber: { type: Number, required: true },
});

const BracketSchema = new Schema({
  rounds: { type: Number, required: true },
  matches: [MatchSchema],
});

const TournamentSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    game: { type: String, required: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    maxTeams: { type: Number },
    maxPlayers: { type: Number }, // For solo tournaments
    prizePool: { type: Number, required: true, index: true },
    description: { type: String, required: true },
    rules: { type: String, required: true },
    format: {
      type: String,
      enum: ['single_elimination', 'double_elimination', 'round_robin'],
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['team', 'solo', 'mixed'],
      required: true,
      default: 'team',
      index: true,
    },
    status: {
      type: String,
      enum: ['registration', 'in_progress', 'completed', 'cancelled'],
      default: 'registration',
      index: true,
    },
    registeredTeams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    registeredPlayers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    bracket: BracketSchema,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true, index: true },
    participantCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
TournamentSchema.index({ status: 1, startDate: -1 });
TournamentSchema.index({ game: 1, status: 1, startDate: -1 });
TournamentSchema.index({ isActive: 1, status: 1, startDate: -1 });
TournamentSchema.index({ createdBy: 1, createdAt: -1 });

// Middleware to check dates and update participant count
TournamentSchema.pre('save', function (next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  
  // Validate tournament type requirements
  if (this.type === 'team' && !this.maxTeams) {
    next(new Error('maxTeams is required for team tournaments'));
  }
  
  if (this.type === 'solo' && !this.maxPlayers) {
    next(new Error('maxPlayers is required for solo tournaments'));
  }
  
  if (this.type === 'mixed' && !this.maxTeams && !this.maxPlayers) {
    next(new Error('Either maxTeams or maxPlayers is required for mixed tournaments'));
  }
  
  // Update participant count
  if (this.isModified('registeredTeams') || this.isModified('registeredPlayers')) {
    this.participantCount = (this.registeredTeams?.length || 0) + (this.registeredPlayers?.length || 0);
  }
  
  next();
});

// Method to check if registration is open
TournamentSchema.methods.isRegistrationOpen = function (): boolean {
  if (this.status !== 'registration' || new Date() >= this.startDate) {
    return false;
  }
  
  const totalParticipants = (this.registeredTeams?.length || 0) + (this.registeredPlayers?.length || 0);
  
  if (this.type === 'team') {
    return this.registeredTeams.length < this.maxTeams;
  } else if (this.type === 'solo') {
    return this.registeredPlayers.length < this.maxPlayers;
  } else if (this.type === 'mixed') {
    const maxTotal = (this.maxTeams || 0) + (this.maxPlayers || 0);
    return totalParticipants < maxTotal;
  }
  
  return false;
};

// Method to check if tournament can be started
TournamentSchema.methods.canStart = function (): boolean {
  if (this.status !== 'registration' || new Date() < this.startDate) {
    return false;
  }
  
  const totalParticipants = (this.registeredTeams?.length || 0) + (this.registeredPlayers?.length || 0);
  return totalParticipants >= 2;
};

// Method to generate tournament bracket (optimized for large tournaments)
TournamentSchema.methods.generateBracket = function (): void {
  // Combine teams and solo players as participants
  const participants = [];
  
  // Add teams
  if (this.registeredTeams) {
    participants.push(...this.registeredTeams.map(teamId => ({ type: 'team', id: teamId })));
  }
  
  // Add solo players
  if (this.registeredPlayers) {
    participants.push(...this.registeredPlayers.map(playerId => ({ type: 'player', id: playerId })));
  }
  
  const participantCount = participants.length;
  
  if (participantCount < 2) {
    throw new Error('At least 2 participants required for tournament');
  }

  // Fisher-Yates shuffle algorithm for better randomization
  for (let i = participantCount - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }

  // Calculate bracket structure
  const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(participantCount)));
  const rounds = Math.ceil(Math.log2(participantCount));
  const byesNeeded = nextPowerOfTwo - participantCount;

  // Create matches efficiently
  const matches: any[] = [];
  let matchNumber = 1;

  // First round with byes handling
  const firstRoundParticipants = [...participants];
  
  // Add byes to balance the bracket
  for (let i = 0; i < byesNeeded; i++) {
    firstRoundParticipants.push(null);
  }

  // Generate first round matches
  for (let i = 0; i < firstRoundParticipants.length; i += 2) {
    const participant1 = firstRoundParticipants[i];
    const participant2 = firstRoundParticipants[i + 1];
    
    // Skip matches where both participants are null (shouldn't happen but safety check)
    if (!participant1 && !participant2) continue;
    
    matches.push({
      team1: participant1?.type === 'team' ? participant1.id : null,
      team2: participant2?.type === 'team' ? participant2.id : null,
      player1: participant1?.type === 'player' ? participant1.id : null,
      player2: participant2?.type === 'player' ? participant2.id : null,
      round: 1,
      matchNumber: matchNumber++,
      status: participant2 === null ? 'completed' : 'pending', // Auto-complete bye matches
      winner: participant2 === null ? participant1?.id : null,
      winnerType: participant2 === null ? participant1?.type : null,
      score1: participant2 === null ? 1 : 0,
      score2: 0,
    });
  }

  // Generate subsequent rounds
  let currentRoundMatches = Math.floor(firstRoundParticipants.length / 2);
  for (let round = 2; round <= rounds; round++) {
    currentRoundMatches = Math.floor(currentRoundMatches / 2);
    for (let i = 0; i < currentRoundMatches; i++) {
      matches.push({
        team1: null,
        team2: null,
        player1: null,
        player2: null,
        round: round,
        matchNumber: matchNumber++,
        status: 'pending',
        winner: null,
        winnerType: null,
      });
    }
  }

  this.bracket = {
    rounds,
    matches,
  };
};

export const Tournament = mongoose.model<ITournament>('Tournament', TournamentSchema); 