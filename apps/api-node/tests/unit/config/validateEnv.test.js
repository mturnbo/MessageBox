import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { validateEnv, MIN_SIGNING_KEY_LENGTH } from '#config/validateEnv.js';
import logger from '#config/logger.js';

const ALL_REQUIRED = {
  DB_DATABASE: 'testdb',
  DB_USER: 'root',
  DB_PASSWORD: 'secret',
  DB_HOST: 'localhost',
  DB_TYPE: 'mysql',
  JWT_SECRET: 'a'.repeat(32),
  JWT_EXPIRATION_TIME: '1h',
};

describe('validateEnv', () => {
  let originalEnv;
  let exitSpy;

  beforeEach(() => {
    originalEnv = { ...process.env };
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    Object.keys(process.env).forEach(k => delete process.env[k]);
  });

  afterEach(() => {
    Object.keys(process.env).forEach(k => delete process.env[k]);
    Object.assign(process.env, originalEnv);
    exitSpy.mockRestore();
  });

  it('does not exit when all required vars are set', () => {
    Object.assign(process.env, ALL_REQUIRED);
    validateEnv();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with code 1 when a required var is missing', () => {
    const { JWT_SECRET: _, ...rest } = ALL_REQUIRED;
    Object.assign(process.env, rest);
    validateEnv();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('catches SERVER_JWT_SECRET when SERVER_JWT is true', () => {
    Object.assign(process.env, ALL_REQUIRED, { SERVER_JWT: 'true' });
    validateEnv();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('does not exit for SERVER_JWT vars when SERVER_JWT is not true', () => {
    Object.assign(process.env, ALL_REQUIRED);
    validateEnv();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with code 1 when JWT_SECRET is shorter than the minimum', () => {
    const errorSpy = jest.spyOn(logger, 'error');
    Object.assign(process.env, ALL_REQUIRED, { JWT_SECRET: 'a'.repeat(MIN_SIGNING_KEY_LENGTH - 1) });
    validateEnv();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('[CONFIG] JWT_SECRET must be at least 32 characters');
    errorSpy.mockRestore();
  });

  it('does not exit when JWT_SECRET is exactly the minimum length', () => {
    Object.assign(process.env, ALL_REQUIRED, { JWT_SECRET: 'a'.repeat(MIN_SIGNING_KEY_LENGTH) });
    validateEnv();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('reports a missing JWT_SECRET without a length error', () => {
    const errorSpy = jest.spyOn(logger, 'error');
    const { JWT_SECRET: _, ...rest } = ALL_REQUIRED;
    Object.assign(process.env, rest);
    validateEnv();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('[CONFIG] Missing required env var: JWT_SECRET');
    expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining('at least'));
    errorSpy.mockRestore();
  });
});
