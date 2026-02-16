import mongoose from 'mongoose';
import { config } from './index';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function connectDB(uri?: string) {
  const mongoUri = uri || config.mongoUri;
  
  if (!mongoUri) {
    throw new Error('MongoDB URI is not provided');
  }

  const retries = Math.max(1, Number(process.env.MONGO_CONNECT_RETRIES || 8));
  const retryDelayMs = Math.max(500, Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS || 3000));
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      });
      
      console.log(`Successfully connected to MongoDB (attempt ${attempt}/${retries})`);
      return mongoose.connection;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection error (attempt ${attempt}/${retries}):`, error);

      if (attempt < retries) {
        await wait(retryDelayMs);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('MongoDB connection failed after retries');
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    throw error;
  }
}

// Обработка событий подключения
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Обработка завершения приложения
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});
