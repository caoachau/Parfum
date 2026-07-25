import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // không kết nối được DB thì dừng app
  }

  // lắng nghe sự kiện để biết khi mất kết nối
  mongoose.connection.on('disconnected', () => console.warn('⚠️ MongoDB disconnected'));

  // tắt êm khi Ctrl+C
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  });
}
