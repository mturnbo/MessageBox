import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { NotificationService } from './notification.service';
import { MessageService } from './message.service';
import { InboxPage, Message } from '../../models/message.model';

const makeMessage = (id: number, sentAt: string, readAt?: string): Message => ({
  id,
  senderId: 99,
  recipientId: 1,
  sentAt,
  readAt,
});

const emptyPage: InboxPage = { messages: [], total: 0, page: 1, limit: 5 };

describe('NotificationService', () => {
  let service: NotificationService;
  let messageService: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationService);
    messageService = TestBed.inject(MessageService);
  });

  afterEach(() => {
    service.stopPolling();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('setInboxUnread() / setSentTotal()', () => {
    it('should update inboxUnread signal', () => {
      service.setInboxUnread(5);
      expect(service.inboxUnread()).toBe(5);
    });

    it('should reset inboxUnread to 0', () => {
      service.setInboxUnread(5);
      service.setInboxUnread(0);
      expect(service.inboxUnread()).toBe(0);
    });

    it('should update sentTotal signal', () => {
      service.setSentTotal(12);
      expect(service.sentTotal()).toBe(12);
    });
  });

  describe('resetUnread()', () => {
    it('should reset unreadCount to 0', () => {
      service.notifyNewMessage(makeMessage(1, new Date().toISOString()), 'Alice');
      expect(service.unreadCount()).toBe(1);
      service.resetUnread();
      expect(service.unreadCount()).toBe(0);
    });
  });

  describe('startPolling() / stopPolling()', () => {
    it('should call getInbox after the polling interval elapses', async () => {
      vi.useFakeTimers();
      const getInboxSpy = vi.spyOn(messageService, 'getInbox').mockReturnValue(of(emptyPage));

      service.startPolling(1);
      await vi.advanceTimersByTimeAsync(30001);

      expect(getInboxSpy).toHaveBeenCalledWith(1, 1, 5);
      service.stopPolling();
    });

    it('should increment inboxUnread when new unread messages arrive after lastChecked', async () => {
      vi.useFakeTimers();
      // Message sent in the future (relative to real clock) — will be after lastChecked
      const futureMsg = makeMessage(99, new Date(Date.now() + 5000).toISOString());
      const page: InboxPage = { messages: [futureMsg], total: 1, page: 1, limit: 5 };
      vi.spyOn(messageService, 'getInbox').mockReturnValue(of(page));

      const initialUnread = service.inboxUnread();
      service.startPolling(1);
      await vi.advanceTimersByTimeAsync(30001);

      expect(service.inboxUnread()).toBe(initialUnread + 1);
      service.stopPolling();
    });

    it('should not increment inboxUnread for already-read messages', async () => {
      vi.useFakeTimers();
      const readMsg = makeMessage(88, new Date(Date.now() + 5000).toISOString(), '2024-01-01T00:00:00Z');
      const page: InboxPage = { messages: [readMsg], total: 1, page: 1, limit: 5 };
      vi.spyOn(messageService, 'getInbox').mockReturnValue(of(page));

      const initialUnread = service.inboxUnread();
      service.startPolling(1);
      await vi.advanceTimersByTimeAsync(30001);

      expect(service.inboxUnread()).toBe(initialUnread);
      service.stopPolling();
    });

    it('stopPolling() should prevent further poll ticks from firing', async () => {
      vi.useFakeTimers();
      const getInboxSpy = vi.spyOn(messageService, 'getInbox').mockReturnValue(of(emptyPage));

      service.startPolling(1);
      service.stopPolling();
      await vi.advanceTimersByTimeAsync(30001);

      expect(getInboxSpy).not.toHaveBeenCalled();
    });
  });
});
