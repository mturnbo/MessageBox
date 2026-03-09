import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Simply blocks the route when the user is not authenticated.
 * No redirect — the app-shell (App component) owns the login modal and
 * displays it whenever isLoggedIn() is false.
 */
export const authGuard: CanActivateFn = () => inject(AuthService).isLoggedIn();
