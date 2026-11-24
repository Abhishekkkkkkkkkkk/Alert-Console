import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { AlertHistoryEntry } from '../../models/alert.model';
import { formatDisplayTimestamp } from '../../data/mock-alerts';

@Component({
  selector: 'app-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="timeline-container" role="region" aria-label="Incident Timeline">
      <h4 class="timeline-title">Timeline</h4>

      <div class="timeline-list">
        @for (item of sortedHistory(); track $index; let isLast = $last) {
          <div class="timeline-item">
            <!-- Vertical timeline connector -->
            @if (!isLast) {
              <div class="timeline-track" aria-hidden="true"></div>
            }

            <!-- State indicator dot -->
            <div
              [class]="'timeline-dot dot-' + (item.isOptimistic ? 'pending' : item.state.toLowerCase())"
              aria-hidden="true"
            ></div>

            <div class="timeline-row-content">
              <span class="timeline-state">
                {{ item.isOptimistic ? 'RESOLVED?' : item.state }}
              </span>
              <time class="timeline-time" [attr.datetime]="item.ts">
                {{ item.isOptimistic ? 'pending' : formatDisplayDate(item.ts) }}
              </time>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .timeline-container {
      margin-bottom: 24px;
    }
    .timeline-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 16px 0;
    }
    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 18px;
      position: relative;
    }
    .timeline-item {
      display: flex;
      align-items: center;
      gap: 14px;
      position: relative;
      white-space: nowrap;
    }
    .timeline-track {
      position: absolute;
      top: 14px;
      left: 6px;
      width: 2px;
      height: calc(100% + 18px);
      background: #cbd5e1;
      z-index: 1;
    }
    [data-theme='dark'] .timeline-track {
      background: #334155;
    }
    .timeline-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      z-index: 2;
      flex-shrink: 0;
    }
    /* Timeline dot status colors */
    .dot-open {
      background-color: #3b82f6; /* Blue dot */
    }
    .dot-escalated {
      background-color: #f97316; /* Orange dot */
    }
    .dot-auto_closed {
      background-color: #64748b; /* Gray dot */
    }
    .dot-resolved {
      background-color: #10b981; /* Green dot */
    }
    .dot-pending {
      background-color: #94a3b8; /* Gray dot for pending */
      box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.3);
    }
    .timeline-row-content {
      display: inline-flex;
      align-items: center;
      gap: 16px;
      font-size: 0.875rem;
      white-space: nowrap;
    }
    .timeline-state {
      font-weight: 600;
      color: var(--text-primary);
      min-width: 80px;
    }
    .timeline-time {
      color: var(--text-secondary);
      font-family: inherit;
    }
  `]
})
export class TimelineComponent {
  public readonly history = input.required<readonly AlertHistoryEntry[]>();

  public readonly sortedHistory = computed(() => {
    return [...this.history()].sort(
      (a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime()
    );
  });

  public formatDisplayDate(ts: string): string {
    return formatDisplayTimestamp(ts);
  }
}
