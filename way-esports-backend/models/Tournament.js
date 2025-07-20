const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    game: {
        type: String,
        required: true,
        enum: ['CS2', 'Dota 2', 'VALORANT', 'League of Legends']
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    prizePool: {
        type: Number,
        required: true,
        min: 0
    },
    entryFee: {
        type: Number,
        required: true,
        min: 0
    },
    maxTeams: {
        type: Number,
        required: true,
        min: 2
    },
    registeredTeams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed'],
        default: 'upcoming'
    },
    format: {
        type: String,
        required: true,
        enum: ['single-elimination', 'double-elimination', 'round-robin']
    },
    matches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
    }],
    rules: {
        type: String,
        required: true
    },
    streamLink: String,
    discordLink: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Tournament', tournamentSchema); 