const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    telegramId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],
    wallet: {
        address: {
            type: String,
            unique: true,
            sparse: true
        },
        balance: {
            type: Number,
            default: 0
        }
    },
    tournaments: [{
        tournament: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tournament'
        },
        role: {
            type: String,
            enum: ['player', 'captain', 'manager'],
            default: 'player'
        },
        joinedAt: {
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', async function(next) {
    if (this.isModified('wallet.address')) {
        // Here you could add wallet address validation for TON
    }
    next();
});

module.exports = mongoose.model('User', userSchema); 