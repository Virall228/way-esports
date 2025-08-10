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
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Ban a user (Admin)
router.put('/users/:id/ban', auth_1.auth, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findByIdAndUpdate(req.params.id, { isBanned: true }, { new: true });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        res.send(user);
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
// Unban a user (Admin)
router.put('/users/:id/unban', auth_1.auth, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findByIdAndUpdate(req.params.id, { isBanned: false }, { new: true });
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        res.send(user);
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
// Получить историю достижений пользователя
router.get('/users/:id/achievements', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findById(req.params.id).populate('achievementHistory.achievement');
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        res.send(user.achievementHistory);
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
// Начислить достижение пользователю (админ/тест)
router.post('/users/:id/achievements/:achievementId', auth_1.auth, auth_1.admin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        const added = yield user.addAchievement(req.params.achievementId);
        if (added) {
            res.send({ success: true, message: 'Achievement added' });
        }
        else {
            res.send({ success: false, message: 'User already has this achievement' });
        }
    }
    catch (error) {
        res.status(500).send(error);
    }
}));
exports.default = router;
