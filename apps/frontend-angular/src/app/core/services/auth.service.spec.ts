import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth.service';
import { AuthUser, LoginResponse } from '../../models/user.model';

const TOKEN_KEY = 'mb_token';
const USER_KEY = 'mb_user';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login()', () => {
    it('should set currentUser signal and write to localStorage on success', () => {
      const mockResponse: LoginResponse = { username: 'alice', token: 'tok123' };

      service.login({ username: 'alice', password: 'pass' }).subscribe();

      const req = httpMock.expectOne('/auth');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      expect(service.currentUser()).toEqual({ username: 'alice', token: 'tok123' });
      expect(service.isLoggedIn()).toBe(true);
      expect(service.token()).toBe('tok123');
      expect(localStorage.getItem(TOKEN_KEY)).toBe('tok123');
      const stored: AuthUser = JSON.parse(localStorage.getItem(USER_KEY)!);
      expect(stored.username).toBe('alice');
    });

    it('should propagate HTTP errors to the caller', () => {
      let errorStatus = 0;
      service.login({ username: 'alice', password: 'wrong' }).subscribe({
        error: (err) => (errorStatus = err.status),
      });

      const req = httpMock.expectOne('/auth');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      expect(errorStatus).toBe(401);
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('logout()', () => {
    it('should clear the currentUser signal and localStorage', () => {
      // Seed a logged-in state
      localStorage.setItem(TOKEN_KEY, 'tok123');
      localStorage.setItem(USER_KEY, JSON.stringify({ username: 'alice', token: 'tok123' }));

      // Re-create service so it picks up stored user
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
        ],
      });
      const freshService = TestBed.inject(AuthService);
      expect(freshService.isLoggedIn()).toBe(true);

      freshService.logout();

      expect(freshService.isLoggedIn()).toBe(false);
      expect(freshService.currentUser()).toBeNull();
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
      expect(localStorage.getItem(USER_KEY)).toBeNull();
    });

    it('should navigate to / on logout', () => {
      const navigateSpy = vi.spyOn(TestBed.inject(Router), 'navigate');
      service.logout();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
    });
  });

  describe('session restoration', () => {
    it('should restore currentUser from localStorage on construction', () => {
      const stored: AuthUser = { username: 'bob', token: 'restored-tok' };
      localStorage.setItem(USER_KEY, JSON.stringify(stored));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
        ],
      });
      const freshService = TestBed.inject(AuthService);

      expect(freshService.isLoggedIn()).toBe(true);
      expect(freshService.currentUser()?.username).toBe('bob');
      expect(freshService.token()).toBe('restored-tok');
    });

    it('should start with null user when localStorage is empty', () => {
      expect(service.isLoggedIn()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });
  });
});
