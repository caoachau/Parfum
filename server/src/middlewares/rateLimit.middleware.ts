import { Request, Response, NextFunction } from 'express';
import { createHash } from 'node:crypto';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

type RateLimitOptions = {
  name: string;
  windowMs: number;
  max: number;
  message?: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_SCRIPT = `
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return { count, ttl }
`;

let lastRedisCommandErrorAt = 0;

function normalizedRequestPath(req: Request) {
  const path = req.originalUrl.split('?')[0] || '/';
  return path.replace(/^\/api(?:\/v1)?(?=\/|$)/, '') || '/';
}

function requestFingerprint(req: Request) {
  return createHash('sha256')
    .update(`${req.ip}\n${normalizedRequestPath(req)}`)
    .digest('hex');
}

/**
 * Distributed rate limiter khi REDIS_URL san sang; fallback ve Map theo tien trinh
 * cho local/test va khi Redis tam thoi mat ket noi.
 */
export function rateLimit(options: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();

  // Don dinh ky bucket het han -> tranh ro ri bo nho.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, options.windowMs);
  // Không giữ tiến trình sống chỉ vì timer này.
  if (typeof sweep.unref === 'function') sweep.unref();

  function consumeLocal(key: string, now: number): Bucket {
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      const created = { count: 1, resetAt: now + options.windowMs };
      buckets.set(key, created);
      return created;
    }
    bucket.count += 1;
    return bucket;
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const fingerprint = requestFingerprint(req);
    const localBucket = consumeLocal(fingerprint, now);
    let count = localBucket.count;
    let resetAfterMs = Math.max(0, localBucket.resetAt - now);

    const redis = getRedisClient();
    if (redis) {
      try {
        const result = await redis.eval(RATE_LIMIT_SCRIPT, {
          keys: [`parfum:rate-limit:${options.name}:${fingerprint}`],
          arguments: [String(options.windowMs)],
        });
        if (Array.isArray(result)) {
          count = Number(result[0]);
          resetAfterMs = Math.max(0, Number(result[1]));
        }
      } catch (error) {
        if (now - lastRedisCommandErrorAt >= 30_000) {
          lastRedisCommandErrorAt = now;
          logger.warn('[rate-limit] Redis command failed; using local fallback', error);
        }
      }
    }

    const resetAfterSeconds = Math.max(1, Math.ceil(resetAfterMs / 1000)); /* số GIÂY phải chờ */
    res.setHeader('RateLimit-Limit', options.max); /*tổng số request được phép trong cửa sổ */
    res.setHeader(
      'RateLimit-Remaining',
      Math.max(0, options.max - count),
    ); /*số request còn lại trong cửa sổ */
    res.setHeader(
      'RateLimit-Reset',
      resetAfterSeconds,
    ); /*thời gian còn lại cho đến khi cửa sổ giới hạn được reset */

    if (count > options.max) {
      res.setHeader('Retry-After', resetAfterSeconds);
      return res.status(429).json({
        message:
          options.message ||
          'Too many requests, please try again later' /*Khi vượt quá giới hạn truy cập, hệ thống trả về HTTP 429 + noi dung  */,
      });
    }

    next();
  };
}
