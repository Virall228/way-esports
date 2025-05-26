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

module.exports = router; 