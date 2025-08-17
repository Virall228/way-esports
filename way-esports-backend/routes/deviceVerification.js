"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const DeviceVerification_1 = require("../models/DeviceVerification");
const DeviceBlacklist_1 = require("../models/DeviceBlacklist");
const emailService_1 = require("../services/emailService");
const router = express_1.default.Router();
// Initialize device verification
router.post('/valorant-mobile/verify-device/init', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deviceId, deviceModel, osVersion, manufacturer, specs } = req.body;
        // Check if device is blacklisted
        const isBlacklisted = yield DeviceBlacklist_1.DeviceBlacklist.isBlacklisted(deviceId, 'valorant-mobile');
        if (isBlacklisted) {
            const blacklist = yield DeviceBlacklist_1.DeviceBlacklist.findOne({
                deviceId,
                gameId: 'valorant-mobile'
            });
            return res.status(403).json({
                status: 'error',
                message: 'Device is blacklisted',
                blacklist: {
                    reason: blacklist.reason,
                    expiresAt: blacklist.expiresAt,
                    appealStatus: blacklist.appealStatus,
                    canAppeal: blacklist.canAppeal()
                }
            });
        }
        // Check if device is already verified
        let deviceVerification = yield DeviceVerification_1.DeviceVerification.findOne({
            deviceId,
            gameId: 'valorant-mobile'
        });
        if (deviceVerification && deviceVerification.isVerified) {
            return res.json({
                status: 'success',
                message: 'Device already verified',
                isVerified: true,
                deviceVerification
            });
        }
        // Create new device verification if doesn't exist
        if (!deviceVerification) {
            deviceVerification = new DeviceVerification_1.DeviceVerification({
                userId: req.user._id,
                deviceId,
                deviceModel,
                osVersion,
                manufacturer,
                specs,
                gameId: 'valorant-mobile'
            });
        }
        // Generate new verification code
        const verificationCode = deviceVerification.generateVerificationCode();
        // Save device verification
        yield deviceVerification.save();
        // Send verification code via email
        yield (0, emailService_1.sendVerificationEmail)(req.user.email, verificationCode);
        res.json({
            status: 'success',
            message: 'Verification code sent',
            deviceVerification: Object.assign(Object.assign({}, deviceVerification.toObject()), { verificationCode: undefined // Don't send code in response
             })
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error initializing device verification',
            error: error.message
        });
    }
}));
// Verify device with code
router.post('/valorant-mobile/verify-device/confirm', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deviceId, verificationCode } = req.body;
        // Check if device is blacklisted
        const isBlacklisted = yield DeviceBlacklist_1.DeviceBlacklist.isBlacklisted(deviceId, 'valorant-mobile');
        if (isBlacklisted) {
            const blacklist = yield DeviceBlacklist_1.DeviceBlacklist.findOne({
                deviceId,
                gameId: 'valorant-mobile'
            });
            return res.status(403).json({
                status: 'error',
                message: 'Device is blacklisted',
                blacklist: {
                    reason: blacklist.reason,
                    expiresAt: blacklist.expiresAt,
                    appealStatus: blacklist.appealStatus,
                    canAppeal: blacklist.canAppeal()
                }
            });
        }
        const deviceVerification = yield DeviceVerification_1.DeviceVerification.findOne({
            deviceId,
            gameId: 'valorant-mobile',
            userId: req.user._id
        });
        if (!deviceVerification) {
            return res.status(404).json({
                status: 'error',
                message: 'Device verification not found'
            });
        }
        // Check if verification code is expired
        if (deviceVerification.verificationExpiry < new Date()) {
            return res.status(400).json({
                status: 'error',
                message: 'Verification code expired'
            });
        }
        // Check verification code
        if (deviceVerification.verificationCode !== verificationCode) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid verification code'
            });
        }
        // Check device requirements
        if (!deviceVerification.meetsMinimumRequirements()) {
            deviceVerification.status = 'rejected';
            yield deviceVerification.save();
            return res.status(400).json({
                status: 'error',
                message: 'Device does not meet minimum requirements',
                requirements: {
                    android: {
                        minVersion: '8.0',
                        minRam: '4GB',
                        minStorage: '4GB'
                    },
                    ios: {
                        minVersion: '13.0',
                        supportedDevices: ['iPhone 8', 'iPhone X', 'iPad 6th gen']
                    }
                }
            });
        }
        // Verify device
        deviceVerification.verify();
        yield deviceVerification.save();
        res.json({
            status: 'success',
            message: 'Device verified successfully',
            deviceVerification
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error verifying device',
            error: error.message
        });
    }
}));
// Get device verification status
router.get('/valorant-mobile/verify-device/status/:deviceId', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if device is blacklisted
        const isBlacklisted = yield DeviceBlacklist_1.DeviceBlacklist.isBlacklisted(req.params.deviceId, 'valorant-mobile');
        if (isBlacklisted) {
            const blacklist = yield DeviceBlacklist_1.DeviceBlacklist.findOne({
                deviceId: req.params.deviceId,
                gameId: 'valorant-mobile'
            });
            return res.status(403).json({
                status: 'error',
                message: 'Device is blacklisted',
                blacklist: {
                    reason: blacklist.reason,
                    expiresAt: blacklist.expiresAt,
                    appealStatus: blacklist.appealStatus,
                    canAppeal: blacklist.canAppeal()
                }
            });
        }
        const deviceVerification = yield DeviceVerification_1.DeviceVerification.findOne({
            deviceId: req.params.deviceId,
            gameId: 'valorant-mobile',
            userId: req.user._id
        });
        if (!deviceVerification) {
            return res.status(404).json({
                status: 'error',
                message: 'Device verification not found'
            });
        }
        res.json({
            status: 'success',
            deviceVerification
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error getting device verification status',
            error: error.message
        });
    }
}));
// Revoke device verification
router.post('/valorant-mobile/verify-device/revoke', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deviceId } = req.body;
        const deviceVerification = yield DeviceVerification_1.DeviceVerification.findOne({
            deviceId,
            gameId: 'valorant-mobile',
            userId: req.user._id
        });
        if (!deviceVerification) {
            return res.status(404).json({
                status: 'error',
                message: 'Device verification not found'
            });
        }
        deviceVerification.isVerified = false;
        deviceVerification.status = 'pending';
        yield deviceVerification.save();
        res.json({
            status: 'success',
            message: 'Device verification revoked',
            deviceVerification
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error revoking device verification',
            error: error.message
        });
    }
}));
exports.default = router;
