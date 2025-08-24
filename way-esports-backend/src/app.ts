import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config';
import tournamentRoutes from './routes/tournaments';
// Routes will be added later
import subscriptionRoutes from '../routes/subscriptions';
// ... other imports

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Telegram SDK Auth Token Middleware
const TELEGRAM_SDK_AUTH_TOKEN = 'eyJhcHBfbmFtZSI6IldBWUUiLCJhcHBfdXJsIjoiaHR0cHM6Ly90Lm1lL1dBWUVzcG9ydHNfYm90IiwiYXBwX2RvbWFpbiI6Imh0dHBzOi8vd2F5ZXNwb3J0cy1hcHAubmV0bGlmeS5hcHAifQ==!cdtiWsDWKPJbeLJVlU5ZxoMg8mtf0JmKBppjIop29mM=';

app.use('/api', (req, res, next) => {
  const token = req.headers['x-telegram-sdk-auth'];
  if (token !== TELEGRAM_SDK_AUTH_TOKEN) {
    return res.status(401).json({ error: 'Invalid or missing Telegram SDK Auth Token' });
  }
  next();
});

// Routes
app.use('/api/tournaments', tournamentRoutes);
// Other routes will be added later

// Connect to MongoDB
mongoose.connect(config.mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

export default app; 