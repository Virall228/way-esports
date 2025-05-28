const router = require('express').Router();
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');
const Match = require('../models/Match');

// Get all tournaments
router.get('/', async (req, res) => {
    try {
        const tournaments = await Tournament.find()
            .populate('registeredTeams', 'name tag logo')
            .sort('-createdAt');
        res.json(tournaments);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('registeredTeams')
            .populate('matches');
        if (!tournament) {
            return res.status(404).json('Tournament not found');
        }
        res.json(tournament);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Create new tournament
router.post('/', async (req, res) => {
    try {
        const newTournament = new Tournament(req.body);
        const tournament = await newTournament.save();
        res.json(tournament);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Register team for tournament
router.post('/:id/register', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        const team = await Team.findById(req.body.teamId);

        if (!tournament || !team) {
            return res.status(404).json('Tournament or Team not found');
        }

        if (tournament.registeredTeams.length >= tournament.maxTeams) {
            return res.status(400).json('Tournament is full');
        }

        if (tournament.registeredTeams.includes(team._id)) {
            return res.status(400).json('Team already registered');
        }

        tournament.registeredTeams.push(team._id);
        await tournament.save();

        team.tournaments.push({
            tournament: tournament._id,
            status: 'registered'
        });
        await team.save();

        res.json({ message: 'Team registered successfully', tournament });
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Get tournament matches
router.get('/:id/matches', async (req, res) => {
    try {
        const matches = await Match.find({ tournament: req.params.id })
            .populate('team1.team', 'name tag logo')
            .populate('team2.team', 'name tag logo')
            .populate('winner', 'name tag')
            .sort('startTime');
        res.json(matches);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Play match
router.post('/:id/matches/:matchId/play', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ error: 'Tournament not found' });
        }

        // Find the match in the tournament bracket
        let targetMatch = null;
        let targetRound = null;

        for (const round of tournament.bracket.rounds) {
            const match = round.matches.find(m => m.matchId === req.params.matchId);
            if (match) {
                targetMatch = match;
                targetRound = round;
                break;
            }
        }

        if (!targetMatch) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Validate if match can be played
        if (targetMatch.status !== 'pending') {
            return res.status(400).json({ error: 'Match cannot be played' });
        }

        if (!targetMatch.team1.name || !targetMatch.team2.name) {
            return res.status(400).json({ error: 'Both teams must be assigned to play the match' });
        }

        // Update match status to in_progress
        targetMatch.status = 'in_progress';
        await tournament.save();

        res.json(tournament);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update tournament
router.put('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!tournament) {
            return res.status(404).json('Tournament not found');
        }
        res.json(tournament);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Delete tournament
router.delete('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findByIdAndDelete(req.params.id);
        if (!tournament) {
            return res.status(404).json('Tournament not found');
        }
        // Remove tournament references from teams
        await Team.updateMany(
            { 'tournaments.tournament': req.params.id },
            { $pull: { tournaments: { tournament: req.params.id } } }
        );
        // Delete associated matches
        await Match.deleteMany({ tournament: req.params.id });
        res.json('Tournament deleted successfully');
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Get Critical Ops tournaments
router.get('/critical-ops', async (req, res) => {
    try {
        const tournaments = await Tournament.find({ game: 'Critical Ops' })
            .populate('registeredTeams', 'name tag logo')
            .sort('-createdAt');
        res.json(tournaments);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

module.exports = router; 