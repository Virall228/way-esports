"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamReward = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TeamRewardSchema = new mongoose_1.Schema({
    teamId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Team',
        required: true,
    },
    rewardId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Reward',
        required: true,
    },
    gameId: {
        type: String,
        required: true,
        enum: ['valorant-mobile'],
    },
    earnedAt: {
        type: Date,
        default: Date.now,
    },
    claimedAt: Date,
    claimedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    expiresAt: Date,
    status: {
        type: String,
        enum: ['earned', 'claimed', 'expired'],
        default: 'earned',
    },
    distribution: [{
            userId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            share: {
                type: Number,
                required: true,
                min: 0,
                max: 100,
            },
            claimedAt: Date,
        }],
}, {
    timestamps: true,
});
// Indexes for faster queries
TeamRewardSchema.index({ teamId: 1, gameId: 1 });
TeamRewardSchema.index({ rewardId: 1 });
TeamRewardSchema.index({ status: 1 });
TeamRewardSchema.index({ expiresAt: 1 });
TeamRewardSchema.index({ 'distribution.userId': 1 });
// Method to check if reward is expired
TeamRewardSchema.methods.isExpired = function () {
    if (!this.expiresAt)
        return false;
    return new Date() > this.expiresAt;
};
// Method to claim team member's share
TeamRewardSchema.methods.claimShare = function (userId) {
    if (this.status !== 'earned') {
        throw new Error('Reward cannot be claimed');
    }
    if (this.isExpired()) {
        this.status = 'expired';
        throw new Error('Reward has expired');
    }
    const memberShare = this.distribution.find(d => d.userId.equals(userId));
    if (!memberShare) {
        throw new Error('User is not eligible for this reward');
    }
    if (memberShare.claimedAt) {
        throw new Error('Share already claimed');
    }
    memberShare.claimedAt = new Date();
    // Check if all shares are claimed
    const allClaimed = this.distribution.every(d => d.claimedAt);
    if (allClaimed) {
        this.status = 'claimed';
        this.claimedAt = new Date();
        this.claimedBy = userId;
    }
};
// Validate total share is 100%
TeamRewardSchema.pre('save', function (next) {
    if (this.distribution) {
        const totalShare = this.distribution.reduce((sum, d) => sum + d.share, 0);
        if (totalShare !== 100) {
            next(new Error('Total distribution share must be 100%'));
        }
    }
    next();
});
exports.TeamReward = mongoose_1.default.model('TeamReward', TeamRewardSchema);
