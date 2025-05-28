const router = require('express').Router();
const User = require('../models/User');
const Team = require('../models/Team');

// Get user profile
router.get('/:telegramId', async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.params.telegramId })
            .populate('teams')
            .populate('tournaments.tournament');
        if (!user) {
            return res.status(404).json('User not found');
        }
        res.json(user);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Create or update user
router.post('/auth', async (req, res) => {
    try {
        const { telegramId, username, firstName, lastName } = req.body;
        
        let user = await User.findOne({ telegramId });
        
        if (user) {
            // Update existing user
            user.username = username;
            user.firstName = firstName;
            user.lastName = lastName;
        } else {
            // Create new user
            user = new User({
                telegramId,
                username,
                firstName,
                lastName
            });
        }
        
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Update wallet address
router.put('/:telegramId/wallet', async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.params.telegramId });
        if (!user) {
            return res.status(404).json('User not found');
        }

        user.wallet.address = req.body.address;
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Get user's teams
router.get('/:telegramId/teams', async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.params.telegramId });
        if (!user) {
            return res.status(404).json('User not found');
        }

        const teams = await Team.find({ 'players.user': user._id })
            .populate('captain', 'username')
            .populate('players.user', 'username');
        res.json(teams);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Get user's tournaments
router.get('/:telegramId/tournaments', async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.params.telegramId })
            .populate('tournaments.tournament');
        if (!user) {
            return res.status(404).json('User not found');
        }
        res.json(user.tournaments);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

// Get user's achievements
router.get('/:telegramId/achievements', async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.params.telegramId })
            .populate('achievements.tournament');
        if (!user) {
            return res.status(404).json('User not found');
        }
        res.json(user.achievements);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

module.exports = router; 