import { Request, Response, NextFunction } from 'express';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message?: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

/**
 * Rate limiter in-memory (theo tien trinh).
 * - FIX ro ri bo nho: quet dinh ky de xoa cac bucket da het han (truoc day Map chi phinh to).
 * - Luu y scale: khi chay NHIEU instance, moi tien trinh giu bucket rieng => nen dung
 *   store phan tan (Redis). Xem REDIS_URL trong .env va huong dan o README de nang cap
 *   sang express-rate-limit + rate-limit-redis khi trien khai da instance.
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

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({
        message: options.message || 'Too many requests, please try again later',
      });
    }

    next();
  };
}
