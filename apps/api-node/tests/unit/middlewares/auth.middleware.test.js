import { describe, it, expect, jest, beforeAll, afterEach } from '@jest/globals';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import User from '#models/user.model';

const SECRET = 'test-secret';
process.env.JWT_SECRET = SECRET;
process.env.JWT_EXPIRATION_TIME = '1h';

const ALICE = { id: 5, username: 'alice', passwordHash: '$2b$12$alicehash' };

function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('authMiddleware', () => {
  let authMiddleware, signAccessToken, signRefreshToken, passwordFingerprint;

  beforeAll(async () => {
    // Import after JWT_SECRET is set above, since config captures
    // process.env.JWT_SECRET into a module-level constant at import time.
    ({ authMiddleware } = await import('#middlewares/auth.middleware.js'));
    ({ signAccessToken, signRefreshToken, passwordFingerprint } = await import('#utils/token.js'));
  });

  afterEach(() => {
    sinon.restore();
  });

  async function run(token) {
    const req = { headers: token ? { authorization: `Bearer ${token}` } : {} };
    const res = makeRes();
    const next = jest.fn();
    await authMiddleware(req, res, next);
    return { req, res, next };
  }

  function expect401(res, next, message) {
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: { message } });
    expect(next).not.toHaveBeenCalled();
  }

  it('returns 401 when no token is provided', async () => {
    const { res, next } = await run(null);

    expect401(res, next, 'Access token required');
  });

  it('returns 401 for an invalid or expired token', async () => {
    const { res, next } = await run('not.a.valid.token');

    expect401(res, next, 'Invalid or expired token');
  });

  it('sets req.user from the token subject for a valid access token', async () => {
    const findByPk = sinon.stub(User, 'findByPk').resolves(ALICE);

    const { req, next } = await run(signAccessToken(ALICE));

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 5, username: 'alice' });
    sinon.assert.calledWith(findByPk, 5);
  });

  it('follows the user across a username change', async () => {
    const token = signAccessToken(ALICE);
    sinon.stub(User, 'findByPk').resolves({ ...ALICE, username: 'alice2026' });

    const { req, next } = await run(token);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ id: 5, username: 'alice2026' });
  });

  it('returns 401 when a refresh token is used as an access token', async () => {
    sinon.stub(User, 'findByPk').resolves(ALICE);

    const { res, next } = await run(signRefreshToken(ALICE));

    expect401(res, next, 'Invalid or expired token');
  });

  it('returns 401 for a legacy username-only token', async () => {
    const legacyToken = jwt.sign({ username: 'alice' }, SECRET, { expiresIn: '1h' });

    const { res, next } = await run(legacyToken);

    expect401(res, next, 'Invalid or expired token');
  });

  it('returns 401 for a token from another issuer', async () => {
    const token = jwt.sign(
      { sub: '5', pwd_fp: passwordFingerprint(ALICE.passwordHash) },
      SECRET,
      { expiresIn: '1h', issuer: 'messagebox-api-python', audience: 'messagebox' }
    );

    const { res, next } = await run(token);

    expect401(res, next, 'Invalid or expired token');
  });

  it('returns 401 for a token with the wrong audience', async () => {
    const token = jwt.sign(
      { sub: '5', pwd_fp: passwordFingerprint(ALICE.passwordHash) },
      SECRET,
      { expiresIn: '1h', issuer: 'messagebox-api-node', audience: 'someone-else' }
    );

    const { res, next } = await run(token);

    expect401(res, next, 'Invalid or expired token');
  });

  it('returns 401 for an expired token', async () => {
    const token = jwt.sign(
      { sub: '5', pwd_fp: passwordFingerprint(ALICE.passwordHash) },
      SECRET,
      { expiresIn: -10, issuer: 'messagebox-api-node', audience: 'messagebox' }
    );

    const { res, next } = await run(token);

    expect401(res, next, 'Invalid or expired token');
  });

  it('returns 401 when the user no longer exists', async () => {
    const token = signAccessToken(ALICE);
    sinon.stub(User, 'findByPk').resolves(null);

    const { res, next } = await run(token);

    expect401(res, next, 'Authenticated user not found');
  });

  it('returns 401 when the password changed after the token was issued', async () => {
    const token = signAccessToken(ALICE);
    sinon.stub(User, 'findByPk').resolves({ ...ALICE, passwordHash: '$2b$12$newhash' });

    const { res, next } = await run(token);

    expect401(res, next, 'Authenticated user not found');
  });

  it('passes database errors to next()', async () => {
    const token = signAccessToken(ALICE);
    const boom = new Error('DB down');
    sinon.stub(User, 'findByPk').rejects(boom);

    const { res, next } = await run(token);

    expect(next).toHaveBeenCalledWith(boom);
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('passwordFingerprint', () => {
  it('matches the Python API (first 16 hex chars of sha256)', async () => {
    const { passwordFingerprint } = await import('#utils/token.js');

    // hashlib.sha256(b"$2b$12$alicehash").hexdigest()[:16]
    expect(passwordFingerprint('$2b$12$alicehash')).toBe('57fc55c66ff1af72');
    expect(passwordFingerprint('$2b$12$alicehash')).not.toBe(passwordFingerprint('$2b$12$newhash'));
  });
});
