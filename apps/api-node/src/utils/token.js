// JWT helpers. Claims match the Python API: sub is the user id, pwd_fp revokes tokens when the password changes.
import { createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import User from '#models/user.model.js';
import { JWT_AUDIENCE, JWT_ISSUER, JWT_SECRET } from '#config/validateEnv.js';

const ALGORITHM = 'HS256';

export const passwordFingerprint = (passwordHash) => (
  createHash('sha256').update(passwordHash).digest('hex').slice(0, 16)
);

const tokenClaims = (user) => ({
  sub: String(user.id),
  pwd_fp: passwordFingerprint(user.passwordHash),
});

const signOptions = (expiresIn) => ({
  algorithm: ALGORITHM,
  expiresIn,
  issuer: JWT_ISSUER,
  audience: JWT_AUDIENCE,
});

export const signAccessToken = (user) => jwt.sign(
  tokenClaims(user),
  JWT_SECRET,
  signOptions(process.env.JWT_EXPIRATION_TIME)
);

export const signRefreshToken = (user) => jwt.sign(
  { ...tokenClaims(user), type: 'refresh' },
  JWT_SECRET,
  signOptions(process.env.JWT_REFRESH_EXPIRATION_TIME ?? '7d')
);

// Returns the payload, or null if the token is invalid, expired, from another issuer/audience, or has no sub
export const verifyToken = (token) => {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: [ALGORITHM],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return payload.sub ? payload : null;
  } catch {
    return null;
  }
};

// Returns the token's user, or null if the account is gone or its password changed since the token was issued
export const findTokenUser = async (payload) => {
  const userId = parseInt(payload.sub, 10);
  if (isNaN(userId)) {
    return null;
  }
  const user = await User.findByPk(userId, { attributes: ['id', 'username', 'passwordHash'] });
  if (!user || payload.pwd_fp !== passwordFingerprint(user.passwordHash)) {
    return null;
  }
  return user;
};
