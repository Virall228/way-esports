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
exports.DeviceVerification = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const DeviceVerificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    deviceId: {
        type: String,
        required: true,
        unique: true,
    },
    deviceModel: {
        type: String,
        required: true,
    },
    osVersion: {
        type: String,
        required: true,
    },
    manufacturer: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationCode: {
        type: String,
        required: true,
    },
    verificationExpiry: {
        type: Date,
        required: true,
    },
    lastVerifiedAt: {
        type: Date,
    },
    gameId: {
        type: String,
        required: true,
        enum: ['valorant-mobile'],
    },
    specs: {
        ram: String,
        processor: String,
        gpu: String,
        storage: String,
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending',
    },
}, {
    timestamps: true,
});
// Index for faster queries
DeviceVerificationSchema.index({ deviceId: 1, gameId: 1 }, { unique: true });
DeviceVerificationSchema.index({ userId: 1, gameId: 1 });
// Method to check if device meets minimum requirements
DeviceVerificationSchema.methods.meetsMinimumRequirements = function () {
    const minimumRequirements = {
        android: {
            version: '8.0',
            ram: '4GB',
            storage: '4GB'
        },
        ios: {
            version: '13.0',
            devices: ['iPhone 8', 'iPhone X', 'iPad 6th gen']
        }
    };
    // Parse RAM to number (remove 'GB' and convert to number)
    const deviceRam = parseInt(this.specs.ram.replace('GB', ''));
    const minRam = parseInt(minimumRequirements.android.ram.replace('GB', ''));
    if (this.deviceModel.toLowerCase().includes('iphone') || this.deviceModel.toLowerCase().includes('ipad')) {
        const iosVersion = parseFloat(this.osVersion);
        return iosVersion >= parseFloat(minimumRequirements.ios.version);
    }
    else {
        const androidVersion = parseFloat(this.osVersion);
        return androidVersion >= parseFloat(minimumRequirements.android.version) &&
            deviceRam >= minRam;
    }
};
// Method to generate verification code
DeviceVerificationSchema.methods.generateVerificationCode = function () {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.verificationCode = code;
    this.verificationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry
    return code;
};
// Method to verify device
DeviceVerificationSchema.methods.verify = function () {
    this.isVerified = true;
    this.status = 'verified';
    this.lastVerifiedAt = new Date();
};
exports.DeviceVerification = mongoose_1.default.model('DeviceVerification', DeviceVerificationSchema);
