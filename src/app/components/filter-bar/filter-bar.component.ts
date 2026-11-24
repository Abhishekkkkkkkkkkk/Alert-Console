import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { AlertFilters } from '../../models/alert.model';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="filter-header-wrapper">
      <div class="card-title-row">
        <h2 class="card-heading">Alerts ({{ totalCount() }})</h2>
        <div class="filter-counter" aria-live="polite">
          Showing <strong>{{ filteredCount() }}</strong> of <strong>{{ totalCount() }}</strong>
        </div>
      </div>

      <div class="filter-bar" role="search" aria-label="Alert filter controls">
        <div class="filter-group">
          <!-- Status filter -->
          <div class="filter-item">
            <label for="filter-status" class="visually-hidden">Filter by Status</label>
            <select
              id="filter-status"
              class="filter-select"
              [class.filter-active]="filters().status !== 'ALL'"
              [value]="filters().status"
              (change)="onStatusChange($event)"
              aria-label="Filter by Status"
            >
              <option value="ALL">Status ▼</option>
              <option value="OPEN">OPEN</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="AUTO_CLOSED">AUTO-CLOSED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>

          <!-- Severity filter -->
          <div class="filter-item">
            <label for="filter-severity" class="visually-hidden">Filter by Severity</label>
            <select
              id="filter-severity"
              class="filter-select"
              [class.filter-active]="filters().severity !== 'ALL'"
              [value]="filters().severity"
              (change)="onSeverityChange($event)"
              aria-label="Filter by Severity"
            >
              <option value="ALL">Severity ▼</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          <!-- Source filter -->
          <div class="filter-item">
            <label for="filter-source" class="visually-hidden">Filter by Source Service</label>
            <select
              id="filter-source"
              class="filter-select"
              [class.filter-active]="filters().source !== 'ALL'"
              [value]="filters().source"
              (change)="onSourceChange($event)"
              aria-label="Filter by Source"
            >
              <option value="ALL">Source ▼</option>
              <option value="tracking-svc">tracking-svc</option>
              <option value="billing-svc">billing-svc</option>
              <option value="auth-svc">auth-svc</option>
              <option value="notify-svc">notify-svc</option>
            </select>
          </div>

          <!-- Clear filters button -->
          @if (isAnyFilterActive()) {
            <button
              type="button"
              class="filter-clear-btn"
              (click)="clearFilters.emit()"
              title="Reset all filters to ALL"
              aria-label="Clear all active filters"
            >
              <span>✕ Clear filters</span>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-header-wrapper {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 8px;
    }
    .card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .card-heading {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .filter-counter {
      font-size: 0.82rem;
      color: var(--text-secondary);
      background: var(--bg-surface-elevated);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid var(--border-color);
    }
    .filter-counter strong {
      color: var(--text-primary);
    }
    .filter-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .filter-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .filter-select {
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 0.85rem;
      font-weight: 500;
      outline: none;
      cursor: pointer;
      min-width: 120px;
      transition: all 0.15s ease;
    }
    .filter-select:hover {
      border-color: var(--accent-primary);
    }
    .filter-select:focus {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px var(--accent-focus);
    }
    .filter-select.filter-active {
      border-color: var(--accent-primary);
      background: var(--bg-surface-elevated);
      font-weight: 600;
    }
    .filter-clear-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: transparent;
      color: var(--accent-primary);
      border: 1px dashed var(--accent-primary);
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-clear-btn:hover {
      background: rgba(59, 130, 246, 0.1);
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
})
export class FilterBarComponent {
  public readonly filters = input.required<AlertFilters>();
  public readonly totalCount = input.required<number>();
  public readonly filteredCount = input.required<number>();

  public readonly filterChange = output<{ key: keyof AlertFilters; value: string }>();
  public readonly clearFilters = output<void>();

  public readonly isAnyFilterActive = computed(() => {
    const f = this.filters();
    return f.status !== 'ALL' || f.severity !== 'ALL' || f.source !== 'ALL';
  });

  public onStatusChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.filterChange.emit({ key: 'status', value: val });
  }

  public onSeverityChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.filterChange.emit({ key: 'severity', value: val });
  }

  public onSourceChange(e: Event): void {
    const val = (e.target as HTMLSelectElement).value;
    this.filterChange.emit({ key: 'source', value: val });
  }
}
