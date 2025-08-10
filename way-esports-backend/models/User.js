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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Team_1 = require("./Team");
const UserSchema = new mongoose_1.Schema({
    telegramId: {
        type: Number,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        sparse: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Invalid email format',
        },
    },
    password: {
        type: String,
        minlength: 8,
        select: false,
    },
    photoUrl: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'developer'],
        default: 'user',
    },
    isBanned: {
        type: Boolean,
        default: false,
    },
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        tournamentsPlayed: { type: Number, default: 0 },
        tournamentsWon: { type: Number, default: 0 },
    },
    achievements: [String],
    tokens: [
        {
            token: {
                type: String,
                required: true,
            },
        },
    ],
    achievementHistory: [
        {
            achievement: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'Achievement',
                required: true
            },
            receivedAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
}, {
    timestamps: true,
});
// Hash password before saving
UserSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        if (user.isModified('password') && user.password) {
            user.password = yield bcryptjs_1.default.hash(user.password, 8);
        }
        next();
    });
});
// Generate JWT token
UserSchema.methods.generateAuthToken = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        const token = jsonwebtoken_1.default.sign({ _id: user._id.toString() }, process.env.JWT_SECRET || 'your-secret-key', {
            expiresIn: '7d',
        });
        user.tokens = user.tokens.concat({ token });
        yield user.save();
        return token;
    });
};
// Get user's team
UserSchema.methods.getTeam = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        const team = yield Team_1.Team.findOne({
            'players.userId': user._id,
        });
        return team;
    });
};
// Добавить достижение пользователю
UserSchema.methods.addAchievement = function (achievementId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.achievementHistory.some((a) => a.achievement.toString() === achievementId)) {
            return false;
        }
        this.achievementHistory.push({ achievement: achievementId, receivedAt: new Date() });
        yield this.save();
        return true;
    });
};
// Remove sensitive data when converting to JSON
UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.tokens;
    return userObject;
};
// Virtual for win rate
UserSchema.virtual('winRate').get(function () {
    const totalGames = this.stats.wins + this.stats.losses;
    return totalGames > 0 ? (this.stats.wins / totalGames) * 100 : 0;
});
exports.User = mongoose_1.default.model('User', UserSchema);
