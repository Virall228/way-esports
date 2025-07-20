const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  tournamentId: {
    type: String,
    required: true
  },
  team1: {
    type: String,
    required: true
  },
  team2: {
    type: String,
    required: true
  },
  score: {
    team1: {
      type: Number,
      default: 0
    },
    team2: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  startTime: {
    type: Date,
    required: true
  },
  round: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Match', matchSchema); 