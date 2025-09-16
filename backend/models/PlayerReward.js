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
exports.PlayerReward = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PlayerRewardSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
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
    expiresAt: Date,
    status: {
        type: String,
        enum: ['earned', 'claimed', 'expired'],
        default: 'earned',
    },
}, {
    timestamps: true,
});
// Indexes for faster queries
PlayerRewardSchema.index({ userId: 1, gameId: 1 });
PlayerRewardSchema.index({ rewardId: 1 });
PlayerRewardSchema.index({ status: 1 });
PlayerRewardSchema.index({ expiresAt: 1 });
// Method to check if reward is expired
PlayerRewardSchema.methods.isExpired = function () {
    if (!this.expiresAt)
        return false;
    return new Date() > this.expiresAt;
};
// Method to claim reward
PlayerRewardSchema.methods.claim = function () {
    if (this.status !== 'earned') {
        throw new Error('Reward cannot be claimed');
    }
    if (this.isExpired()) {
        this.status = 'expired';
        throw new Error('Reward has expired');
    }
    this.status = 'claimed';
    this.claimedAt = new Date();
};
exports.PlayerReward = mongoose_1.default.model('PlayerReward', PlayerRewardSchema);
