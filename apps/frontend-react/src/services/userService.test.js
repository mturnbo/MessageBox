import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as userService from './userService.js';
import * as api from './api.js';

beforeEach(() => vi.restoreAllMocks());

const mockFetch = (body, ok = true) =>
  vi.spyOn(api, 'apiFetch').mockResolvedValue({ ok, json: () => Promise.resolve(body) });

describe('getUsers', () => {
  it('calls the correct paginated endpoint with defaults', async () => {
    const spy = mockFetch([]);
    await userService.getUsers();
    expect(spy).toHaveBeenCalledWith('/v1/users/50/1');
  });

  it('respects limit and page overrides', async () => {
    const spy = mockFetch([]);
    await userService.getUsers(20, 3);
    expect(spy).toHaveBeenCalledWith('/v1/users/20/3');
  });

  it('throws when response is not ok', async () => {
    mockFetch({}, false);
    await expect(userService.getUsers()).rejects.toThrow('Failed to fetch users');
  });
});

describe('getUser', () => {
  it('calls the endpoint with the given id', async () => {
    const spy = mockFetch({ id: 7, username: 'alice' });
    await userService.getUser(7);
    expect(spy).toHaveBeenCalledWith('/v1/users/7');
  });

  it('works with a string username', async () => {
    const spy = mockFetch({ id: 7, username: 'alice' });
    await userService.getUser('alice');
    expect(spy).toHaveBeenCalledWith('/v1/users/alice');
  });

  it('throws when response is not ok', async () => {
    mockFetch({}, false);
    await expect(userService.getUser(99)).rejects.toThrow('Failed to fetch user');
  });
});
