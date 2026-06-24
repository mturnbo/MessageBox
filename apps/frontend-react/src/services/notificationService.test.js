import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as notificationService from './notificationService.js';

beforeEach(() => {
  notificationService.resetLastChecked();
});

const makeMsg = (id, readAt = null, sentAt = null) => ({
  id,
  senderId: 1,
  recipientId: 2,
  readAt,
  sentAt: sentAt ?? new Date().toISOString(),
});

describe('checkForNewMessages', () => {
  it('returns messages newer than lastChecked that are unread', async () => {
    const future = new Date(Date.now() + 1000).toISOString();
    const getInboxFn = vi.fn().mockResolvedValue({
      messages: [makeMsg(1, null, future), makeMsg(2, null, future)],
      total: 2,
    });

    notificationService.resetLastChecked();
    const { newMessages } = await notificationService.checkForNewMessages(2, getInboxFn);
    expect(newMessages).toHaveLength(2);
  });

  it('excludes already-read messages', async () => {
    const future = new Date(Date.now() + 1000).toISOString();
    const getInboxFn = vi.fn().mockResolvedValue({
      messages: [makeMsg(1, new Date().toISOString(), future)],
      total: 1,
    });

    const { newMessages } = await notificationService.checkForNewMessages(2, getInboxFn);
    expect(newMessages).toHaveLength(0);
  });

  it('excludes messages older than lastChecked', async () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const getInboxFn = vi.fn().mockResolvedValue({
      messages: [makeMsg(1, null, past)],
      total: 1,
    });

    const { newMessages } = await notificationService.checkForNewMessages(2, getInboxFn);
    expect(newMessages).toHaveLength(0);
  });

  it('returns the total from the inbox response', async () => {
    const getInboxFn = vi.fn().mockResolvedValue({ messages: [], total: 17 });
    const { total } = await notificationService.checkForNewMessages(2, getInboxFn);
    expect(total).toBe(17);
  });
});
