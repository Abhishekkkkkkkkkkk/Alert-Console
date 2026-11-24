import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Alert } from '../../models/alert.model';
import { SeverityChipComponent } from '../severity-chip/severity-chip.component';
import { StatusChipComponent } from '../status-chip/status-chip.component';
import { formatDisplayTimestamp } from '../../data/mock-alerts';

@Component({
  selector: 'app-alert-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SeverityChipComponent, StatusChipComponent],
  template: `
    <div class="table-card" role="region" aria-label="System Alerts Table">
      <table class="alerts-table" aria-label="Alerts Monitoring Grid">
        <thead>
          <tr>
            <th scope="col" class="th-id">ID</th>
            <th scope="col" class="th-source">Source</th>
            <th scope="col" class="th-severity">Severity</th>
            <th scope="col" class="th-status">Status</th>
            <th scope="col" class="th-created">Created At</th>
            <th scope="col" class="th-action text-right"><span class="visually-hidden">Action</span></th>
          </tr>
        </thead>
        <tbody>
          @for (alert of alerts(); track alert.id; let i = $index) {
            <tr
              tabindex="0"
              class="table-row"
              [class.row-selected]="alert.id === selectedAlertId()"
              [class.row-saving]="!!inFlightIds()[alert.id]"
              (click)="selectAlert.emit(alert.id)"
              (keydown)="onRowKeyDown($event, alert.id, i)"
              [attr.aria-selected]="alert.id === selectedAlertId()"
              role="row"
            >
              <!-- ID Column -->
              <td class="td-id font-mono">
                <span class="id-text">{{ alert.id }}</span>
              </td>

              <!-- Source Column -->
              <td class="td-source">
                <span class="source-text font-mono">{{ alert.source }}</span>
              </td>

              <!-- Severity Column -->
              <td class="td-severity">
                <app-severity-chip [severity]="alert.severity" />
              </td>

              <!-- Status Column -->
              <td class="td-status">
                <app-status-chip
                  [status]="alert.status"
                  [isSaving]="!!inFlightIds()[alert.id]"
                />
              </td>

              <!-- Created At Column -->
              <td class="td-created text-muted font-mono">
                {{ formatCreatedAt(alert.createdAt) }}
              </td>

              <!-- Action Column (Resolve Link with Spinner during Save) -->
              <td class="td-action text-right">
                @if (inFlightIds()[alert.id]) {
                  <span class="row-saving-text" aria-live="polite">
                    <span class="row-mini-spinner" aria-hidden="true"></span>
                    <span>Saving...</span>
                  </span>
                } @else if (alert.status === 'OPEN' || alert.status === 'ESCALATED') {
                  <button
                    type="button"
                    class="row-resolve-btn"
                    (click)="onQuickResolve($event, alert.id)"
                    [attr.title]="'Resolve alert ' + alert.id"
                    [attr.aria-label]="'Resolve alert ' + alert.id"
                  >
                    Resolve
                  </button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>

      <!-- Subtext from Reference Wireframe -->
      <div class="table-footer-note">
        Pagination / virtualization for large lists
      </div>
    </div>
  `,
  styles: [`
    .table-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .alerts-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    .alerts-table thead {
      background: var(--bg-surface-elevated);
      border-bottom: 1px solid var(--border-color);
    }
    .alerts-table th {
      padding: 10px 16px;
      font-weight: 600;
      color: var(--text-primary);
      font-size: 0.85rem;
      white-space: nowrap;
    }
    .alerts-table tbody tr {
      border-bottom: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: background-color 0.15s ease;
      outline: none;
    }
    .alerts-table tbody tr:hover {
      background-color: var(--bg-surface-hover);
    }
    .alerts-table tbody tr:focus-visible {
      background-color: var(--bg-surface-hover);
      box-shadow: inset 0 0 0 2px var(--accent-primary);
    }
    .alerts-table tbody tr:last-child {
      border-bottom: none;
    }
    .alerts-table td {
      padding: 11px 16px;
      vertical-align: middle;
    }
    .table-row.row-selected {
      background-color: var(--bg-surface-hover);
      position: relative;
    }
    .table-row.row-selected td:first-child {
      border-left: 3px solid var(--accent-primary);
    }
    .table-row.row-saving {
      opacity: 0.75;
    }
    .id-text {
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.875rem;
    }
    .source-text {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .td-action {
      white-space: nowrap;
    }
    .row-resolve-btn {
      background: transparent;
      border: none;
      color: #3b82f6;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.15s ease;
    }
    .row-resolve-btn:hover:not(:disabled) {
      background: rgba(59, 130, 246, 0.1);
      text-decoration: underline;
    }
    .row-saving-text {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #10b981;
      font-weight: 600;
    }
    .row-mini-spinner {
      width: 10px;
      height: 10px;
      border: 2px solid rgba(16, 185, 129, 0.3);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      display: inline-block;
    }
    .table-footer-note {
      padding: 12px 16px;
      font-size: 0.8rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-subtle);
      font-style: italic;
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
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AlertTableComponent {
  public readonly alerts = input.required<readonly Alert[]>();
  public readonly selectedAlertId = input<string | null>(null);
  public readonly inFlightIds = input<Record<string, boolean>>({});

  public readonly selectAlert = output<string>();

  public onRowKeyDown(e: KeyboardEvent, id: string, index: number): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.selectAlert.emit(id);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const rows = document.querySelectorAll<HTMLTableRowElement>('.table-row');
      if (index + 1 < rows.length) {
        rows[index + 1].focus();
        const nextAlert = this.alerts()[index + 1];
        if (nextAlert) {
          this.selectAlert.emit(nextAlert.id);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const rows = document.querySelectorAll<HTMLTableRowElement>('.table-row');
      if (index > 0) {
        rows[index - 1].focus();
        const prevAlert = this.alerts()[index - 1];
        if (prevAlert) {
          this.selectAlert.emit(prevAlert.id);
        }
      }
    }
  }

  public onQuickResolve(e: MouseEvent, id: string): void {
    e.stopPropagation();
    this.selectAlert.emit(id);
    setTimeout(() => {
      const el = document.getElementById(`resolve-note-${id}`) as HTMLInputElement | null;
      if (el) el.focus();
    }, 50);
  }

  public formatCreatedAt(ts: string): string {
    return formatDisplayTimestamp(ts);
  }
}
