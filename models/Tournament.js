const mongoose = require('mongoose');

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
          }
        },
        team2: {
          name: String,
          score: {
            type: Number,
            default: 0
          }
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

// Method to generate initial bracket
tournamentSchema.methods.generateBracket = function() {
  const teams = [...this.registeredTeams].sort((a, b) => a.seed - b.seed);
  const rounds = Math.ceil(Math.log2(teams.length));
  const totalTeams = Math.pow(2, rounds);
  
  // Fill with byes if needed
  while (teams.length < totalTeams) {
    teams.push({ name: 'BYE', players: [] });
  }

  this.bracket = {
    rounds: []
  };

  // Generate first round
  const firstRound = {
    roundNumber: 1,
    matches: []
  };

  for (let i = 0; i < teams.length; i += 2) {
    firstRound.matches.push({
      matchId: `R1M${i/2 + 1}`,
      team1: { name: teams[i].name },
      team2: { name: teams[i + 1].name },
      status: 'pending'
    });
  }

  this.bracket.rounds.push(firstRound);

  // Generate subsequent rounds
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    const roundData = {
      roundNumber: round,
      matches: []
    };

    for (let match = 1; match <= matchesInRound; match++) {
      roundData.matches.push({
        matchId: `R${round}M${match}`,
        team1: { name: 'TBD' },
        team2: { name: 'TBD' },
        status: 'pending'
      });
    }

    this.bracket.rounds.push(roundData);
  }
};

// Method to update bracket after a match
tournamentSchema.methods.updateBracket = function(roundNumber, matchIndex, winner) {
  const currentMatch = this.bracket.rounds[roundNumber - 1].matches[matchIndex];
  currentMatch.winner = winner;
  currentMatch.status = 'completed';

  // Update next round if not final
  if (roundNumber < this.bracket.rounds.length) {
    const nextRoundMatch = this.bracket.rounds[roundNumber].matches[Math.floor(matchIndex / 2)];
    if (matchIndex % 2 === 0) {
      nextRoundMatch.team1.name = winner;
    } else {
      nextRoundMatch.team2.name = winner;
    }
  }
};

module.exports = mongoose.model('Tournament', tournamentSchema); 
