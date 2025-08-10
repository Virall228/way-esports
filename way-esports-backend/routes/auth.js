const express = require('express');
const router = express.Router();
const User = require('../models/User');
const validateTelegramWebAppData = require('../middleware/telegramAuth');

// Login/Register route for Telegram WebApp users
router.post('/login', validateTelegramWebAppData, async (req, res) => {
    try {
        const telegramUser = req.telegramUser;

        // Find or create user
        let user = await User.findOne({ telegramId: telegramUser.id });
        
        if (!user) {
            // Create new user
            user = new User({
                telegramId: telegramUser.id,
                firstName: telegramUser.first_name,
                lastName: telegramUser.last_name,
                username: telegramUser.username,
                photoUrl: telegramUser.photo_url,
                languageCode: telegramUser.language_code
            });
            await user.save();
        } else {
            // Update user info
            user.firstName = telegramUser.first_name;
            user.lastName = telegramUser.last_name;
            user.username = telegramUser.username;
            user.photoUrl = telegramUser.photo_url;
            user.languageCode = telegramUser.language_code;
            user.lastActive = new Date();
            await user.save();
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                telegramId: user.telegramId,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                photoUrl: user.photoUrl,
                role: user.role,
                wallet: {
                    balance: user.wallet.balance
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error during login process'
        });
    }
});

// Get current user info
router.get('/me', validateTelegramWebAppData, async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.telegramUser.id });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                telegramId: user.telegramId,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                photoUrl: user.photoUrl,
                role: user.role,
                wallet: {
                    balance: user.wallet.balance
                }
            }
        });
    } catch (error) {
        console.error('Get user info error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user information'
        });
    }
});

module.exports = router; 