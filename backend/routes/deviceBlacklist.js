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
const adminAuth_1 = require("../middleware/adminAuth");
const DeviceBlacklist_1 = require("../models/DeviceBlacklist");
const DeviceVerification_1 = require("../models/DeviceVerification");
const router = express_1.default.Router();
// Add device to blacklist (admin only)
router.post('/valorant-mobile/blacklist', adminAuth_1.adminAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { deviceId, deviceModel, manufacturer, reason, expiresAt, isGlobalBan, notes } = req.body;
        // Check if device is already blacklisted
        const existingBlacklist = yield DeviceBlacklist_1.DeviceBlacklist.findOne({
            deviceId,
            gameId: 'valorant-mobile'
        });
        if (existingBlacklist) {
            return res.status(400).json({
                status: 'error',
                message: 'Device is already blacklisted'
            });
        }
        // Create blacklist entry
        const blacklist = new DeviceBlacklist_1.DeviceBlacklist({
            deviceId,
            deviceModel,
            manufacturer,
            reason,
            blacklistedBy: req.user._id,
            expiresAt,
            isGlobalBan,
            gameId: 'valorant-mobile',
            notes
        });
        yield blacklist.save();
        // Revoke any existing device verifications
        yield DeviceVerification_1.DeviceVerification.updateMany({ deviceId, gameId: 'valorant-mobile' }, {
            $set: {
                isVerified: false,
                status: 'rejected'
            }
        });
        res.status(201).json({
            status: 'success',
            message: 'Device added to blacklist',
            blacklist
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error adding device to blacklist',
            error: error.message
        });
    }
}));
// Remove device from blacklist (admin only)
router.delete('/valorant-mobile/blacklist/:deviceId', adminAuth_1.adminAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blacklist = yield DeviceBlacklist_1.DeviceBlacklist.findOneAndDelete({
            deviceId: req.params.deviceId,
            gameId: 'valorant-mobile'
        });
        if (!blacklist) {
            return res.status(404).json({
                status: 'error',
                message: 'Device not found in blacklist'
            });
        }
        res.json({
            status: 'success',
            message: 'Device removed from blacklist',
            blacklist
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error removing device from blacklist',
            error: error.message
        });
    }
}));
// Get blacklist status for device
router.get('/valorant-mobile/blacklist/status/:deviceId', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blacklist = yield DeviceBlacklist_1.DeviceBlacklist.findOne({
            deviceId: req.params.deviceId,
            gameId: 'valorant-mobile'
        });
        if (!blacklist) {
            return res.json({
                status: 'success',
                isBlacklisted: false
            });
        }
        res.json({
            status: 'success',
            isBlacklisted: !blacklist.isExpired(),
            blacklist: blacklist.isExpired() ? undefined : blacklist
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error checking blacklist status',
            error: error.message
        });
    }
}));
// Submit appeal for blacklisted device
router.post('/valorant-mobile/blacklist/appeal/:deviceId', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { appealNotes } = req.body;
        const blacklist = yield DeviceBlacklist_1.DeviceBlacklist.findOne({
            deviceId: req.params.deviceId,
            gameId: 'valorant-mobile'
        });
        if (!blacklist) {
            return res.status(404).json({
                status: 'error',
                message: 'Device not found in blacklist'
            });
        }
        if (!blacklist.canAppeal()) {
            return res.status(400).json({
                status: 'error',
                message: 'Appeal not allowed at this time',
                nextAppealDate: blacklist.appealStatus === 'rejected'
                    ? new Date(blacklist.updatedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
                    : undefined
            });
        }
        blacklist.appealStatus = 'pending';
        blacklist.appealNotes = appealNotes;
        yield blacklist.save();
        // Уведомление админу о новой апелляции (лог)
        console.log(`[APPEAL] New appeal submitted for device ${blacklist.deviceId} by user ${req.user._id}`);
        res.json({
            status: 'success',
            message: 'Appeal submitted successfully',
            blacklist
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error submitting appeal',
            error: error.message
        });
    }
}));
// Review appeal (admin only)
router.post('/valorant-mobile/blacklist/appeal/:deviceId/review', adminAuth_1.adminAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, notes } = req.body;
        const blacklist = yield DeviceBlacklist_1.DeviceBlacklist.findOne({
            deviceId: req.params.deviceId,
            gameId: 'valorant-mobile'
        });
        if (!blacklist) {
            return res.status(404).json({
                status: 'error',
                message: 'Device not found in blacklist'
            });
        }
        if (blacklist.appealStatus !== 'pending') {
            return res.status(400).json({
                status: 'error',
                message: 'No pending appeal found'
            });
        }
        blacklist.appealStatus = status;
        blacklist.appealNotes = notes;
        if (status === 'approved') {
            // If appeal is approved, set expiry to now to effectively unban
            blacklist.expiresAt = new Date();
        }
        yield blacklist.save();
        // Уведомление пользователю о решении (лог)
        console.log(`[APPEAL] Appeal for device ${blacklist.deviceId} reviewed: ${status}`);
        res.json({
            status: 'success',
            message: 'Appeal reviewed successfully',
            blacklist
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error reviewing appeal',
            error: error.message
        });
    }
}));
// Get all blacklisted devices (admin only)
router.get('/valorant-mobile/blacklist', adminAuth_1.adminAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blacklist = yield DeviceBlacklist_1.DeviceBlacklist.find({
            gameId: 'valorant-mobile'
        }).sort({ blacklistedAt: -1 });
        res.json({
            status: 'success',
            count: blacklist.length,
            blacklist
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error fetching blacklist',
            error: error.message
        });
    }
}));
exports.default = router;
