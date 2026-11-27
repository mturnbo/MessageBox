import dotenv from 'dotenv';
import logger from './logger.js';

dotenv.config();

const REQUIRED = [
  'DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_TYPE',
  'JWT_SECRET', 'JWT_EXPIRATION_TIME',
];

// Same minimum as the Python API
export const MIN_SIGNING_KEY_LENGTH = 32;

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_ISSUER = process.env.JWT_ISSUER || 'messagebox-api-node';
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'messagebox';

export function validateEnv() {
  const missing = REQUIRED.filter(v => !process.env[v]);
  if (process.env.SERVER_JWT === 'true') {
    ['SERVER_JWT_SECRET', 'SERVER_JWT_TIMEOUT']
      .filter(v => !process.env[v])
      .forEach(v => missing.push(v));
  }
  const errors = missing.map(v => `[CONFIG] Missing required env var: ${v}`);
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < MIN_SIGNING_KEY_LENGTH) {
    errors.push(`[CONFIG] JWT_SECRET must be at least ${MIN_SIGNING_KEY_LENGTH} characters`);
  }
  if (errors.length) {
    errors.forEach(message => logger.error(message));
    logger.flush(() => process.exit(1));
  }
}
