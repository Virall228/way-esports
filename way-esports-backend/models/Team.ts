import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer extends Document {
  userId: mongoose.Types.ObjectId;
  role: string;
  joinedAt: Date;
  isActive: boolean;
}

export interface ITeam extends Document {
  name: string;
  tag: string;
  logo: string;
  game: string;
  players: IPlayer[];
  captain: mongoose.Types.ObjectId;
  stats: {
    wins: number;
    losses: number;
    tournamentsPlayed: number;
    tournamentsWon: number;
  };
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

const TeamSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    tag: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 5,
      uppercase: true,
    },
    logo: {
      type: String,
      required: true,
    },
    game: {
      type: String,
      required: true,
    },
    players: [PlayerSchema],
    captain: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      tournamentsPlayed: { type: Number, default: 0 },
      tournamentsWon: { type: Number, default: 0 },
    },
    achievements: [String],
  },
  {
    timestamps: true,
  }
);

// Validate maximum players
TeamSchema.pre('save', function (next) {
  if (this.players.length > 7) {
    next(new Error('Team cannot have more than 7 players'));
  }
  next();
});

// Method to add player
TeamSchema.methods.addPlayer = async function (
  userId: mongoose.Types.ObjectId,
  role: string
): Promise<void> {
  if (this.players.some((p) => p.userId.equals(userId))) {
    throw new Error('Player already in team');
  }

  this.players.push({
    userId,
    role,
    joinedAt: new Date(),
    isActive: true,
  });

  await this.save();
};

// Method to remove player
TeamSchema.methods.removePlayer = async function (
  userId: mongoose.Types.ObjectId
): Promise<void> {
  const playerIndex = this.players.findIndex((p) => p.userId.equals(userId));
  if (playerIndex === -1) {
    throw new Error('Player not found in team');
  }

  if (this.captain.equals(userId)) {
    throw new Error('Cannot remove team captain');
  }

  this.players.splice(playerIndex, 1);
  await this.save();
};

// Method to update team stats
TeamSchema.methods.updateStats = async function (
  won: boolean,
  tournamentCompleted: boolean = false
): Promise<void> {
  if (won) {
    this.stats.wins += 1;
  } else {
    this.stats.losses += 1;
  }

  if (tournamentCompleted) {
    this.stats.tournamentsPlayed += 1;
    if (won) {
      this.stats.tournamentsWon += 1;
    }
  }

  await this.save();
};

// Virtual for win rate
TeamSchema.virtual('winRate').get(function () {
  const totalGames = this.stats.wins + this.stats.losses;
  return totalGames > 0 ? (this.stats.wins / totalGames) * 100 : 0;
});

export const Team = mongoose.model<ITeam>('Team', TeamSchema); 