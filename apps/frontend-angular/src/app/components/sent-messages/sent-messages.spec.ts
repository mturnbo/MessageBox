import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { of } from 'rxjs';

import { SentMessagesComponent } from './sent-messages';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { Message } from '../../models/message.model';
import { AuthUser, User } from '../../models/user.model';

const now = new Date().toISOString();

const mockAuthUser: AuthUser = { username: 'alice', token: 'tok', userId: 1 };

const mockCurrentUser: User = {
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
};

const mockRecipient: User = {
  id: 2,
  username: 'bob',
  email: 'bob@example.com',
  firstName: 'Bob',
  lastName: 'Jones',
};

const mockMessages: Message[] = [
  {
    id: 10,
    senderId: 1,
    recipientId: 2,
    subject: 'Hey Bob',
    body: 'Just checking in',
    sentAt: now,
  },
  {
    id: 11,
    senderId: 1,
    recipientId: 2,
    subject: 'Follow-up',
    body: 'Did you get my last message?',
    sentAt: now,
  },
];

describe('SentMessagesComponent', () => {
  let component: SentMessagesComponent;
  let fixture: ComponentFixture<SentMessagesComponent>;
  let messageService: MessageService;
  let userService: UserService;
  let notificationService: NotificationService;
  let authService: AuthService;

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [SentMessagesComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SentMessagesComponent);
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

  async function flushAsync(): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  }

  function setupDefaultSpies(messages = mockMessages) {
    vi.spyOn(authService, 'currentUser').mockReturnValue(
      mockAuthUser as ReturnType<typeof authService.currentUser>,
    );
    vi.spyOn(userService, 'getUserById').mockImplementation((id) => {
      if (id === 'alice' || id === 1) return of(mockCurrentUser);
      return of(mockRecipient);
    });
    vi.spyOn(messageService, 'getSent').mockReturnValue(
      of({ messages, total: messages.length, page: 1, limit: 10 }),
    );
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
    it('should render sent messages with recipient names', async () => {
      await createComponent();
      setupDefaultSpies();

      fixture.detectChanges();
      await flushAsync();

      expect(component.messages().length).toBe(2);
      expect(component.messages()[0].recipientName).toBe('Bob Jones');
    });

    it('should show empty state when no sent messages', async () => {
      await createComponent();
      setupDefaultSpies([]);

      fixture.detectChanges();
      await flushAsync();

      expect(component.messages().length).toBe(0);
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.mb-sent__empty')).toBeTruthy();
    });

    it('should call setSentTotal with total from API', async () => {
      await createComponent();
      setupDefaultSpies();
      const setSentTotalSpy = vi.spyOn(notificationService, 'setSentTotal');

      fixture.detectChanges();
      await flushAsync();

      expect(setSentTotalSpy).toHaveBeenCalledWith(mockMessages.length);
    });
  });

  describe('openMessage', () => {
    it('should set selectedMessage and showMessageView on openMessage()', async () => {
      await createComponent();
      setupDefaultSpies();

      fixture.detectChanges();
      await flushAsync();

      component.openMessage(mockMessages[0]);

      expect(component.selectedMessage()).toBe(mockMessages[0]);
      expect(component.showMessageView()).toBe(true);
    });

    it('should clear selectedMessage and hide modal on onMessageViewClose()', async () => {
      await createComponent();
      setupDefaultSpies();

      fixture.detectChanges();
      await flushAsync();

      component.openMessage(mockMessages[0]);
      component.onMessageViewClose();

      expect(component.selectedMessage()).toBeNull();
      expect(component.showMessageView()).toBe(false);
    });
  });
});
