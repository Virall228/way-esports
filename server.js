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
const Tournament = require('./models/Tournament');

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

// Tournament Routes
app.post('/api/tournaments', authenticateUser, async (req, res) => {
  try {
    const tournament = new Tournament({
      ...req.body,
      organizer: req.headers['x-telegram-user-id']
    });
    await tournament.save();
    res.status(201).json(tournament);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/tournaments', authenticateUser, async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .sort({ startDate: -1 });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tournaments/:id', authenticateUser, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tournaments/:id/register', authenticateUser, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    if (tournament.registeredTeams.length >= tournament.maxTeams) {
      return res.status(400).json({ error: 'Tournament is full' });
    }

    const newTeam = {
      name: req.body.teamName,
      players: req.body.players,
      seed: tournament.registeredTeams.length + 1
    };

    tournament.registeredTeams.push(newTeam);
    await tournament.save();
    res.json(tournament);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/tournaments/:id/start', authenticateUser, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({ error: 'Tournament has already started' });
    }

    if (tournament.registeredTeams.length < 2) {
      return res.status(400).json({ error: 'Not enough teams registered' });
    }

    tournament.status = 'in_progress';
    tournament.generateBracket();
    await tournament.save();
    res.json(tournament);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/tournaments/:id/matches/update', authenticateUser, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const { roundNumber, matchIndex, team1Score, team2Score } = req.body;
    const match = tournament.bracket.rounds[roundNumber - 1].matches[matchIndex];
    
    match.team1.score = team1Score;
    match.team2.score = team2Score;
    match.status = 'completed';
    
    const winner = team1Score > team2Score ? match.team1.name : match.team2.name;
    tournament.updateBracket(roundNumber, matchIndex, winner);
    
    // Check if tournament is completed
    const finalRound = tournament.bracket.rounds[tournament.bracket.rounds.length - 1];
    if (finalRound.matches[0].status === 'completed') {
      tournament.status = 'completed';
      
      // Update winner's stats
      const winningTeam = tournament.registeredTeams.find(team => team.name === winner);
      if (winningTeam) {
        for (const playerId of winningTeam.players) {
          await User.findOneAndUpdate(
            { telegramId: playerId },
            { 
              $inc: { 
                'stats.wins': 1,
                'stats.tournamentParticipation': 1
              }
            }
          );
        }
      }
    }

    await tournament.save();
    res.json(tournament);
  } catch (error) {
    res.status(400).json({ error: error.message });
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