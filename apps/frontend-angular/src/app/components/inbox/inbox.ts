import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Paginator, PaginatorState } from 'primeng/paginator';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { Card } from 'primeng/card';
import { Divider } from 'primeng/divider';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { Message } from '../../models/message.model';
import { User } from '../../models/user.model';
import { MessageViewModalComponent } from '../message-view-modal/message-view-modal';
import { ComposeModalComponent } from '../compose-modal/compose-modal';

@Component({
  selector: 'app-inbox',
  imports: [
    Paginator,
    Button,
    Tag,
    Skeleton,
    Card,
    Divider,
    DatePipe,
    Toast,
    MessageViewModalComponent,
    ComposeModalComponent,
  ],
  providers: [PrimeMessageService],
  templateUrl: './inbox.html',
  styleUrl: './inbox.scss',
})
export class InboxComponent implements OnInit, OnDestroy {
  messages = signal<Message[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  page = signal(1);
  readonly pageSize = 10;

  selectedMessage = signal<Message | null>(null);
  showMessageView = signal(false);
  replyingTo = signal<Message | null>(null);
  showReply = signal(false);

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

    this.notificationService.newMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadMessages());
  }

  private resolveCurrentUserId(): void {
    const username = this.authService.currentUser()?.username;
    if (!username) return;

    this.userService.getUserById(username).subscribe({
      next: (user) => {
        this.currentUserId = user.id;
        this.notificationService.startPolling(user.id);
        this.loadMessages();
      },
    });
  }

  loadMessages(): void {
    if (!this.currentUserId) return;
    this.loading.set(true);

    this.messageService.getInbox(this.currentUserId, this.page(), this.pageSize).subscribe({
      next: (page) => {
        this.enrichMessages(page.messages).then((enriched) => {
          this.messages.set(enriched);
          this.totalRecords.set(page.total);
          const unread = enriched.filter((m) => !m.readAt).length;
          this.notificationService.setInboxUnread(unread);
          this.loading.set(false);
        });
      },
      error: () => {
        this.loading.set(false);
        this.primeMessageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Could not load messages. Make sure the API inbox endpoint is available.',
        });
      },
    });
  }

  private async enrichMessages(messages: Message[]): Promise<Message[]> {
    const senderIds = [...new Set(messages.map((m) => m.senderId))];
    await Promise.all(
      senderIds.map((id) =>
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
      const sender = this.userCache.get(m.senderId);
      return {
        ...m,
        senderName: sender
          ? `${sender.firstName} ${sender.lastName}`.trim() || sender.username
          : `User #${m.senderId}`,
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

    if (!message.readAt && this.currentUserId) {
      this.messageService.markAsRead({ id: message.id }).subscribe({
        next: () => {
          this.messages.update((msgs) =>
            msgs.map((m) => (m.id === message.id ? { ...m, readAt: new Date().toISOString() } : m)),
          );
          this.notificationService.setInboxUnread(
            Math.max(0, this.notificationService.inboxUnread() - 1),
          );
        },
      });
    }
  }

  archiveMessage(message: Message, event: Event): void {
    event.stopPropagation();
    if (!this.currentUserId) return;

    this.messageService
      .archiveMessage({ id: message.id, deletedBy: this.currentUserId })
      .subscribe({
        next: () => {
          this.messages.update((msgs) => msgs.filter((m) => m.id !== message.id));
          this.totalRecords.update((t) => t - 1);
          this.primeMessageService.add({
            severity: 'success',
            summary: 'Archived',
            detail: 'Message archived successfully.',
            life: 3000,
          });
        },
        error: () => {
          this.primeMessageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Could not archive message.',
          });
        },
      });
  }

  isUnread(message: Message): boolean {
    return !message.readAt;
  }

  onMessageViewClose(): void {
    this.showMessageView.set(false);
    this.selectedMessage.set(null);
  }

  onReply(message: Message): void {
    this.showMessageView.set(false);
    this.selectedMessage.set(null);
    this.replyingTo.set(message);
    this.showReply.set(true);
  }

  onReplyClose(): void {
    this.showReply.set(false);
    this.replyingTo.set(null);
  }

  onReplySent(): void {
    this.onReplyClose();
    this.loadMessages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.notificationService.stopPolling();
  }
}
