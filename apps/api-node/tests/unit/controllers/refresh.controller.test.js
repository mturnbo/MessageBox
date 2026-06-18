import { describe, it, expect, jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import RefreshController from '#controllers/refresh.controller';

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
