import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import jwt from 'jsonwebtoken';

const SECRET = 'test-secret';
process.env.JWT_SECRET = SECRET;

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('authMiddleware', () => {
  let authMiddleware;

  beforeAll(async () => {
    // Import after JWT_SECRET is set above, since the middleware captures
    // process.env.JWT_SECRET into a module-level constant at import time.
    ({ authMiddleware } = await import('#middlewares/auth.middleware.js'));
  });

  it('returns 401 when no token is provided', () => {
    const req = { headers: {} };
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Access token required' } });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for an invalid or expired token', () => {
    const req = { headers: { authorization: 'Bearer not.a.valid.token' } };
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Invalid or expired token' } });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.user for a valid access token', () => {
    const token = jwt.sign({ username: 'alice' }, SECRET, { expiresIn: '1h' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user.username).toBe('alice');
  });

  it('returns 403 when a refresh token is used as an access token', () => {
    const refreshToken = jwt.sign({ username: 'alice', type: 'refresh' }, SECRET, { expiresIn: '7d' });
    const req = { headers: { authorization: `Bearer ${refreshToken}` } };
    const res = makeRes();
    const next = jest.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: { message: 'Invalid or expired token' } });
    expect(next).not.toHaveBeenCalled();
  });
});
