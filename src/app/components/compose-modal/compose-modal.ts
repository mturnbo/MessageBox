import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Button } from 'primeng/button';
import { AutoComplete, AutoCompleteCompleteEvent } from 'primeng/autocomplete';
import { Message as PrimeMessage } from 'primeng/message';
import { MessageService as PrimeMessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';

import { MessageService } from '../../core/services/message.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-compose-modal',
  imports: [
    Dialog,
    ReactiveFormsModule,
    InputText,
    Textarea,
    Button,
    AutoComplete,
    PrimeMessage,
    Toast,
  ],
  providers: [PrimeMessageService],
  templateUrl: './compose-modal.html',
  styleUrl: './compose-modal.scss',
})
export class ComposeModalComponent implements OnInit {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
  @Output() sent = new EventEmitter<void>();

  form: FormGroup;
  loading = false;
  errorMessage = '';

  allUsers: User[] = [];
  filteredUsers: User[] = [];
  selectedRecipient: User | null = null;
  private currentUserId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private userService: UserService,
    private authService: AuthService,
    private primeMessageService: PrimeMessageService,
  ) {
    this.form = this.fb.group({
      recipient: [null, Validators.required],
      subject: [''],
      body: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    const username = this.authService.currentUser()?.username;
    if (username) {
      this.userService.getUserById(username).subscribe({
        next: (user) => {
          this.currentUserId = user.id;
          this.loadUsers();
        },
      });
    }
  }

  private loadUsers(): void {
    this.userService.getAllUsers(100, 1).subscribe({
      next: (users) => {
        this.allUsers = users.filter((u) => u.id !== this.currentUserId);
      },
    });
  }

  searchUsers(event: AutoCompleteCompleteEvent): void {
    const query = event.query.toLowerCase();
    this.filteredUsers = this.allUsers.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        (u.firstName + ' ' + u.lastName).toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query),
    );
  }

  getUserLabel(user: User): string {
    const name = `${user.firstName} ${user.lastName}`.trim();
    return name ? `${name} (${user.username})` : user.username;
  }

  onSubmit(): void {
    if (this.form.invalid || !this.currentUserId) return;

    const recipient: User = this.form.value.recipient;
    if (!recipient?.id) {
      this.errorMessage = 'Please select a valid recipient.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.messageService
      .createMessage({
        senderId: this.currentUserId,
        recipientId: recipient.id,
        subject: this.form.value.subject || undefined,
        body: this.form.value.body,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.primeMessageService.add({
            severity: 'success',
            summary: 'Sent',
            detail: 'Your message has been sent.',
            life: 3000,
          });
          this.sent.emit();
          this.resetAndClose();
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Failed to send message. Please try again.';
        },
      });
  }

  private resetAndClose(): void {
    this.form.reset();
    this.selectedRecipient = null;
    this.close.emit();
  }

  onClose(): void {
    this.resetAndClose();
  }
}
