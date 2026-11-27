import { describe, it, expect, jest, beforeAll, afterEach } from '@jest/globals';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import User from '#models/user.model';

const SECRET = 'test-secret';
process.env.JWT_SECRET = SECRET;
process.env.JWT_EXPIRATION_TIME = '1h';

const ALICE = { id: 5, username: 'alice', passwordHash: '$2b$12$alicehash' };

function makeRes() {
  return { json: jest.fn() };
}

describe('RefreshController.refreshToken', () => {
  let RefreshController, signAccessToken, signRefreshToken, passwordFingerprint;

  beforeAll(async () => {
    // Import after JWT_SECRET is set above, since config captures
    // process.env.JWT_SECRET into a module-level constant at import time.
    ({ default: RefreshController } = await import('#controllers/refresh.controller'));
    ({ signAccessToken, signRefreshToken, passwordFingerprint } = await import('#utils/token.js'));
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns a new access token for a valid refresh token', async () => {
    sinon.stub(User, 'findByPk').resolves(ALICE);
    const req = { body: { refreshToken: signRefreshToken(ALICE) } };
    const res = makeRes();

    await RefreshController.refreshToken(req, res);

    expect(res.json).toHaveBeenCalledWith({ token: expect.any(String) });
    const { token } = res.json.mock.calls[0][0];
    const decoded = jwt.verify(token, SECRET, { issuer: 'messagebox-api-node', audience: 'messagebox' });
    expect(decoded.sub).toBe('5');
    expect(decoded.pwd_fp).toBe(passwordFingerprint(ALICE.passwordHash));
    expect(decoded.username).toBeUndefined();
    expect(decoded.type).toBeUndefined();
  });

  it('throws BadRequestError when refreshToken is missing', async () => {
    const req = { body: {} };
    await expect(RefreshController.refreshToken(req, makeRes())).rejects.toThrow();
  });

  it('throws UnauthorizedError when token type is not refresh', async () => {
    sinon.stub(User, 'findByPk').resolves(ALICE);
    const req = { body: { refreshToken: signAccessToken(ALICE) } };
    await expect(RefreshController.refreshToken(req, makeRes())).rejects.toThrow();
  });

  it('throws UnauthorizedError for an invalid/expired token', async () => {
    const req = { body: { refreshToken: 'not.a.valid.token' } };
    await expect(RefreshController.refreshToken(req, makeRes())).rejects.toThrow();
  });

  it('throws UnauthorizedError for a legacy username-only refresh token', async () => {
    const legacyToken = jwt.sign({ username: 'alice', type: 'refresh' }, SECRET, { expiresIn: '7d' });
    const req = { body: { refreshToken: legacyToken } };
    await expect(RefreshController.refreshToken(req, makeRes())).rejects.toThrow();
  });

  it('throws UnauthorizedError when the user no longer exists', async () => {
    const refreshToken = signRefreshToken(ALICE);
    sinon.stub(User, 'findByPk').resolves(null);
    const res = makeRes();

    await expect(RefreshController.refreshToken({ body: { refreshToken } }, res)).rejects.toThrow();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when the password changed after the token was issued', async () => {
    const refreshToken = signRefreshToken(ALICE);
    sinon.stub(User, 'findByPk').resolves({ ...ALICE, passwordHash: '$2b$12$newhash' });
    const res = makeRes();

    await expect(RefreshController.refreshToken({ body: { refreshToken } }, res)).rejects.toThrow();
    expect(res.json).not.toHaveBeenCalled();
  });
});
