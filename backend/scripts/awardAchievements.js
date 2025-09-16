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
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const Achievement_1 = require("../models/Achievement");
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default.connect(process.env.MONGODB_URI || '', { useNewUrlParser: true, useUnifiedTopology: true });
    const achievements = yield Achievement_1.Achievement.find();
    const users = yield User_1.User.find();
    for (const user of users) {
        for (const achievement of achievements) {
            const { type, value } = achievement.condition;
            let eligible = false;
            if (type === 'wins' && user.stats.wins >= value)
                eligible = true;
            if (type === 'tournaments' && user.stats.tournamentsPlayed >= value)
                eligible = true;
            if (type === 'first_place' && user.stats.tournamentsWon >= value)
                eligible = true;
            // Можно добавить другие условия
            if (eligible) {
                const added = yield user.addAchievement(achievement._id);
                if (added) {
                    console.log(`Achievement '${achievement.name}' awarded to user ${user.username}`);
                }
            }
        }
    }
    yield mongoose_1.default.disconnect();
    console.log('Achievement awarding complete.');
}))();
