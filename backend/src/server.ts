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

// Mongo client options can be tuned via URI (e.g., maxPoolSize)
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

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

// DB health endpoint
app.get('/health/db', (_req, res) => {
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  res.json({ ok: mongoose.connection.readyState === 1, state: states[mongoose.connection.readyState] });
});

// Error handling
app.use(errorHandler);

// Handle unhandled routes (catch-all without path pattern - Express 5.x compatible)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server ONLY after successful DB connect
const PORT: number = typeof config.port === 'string' ? parseInt(config.port, 10) : Number(config.port) || 3000;

async function start() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log('✅ MongoDB connected');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API on http://0.0.0.0:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      try {
        console.log(`\n${signal} received. Shutting down...`);
        await mongoose.connection.close();
        server.close(() => {
          console.log('HTTP server closed');
          process.exit(0);
        });
      } catch (e) {
        console.error('Error during shutdown', e);
        process.exit(1);
      }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  }
}

start();
