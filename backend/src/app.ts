import express from 'express';
import cors from 'cors';
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

// Swagger UI
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
const openapiPath = path.join(__dirname, 'docs', 'openapi.json');
const openapi = fs.existsSync(openapiPath) ? JSON.parse(fs.readFileSync(openapiPath, 'utf-8')) : { openapi: '3.0.3', info: { title: 'WAY-Esports API', version: '1.0.0' } };
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi));

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