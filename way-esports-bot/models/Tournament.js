const mongoose = require('mongoose');
const bracketManager = require('../utils/bracketManager');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'in_progress', 'completed'],
    default: 'upcoming'
  },
  maxTeams: {
    type: Number,
    required: true
  },
  registeredTeams: [{
    name: String,
    players: [{
      type: String,  // telegramId
      ref: 'User'
    }],
    seed: Number
  }],
  bracket: {
    rounds: [{
      roundNumber: Number,
      matches: [{
        matchId: String,
        team1: {
          name: String,
          score: {
            type: Number,
            default: 0
          },
          seed: Number
        },
        team2: {
          name: String,
          score: {
            type: Number,
            default: 0
          },
          seed: Number
        },
        winner: String,
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending'
        },
        scheduledTime: Date
      }]
    }]
  },
  game: {
    type: String,
    required: true
  },
  prizePool: {
    type: Number,
    default: 0
  },
  organizer: {
    type: String,  // telegramId
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to validate dates
tournamentSchema.pre('save', function(next) {
  if (this.endDate <= this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

// Method to check if registration is open
tournamentSchema.methods.isRegistrationOpen = function() {
  return (
    this.status === 'upcoming' &&
    this.registeredTeams.length < this.maxTeams &&
    new Date() < this.startDate
  );
};

// Method to check if tournament can be started
tournamentSchema.methods.canStart = function() {
  return (
    this.status === 'upcoming' &&
    this.registeredTeams.length >= 2 &&
    new Date() >= this.startDate
  );
};

// Method to generate tournament bracket
tournamentSchema.methods.generateBracket = function() {
  try {
    const bracket = bracketManager.generateBracket(this.registeredTeams);
    this.bracket = bracket;
    return true;
  } catch (error) {
    throw new Error(`Failed to generate bracket: ${error.message}`);
  }
};

// Method to update match result
tournamentSchema.methods.updateMatchResult = function(roundNumber, matchIndex, team1Score, team2Score) {
  try {
    const updatedTournament = bracketManager.updateBracket(this, roundNumber, matchIndex, team1Score, team2Score);
    this.bracket = updatedTournament.bracket;
    this.status = updatedTournament.status;
    return true;
  } catch (error) {
    throw new Error(`Failed to update match result: ${error.message}`);
  }
};

// Method to check if a match can be played
tournamentSchema.methods.canPlayMatch = function(matchId) {
  if (this.status !== 'in_progress') return false;

  for (const round of this.bracket.rounds) {
    const match = round.matches.find(m => m.matchId === matchId);
    if (match) {
      if (match.status !== 'pending' || !match.team1.name || !match.team2.name) {
        return false;
      }
      return true;
    }
  }
  return false;
};

module.exports = mongoose.model('Tournament', tournamentSchema); 