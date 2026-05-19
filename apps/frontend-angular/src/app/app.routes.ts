import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inbox',
    pathMatch: 'full',
  },
  {
    path: 'inbox',
    loadComponent: () => import('./components/inbox/inbox').then((m) => m.InboxComponent),
    canActivate: [authGuard],
  },
  {
    path: 'sent',
    loadComponent: () =>
      import('./components/sent-messages/sent-messages').then((m) => m.SentMessagesComponent),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'inbox',
  },
];
