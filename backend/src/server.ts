import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { authenticateJWT, isAdmin } from './middleware/auth';
import { apiLimiter } from './middleware/rateLimiter';
import { connectDB, disconnectDB } from './config/db';
import { startSchedulers } from './services/scheduler';
import { startWorkers } from './services/queue';
import { getMetricsSnapshot, requestMetricsMiddleware, startMonitoring } from './services/monitoringService';

// Import routes
import matchesRouter from './routes/matches';
import teamsRouter from './routes/teams';
import profileRouter from './routes/profile';
import walletRouter from './routes/wallet';
import tournamentsRouter from './routes/tournaments';
import rankingsRouter from './routes/rankings';
import rewardsRouter from './routes/rewards';
import authRouter from './routes/auth';
import newsRouter from './routes/news';
import achievementsRouter from './routes/achievements';
import searchRouter from './routes/search';
import prizesRouter from './routes/prizes';
import referralsRouter from './routes/referrals';
import termsRouter from './routes/terms';
import adminRouter from './routes/admin';
import uploadsRouter from './routes/uploads';
import refundsRouter from './routes/refunds';
import statsRouter from './routes/stats';
import contactRouter from './routes/contact';
import analyticsRouter from './routes/analytics';
import usersRouter from './routes/users';
import tasksRouter from './routes/tasks';
import tournamentRoomsRouter from './routes/tournamentRooms';

import { seedDefaultAchievements } from './services/achievements/seedAchievements';

const app = express();
const PORT = typeof config.port === 'string' ? parseInt(config.port, 10) : config.port;
const PORT_NUMBER = Number.isFinite(PORT) ? PORT : 3000;

// Security middleware - CORS configuration for Telegram Mini App
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, or Telegram Mini App)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = config.cors.origin === '*'
      ? true
      : config.cors.origin.split(',').map(o => o.trim());

    // Allow all origins if configured as '*'
    if (allowedOrigins === true) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Always allow Telegram WebApp origins
    if (origin.includes('telegram.org') || origin.includes('t.me')) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-Data', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting
app.use(apiLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
app.use(requestMetricsMiddleware);

// API Routes
app.use('/api/matches', matchesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/wallet', authenticateJWT, walletRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api', rankingsRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/search', searchRouter);
app.use('/api/auth', authRouter);
app.use('/api/news', newsRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/prizes', prizesRouter);
app.use('/api/referrals', referralsRouter);
app.use('/api/terms', termsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/uploads', uploadsRouter);
app.use('/api/refunds', authenticateJWT, refundsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/tournament-rooms', tournamentRoomsRouter);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/live', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health/ready', (_req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  if (!mongoConnected) {
    return res.status(503).json({
      status: 'degraded',
      mongo: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }

  return res.json({
    status: 'ok',
    mongo: 'connected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/metrics', (req, res) => {
  const expectedApiKey = (process.env.METRICS_API_KEY || '').trim();
  if (expectedApiKey) {
    const providedApiKey = (req.header('x-metrics-key') || '').trim();
    if (providedApiKey !== expectedApiKey) {
      return res.status(401).json({ success: false, error: 'Unauthorized metrics access' });
    }
  }

  return res.json(getMetricsSnapshot());
});

// Swagger UI (serves /api-docs)
const openapiCandidates = [
  path.join(__dirname, 'docs', 'openapi.json'),
  path.join(process.cwd(), 'dist', 'src', 'docs', 'openapi.json'),
  path.join(process.cwd(), 'src', 'docs', 'openapi.json'),
  path.join(process.cwd(), 'docs', 'openapi.json')
];

let openapiSpec: any = { openapi: '3.0.3', info: { title: 'WAY-Esports API', version: '1.0.0' } };

for (const candidate of openapiCandidates) {
  if (fs.existsSync(candidate)) {
    try {
      openapiSpec = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
      break;
    } catch (err) {
      console.error('Failed to read OpenAPI spec:', err);
    }
  }
}
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Logging
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode');
} else {
  console.log('Production mode');
}
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path
  });
});

// Error handling middleware
app.use(errorHandler);

async function start() {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB connected');
    } else {
      console.warn('⚠️ MongoDB is not connected. API is running in degraded mode.');
    }

    try {
      await seedDefaultAchievements();
    } catch (seedError) {
      console.error('⚠️ Failed to seed default achievements:', seedError);
    }

    // Start background workers
    try {
      console.log('Starting background workers...');
      startWorkers();
      startSchedulers();
      startMonitoring();
    } catch (workerError) {
      console.error('⚠️ Failed to start background workers:', workerError);
    }

    const server = app.listen(PORT_NUMBER, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT_NUMBER}`);
      console.log(`📚 API Documentation: http://localhost:${PORT_NUMBER}/api-docs`);
      console.log(`🌐 Health check: http://localhost:${PORT_NUMBER}/api/health`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') throw error;

      const bind = 'Port ' + PORT_NUMBER;

      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use');
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('🛑 Received shutdown signal. Gracefully shutting down...');

      // Give time for current requests to complete
      server.close(async () => {
        console.log('🔌 Server closed');

        try {
          await disconnectDB();
          console.log('✅ MongoDB connection closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️ Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle termination signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('🔥 Uncaught Exception:', error);
      shutdown();
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown();
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await disconnectDB();
    process.exit(1);
  }
}

// Start the server
start();
