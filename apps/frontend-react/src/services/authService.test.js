import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authService from './authService.js';

const MOCK_LOGIN_RESPONSE = {
  username: 'testuser',
  token: 'access-token-abc',
  refreshToken: 'refresh-token-xyz',
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('login', () => {
  it('returns login response on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_LOGIN_RESPONSE),
    }));
    const result = await authService.login({ username: 'testuser', password: 'pass' });
    expect(result).toEqual(MOCK_LOGIN_RESPONSE);
    expect(fetch).toHaveBeenCalledWith('/v1/auth', expect.objectContaining({ method: 'POST' }));
  });

  it('throws with status on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    }));
    await expect(authService.login({ username: 'x', password: 'y' })).rejects.toMatchObject({
      status: 401,
      message: 'Invalid credentials',
    });
  });
});

describe('storeSession / loadStoredSession / clearSession', () => {
  it('stores and restores the session', () => {
    authService.storeSession(MOCK_LOGIN_RESPONSE);
    const restored = authService.loadStoredSession();
    expect(restored).toMatchObject({
      username: 'testuser',
      token: 'access-token-abc',
      refreshToken: 'refresh-token-xyz',
    });
  });

  it('returns null when nothing is stored', () => {
    expect(authService.loadStoredSession()).toBeNull();
  });

  it('clearSession removes all keys', () => {
    authService.storeSession(MOCK_LOGIN_RESPONSE);
    authService.clearSession();
    expect(localStorage.getItem('mb_token')).toBeNull();
    expect(localStorage.getItem('mb_user')).toBeNull();
    expect(localStorage.getItem('mb_refresh_token')).toBeNull();
    expect(authService.loadStoredSession()).toBeNull();
  });
});

describe('getToken', () => {
  it('returns the stored token', () => {
    authService.storeSession(MOCK_LOGIN_RESPONSE);
    expect(authService.getToken()).toBe('access-token-abc');
  });

  it('returns null when not logged in', () => {
    expect(authService.getToken()).toBeNull();
  });
});

describe('updateToken', () => {
  it('updates token in localStorage and in stored user', () => {
    authService.storeSession(MOCK_LOGIN_RESPONSE);
    authService.updateToken('new-token-999');
    expect(authService.getToken()).toBe('new-token-999');
    expect(authService.loadStoredSession().token).toBe('new-token-999');
  });
});

describe('refreshToken', () => {
  it('POSTs the stored refresh token and returns new access token', async () => {
    authService.storeSession(MOCK_LOGIN_RESPONSE);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'new-access-token' }),
    }));
    const result = await authService.refreshToken();
    expect(result).toEqual({ token: 'new-access-token' });
    expect(fetch).toHaveBeenCalledWith('/v1/auth/refresh', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ refreshToken: 'refresh-token-xyz' }),
    }));
  });

  it('throws when no refresh token is stored', async () => {
    await expect(authService.refreshToken()).rejects.toThrow('No refresh token stored');
  });
});
