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
exports.Reward = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RewardSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['currency', 'item', 'badge', 'title', 'skin'],
        required: true,
    },
    value: {
        type: Number,
        required: true,
    },
    currencyDetails: {
        amount: {
            type: Number,
            min: 0,
            get: (v) => parseFloat(v.toFixed(2)), // Always return 2 decimal places
        },
        currency: {
            type: String,
            enum: ['USD'],
            default: 'USD',
        },
        minWithdrawal: {
            type: Number,
            min: 0,
            default: 10, // $10 minimum withdrawal
        },
        maxWithdrawal: {
            type: Number,
            min: 0,
        },
        withdrawalFee: {
            type: Number,
            min: 0,
            max: 100, // percentage
            default: 2, // 2% default fee
        },
    },
    imageUrl: String,
    gameId: {
        type: String,
        required: true,
        enum: ['valorant-mobile'],
    },
    requirements: {
        minRank: Number,
        minLevel: Number,
        minWins: Number,
        achievementId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Achievement',
        },
        tournamentId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Tournament',
        },
    },
    expiresAt: Date,
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
// Indexes for faster queries
RewardSchema.index({ gameId: 1, type: 1 });
RewardSchema.index({ 'requirements.minRank': 1 });
RewardSchema.index({ isActive: 1, expiresAt: 1 });
// Method to calculate withdrawal fee
RewardSchema.methods.calculateWithdrawalFee = function (amount) {
    if (!this.currencyDetails || this.type !== 'currency')
        return 0;
    return parseFloat((amount * (this.currencyDetails.withdrawalFee / 100)).toFixed(2));
};
// Method to validate withdrawal amount
RewardSchema.methods.validateWithdrawal = function (amount) {
    if (!this.currencyDetails || this.type !== 'currency') {
        return { valid: false, message: 'Not a currency reward' };
    }
    if (amount < this.currencyDetails.minWithdrawal) {
        return {
            valid: false,
            message: `Minimum withdrawal amount is $${this.currencyDetails.minWithdrawal}`
        };
    }
    if (this.currencyDetails.maxWithdrawal && amount > this.currencyDetails.maxWithdrawal) {
        return {
            valid: false,
            message: `Maximum withdrawal amount is $${this.currencyDetails.maxWithdrawal}`
        };
    }
    if (amount > this.currencyDetails.amount) {
        return {
            valid: false,
            message: `Insufficient balance. Available: $${this.currencyDetails.amount}`
        };
    }
    return { valid: true };
};
exports.Reward = mongoose_1.default.model('Reward', RewardSchema);
