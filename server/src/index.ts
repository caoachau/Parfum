import { env } from './config/env'; // import ĐẦU TIÊN để nạp .env trước mọi thứ
import { connectDB } from './config/db';
import { initMonitoring } from './utils/monitoring';

// Lưu ý: file ./app (khởi tạo Express app) thuộc skeleton HT-05.
// Ở đây minh họa cách ráp connectDB vào điểm khởi động.
import { createApp } from './app';
import {
  rotateDefaultAdminPassword,
  ensureDefaultAdmin,
  fixLegacySlugIndexes,
} from './services/security.service';

async function start() {
  await initMonitoring();
  await connectDB();
  await ensureDefaultAdmin();
  await rotateDefaultAdminPassword();
  await fixLegacySlugIndexes();
  const app = createApp();
  app.listen(env.port, () => console.log(`🚀 Server: http://localhost:${env.port}`));
}

start();
