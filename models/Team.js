const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    tag: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        maxLength: 5
    },
    logo: {
        type: String,
        default: null
    },
    captain: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    players: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['player', 'substitute'],
            default: 'player'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    tournaments: [{
        tournament: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament'
        },
        status: {
            type: String,
            enum: ['registered', 'active', 'eliminated', 'completed'],
            default: 'registered'
        },
        position: Number,
        registeredAt: {
            type: Date,
            default: Date.now
        }
    }],
    achievements: [{
        tournament: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament'
        },
        position: Number,
        prize: Number,
        awardedAt: {
            type: Date,
            default: Date.now
        }
    }],
    stats: {
        totalWins: {
            type: Number,
            default: 0
        },
        totalLosses: {
            type: Number,
            default: 0
        },
        totalPrizeMoney: {
            type: Number,
            default: 0
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

teamSchema.pre('save', function(next) {
    if (this.players.length > 7) {
        next(new Error('Team cannot have more than 7 players (5 main + 2 substitutes)'));
    }
    next();
});

module.exports = mongoose.model('Team', teamSchema); 