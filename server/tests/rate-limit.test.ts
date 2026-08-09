import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app';
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

describe('configured API rate limits', () => {
  it('allows 300 requests to one API path and blocks request 301', async () => {
    vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(null);
    const app = createApp();
    const statuses: number[] = [];
    let lastAllowed: any;

    for (let index = 0; index < 300; index += 1) {
      lastAllowed = await request(app)
        .get('/api/rate-limit-probe-300')
        .set('X-Forwarded-For', '198.51.100.30');
      statuses.push(lastAllowed.status);
    }

    const blocked = await request(app)
      .get('/api/rate-limit-probe-300')
      .set('X-Forwarded-For', '198.51.100.30');

    // The probe route intentionally does not exist: allowed requests reach Express 404.
    expect(new Set(statuses)).toEqual(new Set([404]));
    expect(lastAllowed?.headers['ratelimit-limit']).toBe('300');
    expect(lastAllowed?.headers['ratelimit-remaining']).toBe('0');
    expect(blocked.status).toBe(429);
    expect(blocked.headers['ratelimit-limit']).toBe('300');
    expect(blocked.headers['ratelimit-remaining']).toBe('0');
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('allows 10 login attempts and blocks attempt 11', async () => {
    vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(null);
    const app = createApp();
    const statuses: number[] = [];

    for (let index = 0; index < 10; index += 1) {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '198.51.100.31')
        .send({ email: 'invalid-email', password: 'x' });
      statuses.push(response.status);
    }

    const blocked = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '198.51.100.31')
      .send({ email: 'invalid-email', password: 'x' });

    // The first 10 pass the limiter and are then rejected by request validation.
    expect(new Set(statuses)).toEqual(new Set([400]));
    expect(blocked.status).toBe(429);
    expect(blocked.headers['ratelimit-limit']).toBe('10');
    expect(blocked.headers['ratelimit-remaining']).toBe('0');
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('allows 10 order lookups and blocks lookup 11', async () => {
    vi.spyOn(redisConfig, 'getRedisClient').mockReturnValue(null);
    const app = createApp();
    const statuses: number[] = [];

    for (let index = 0; index < 10; index += 1) {
      const response = await request(app)
        .get('/api/orders/lookup?q=ab')
        .set('X-Forwarded-For', '198.51.100.32');
      statuses.push(response.status);
    }

    const blocked = await request(app)
      .get('/api/orders/lookup?q=ab')
      .set('X-Forwarded-For', '198.51.100.32');

    // q=ab is intentionally invalid, so allowed requests stop at query validation.
    expect(new Set(statuses)).toEqual(new Set([400]));
    expect(blocked.status).toBe(429);
    expect(blocked.headers['ratelimit-limit']).toBe('10');
    expect(blocked.headers['ratelimit-remaining']).toBe('0');
    expect(blocked.headers['retry-after']).toBeDefined();
  });
});
