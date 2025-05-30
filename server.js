const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Telegram Bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { webHook: { port: process.env.PORT } });
bot.setWebHook(`${process.env.BOT_WEBHOOK_URL}/webhook/${process.env.TELEGRAM_BOT_TOKEN}`);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/way-esports', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('MongoDB database connection established successfully');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Import routes
const authRouter = require('./routes/auth');
const tournamentsRouter = require('./routes/tournaments');
const usersRouter = require('./routes/users');
const teamsRouter = require('./routes/teams');
const paymentsRouter = require('./routes/payments');
const webhookRouter = require('./routes/webhook');

// Import middleware
const validateTelegramWebAppData = require('./middleware/telegramAuth');

// Routes
app.use('/api/auth', authRouter);
app.use('/api/tournaments', validateTelegramWebAppData, tournamentsRouter);
app.use('/api/users', validateTelegramWebAppData, usersRouter);
app.use('/api/teams', validateTelegramWebAppData, teamsRouter);
app.use('/api/payments', validateTelegramWebAppData, paymentsRouter);
app.use('/webhook', webhookRouter);

// Serve static files
app.use('/public', express.static('public'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
}); 