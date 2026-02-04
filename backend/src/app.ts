import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import tournamentRoutes from './routes/tournaments';
import authRoutes from './routes/auth';
import prizesRoutes from './routes/prizes';
import referralsRoutes from './routes/referrals';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/prizes', prizesRoutes);
app.use('/api/referrals', referralsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve Swagger UI in development only
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const fs = require('fs');
  const openapiPath = path.join(__dirname, 'docs', 'openapi.json');
  
  if (fs.existsSync(openapiPath)) {
    const openapi = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));
  }
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Not Found',
    path: req.path
  });
});

// Error handling middleware
app.use(errorHandler);

export default app; 