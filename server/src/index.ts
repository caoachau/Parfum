import { env } from './config/env';
import { connectDB, disconnectDB } from './config/db';
import { connectRedis, disconnectRedis } from './config/redis';
import { createApp } from './app';
import { initMonitoring } from './utils/monitoring';
import { logger } from './utils/logger';
import {
  rotateDefaultAdminPassword,
  ensureDefaultAdmin,
  fixLegacySlugIndexes,
} from './services/security.service';
import {
  startQrPaymentLifecycleJob,
  stopQrPaymentLifecycleJob,
} from './services/qr-payment-lifecycle.service';

async function start() {
  await initMonitoring();
  await connectDB();
  await connectRedis();
  await ensureDefaultAdmin();
  await rotateDefaultAdminPassword();
  await fixLegacySlugIndexes();
  startQrPaymentLifecycleJob();

  const app = createApp();
  const server = app.listen(env.port, () =>
    logger.info(`Server listening at http://localhost:${env.port}`),
  );

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    stopQrPaymentLifecycleJob();
    logger.info(`[shutdown] received ${signal}`);

    const forceExit = setTimeout(() => {
      logger.error('[shutdown] timed out');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([disconnectRedis(), disconnectDB()]);
    clearTimeout(forceExit);
    process.exit(0);
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

start().catch(async (error) => {
  logger.error('[startup] failed', error);
  await Promise.allSettled([disconnectRedis(), disconnectDB()]);
  process.exit(1);
});
