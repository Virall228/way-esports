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
exports.Tournament = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const MatchSchema = new mongoose_1.Schema({
    team1: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team' },
    team2: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team' },
    score1: { type: Number, default: 0 },
    score2: { type: Number, default: 0 },
    winner: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Team' },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending',
    },
    scheduledTime: Date,
    actualStartTime: Date,
    actualEndTime: Date,
    round: { type: Number, required: true },
    matchNumber: { type: Number, required: true },
});
const BracketSchema = new mongoose_1.Schema({
    rounds: { type: Number, required: true },
    matches: [MatchSchema],
});
const TournamentSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    game: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    maxTeams: { type: Number, required: true },
    prizePool: { type: Number, required: true },
    description: { type: String, required: true },
    rules: { type: String, required: true },
    format: {
        type: String,
        enum: ['single_elimination', 'double_elimination', 'round_robin'],
        required: true,
    },
    status: {
        type: String,
        enum: ['registration', 'in_progress', 'completed', 'cancelled'],
        default: 'registration',
    },
    registeredTeams: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Team' }],
    bracket: BracketSchema,
}, {
    timestamps: true,
});
// Middleware to check dates
TournamentSchema.pre('save', function (next) {
    if (this.endDate < this.startDate) {
        next(new Error('End date must be after start date'));
    }
    next();
});
// Method to check if registration is open
TournamentSchema.methods.isRegistrationOpen = function () {
    return (this.status === 'registration' &&
        this.registeredTeams.length < this.maxTeams &&
        new Date() < this.startDate);
};
// Method to check if tournament can be started
TournamentSchema.methods.canStart = function () {
    return (this.status === 'registration' &&
        this.registeredTeams.length >= 2 &&
        new Date() >= this.startDate);
};
// Method to generate tournament bracket
TournamentSchema.methods.generateBracket = function () {
    const teams = [...this.registeredTeams];
    const rounds = Math.ceil(Math.log2(teams.length));
    const totalMatches = Math.pow(2, rounds) - 1;
    // Shuffle teams
    for (let i = teams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teams[i], teams[j]] = [teams[j], teams[i]];
    }
    // Create matches
    const matches = [];
    let matchNumber = 1;
    let currentRound = 1;
    let teamsInRound = teams.length;
    while (teamsInRound > 1) {
        for (let i = 0; i < teamsInRound; i += 2) {
            matches.push({
                team1: teams[i] || null,
                team2: teams[i + 1] || null,
                round: currentRound,
                matchNumber: matchNumber++,
                status: 'pending',
            });
        }
        teamsInRound = Math.ceil(teamsInRound / 2);
        currentRound++;
    }
    this.bracket = {
        rounds,
        matches,
    };
};
exports.Tournament = mongoose_1.default.model('Tournament', TournamentSchema);
