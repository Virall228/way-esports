import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { connectDB, disconnectDB } from './config/db';
import { startSchedulers } from './services/scheduler';
import { startWorkers } from './services/queue';

// Import routes
import matchesRouter from './routes/matches';
import teamsRouter from './routes/teams';
import profileRouter from './routes/profile';
import walletRouter from './routes/wallet';
import tournamentsRouter from './routes/tournaments';
import rankingsRouter from './routes/rankings';
import rewardsRouter from './routes/rewards';
import authRouter from './routes/auth';

const app = express();

// Security middleware
app.use(cors({
  origin: config.cors.origin || '*',
  credentials: true
}));

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

// API Routes
app.use('/api/matches', matchesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api/rewards', rewardsRouter);
app.use('/api/auth', authRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Swagger UI (serves /api-docs) - only in development
if (process.env.NODE_ENV !== 'production') {
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

// Routes
app.use('/api/matches', matchesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api', rankingsRouter);
app.use('/api/rewards', rewardsRouter);
// Queue control (minimal): enqueue bulk registration
app.post('/api/tasks/bulk-register', async (req, res) => {
  try {
    const { tournamentId, teamIds } = req.body || {};
    if (!tournamentId || !Array.isArray(teamIds) || !teamIds.length) {
      return res.status(400).json({ success: false, error: 'tournamentId and teamIds[] required' });
    }
    await addTask('bulkRegisterTeams', { tournamentId, teamIds });
    res.status(202).json({ success: true, queued: teamIds.length });
  } catch (err) {
    console.error('Error enqueue bulk register', err);
    res.status(500).json({ success: false, error: 'Failed to enqueue task' });
  }
});

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
    await connectDB();
    console.log('✅ MongoDB connected');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API on http://0.0.0.0:${PORT}`);
    });

    // Start background schedulers (registration close, tournament completion, stale matches)
    startSchedulers();

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    });

    // Обработка ошибок сервера
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') throw error;
      
      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
      
      // Обработка специфических ошибок
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

    // Обработка завершения приложения
    const shutdown = async () => {
      console.log('🛑 Received shutdown signal. Gracefully shutting down...');
      
      // Даем время на завершение текущих запросов
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

      // Принудительное завершение, если сервер не завершился за 10 секунд
      setTimeout(() => {
        console.error('⚠️ Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Обработка сигналов завершения
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    // Обработка необработанных исключений
    process.on('uncaughtException', (error) => {
      console.error('🔥 Uncaught Exception:', error);
      shutdown();
    });

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

start();
