const express = require('express');
const router = express.Router();
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

// Webhook endpoint for Telegram updates
router.post(`/${process.env.TELEGRAM_BOT_TOKEN}`, async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.sendStatus(200);
        }

        const chatId = message.chat.id;
        const text = message.text;

        if (text === '/start') {
            const welcomeMessage = `Welcome to WAY Esports! 🎮\n\n` +
                `Here you can:\n` +
                `🏆 Participate in tournaments\n` +
                `👥 Join or create teams\n` +
                `💰 Manage your wallet\n` +
                `📊 Track your statistics\n\n` +
                `Click the Menu button to access the Mini App!`;

            await bot.sendMessage(chatId, welcomeMessage, {
                reply_markup: {
                    keyboard: [[{
                        text: '🎮 Open Mini App',
                        web_app: { url: process.env.FRONTEND_URL }
                    }]],
                    resize_keyboard: true
                }
            });
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
});

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

module.exports = router; 