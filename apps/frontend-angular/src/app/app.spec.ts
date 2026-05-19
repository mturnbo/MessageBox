import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { vi } from 'vitest';
import { App } from './app';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { Router } from '@angular/router';

describe('App (shell)', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimationsAsync(),
      ],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('showLogin should be true when not authenticated', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.showLogin()).toBe(true);
  });

  it('showLogin should be false when authenticated', () => {
    localStorage.setItem('mb_user', JSON.stringify({ username: 'alice', token: 'tok' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimationsAsync(),
      ],
    });
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance.showLogin()).toBe(false);
  });

  it('onLoginSuccess() should navigate to /inbox', () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    fixture.componentInstance.onLoginSuccess();
    expect(navigateSpy).toHaveBeenCalledWith(['/inbox']);
  });

  it('should render app-header', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-header')).toBeTruthy();
  });

  it('should render app-login-modal', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-login-modal')).toBeTruthy();
  });

  describe('notification polling integration', () => {
    it('should call stopPolling when the user logs out', () => {
      localStorage.setItem('mb_user', JSON.stringify({ username: 'alice', token: 'tok' }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [App],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          provideAnimationsAsync(),
        ],
      });

      const notificationService = TestBed.inject(NotificationService);
      const authService = TestBed.inject(AuthService);
      const stopPollingSpy = vi.spyOn(notificationService, 'stopPolling');

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      authService.logout();
      fixture.detectChanges(); // effect re-evaluates after signal change

      expect(stopPollingSpy).toHaveBeenCalled();
    });

    it('should expose newMessage$ subject on NotificationService', () => {
      const notificationService = TestBed.inject(NotificationService);
      // Verify the subject is observable so the app.ts subscription can receive events
      let received = false;
      notificationService.newMessage$.subscribe(() => { received = true; });
      notificationService.notifyNewMessage(
        { id: 1, senderId: 2, recipientId: 3, sentAt: new Date().toISOString() },
        'Bob Jones',
      );
      expect(received).toBe(true);
    });
  });
});
