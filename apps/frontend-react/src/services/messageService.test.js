import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as messageService from './messageService.js';
import * as api from './api.js';

beforeEach(() => vi.restoreAllMocks());

const mockFetch = (body, ok = true) =>
  vi.spyOn(api, 'apiFetch').mockResolvedValue({ ok, json: () => Promise.resolve(body) });

describe('getInbox', () => {
  it('calls the correct endpoint with defaults', async () => {
    const spy = mockFetch({ messages: [], total: 0, page: 1, limit: 10 });
    await messageService.getInbox(42);
    expect(spy).toHaveBeenCalledWith('/v1/messages/inbox?recipientId=42&page=1&limit=10');
  });

  it('respects page and limit overrides', async () => {
    const spy = mockFetch({ messages: [], total: 0, page: 2, limit: 5 });
    await messageService.getInbox(1, 2, 5);
    expect(spy).toHaveBeenCalledWith('/v1/messages/inbox?recipientId=1&page=2&limit=5');
  });

  it('throws when response is not ok', async () => {
    mockFetch({}, false);
    await expect(messageService.getInbox(1)).rejects.toThrow('Failed to fetch inbox');
  });
});

describe('markAsRead', () => {
  it('POSTs the correct body', async () => {
    const spy = mockFetch({ id: 5 });
    await messageService.markAsRead(5);
    expect(spy).toHaveBeenCalledWith('/v1/messages/read', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ id: 5 }),
    }));
  });
});

describe('archiveMessage', () => {
  it('POSTs id and deletedBy', async () => {
    const spy = mockFetch({ id: 3 });
    await messageService.archiveMessage(3, 99);
    expect(spy).toHaveBeenCalledWith('/v1/messages/delete', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ id: 3, deletedBy: 99 }),
    }));
  });
});

describe('createMessage', () => {
  it('POSTs the message payload', async () => {
    const payload = { senderId: 1, recipientId: 2, body: 'Hello', clientMessageId: 'abc' };
    const spy = mockFetch({ id: 10 });
    await messageService.createMessage(payload);
    expect(spy).toHaveBeenCalledWith('/v1/messages/post', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(payload),
    }));
  });
});
