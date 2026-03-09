import { Component, Input, Output, EventEmitter } from '@angular/core';

/** Stub — will be replaced in Phase 8. */
@Component({
  selector: 'app-compose-modal',
  template: '',
})
export class ComposeModalComponent {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
  @Output() sent  = new EventEmitter<void>();
}
