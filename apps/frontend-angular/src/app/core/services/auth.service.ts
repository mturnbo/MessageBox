import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser, LoginRequest, LoginResponse } from '../../models/user.model';

const TOKEN_KEY = 'mb_token';
const USER_KEY = 'mb_user';
const REFRESH_TOKEN_KEY = 'mb_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<AuthUser | null>(this.loadStoredUser());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => !!this._currentUser());
  readonly token = computed(() => this._currentUser()?.token ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    console.log('AuthService.login()', `${environment.apiUrl}/v1/auth`);
    return this.http.post<LoginResponse>(`${environment.apiUrl}/v1/auth`, credentials).pipe(
      tap((response) => {
        const authUser: AuthUser = {
          username: response.username,
          token: response.token,
          refreshToken: response.refreshToken,
        };
        this._currentUser.set(authUser);
        localStorage.setItem(TOKEN_KEY, response.token);
        localStorage.setItem(USER_KEY, JSON.stringify(authUser));
        if (response.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
        }
      })
    );
  }

  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    this.router.navigate(['/']);
  }

  refreshAccessToken(): Observable<{ token: string }> {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http
      .post<{ token: string }>(`${environment.apiUrl}/v1/auth/refresh`, { refreshToken })
      .pipe(
        tap((response) => {
          const currentUser = this._currentUser();
          if (currentUser) {
            const updated = { ...currentUser, token: response.token };
            this._currentUser.set(updated);
            localStorage.setItem(TOKEN_KEY, response.token);
            localStorage.setItem(USER_KEY, JSON.stringify(updated));
          }
        })
      );
  }

  private loadStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
