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
const Tournament_1 = require("../models/Tournament");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Get all tournaments
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournaments = yield Tournament_1.Tournament.find()
            .sort({ startDate: -1 })
            .populate('registeredTeams', 'name logo');
        res.json(tournaments);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching tournaments' });
    }
}));
// Get tournament by ID
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournament = yield Tournament_1.Tournament.findById(req.params.id)
            .populate('registeredTeams', 'name logo players')
            .populate('bracket.matches.team1', 'name logo')
            .populate('bracket.matches.team2', 'name logo');
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        res.json(tournament);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching tournament' });
    }
}));
// Create new tournament (admin only)
router.post('/', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, game, startDate, endDate, maxTeams, prizePool, description, rules, format, } = req.body;
        const tournament = new Tournament_1.Tournament({
            name,
            game,
            startDate,
            endDate,
            maxTeams,
            prizePool,
            description,
            rules,
            format,
            status: 'registration',
            registeredTeams: [],
            bracket: {
                rounds: [],
                matches: [],
            },
        });
        yield tournament.save();
        res.status(201).json(tournament);
    }
    catch (error) {
        res.status(400).json({ message: 'Error creating tournament' });
    }
}));
// Update tournament (admin only)
router.put('/:id', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournament = yield Tournament_1.Tournament.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        res.json(tournament);
    }
    catch (error) {
        res.status(400).json({ message: 'Error updating tournament' });
    }
}));
// Register team for tournament
router.post('/:id/register', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournament = yield Tournament_1.Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        if (tournament.status !== 'registration') {
            return res.status(400).json({ message: 'Registration is closed' });
        }
        if (tournament.registeredTeams.length >= tournament.maxTeams) {
            return res.status(400).json({ message: 'Tournament is full' });
        }
        const { teamId } = req.body;
        if (tournament.registeredTeams.includes(teamId)) {
            return res.status(400).json({ message: 'Team already registered' });
        }
        tournament.registeredTeams.push(teamId);
        yield tournament.save();
        res.json(tournament);
    }
    catch (error) {
        res.status(400).json({ message: 'Error registering for tournament' });
    }
}));
// Start tournament (admin only)
router.post('/:id/start', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournament = yield Tournament_1.Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        if (tournament.status !== 'registration') {
            return res.status(400).json({ message: 'Tournament cannot be started' });
        }
        if (tournament.registeredTeams.length < 2) {
            return res.status(400).json({ message: 'Not enough teams registered' });
        }
        // Generate tournament bracket
        tournament.status = 'in_progress';
        tournament.bracket = generateBracket(tournament.registeredTeams);
        yield tournament.save();
        res.json(tournament);
    }
    catch (error) {
        res.status(400).json({ message: 'Error starting tournament' });
    }
}));
// Update match result
router.put('/:id/matches/:matchId', auth_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tournament = yield Tournament_1.Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }
        const { score1, score2, winner } = req.body;
        const match = tournament.bracket.matches.id(req.params.matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }
        match.score1 = score1;
        match.score2 = score2;
        match.winner = winner;
        match.status = 'completed';
        // Update tournament progress
        updateTournamentProgress(tournament);
        yield tournament.save();
        res.json(tournament);
    }
    catch (error) {
        res.status(400).json({ message: 'Error updating match result' });
    }
}));
exports.default = router;
