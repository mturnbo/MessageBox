import { describe, it, expect, jest, beforeAll } from '@jest/globals';
import jwt from 'jsonwebtoken';

const SECRET = 'test-secret';
process.env.JWT_SECRET = SECRET;
process.env.JWT_EXPIRATION_TIME = '1h';

function makeRes() {
  return { json: jest.fn() };
}

function makeRefreshToken(overrides = {}) {
  return jwt.sign({ username: 'alice', type: 'refresh', ...overrides }, SECRET, { expiresIn: '7d' });
}

describe('RefreshController.refreshToken', () => {
  let RefreshController;

  beforeAll(async () => {
    // Import after JWT_SECRET is set above, since the controller now imports
    // the validated secret from config, which captures process.env.JWT_SECRET
    // into a module-level constant at import time.
    ({ default: RefreshController } = await import('#controllers/refresh.controller'));
  });

  it('returns a new access token for a valid refresh token', () => {
    const refreshToken = makeRefreshToken();
    const req = { body: { refreshToken } };
    const res = makeRes();

    RefreshController.refreshToken(req, res);

    expect(res.json).toHaveBeenCalledWith({ token: expect.any(String) });
    const { token } = res.json.mock.calls[0][0];
    const decoded = jwt.verify(token, SECRET);
    expect(decoded.username).toBe('alice');
    expect(decoded.type).toBeUndefined();
  });

  it('throws BadRequestError when refreshToken is missing', () => {
    const req = { body: {} };
    expect(() => RefreshController.refreshToken(req, makeRes())).toThrow();
  });

  it('throws UnauthorizedError when token type is not refresh', () => {
    const accessToken = jwt.sign({ username: 'alice' }, SECRET, { expiresIn: '1h' });
    const req = { body: { refreshToken: accessToken } };
    expect(() => RefreshController.refreshToken(req, makeRes())).toThrow();
  });

  it('throws UnauthorizedError for an invalid/expired token', () => {
    const req = { body: { refreshToken: 'not.a.valid.token' } };
    expect(() => RefreshController.refreshToken(req, makeRes())).toThrow();
  });
});
