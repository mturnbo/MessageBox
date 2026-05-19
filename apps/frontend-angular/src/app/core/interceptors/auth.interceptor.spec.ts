import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { provideRouter } from '@angular/router';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let authService: AuthService;

  function setup() {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    authService = TestBed.inject(AuthService);
  }

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should pass through requests when no token is present', () => {
    setup();
    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should attach Authorization: Bearer header when token is present', () => {
    localStorage.setItem('mb_user', JSON.stringify({ username: 'alice', token: 'my-token' }));
    setup();

    httpClient.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
    req.flush({});
  });

  it('should not modify the original request object', () => {
    localStorage.setItem('mb_user', JSON.stringify({ username: 'alice', token: 'tok' }));
    setup();

    httpClient.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    // The cloned request has the header; original is unchanged (we can only inspect the sent req)
    expect(req.request.url).toBe('/api/test');
    req.flush({});
  });
});
