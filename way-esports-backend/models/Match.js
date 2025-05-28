const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    tournament: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tournament',
        required: true
    },
    round: {
        type: Number,
        required: true
    },
    matchNumber: {
        type: Number,
        required: true
    },
    team1: {
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        score: {
            type: Number,
            default: 0
        }
    },
    team2: {
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        score: {
            type: Number,
            default: 0
        }
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        default: null
    },
    status: {
        type: String,
        enum: ['scheduled', 'live', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: Date,
    maps: [{
        name: String,
        team1Score: Number,
        team2Score: Number,
        winner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        status: {
            type: String,
            enum: ['pending', 'ongoing', 'completed'],
            default: 'pending'
        }
    }],
    streamLink: String,
    demoLink: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Match', matchSchema); 