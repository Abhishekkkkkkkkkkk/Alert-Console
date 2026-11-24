import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      [class]="'status-chip ' + chipClass() + (isOptimistic() || isSaving() ? ' status-optimistic' : '')"
      role="status"
      [attr.aria-label]="'Status: ' + displayLabel()"
    >
      @if (isSaving() || isOptimistic()) {
        <span class="chip-spinner-dot" aria-hidden="true"></span>
      }
      {{ displayLabel() }}
    </span>
  `,
  styles: [`
    .status-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 3px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
      color: #ffffff;
      transition: all 0.2s ease;
    }
    .status-open {
      background-color: #2563eb; /* Blue */
    }
    .status-escalated {
      background-color: #ea580c; /* Orange */
    }
    .status-autoclosed {
      background-color: #64748b; /* Gray */
    }
    .status-resolved {
      background-color: #059669; /* Green */
    }
    .status-optimistic {
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
    }
    .chip-spinner-dot {
      width: 8px;
      height: 8px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class StatusChipComponent {
  public readonly status = input<string>('OPEN');
  public readonly isOptimistic = input<boolean>(false);
  public readonly isSaving = input<boolean>(false);

  public readonly norm = computed(() => (this.status() || 'OPEN').toUpperCase());

  public readonly displayLabel = computed(() => {
    if (this.norm() === 'AUTO_CLOSED') {
      return 'AUTO-CLOSED';
    }
    if (this.norm() === 'RESOLVED' && (this.isOptimistic() || this.isSaving())) {
      return 'RESOLVED (pending)';
    }
    return this.norm();
  });

  public readonly chipClass = computed(() => {
    switch (this.norm()) {
      case 'OPEN':
        return 'status-open';
      case 'ESCALATED':
        return 'status-escalated';
      case 'AUTO_CLOSED':
        return 'status-autoclosed';
      case 'RESOLVED':
        return 'status-resolved';
      default:
        return 'status-default';
    }
  });
}
