const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/way-esports')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Test referral endpoint
app.get('/api/referrals/stats', (req, res) => {
  res.json({
    isSubscribed: false,
    subscriptionExpiresAt: null,
    freeEntriesCount: 2,
    referralCode: 'TEST123',
    referralsMade: 0,
    referralStats: {
      totalReferrals: 0,
      pendingReferrals: 0,
      completedReferrals: 0,
      totalEarned: 0
    }
  });
});

// Test settings endpoint
app.get('/api/referrals/settings', (req, res) => {
  res.json({
    subscriptionPrice: 9.99,
    referralBonusThreshold: 3,
    refereeBonus: 1,
    referrerBonus: 1
  });
});

// Test tournaments endpoint
app.get('/api/tournaments', (req, res) => {
  res.json({
    tournaments: [
      {
        id: '1',
        name: 'Test Tournament',
        game: 'CS2',
        status: 'upcoming',
        startDate: new Date().toISOString(),
        prizePool: 1000,
        participants: 5,
        maxParticipants: 10
      }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
