import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as redisConfig from '../src/config/redis';
import { rateLimit } from '../src/middlewares/rateLimit.middleware';

afterEach(() => vi.restoreAllMocks());

describe('rate limit stores', () => {
  it('falls back to the in-memory bucket when Redis is unavailable', async () => {
    vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(null);
    const app = express();
    const limiter = rateLimit({ name: 'local-test', windowMs: 60_000, max: 2 });
    app.get('/limited', limiter, (_req, res) => res.json({ ok: true }));

    expect((await request(app).get('/limited')).status).toBe(200);
    expect((await request(app).get('/limited')).status).toBe(200);
    const blocked = await request(app).get('/limited');

    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();
    expect(blocked.headers['ratelimit-remaining']).toBe('0');
  });

  it('uses the atomic Redis result when the shared store is ready', async () => {
    const evalCommand = vi.fn().mockResolvedValue([3, 45_000]);
    vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue({ eval: evalCommand } as any);
    const app = express();
    const limiter = rateLimit({ name: 'redis-test', windowMs: 60_000, max: 2 });
    app.get('/limited', limiter, (_req, res) => res.json({ ok: true }));

    const blocked = await request(app).get('/limited');

    expect(blocked.status).toBe(429);
    expect(evalCommand).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('INCR'"),
      expect.objectContaining({
        keys: [expect.stringMatching(/^parfum:rate-limit:redis-test:[a-f0-9]{64}$/)],
        arguments: ['60000'],
      }),
    );
  });

  it('shares one logical bucket between /api and /api/v1 aliases', async () => {
    vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(null);
    const app = express();
    const limiter = rateLimit({ name: 'alias-test', windowMs: 60_000, max: 1 });
    app.get(['/api/demo', '/api/v1/demo'], limiter, (_req, res) => res.json({ ok: true }));

    expect((await request(app).get('/api/demo')).status).toBe(200);
    expect((await request(app).get('/api/v1/demo')).status).toBe(429);
  });
});
