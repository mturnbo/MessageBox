import { Component, Output, EventEmitter } from '@angular/core';

/** Stub — will be replaced in Phase 5. */
@Component({
  selector: 'app-header',
  template: '<header></header>',
})
export class HeaderComponent {
  @Output() openCompose = new EventEmitter<void>();
}
