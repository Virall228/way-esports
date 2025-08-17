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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceBlacklist = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const DeviceBlacklistSchema = new mongoose_1.Schema({
    deviceId: {
        type: String,
        required: true,
        unique: true,
    },
    deviceModel: {
        type: String,
        required: true,
    },
    manufacturer: {
        type: String,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    blacklistedAt: {
        type: Date,
        default: Date.now,
    },
    blacklistedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    expiresAt: {
        type: Date,
    },
    isGlobalBan: {
        type: Boolean,
        default: false,
    },
    gameId: {
        type: String,
        required: true,
        enum: ['valorant-mobile'],
    },
    notes: String,
    appealStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none',
    },
    appealNotes: String,
}, {
    timestamps: true,
});
// Indexes for faster queries
DeviceBlacklistSchema.index({ deviceId: 1, gameId: 1 }, { unique: true });
DeviceBlacklistSchema.index({ manufacturer: 1, deviceModel: 1 });
DeviceBlacklistSchema.index({ blacklistedAt: 1 });
DeviceBlacklistSchema.index({ expiresAt: 1 });
// Method to check if blacklist is expired
DeviceBlacklistSchema.methods.isExpired = function () {
    if (!this.expiresAt)
        return false;
    return new Date() > this.expiresAt;
};
// Method to check if device can appeal
DeviceBlacklistSchema.methods.canAppeal = function () {
    return this.appealStatus === 'none' ||
        (this.appealStatus === 'rejected' &&
            this.updatedAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days since last appeal
};
// Static method to check if device is blacklisted
DeviceBlacklistSchema.statics.isBlacklisted = function (deviceId, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const blacklist = yield this.findOne({
            deviceId,
            gameId,
            $or: [
                { expiresAt: { $gt: new Date() } },
                { expiresAt: null }
            ]
        });
        return !!blacklist && !blacklist.isExpired();
    });
};
exports.DeviceBlacklist = mongoose_1.default.model('DeviceBlacklist', DeviceBlacklistSchema);
