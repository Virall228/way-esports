import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Import routes
import matchesRouter from './routes/matches';
import teamsRouter from './routes/teams';
import profileRouter from './routes/profile';
import walletRouter from './routes/wallet';

const app = express();

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Security middleware

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(apiLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode');
} else {
  console.log('Production mode');
}

// Routes
app.use('/api/matches', matchesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/wallet', walletRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(errorHandler);

// Handle unhandled routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
}); 