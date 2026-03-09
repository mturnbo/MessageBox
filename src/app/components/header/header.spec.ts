import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';
import { HeaderComponent } from './header';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: AuthService;
  let notificationService: NotificationService;

  function setupLoggedIn() {
    localStorage.setItem('mb_user', JSON.stringify({ username: 'alice', token: 'tok' }));
  }

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();

    fixture           = TestBed.createComponent(HeaderComponent);
    component         = fixture.componentInstance;
    authService       = TestBed.inject(AuthService);
    notificationService = TestBed.inject(NotificationService);
    fixture.detectChanges();
  }

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  describe('navigation links', () => {
    it('should render Inbox and Sent links when logged in', async () => {
      setupLoggedIn();
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      // Angular router bindings don't create HTML attributes — query by class
      const navLinks = Array.from(el.querySelectorAll('a.mb-header__nav-btn'));
      expect(navLinks.length).toBe(2);
      // Check the actions container is present
      expect(el.querySelector('.mb-header__actions')).toBeTruthy();
    });

    it('should not render nav actions when not logged in', async () => {
      await createComponent();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.mb-header__actions')).toBeNull();
    });
  });

  describe('notification badges', () => {
    it('inboxUnread() should reflect NotificationService.inboxUnread signal', async () => {
      await createComponent();
      notificationService.setInboxUnread(3);
      expect(component.inboxUnread()).toBe(3);
    });

    it('inboxUnread() should be 0 when no unread messages', async () => {
      await createComponent();
      notificationService.setInboxUnread(0);
      expect(component.inboxUnread()).toBe(0);
    });

    it('sentTotal() should reflect NotificationService.sentTotal signal', async () => {
      await createComponent();
      notificationService.setSentTotal(7);
      expect(component.sentTotal()).toBe(7);
    });

    it('sentTotal() should be 0 by default', async () => {
      await createComponent();
      expect(component.sentTotal()).toBe(0);
    });
  });

  describe('compose', () => {
    it('openCompose() should set showCompose to true', async () => {
      await createComponent();
      expect(component.showCompose).toBe(false);
      component.openCompose();
      expect(component.showCompose).toBe(true);
    });

    it('onComposeClose() should set showCompose to false', async () => {
      await createComponent();
      component.showCompose = true;
      component.onComposeClose();
      expect(component.showCompose).toBe(false);
    });
  });

  describe('sign out', () => {
    it('should call authService.logout() when sign out menu item command runs', async () => {
      await createComponent();
      const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => {});
      // Invoke the menu item command directly (as clicking the popup menu in DOM is complex)
      component.menuItems[0].command!({});
      expect(logoutSpy).toHaveBeenCalled();
    });
  });
});
