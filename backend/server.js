const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/way-esports', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const connection = mongoose.connection;
connection.once('open', () => {
    console.log('MongoDB database connection established successfully');
});

// Routes
const tournamentsRouter = require('./dist/routes/tournaments');
const usersRouter = require('./dist/routes/users');
const paymentsRouter = require('./dist/routes/payments');
const teamRoutes = require('./dist/routes/teams');
const walletRoutes = require('./dist/routes/wallet');
const rankingsRoutes = require('./dist/routes/rankings');
const contactRoutes = require('./dist/routes/contact');
const matchesRouter = require('./dist/routes/matches');

app.use('/api/tournaments', tournamentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/teams', teamRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/rankings', rankingsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/matches', matchesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
}); 