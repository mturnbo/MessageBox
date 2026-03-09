import type { InboxPage, Message, SentPage } from './message.model';

describe('Message models', () => {
  describe('Message', () => {
    it('should have required fields', () => {
      const msg: Message = {
        id: 1,
        senderId: 10,
        recipientId: 20,
        sentAt: '2024-01-15T10:00:00Z',
      };
      expect(msg.id).toBe(1);
      expect(msg.senderId).toBe(10);
      expect(msg.recipientId).toBe(20);
      expect(msg.sentAt).toBe('2024-01-15T10:00:00Z');
    });

    it('should allow optional enriched fields senderName and recipientName', () => {
      const msg: Message = {
        id: 1,
        senderId: 10,
        recipientId: 20,
        sentAt: '2024-01-15T10:00:00Z',
        senderName: 'Alice',
        recipientName: 'Bob',
      };
      expect(msg.senderName).toBe('Alice');
      expect(msg.recipientName).toBe('Bob');
    });
  });

  describe('InboxPage', () => {
    it('should have messages, total, page, and limit fields', () => {
      const page: InboxPage = {
        messages: [],
        total: 0,
        page: 1,
        limit: 10,
      };
      expect(page.messages).toEqual([]);
      expect(page.total).toBe(0);
      expect(page.page).toBe(1);
      expect(page.limit).toBe(10);
    });

    it('should hold an array of Message objects', () => {
      const msg: Message = {
        id: 5,
        senderId: 1,
        recipientId: 2,
        sentAt: '2024-03-01T09:00:00Z',
        subject: 'Hello',
      };
      const page: InboxPage = { messages: [msg], total: 1, page: 1, limit: 10 };
      expect(page.messages.length).toBe(1);
      expect(page.messages[0].subject).toBe('Hello');
    });
  });

  describe('SentPage', () => {
    it('should be assignable to InboxPage (same shape)', () => {
      const sentPage: SentPage = {
        messages: [],
        total: 24,
        page: 2,
        limit: 10,
      };
      // SentPage is a type alias of InboxPage — assert the fields exist
      const asInboxPage: InboxPage = sentPage;
      expect(asInboxPage.total).toBe(24);
      expect(asInboxPage.page).toBe(2);
    });
  });
});
