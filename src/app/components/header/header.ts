import { Component, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Toolbar } from 'primeng/toolbar';
import { Button } from 'primeng/button';
import { Avatar } from 'primeng/avatar';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ComposeModalComponent } from '../compose-modal/compose-modal';

@Component({
  selector: 'app-header',
  imports: [Toolbar, Button, Avatar, Menu, RouterLink, RouterLinkActive, ComposeModalComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  showCompose = false;
  menuItems: MenuItem[] = [];

  readonly isLoggedIn  = computed(() => this.authService.isLoggedIn());
  readonly currentUser = computed(() => this.authService.currentUser());
  readonly inboxUnread = computed(() => this.notificationService.inboxUnread());
  readonly sentTotal   = computed(() => this.notificationService.sentTotal());

  constructor(
    private authService:         AuthService,
    private notificationService: NotificationService,
  ) {
    this.menuItems = [
      {
        label: 'Sign out',
        icon: 'pi pi-sign-out',
        command: () => this.authService.logout(),
      },
    ];
  }

  openCompose(): void {
    this.showCompose = true;
  }

  onComposeClose(): void {
    this.showCompose = false;
  }
}
