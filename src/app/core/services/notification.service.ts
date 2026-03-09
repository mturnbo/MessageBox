import { Injectable, OnDestroy, signal } from '@angular/core';
import { Subject, interval, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MessageService } from './message.service';
import { Message } from '../../models/message.model';
import { environment } from '../../../environments/environment';

export interface NewMessageNotification {
  message: Message;
  senderName: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private pollingSubscription?: Subscription;
  private lastChecked = new Date();
  private currentUserId: number | null = null;

  readonly newMessage$ = new Subject<NewMessageNotification>();
  /** In-session counter incremented by polling when new messages arrive. */
  readonly unreadCount = signal(0);
  /** Total unread messages in inbox — set by InboxComponent after each load. */
  readonly inboxUnread = signal(0);
  /** Total messages in sent folder — set by SentMessagesComponent after each load. */
  readonly sentTotal = signal(0);

  constructor(private messageService: MessageService) {}

  startPolling(userId: number): void {
    this.currentUserId = userId;
    this.lastChecked = new Date();
    this.stopPolling();

    this.pollingSubscription = interval(environment.pollingIntervalMs)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.checkForNewMessages());
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
  }

  /**
   * Emit a notification immediately (called after a message is created).
   * In a production app this would use WebSockets / SSE.
   */
  notifyNewMessage(message: Message, senderName: string): void {
    this.newMessage$.next({ message, senderName });
    this.unreadCount.update((c) => c + 1);
  }

  setInboxUnread(count: number): void {
    this.inboxUnread.set(count);
  }

  setSentTotal(count: number): void {
    this.sentTotal.set(count);
  }

  resetUnread(): void {
    this.unreadCount.set(0);
  }

  private checkForNewMessages(): void {
    if (!this.currentUserId) return;
    this.messageService.getInbox(this.currentUserId, 1, 5).subscribe({
      next: (page) => {
        const fresh = page.messages.filter(
          (m) => !m.readAt && new Date(m.sentAt) > this.lastChecked,
        );
        fresh.forEach((m) => {
          const senderName = m.senderName ?? `User #${m.senderId}`;
          this.newMessage$.next({ message: m, senderName });
        });
        if (fresh.length > 0) {
          this.unreadCount.update((c) => c + fresh.length);
          this.inboxUnread.update((c) => c + fresh.length);
          this.lastChecked = new Date();
        }
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
