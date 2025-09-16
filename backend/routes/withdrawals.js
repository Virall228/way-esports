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
const Withdrawal_1 = require("../models/Withdrawal");
const Reward_1 = require("../models/Reward");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Request a withdrawal (User)
router.post('/withdrawals/request', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { rewardId, amount } = req.body;
    try {
        const reward = yield Reward_1.Reward.findById(rewardId);
        if (!reward) {
            return res.status(404).send({ error: 'Reward not found.' });
        }
        const validation = reward.validateWithdrawal(amount);
        if (!validation.valid) {
            return res.status(400).send({ error: validation.message });
        }
        const withdrawal = new Withdrawal_1.Withdrawal({
            user: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
            reward: rewardId,
            amount,
        });
        yield withdrawal.save();
        res.status(201).send(withdrawal);
    }
    catch (error) {
        res.status(400).send(error);
    }
}));
// Get all withdrawal requests (Admin)
router.get('/withdrawals', auth_1.auth, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const withdrawals = yield Withdrawal_1.Withdrawal.find({})
            .populate('user', 'username')
            .populate('reward', 'name');
        res.send(withdrawals);
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
// Update a withdrawal request status (Admin)
router.patch('/withdrawals/:id', auth_1.auth, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { status, rejectionReason, transactionId } = req.body;
    const allowedUpdates = ['status', 'rejectionReason', 'transactionId'];
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }
    try {
        const withdrawal = yield Withdrawal_1.Withdrawal.findById(req.params.id);
        if (!withdrawal) {
            return res.status(404).send();
        }
        updates.forEach(update => (withdrawal[update] = req.body[update]));
        if (status) {
            withdrawal.processedAt = new Date();
        }
        yield withdrawal.save();
        res.send(withdrawal);
    }
    catch (error) {
        res.status(400).send(error);
    }
}));
exports.default = router;
