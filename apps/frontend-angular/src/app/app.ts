import { Component, computed, effect, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Toast } from 'primeng/toast';
import { MessageService as PrimeMessageService } from 'primeng/api';

import { HeaderComponent } from './components/header/header';
import { LoginModalComponent } from './components/login-modal/login-modal';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast, HeaderComponent, LoginModalComponent],
  providers: [PrimeMessageService],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private authService         = inject(AuthService);
  private notificationService = inject(NotificationService);
  private primeMessageService = inject(PrimeMessageService);
  private router              = inject(Router);

  /** Derived from auth state — updates instantly when the user logs in or out. */
  readonly showLogin = computed(() => !this.authService.isLoggedIn());

  constructor() {
    // Side-effect only: stop polling when the user logs out.
    effect(() => {
      if (!this.authService.isLoggedIn()) {
        this.notificationService.stopPolling();
      }
    });

    // Show a global toast when a new message notification arrives.
    this.notificationService.newMessage$.subscribe((n) =>
      this.primeMessageService.add({
        severity: 'info',
        summary:  `New message from ${n.senderName}`,
        detail:   n.message.subject ?? '(no subject)',
        life:     6000,
        icon:     'pi pi-envelope',
      })
    );
  }

  onLoginSuccess(): void {
    // showLogin resets automatically via computed().
    // Navigate so the guarded inbox route now activates.
    this.router.navigate(['/inbox']);
  }
}
