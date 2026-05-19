import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Divider } from 'primeng/divider';

import { Message } from '../../models/message.model';

@Component({
  selector: 'app-message-view-modal',
  imports: [Dialog, Button, Tag, Divider, DatePipe],
  templateUrl: './message-view-modal.html',
  styleUrl: './message-view-modal.scss',
})
export class MessageViewModalComponent {
  @Input() visible = false;
  @Input() message: Message | null = null;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}
