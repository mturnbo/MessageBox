import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authService from './authService.js';
import { init, apiFetch } from './api.js';

const MOCK_USER = {
  username: 'testuser',
  token: 'access-token',
  refreshToken: 'refresh-token',
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  // Reset api callbacks
  init({ onTokenRefreshed: null, onAuthFailure: null });
});

describe('apiFetch', () => {
  it('attaches Authorization header when token is stored', async () => {
    authService.storeSession(MOCK_USER);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, ok: true }));

    await apiFetch('/v1/messages/inbox');

    expect(fetch).toHaveBeenCalledWith('/v1/messages/inbox', expect.objectContaining({
      headers: expect.objectContaining({ Authorization: 'Bearer access-token' }),
    }));
  });

  it('does not attach Authorization header when no token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 200, ok: true }));

    await apiFetch('/v1/health');

    const call = fetch.mock.calls[0][1];
    expect(call.headers?.Authorization).toBeUndefined();
  });

  it('returns 200 response directly without refresh', async () => {
    authService.storeSession(MOCK_USER);
    const mockRes = { status: 200, ok: true };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockRes));

    const res = await apiFetch('/v1/users/1');
    expect(res).toBe(mockRes);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries with new token after 401 when onTokenRefreshed succeeds', async () => {
    authService.storeSession(MOCK_USER);
    const onTokenRefreshed = vi.fn().mockResolvedValue('new-token');
    const onAuthFailure = vi.fn();
    init({ onTokenRefreshed, onAuthFailure });

    const first = { status: 401 };
    const second = { status: 200, ok: true };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(first).mockResolvedValueOnce(second));

    const res = await apiFetch('/v1/users/1');

    expect(onTokenRefreshed).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(res).toBe(second);
  });

  it('calls onAuthFailure and returns 401 when refresh fails', async () => {
    authService.storeSession(MOCK_USER);
    const onTokenRefreshed = vi.fn().mockRejectedValue(new Error('refresh failed'));
    const onAuthFailure = vi.fn();
    init({ onTokenRefreshed, onAuthFailure });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401 }));

    await apiFetch('/v1/users/1');

    expect(onAuthFailure).toHaveBeenCalledOnce();
  });

  it('does not attempt refresh for /v1/auth endpoints', async () => {
    authService.storeSession(MOCK_USER);
    const onTokenRefreshed = vi.fn();
    init({ onTokenRefreshed, onAuthFailure: vi.fn() });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401 }));

    await apiFetch('/v1/auth/refresh');

    expect(onTokenRefreshed).not.toHaveBeenCalled();
  });
});
