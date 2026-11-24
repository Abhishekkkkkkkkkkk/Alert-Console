import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-severity-chip',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      [class]="'severity-chip ' + chipClass()"
      role="status"
      [attr.aria-label]="'Severity: ' + label()"
    >
      {{ label() }}
    </span>
  `,
  styles: [`
    .severity-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 3px 12px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      white-space: nowrap;
      color: #ffffff;
    }
    /* Exact Wireframe Colors conforming to accessibility guidelines */
    /* CRITICAL: dark red */
    .severity-critical {
      background-color: #7f1d1d;
    }
    /* HIGH: red */
    .severity-high {
      background-color: #ef4444;
    }
    /* MEDIUM: yellow/amber */
    .severity-medium {
      background-color: #d97706;
    }
    /* LOW: green */
    .severity-low {
      background-color: #10b981;
    }
  `]
})
export class SeverityChipComponent {
  public readonly severity = input<string>('LOW');

  public readonly label = computed(() => (this.severity() || 'LOW').toUpperCase());

  public readonly chipClass = computed(() => {
    switch (this.label()) {
      case 'CRITICAL':
        return 'severity-critical';
      case 'HIGH':
        return 'severity-high';
      case 'MEDIUM':
        return 'severity-medium';
      case 'LOW':
      default:
        return 'severity-low';
    }
  });
}
