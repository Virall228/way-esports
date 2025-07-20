import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  team1: mongoose.Types.ObjectId;
  team2: mongoose.Types.ObjectId;
  score1: number;
  score2: number;
  winner: mongoose.Types.ObjectId;
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
  prizePool: number;
  description: string;
  rules: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin';
  status: 'registration' | 'in_progress' | 'completed' | 'cancelled';
  registeredTeams: mongoose.Types.ObjectId[];
  bracket: IBracket;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema({
  team1: { type: Schema.Types.ObjectId, ref: 'Team' },
  team2: { type: Schema.Types.ObjectId, ref: 'Team' },
  score1: { type: Number, default: 0 },
  score2: { type: Number, default: 0 },
  winner: { type: Schema.Types.ObjectId, ref: 'Team' },
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
    name: { type: String, required: true },
    game: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    maxTeams: { type: Number, required: true },
    prizePool: { type: Number, required: true },
    description: { type: String, required: true },
    rules: { type: String, required: true },
    format: {
      type: String,
      enum: ['single_elimination', 'double_elimination', 'round_robin'],
      required: true,
    },
    status: {
      type: String,
      enum: ['registration', 'in_progress', 'completed', 'cancelled'],
      default: 'registration',
    },
    registeredTeams: [{ type: Schema.Types.ObjectId, ref: 'Team' }],
    bracket: BracketSchema,
  },
  {
    timestamps: true,
  }
);

// Middleware to check dates
TournamentSchema.pre('save', function (next) {
  if (this.endDate < this.startDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Method to check if registration is open
TournamentSchema.methods.isRegistrationOpen = function (): boolean {
  return (
    this.status === 'registration' &&
    this.registeredTeams.length < this.maxTeams &&
    new Date() < this.startDate
  );
};

// Method to check if tournament can be started
TournamentSchema.methods.canStart = function (): boolean {
  return (
    this.status === 'registration' &&
    this.registeredTeams.length >= 2 &&
    new Date() >= this.startDate
  );
};

// Method to generate tournament bracket
TournamentSchema.methods.generateBracket = function (): void {
  const teams = [...this.registeredTeams];
  const rounds = Math.ceil(Math.log2(teams.length));
  const totalMatches = Math.pow(2, rounds) - 1;

  // Shuffle teams
  for (let i = teams.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [teams[i], teams[j]] = [teams[j], teams[i]];
  }

  // Create matches
  const matches: any[] = [];
  let matchNumber = 1;
  let currentRound = 1;
  let teamsInRound = teams.length;

  while (teamsInRound > 1) {
    for (let i = 0; i < teamsInRound; i += 2) {
      matches.push({
        team1: teams[i] || null,
        team2: teams[i + 1] || null,
        round: currentRound,
        matchNumber: matchNumber++,
        status: 'pending',
      });
    }
    teamsInRound = Math.ceil(teamsInRound / 2);
    currentRound++;
  }

  this.bracket = {
    rounds,
    matches,
  };
};

export const Tournament = mongoose.model<ITournament>('Tournament', TournamentSchema); 