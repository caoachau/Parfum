import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri);
    logger.info('[mongo] connected');
  } catch (error) {
    logger.error('[mongo] connection failed', error);
    throw error;
  }

  mongoose.connection.on('disconnected', () => logger.warn('[mongo] disconnected'));
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    logger.info('[mongo] connection closed');
  }
}
