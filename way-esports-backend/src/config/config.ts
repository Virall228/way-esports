import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  TELEGRAM_BOT_TOKEN: string;
  CORS_ORIGIN: string;
  MAX_FILE_SIZE: number;
}

const config: Config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/way-esports',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5000000', 10) // 5MB
};

// Validate required environment variables
const requiredEnvVars: (keyof Config)[] = ['MONGODB_URI', 'JWT_SECRET', 'TELEGRAM_BOT_TOKEN'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export default config; 