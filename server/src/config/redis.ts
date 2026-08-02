import { createClient } from 'redis';
import { env } from './env';
import { logger } from '../utils/logger';

export type RedisStatus = 'disabled' | 'connecting' | 'ready' | 'reconnecting' | 'error';

type RedisClient = ReturnType<typeof createClient>;

let client: RedisClient | null = null;
let connectionTask: Promise<void> | null = null;
let connectionFailed = false;
let lastErrorLogAt = 0;

function logRedisError(error: unknown) {
  const now = Date.now();
  if (now - lastErrorLogAt < 30_000) return;
  lastErrorLogAt = now;
  logger.warn('[redis] connection/command error; rate limit is using local fallback', error);
}

function ensureClient(): RedisClient | null {
  if (!env.redisUrl) return null;
  if (client) return client;

  client = createClient({
    url: env.redisUrl,
    socket: {
      reconnectStrategy(retries) {
        const jitter = Math.floor(Math.random() * 100);
        return Math.min(2 ** retries * 50, 3_000) + jitter;
      },
    },
  });
  client.on('error', logRedisError);
  client.on('ready', () => {
    connectionFailed = false;
    logger.info('[redis] ready');
  });
  client.on('reconnecting', () => logRedisError('[redis] reconnecting'));
  return client;
}

export async function connectRedis() {
  const redis = ensureClient();
  if (!redis) {
    logger.info('[redis] REDIS_URL is empty; using in-memory rate limit');
    return;
  }
  if (redis.isReady || connectionTask) return;

  connectionTask = redis
    .connect()
    .then(() => {
      connectionFailed = false;
    })
    .catch((error) => {
      connectionFailed = true;
      logRedisError(error);
    })
    .finally(() => {
      connectionTask = null;
    });

  // Redis la ha tang tuy chon: khong chan server khoi dong vo han khi Redis dang down.
  await Promise.race([
    connectionTask,
    new Promise<void>((resolve) => {
      const timeout = setTimeout(resolve, 2_000);
      timeout.unref?.();
    }),
  ]);

  if (!redis.isReady) {
    logger.warn('[redis] not ready at startup; using in-memory rate limit until it reconnects');
  }
}

export function getRedisClient(): RedisClient | null {
  return client?.isReady ? client : null;
}

export function getRedisStatus(): RedisStatus {
  if (!env.redisUrl) return 'disabled';
  if (client?.isReady) return 'ready';
  if (client?.isOpen) return 'reconnecting';
  if (connectionFailed) return 'error';
  return 'connecting';
}

export async function disconnectRedis() {
  if (!client) return;
  const current = client;
  client = null;
  connectionTask = null;
  if (!current.isOpen) return;
  try {
    await current.close();
  } catch {
    current.destroy();
  }
}
