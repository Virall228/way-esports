require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Models
const Match = require('./models/Match');
const User = require('./models/User');

// Telegram Bot Setup
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Authentication Middleware
const authenticateUser = async (req, res, next) => {
  const initData = req.headers['x-telegram-init-data'];
  if (!initData) {
    return res.status(401).json({ error: 'No authentication data' });
  }
  // In a production environment, you should verify the initData
  // using Telegram's guidelines for Mini Apps
  next();
};

// Bot commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    // Create or update user profile
    const user = await User.findOneAndUpdate(
      { telegramId: msg.from.id.toString() },
      {
        telegramId: msg.from.id.toString(),
        username: msg.from.username || 'Anonymous',
        lastActive: new Date()
      },
      { upsert: true, new: true }
    );
    bot.sendMessage(chatId, 'Welcome to WAY Esports! Click the menu button to open the Mini App.');
  } catch (error) {
    console.error('Error creating user profile:', error);
    bot.sendMessage(chatId, 'Welcome! There was an error setting up your profile. Please try again later.');
  }
});

// User Profile Routes
app.get('/api/profile/:telegramId', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/profile/:telegramId', authenticateUser, async (req, res) => {
  try {
    const allowedUpdates = ['nickname', 'favoriteGames'];
    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const user = await User.findOneAndUpdate(
      { telegramId: req.params.telegramId },
      { ...updates, lastActive: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Match Routes
app.get('/api/matches', authenticateUser, async (req, res) => {
  try {
    const matches = await Match.find();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/matches', authenticateUser, async (req, res) => {
  try {
    const match = new Match(req.body);
    await match.save();
    res.status(201).json(match);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Stats Routes
app.get('/api/stats/:telegramId', authenticateUser, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 
