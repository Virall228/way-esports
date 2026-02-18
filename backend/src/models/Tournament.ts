import mongoose, { Document, Schema } from 'mongoose';

export interface ITournament extends Document<mongoose.Types.ObjectId> {
  name: string;
  game: string;
  image?: string;
  coverImage?: string;
  startDate: Date;
  endDate: Date;
  prizePool: number;
  maxTeams: number;
  maxPlayers?: number;
  maxParticipants?: number; // Added for compatibility
  currentParticipants?: number; // Added for compatibility
  skillLevel?: string; // Added
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
  prizeDistribution?: {
    firstPlace: number;
    secondPlace: number;
    thirdPlace: number;
  };
  prizeStatus?: 'pending' | 'processing' | 'distributed';
  createdAt: Date;
  updatedAt: Date;

  // Methods
  canStart(): boolean;
  generateBracket(): void;
  distributePrizes(): Promise<void>;
}

const tournamentSchema = new Schema<ITournament>({
  name: { type: String, required: true },
  game: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String,
    trim: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  prizePool: { type: Number, required: true },
  maxTeams: { type: Number, required: true },
  maxPlayers: { type: Number },
  maxParticipants: { type: Number }, // Added
  skillLevel: { type: String }, // Added
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
    required: false
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
  },
  prizeDistribution: {
    firstPlace: { type: Number, default: 0 },
    secondPlace: { type: Number, default: 0 },
    thirdPlace: { type: Number, default: 0 }
  },
  prizeStatus: {
    type: String,
    enum: ['pending', 'processing', 'distributed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Methods
tournamentSchema.methods.canStart = function (): boolean {
  return this.status === 'upcoming' &&
    ((this.type === 'team' && this.registeredTeams.length >= 2) ||
      (this.type === 'solo' && this.registeredPlayers.length >= 2));
};

tournamentSchema.methods.generateBracket = function (): void {
  // Simple bracket generation logic
  if (this.type === 'team') {
    // Generate team bracket
    this.bracket = { matches: [] };
  } else {
    // Generate solo bracket
    this.bracket = { matches: [] };
  }
};

tournamentSchema.methods.distributePrizes = async function (): Promise<void> {
  if (this.status !== 'completed' || this.prizeStatus !== 'pending') {
    return;
  }

  this.prizeStatus = 'processing';
  await this.save();

  try {
    // Calculate prize distribution (50%, 30%, 20%)
    const totalPrize = this.prizePool;
    const firstPlacePrize = totalPrize * 0.5;
    const secondPlacePrize = totalPrize * 0.3;
    const thirdPlacePrize = totalPrize * 0.2;

    this.prizeDistribution = {
      firstPlace: firstPlacePrize,
      secondPlace: secondPlacePrize,
      thirdPlace: thirdPlacePrize
    };

    // Get top 3 teams/players (this would be determined from tournament results)
    // For now, we'll use the registered teams as placeholders
    const winners = this.type === 'team' ? this.registeredTeams.slice(0, 3) : this.registeredPlayers.slice(0, 3);
    const prizes = [firstPlacePrize, secondPlacePrize, thirdPlacePrize];

    for (let i = 0; i < Math.min(winners.length, 3); i++) {
      const winnerId = winners[i];
      const prize = prizes[i];

      if (this.type === 'team') {
        // Distribute to team members equally
        const Team = mongoose.model('Team');
        const team = await Team.findById(winnerId).populate('players');

        if (team && team.players && team.players.length > 0) {
          const prizePerPlayer = prize / team.players.length;

          for (const player of team.players) {
            await distributePrizeToPlayer(player, prizePerPlayer, this._id, i + 1);
          }
        }
      } else {
        // Distribute to solo player
        await distributePrizeToPlayer(winnerId, prize, this._id, i + 1);
      }
    }

    this.prizeStatus = 'distributed';
    await this.save();
  } catch (error) {
    this.prizeStatus = 'pending';
    await this.save();
    throw error;
  }
};

// Helper function to distribute prize to individual player
async function distributePrizeToPlayer(
  playerId: mongoose.Types.ObjectId,
  amount: number,
  tournamentId: mongoose.Types.ObjectId,
  position: number
): Promise<void> {
  const User = mongoose.model('User');
  const user = await User.findById(playerId);

  if (!user) return;

  // Add to wallet balance
  user.wallet.balance += amount;

  // Add transaction record
  user.wallet.transactions.push({
    type: 'prize',
    amount: amount,
    description: `Prize for ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : 'rd'} place in tournament`,
    date: new Date()
  });

  // Update stats
  if (position === 1) {
    user.stats.tournamentsWon += 1;
  }
  user.stats.tournamentsPlayed += 1;

  await user.save();
}

// Indexes
tournamentSchema.index({ game: 1, status: 1 });
tournamentSchema.index({ startDate: 1 });

export default mongoose.model<ITournament>('Tournament', tournamentSchema);
