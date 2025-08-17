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
const Reward_1 = require("../models/Reward");
const PlayerReward_1 = require("../models/PlayerReward");
const TeamReward_1 = require("../models/TeamReward");
const router = express_1.default.Router();
// Get available rewards for player
router.get('/valorant-mobile/rewards/available', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rewards = yield Reward_1.Reward.find({
            gameId: 'valorant-mobile',
            isActive: true,
            $or: [
                { expiresAt: { $gt: new Date() } },
                { expiresAt: null }
            ]
        });
        res.json({
            status: 'success',
            rewards
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error fetching available rewards',
            error: error.message
        });
    }
}));
// Get player's rewards
router.get('/valorant-mobile/rewards/player', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerRewards = yield PlayerReward_1.PlayerReward.find({
            userId: req.user._id,
            gameId: 'valorant-mobile'
        })
            .populate('rewardId')
            .sort({ earnedAt: -1 });
        res.json({
            status: 'success',
            rewards: playerRewards
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error fetching player rewards',
            error: error.message
        });
    }
}));
// Get team's rewards
router.get('/valorant-mobile/rewards/team/:teamId', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const teamRewards = yield TeamReward_1.TeamReward.find({
            teamId: req.params.teamId,
            gameId: 'valorant-mobile',
            'distribution.userId': req.user._id
        })
            .populate('rewardId')
            .sort({ earnedAt: -1 });
        res.json({
            status: 'success',
            rewards: teamRewards
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error fetching team rewards',
            error: error.message
        });
    }
}));
// Withdraw currency reward
router.post('/valorant-mobile/rewards/player/withdraw/:rewardId', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount } = req.body;
        const playerReward = yield PlayerReward_1.PlayerReward.findOne({
            userId: req.user._id,
            rewardId: req.params.rewardId,
            gameId: 'valorant-mobile',
            status: 'earned'
        }).populate('rewardId');
        if (!playerReward) {
            return res.status(404).json({
                status: 'error',
                message: 'Reward not found or cannot be withdrawn'
            });
        }
        if (playerReward.rewardId.type !== 'currency' || !playerReward.rewardId.currencyDetails) {
            return res.status(400).json({
                status: 'error',
                message: 'This reward does not support withdrawals'
            });
        }
        const validation = playerReward.rewardId.validateWithdrawal(amount);
        if (!validation.valid) {
            return res.status(400).json({
                status: 'error',
                message: validation.message
            });
        }
        const withdrawalFee = playerReward.rewardId.calculateWithdrawalFee(amount);
        const netAmount = amount - withdrawalFee;
        // Update reward balance
        playerReward.rewardId.currencyDetails.amount -= amount;
        yield playerReward.rewardId.save();
        // If balance is 0, mark as claimed
        if (playerReward.rewardId.currencyDetails.amount === 0) {
            playerReward.status = 'claimed';
            playerReward.claimedAt = new Date();
            yield playerReward.save();
        }
        // TODO: Integrate with payment processing service
        // This is where you would integrate with your payment processing service
        // to actually send the money to the user's account
        res.json({
            status: 'success',
            message: 'Withdrawal processed successfully',
            withdrawal: {
                amount,
                fee: withdrawalFee,
                netAmount,
                timestamp: new Date(),
            }
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error processing withdrawal',
            error: error.message
        });
    }
}));
// Claim player reward
router.post('/valorant-mobile/rewards/player/claim/:rewardId', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const playerReward = yield PlayerReward_1.PlayerReward.findOne({
            userId: req.user._id,
            rewardId: req.params.rewardId,
            gameId: 'valorant-mobile',
            status: 'earned'
        }).populate('rewardId');
        if (!playerReward) {
            return res.status(404).json({
                status: 'error',
                message: 'Reward not found or cannot be claimed'
            });
        }
        playerReward.claim();
        yield playerReward.save();
        res.json({
            status: 'success',
            message: 'Reward claimed successfully',
            reward: playerReward
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error claiming reward',
            error: error.message
        });
    }
}));
// Claim team reward share
router.post('/valorant-mobile/rewards/team/claim/:rewardId', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const teamReward = yield TeamReward_1.TeamReward.findOne({
            rewardId: req.params.rewardId,
            gameId: 'valorant-mobile',
            'distribution.userId': req.user._id,
            status: 'earned'
        }).populate('rewardId');
        if (!teamReward) {
            return res.status(404).json({
                status: 'error',
                message: 'Team reward not found or cannot be claimed'
            });
        }
        teamReward.claimShare(req.user._id);
        yield teamReward.save();
        res.json({
            status: 'success',
            message: 'Team reward share claimed successfully',
            reward: teamReward
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error claiming team reward share',
            error: error.message
        });
    }
}));
// Admin routes
// Create new reward
router.post('/valorant-mobile/rewards', adminAuth_1.adminAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reward = new Reward_1.Reward(Object.assign(Object.assign({}, req.body), { gameId: 'valorant-mobile' }));
        yield reward.save();
        res.status(201).json({
            status: 'success',
            message: 'Reward created successfully',
            reward
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error creating reward',
            error: error.message
        });
    }
}));
// Update reward
router.put('/valorant-mobile/rewards/:rewardId', adminAuth_1.adminAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reward = yield Reward_1.Reward.findByIdAndUpdate(req.params.rewardId, Object.assign(Object.assign({}, req.body), { gameId: 'valorant-mobile' }), { new: true });
        if (!reward) {
            return res.status(404).json({
                status: 'error',
                message: 'Reward not found'
            });
        }
        res.json({
            status: 'success',
            message: 'Reward updated successfully',
            reward
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error updating reward',
            error: error.message
        });
    }
}));
// Grant reward to player
router.post('/valorant-mobile/rewards/grant/player', adminAuth_1.adminAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, rewardId, expiresAt } = req.body;
        const playerReward = new PlayerReward_1.PlayerReward({
            userId,
            rewardId,
            gameId: 'valorant-mobile',
            expiresAt
        });
        yield playerReward.save();
        res.status(201).json({
            status: 'success',
            message: 'Reward granted to player successfully',
            reward: playerReward
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error granting reward to player',
            error: error.message
        });
    }
}));
// Grant reward to team
router.post('/valorant-mobile/rewards/grant/team', adminAuth_1.adminAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { teamId, rewardId, distribution, expiresAt } = req.body;
        const teamReward = new TeamReward_1.TeamReward({
            teamId,
            rewardId,
            gameId: 'valorant-mobile',
            distribution,
            expiresAt
        });
        yield teamReward.save();
        res.status(201).json({
            status: 'success',
            message: 'Reward granted to team successfully',
            reward: teamReward
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Error granting reward to team',
            error: error.message
        });
    }
}));
exports.default = router;
