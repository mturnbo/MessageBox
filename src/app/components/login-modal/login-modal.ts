import { Component, Input, Output, EventEmitter } from '@angular/core';

/** Stub — will be replaced in Phase 4. */
@Component({
  selector: 'app-login-modal',
  template: '',
})
export class LoginModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() loginSuccess = new EventEmitter<void>();
}
