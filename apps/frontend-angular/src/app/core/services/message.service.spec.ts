import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from './message.service';
import { InboxPage, Message } from '../../models/message.model';

const mockMessage: Message = {
  id: 1,
  senderId: 10,
  recipientId: 20,
  subject: 'Hello',
  body: 'World',
  sentAt: '2024-01-15T10:00:00Z',
};

const mockInboxPage: InboxPage = {
  messages: [mockMessage],
  total: 1,
  page: 1,
  limit: 10,
};

describe('MessageService', () => {
  let service: MessageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MessageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getInbox()', () => {
    it('should GET /messages/inbox with recipientId, page=1, limit=10 by default', () => {
      service.getInbox(20).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url.endsWith('/messages/inbox') && r.params.get('recipientId') === '20'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush(mockInboxPage);
    });

    it('should use provided page and limit', () => {
      service.getInbox(20, 2, 5).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url.endsWith('/messages/inbox') && r.params.get('page') === '2'
      );
      expect(req.request.params.get('limit')).toBe('5');
      req.flush(mockInboxPage);
    });
  });

  describe('getSent()', () => {
    it('should GET /messages/sent with senderId, page=1, limit=10 by default', () => {
      service.getSent(10).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url.endsWith('/messages/sent') && r.params.get('senderId') === '10'
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush(mockInboxPage);
    });
  });

  describe('getMessageById()', () => {
    it('should GET /messages/:id', () => {
      service.getMessageById(1).subscribe();
      const req = httpMock.expectOne((r) => r.url.endsWith('/messages/1'));
      expect(req.request.method).toBe('GET');
      req.flush(mockMessage);
    });
  });

  describe('createMessage()', () => {
    it('should POST /messages/post with payload', () => {
      const payload = { clientMessageId: 'test-key-1', senderId: 10, recipientId: 20, subject: 'Hi', body: 'Hey' };
      service.createMessage(payload).subscribe();
      const req = httpMock.expectOne((r) => r.url.endsWith('/messages/post'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockMessage);
    });
  });

  describe('markAsRead()', () => {
    it('should POST /messages/read with payload', () => {
      service.markAsRead({ id: 1 }).subscribe();
      const req = httpMock.expectOne((r) => r.url.endsWith('/messages/read'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ id: 1 });
      req.flush({ status: 'ok' });
    });
  });

  describe('archiveMessage()', () => {
    it('should POST /messages/delete with payload', () => {
      service.archiveMessage({ id: 1, deletedBy: 20 }).subscribe();
      const req = httpMock.expectOne((r) => r.url.endsWith('/messages/delete'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ id: 1, deletedBy: 20 });
      req.flush({ status: 'ok' });
    });
  });
});
