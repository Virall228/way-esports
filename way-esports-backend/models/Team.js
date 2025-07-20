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
exports.Team = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const PlayerSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
});
const TeamSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50,
    },
    tag: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 2,
        maxlength: 5,
        uppercase: true,
    },
    logo: {
        type: String,
        required: true,
    },
    game: {
        type: String,
        required: true,
    },
    players: [PlayerSchema],
    captain: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    stats: {
        wins: { type: Number, default: 0 },
        losses: { type: Number, default: 0 },
        tournamentsPlayed: { type: Number, default: 0 },
        tournamentsWon: { type: Number, default: 0 },
    },
    achievements: [String],
}, {
    timestamps: true,
});
// Validate maximum players
TeamSchema.pre('save', function (next) {
    if (this.players.length > 7) {
        next(new Error('Team cannot have more than 7 players'));
    }
    next();
});
// Method to add player
TeamSchema.methods.addPlayer = function (userId, role) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.players.some((p) => p.userId.equals(userId))) {
            throw new Error('Player already in team');
        }
        this.players.push({
            userId,
            role,
            joinedAt: new Date(),
            isActive: true,
        });
        yield this.save();
    });
};
// Method to remove player
TeamSchema.methods.removePlayer = function (userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const playerIndex = this.players.findIndex((p) => p.userId.equals(userId));
        if (playerIndex === -1) {
            throw new Error('Player not found in team');
        }
        if (this.captain.equals(userId)) {
            throw new Error('Cannot remove team captain');
        }
        this.players.splice(playerIndex, 1);
        yield this.save();
    });
};
// Method to update team stats
TeamSchema.methods.updateStats = function (won_1) {
    return __awaiter(this, arguments, void 0, function* (won, tournamentCompleted = false) {
        if (won) {
            this.stats.wins += 1;
        }
        else {
            this.stats.losses += 1;
        }
        if (tournamentCompleted) {
            this.stats.tournamentsPlayed += 1;
            if (won) {
                this.stats.tournamentsWon += 1;
            }
        }
        yield this.save();
    });
};
// Virtual for win rate
TeamSchema.virtual('winRate').get(function () {
    const totalGames = this.stats.wins + this.stats.losses;
    return totalGames > 0 ? (this.stats.wins / totalGames) * 100 : 0;
});
exports.Team = mongoose_1.default.model('Team', TeamSchema);
