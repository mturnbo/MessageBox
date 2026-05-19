import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { of } from 'rxjs';

import { InboxComponent } from './inbox';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { Message } from '../../models/message.model';
import { AuthUser, User } from '../../models/user.model';

const now = new Date().toISOString();

/** AuthUser returned by authService.currentUser() */
const mockAuthUser: AuthUser = { username: 'alice', token: 'tok', userId: 1 };

/** Full User record returned by userService.getUserById() */
const mockCurrentUser: User = {
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
};

const mockSender: User = {
  id: 2,
  username: 'bob',
  email: 'bob@example.com',
  firstName: 'Bob',
  lastName: 'Jones',
};

const mockMessages: Message[] = [
  {
    id: 1,
    senderId: 2,
    recipientId: 1,
    subject: 'Hello',
    body: 'Hi there',
    sentAt: now,
    readAt: undefined,
  },
  {
    id: 2,
    senderId: 2,
    recipientId: 1,
    subject: 'Meeting',
    body: 'Meeting at 3pm',
    sentAt: now,
    readAt: now, // already read
  },
];

describe('InboxComponent', () => {
  let component: InboxComponent;
  let fixture: ComponentFixture<InboxComponent>;
  let messageService: MessageService;
  let userService: UserService;
  let notificationService: NotificationService;
  let authService: AuthService;

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [InboxComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InboxComponent);
    component = fixture.componentInstance;
    messageService = TestBed.inject(MessageService);
    userService = TestBed.inject(UserService);
    notificationService = TestBed.inject(NotificationService);
    authService = TestBed.inject(AuthService);
  }

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  /**
   * Wait for all pending microtasks (including Promise.all chains inside
   * enrichMessages) to flush before asserting on component state.
   * fixture.whenStable() alone doesn't wait for arbitrary Promise chains
   * in Vitest's jsdom environment, so we defer to the next event-loop tick.
   */
  async function flushAsync(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  /** Set up default service spies for a logged-in user with messages. */
  function setupDefaultSpies(messages = mockMessages) {
    vi.spyOn(authService, 'currentUser').mockReturnValue(
      mockAuthUser as ReturnType<typeof authService.currentUser>,
    );
    vi.spyOn(userService, 'getUserById').mockImplementation((id) => {
      if (id === 'alice' || id === 1) return of(mockCurrentUser);
      return of(mockSender);
    });
    vi.spyOn(messageService, 'getInbox').mockReturnValue(
      of({ messages, total: messages.length, page: 1, limit: 10 }),
    );
    vi.spyOn(notificationService, 'startPolling').mockImplementation(() => {});
  }

  it('should create', async () => {
    await createComponent();
    vi.spyOn(authService, 'currentUser').mockReturnValue(
      null as ReturnType<typeof authService.currentUser>,
    );
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('message loading', () => {
    it('should render message list with correct sender names', async () => {
      await createComponent();
      setupDefaultSpies();

      fixture.detectChanges();
      await flushAsync();

      expect(component.messages().length).toBe(2);
      // Both messages share senderId=2, so they should be enriched with Bob Jones
      expect(component.messages()[0].senderName).toBe('Bob Jones');
    });

    it('should show empty state when no messages', async () => {
      await createComponent();
      setupDefaultSpies([]);

      fixture.detectChanges();
      await flushAsync();

      expect(component.messages().length).toBe(0);
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.mb-inbox__empty')).toBeTruthy();
    });

    it('should call setInboxUnread with unread count after load', async () => {
      await createComponent();
      setupDefaultSpies();
      const setUnreadSpy = vi.spyOn(notificationService, 'setInboxUnread');

      fixture.detectChanges();
      await flushAsync();

      // 1 of the 2 mock messages has readAt undefined (unread)
      expect(setUnreadSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('openMessage', () => {
    it('should decrement inboxUnread when opening an unread message', async () => {
      await createComponent();
      setupDefaultSpies();
      vi.spyOn(messageService, 'markAsRead').mockReturnValue(of({ status: 'ok' }));

      fixture.detectChanges();
      await flushAsync();

      notificationService.setInboxUnread(3);
      const unreadMsg = mockMessages[0]; // readAt is undefined
      component.openMessage(unreadMsg);
      // markAsRead returns of({status:'ok'}) which resolves synchronously
      // but the subscription callback still runs as a microtask
      await flushAsync();

      expect(notificationService.inboxUnread()).toBe(2);
    });

    it('should NOT call markAsRead when message is already read', async () => {
      await createComponent();
      setupDefaultSpies();
      const markReadSpy = vi.spyOn(messageService, 'markAsRead');

      fixture.detectChanges();
      await flushAsync();

      const readMsg = mockMessages[1]; // readAt is set
      component.openMessage(readMsg);

      expect(markReadSpy).not.toHaveBeenCalled();
    });
  });

  describe('archiveMessage', () => {
    it('should remove message from list after archive', async () => {
      await createComponent();
      setupDefaultSpies();
      vi.spyOn(messageService, 'archiveMessage').mockReturnValue(of({ status: 'ok' }));

      fixture.detectChanges();
      await flushAsync();

      expect(component.messages().length).toBe(2);
      component.archiveMessage(mockMessages[0], new MouseEvent('click'));

      expect(component.messages().length).toBe(1);
      expect(component.messages()[0].id).toBe(2);
    });
  });
});
