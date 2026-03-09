import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';

import { ComposeModalComponent } from './compose-modal';
import { MessageService } from '../../core/services/message.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User, AuthUser } from '../../models/user.model';
import { Message } from '../../models/message.model';

const mockAuthUser: AuthUser = { username: 'alice', token: 'tok', userId: 1 };

const mockCurrentUser: User = {
  id: 1,
  username: 'alice',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Smith',
};

const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: 2,
    username: 'bob',
    email: 'bob@example.com',
    firstName: 'Bob',
    lastName: 'Jones',
  },
  {
    id: 3,
    username: 'carol',
    email: 'carol@example.com',
    firstName: 'Carol',
    lastName: 'White',
  },
];

const mockSentMessage: Message = {
  id: 99,
  senderId: 1,
  recipientId: 2,
  subject: 'Test',
  body: 'Hello!',
  sentAt: new Date().toISOString(),
};

describe('ComposeModalComponent', () => {
  let component: ComposeModalComponent;
  let fixture: ComponentFixture<ComposeModalComponent>;
  let messageService: MessageService;
  let userService: UserService;
  let authService: AuthService;

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [ComposeModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComposeModalComponent);
    component = fixture.componentInstance;
    component.visible = true;
    messageService = TestBed.inject(MessageService);
    userService = TestBed.inject(UserService);
    authService = TestBed.inject(AuthService);
  }

  function setupDefaultSpies() {
    vi.spyOn(authService, 'currentUser').mockReturnValue(
      mockAuthUser as ReturnType<typeof authService.currentUser>,
    );
    vi.spyOn(userService, 'getUserById').mockReturnValue(of(mockCurrentUser));
    vi.spyOn(userService, 'getAllUsers').mockReturnValue(of(mockUsers));
  }

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('should create', async () => {
    await createComponent();
    vi.spyOn(authService, 'currentUser').mockReturnValue(
      null as ReturnType<typeof authService.currentUser>,
    );
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('form validation', () => {
    it('should be invalid when recipient and body are empty', async () => {
      await createComponent();
      setupDefaultSpies();
      fixture.detectChanges();

      expect(component.form.invalid).toBe(true);
    });

    it('should be invalid when only body is filled (no recipient)', async () => {
      await createComponent();
      setupDefaultSpies();
      fixture.detectChanges();

      component.form.controls['body'].setValue('Hello!');
      expect(component.form.invalid).toBe(true);
    });

    it('should be invalid when only recipient is set (no body)', async () => {
      await createComponent();
      setupDefaultSpies();
      fixture.detectChanges();

      component.form.controls['recipient'].setValue(mockUsers[1]);
      expect(component.form.invalid).toBe(true);
    });

    it('should be valid when both recipient and body are filled', async () => {
      await createComponent();
      setupDefaultSpies();
      fixture.detectChanges();

      component.form.controls['recipient'].setValue(mockUsers[1]);
      component.form.controls['body'].setValue('Hello!');
      expect(component.form.valid).toBe(true);
    });

    it('onSubmit() should do nothing when form is invalid', async () => {
      await createComponent();
      setupDefaultSpies();
      fixture.detectChanges();

      const createSpy = vi.spyOn(messageService, 'createMessage');
      component.onSubmit();
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe('user search', () => {
    it('searchUsers() should filter allUsers by query', async () => {
      await createComponent();
      setupDefaultSpies();
      fixture.detectChanges();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      // allUsers is loaded minus the current user (alice, id=1)
      // so bob and carol are available
      component.searchUsers({ query: 'bob', originalEvent: new Event('input') });

      expect(component.filteredUsers.length).toBe(1);
      expect(component.filteredUsers[0].username).toBe('bob');
    });

    it('searchUsers() should match on firstName + lastName', async () => {
      await createComponent();
      setupDefaultSpies();
      fixture.detectChanges();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      component.searchUsers({ query: 'carol', originalEvent: new Event('input') });
      expect(component.filteredUsers[0].username).toBe('carol');
    });
  });

  describe('send message', () => {
    it('should emit sent and close when message is sent successfully', async () => {
      await createComponent();
      setupDefaultSpies();
      vi.spyOn(messageService, 'createMessage').mockReturnValue(of(mockSentMessage));

      fixture.detectChanges();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      component.form.controls['recipient'].setValue(mockUsers[1]);
      component.form.controls['body'].setValue('Hello there!');

      let sentEmitted = false;
      let closeEmitted = false;
      component.sent.subscribe(() => (sentEmitted = true));
      component.close.subscribe(() => (closeEmitted = true));

      component.onSubmit();

      expect(sentEmitted).toBe(true);
      expect(closeEmitted).toBe(true);
      expect(component.loading).toBe(false);
    });

    it('should show error message on send failure', async () => {
      await createComponent();
      setupDefaultSpies();
      vi.spyOn(messageService, 'createMessage').mockReturnValue(
        throwError(() => new Error('500 Server Error')),
      );

      fixture.detectChanges();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      component.form.controls['recipient'].setValue(mockUsers[1]);
      component.form.controls['body'].setValue('Hello!');
      component.onSubmit();

      expect(component.errorMessage).toBe('Failed to send message. Please try again.');
      expect(component.loading).toBe(false);
    });

    it('should reset form after successful send', async () => {
      await createComponent();
      setupDefaultSpies();
      vi.spyOn(messageService, 'createMessage').mockReturnValue(of(mockSentMessage));

      fixture.detectChanges();
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      component.form.controls['recipient'].setValue(mockUsers[1]);
      component.form.controls['body'].setValue('Hello!');
      component.onSubmit();

      expect(component.form.value.recipient).toBeNull();
      expect(component.form.value.body).toBeNull();
    });
  });
});
