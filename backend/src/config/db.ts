import mongoose from 'mongoose';
import { config } from './index';

export async function connectDB(uri?: string) {
  const mongoUri = uri || config.mongoUri;
  if (!mongoUri) throw new Error('MongoDB URI is not provided');
  await mongoose.connect(mongoUri);
  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
