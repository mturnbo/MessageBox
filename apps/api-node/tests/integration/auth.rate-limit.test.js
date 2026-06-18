import { describe, it, expect } from '@jest/globals';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import request from 'supertest';

const MAX = 3;

function buildTestApp() {
  const app = express();
  app.use(express.json());

  const limiter = rateLimit({
    windowMs: 60000,
    max: MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many login attempts, please try again later.' },
  });

  app.post('/v1/auth', limiter, (req, res) => {
    res.status(401).json({ message: 'Invalid credentials' });
  });

  return app;
}

describe('auth rate limiter', () => {
  it(`should allow the first ${MAX} requests through`, async () => {
    const app = buildTestApp();
    for (let i = 0; i < MAX; i++) {
      const res = await request(app)
        .post('/v1/auth')
        .send({ username: 'alice', password: 'wrong' });
      expect(res.status).not.toBe(429);
    }
  });

  it(`should return 429 after ${MAX} requests in the same window`, async () => {
    const app = buildTestApp();
    for (let i = 0; i < MAX; i++) {
      await request(app).post('/v1/auth').send({ username: 'alice', password: 'wrong' });
    }
    const res = await request(app).post('/v1/auth').send({ username: 'alice', password: 'wrong' });
    expect(res.status).toBe(429);
    expect(res.body.message).toMatch(/too many/i);
  });

  it('should include rate limit headers in the response', async () => {
    const app = buildTestApp();
    const res = await request(app).post('/v1/auth').send({ username: 'alice', password: 'wrong' });
    // draft-7 combines limit/remaining into a single RateLimit header
    expect(res.headers['ratelimit']).toBeDefined();
    expect(res.headers['ratelimit-policy']).toBeDefined();
  });
});
