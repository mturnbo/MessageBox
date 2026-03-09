import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { FloatLabel } from 'primeng/floatlabel';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-modal',
  imports: [Dialog, ReactiveFormsModule, InputText, Password, Button, Message, FloatLabel],
  templateUrl: './login-modal.html',
  styleUrl: './login-modal.scss',
})
export class LoginModalComponent {
  @Input() visible = false;
  /** Emitted when the dialog requests close (e.g. backdrop click — kept blocked via [closable]=false). */
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() loginSuccess = new EventEmitter<void>();

  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  loading      = false;
  errorMessage = '';

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading      = true;
    this.errorMessage = '';

    const { username, password } = this.form.value;
    this.authService.login({ username: username!, password: password! }).subscribe({
      next: () => {
        this.loading = false;
        this.loginSuccess.emit();
      },
      error: (err: { status: number }) => {
        this.loading = false;
        this.form.controls.password.reset();
        this.errorMessage =
          err.status === 400 || err.status === 401
            ? 'Invalid username or password.'
            : 'Unable to connect. Please try again.';
      },
    });
  }
}
