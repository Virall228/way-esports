const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  stats: {
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    tournamentParticipation: {
      type: Number,
      default: 0
    }
  },
  achievements: [{
    name: String,
    description: String,
    dateEarned: Date
  }],
  favoriteGames: [{
    type: String
  }],
  rank: {
    type: String,
    default: 'Rookie'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema); 