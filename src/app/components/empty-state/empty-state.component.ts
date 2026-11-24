import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state-card" role="status" aria-live="polite">
      <div class="empty-state-icon-wrapper" aria-hidden="true">
        <svg class="empty-state-icon" viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 4H3l7 8.5V19l4 2v-8.5L21 4z"/>
          <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
      </div>
      <h3 class="empty-state-title">No Matching Alerts Found</h3>
      <p class="empty-state-description">
        No system alerts match the currently applied combination of filters.
        @if (activeFilterCount() > 0) {
          Try loosening one or more filters.
        }
      </p>
      <button
        type="button"
        (click)="clearFilters.emit()"
        class="empty-state-action-btn"
        aria-label="Clear all applied filters"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M1 4v6h6M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
        <span>Clear All Filters</span>
      </button>
    </div>
  `,
  styles: [`
    .empty-state-card {
      background: var(--bg-surface);
      border: 1px dashed var(--border-color);
      border-radius: 10px;
      padding: 48px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .empty-state-icon-wrapper {
      background: var(--bg-surface-elevated);
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .empty-state-icon {
      color: var(--text-muted);
    }
    .empty-state-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }
    .empty-state-description {
      font-size: 0.875rem;
      color: var(--text-secondary);
      max-width: 400px;
      margin-bottom: 20px;
    }
    .empty-state-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--accent-primary);
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .empty-state-action-btn:hover {
      background: var(--accent-primary-hover);
    }
  `]
})
export class EmptyStateComponent {
  public readonly activeFilterCount = input<number>(0);
  public readonly clearFilters = output<void>();
}
