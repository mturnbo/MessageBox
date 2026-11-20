import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Skeleton } from 'primeng/skeleton';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { Tag } from 'primeng/tag';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Subject } from 'rxjs';

import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { Message } from '../../models/message.model';
import { User } from '../../models/user.model';
import { MessageViewModalComponent } from '../message-view-modal/message-view-modal';

@Component({
  selector: 'app-sent-messages',
  imports: [
    Paginator,
    Tag,
    Skeleton,
    Card,
    Divider,
    DatePipe,
    Toast,
    MessageViewModalComponent,
  ],
  providers: [PrimeMessageService],
  templateUrl: './sent-messages.html',
  styleUrl: './sent-messages.scss',
})
export class SentMessagesComponent implements OnInit, OnDestroy {
  messages = signal<Message[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  page = signal(1);
  readonly pageSize = 10;

  selectedMessage = signal<Message | null>(null);
  showMessageView = signal(false);

  private destroy$ = new Subject<void>();
  private userCache = new Map<number, User>();
  private currentUserId: number | null = null;

  constructor(
    private messageService: MessageService,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService,
    private primeMessageService: PrimeMessageService,
  ) {}

  ngOnInit(): void {
    this.resolveCurrentUserId();
  }

  private resolveCurrentUserId(): void {
    const username = this.authService.currentUser()?.username;
    if (!username) return;

    this.userService.getUserById(username).subscribe({
      next: (user) => {
        this.currentUserId = user.id;
        this.loadMessages();
      },
    });
  }

  loadMessages(): void {
    if (!this.currentUserId) return;
    this.loading.set(true);

    this.messageService.getSent(this.currentUserId, this.page(), this.pageSize).subscribe({
      next: (page) => {
        this.enrichMessages(page.messages).then((enriched) => {
          this.messages.set(enriched);
          this.totalRecords.set(page.total);
          this.notificationService.setSentTotal(page.total);
          this.loading.set(false);
        });
      },
      error: () => {
        this.loading.set(false);
        this.primeMessageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Could not load sent messages.',
        });
      },
    });
  }

  private async enrichMessages(messages: Message[]): Promise<Message[]> {
    const recipientIds = [...new Set(messages.map((m) => m.recipientId))];
    await Promise.all(
      recipientIds.map((id) =>
        this.userCache.has(id)
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              this.userService.getUserById(id).subscribe({
                next: (u) => {
                  this.userCache.set(id, u);
                  resolve();
                },
                error: () => resolve(),
              });
            }),
      ),
    );

    return messages.map((m) => {
      const recipient = this.userCache.get(m.recipientId);
      return {
        ...m,
        recipientName: recipient
          ? `${recipient.firstName} ${recipient.lastName}`.trim() || recipient.username
          : `User #${m.recipientId}`,
      };
    });
  }

  onPageChange(event: PaginatorState): void {
    this.page.set((event.page ?? 0) + 1);
    this.loadMessages();
  }

  openMessage(message: Message): void {
    this.selectedMessage.set(message);
    this.showMessageView.set(true);
  }

  onMessageViewClose(): void {
    this.showMessageView.set(false);
    this.selectedMessage.set(null);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
