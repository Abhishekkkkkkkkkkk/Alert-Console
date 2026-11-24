import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Alert } from '../../models/alert.model';
import { TimelineComponent } from '../timeline/timeline.component';
import { ResolveFormComponent } from '../resolve-form/resolve-form.component';

@Component({
  selector: 'app-detail-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TimelineComponent, ResolveFormComponent],
  template: `
    @if (!alert()) {
      <aside class="detail-card detail-card-empty" aria-label="Alert details panel">
        <div class="empty-panel-prompt">
          <p class="prompt-heading">No Alert Selected</p>
          <p class="prompt-subtext">Select an alert from the table to view details.</p>
        </div>
      </aside>
    } @else {
      <aside class="detail-card" aria-labelledby="detail-panel-title" role="region">
        <!-- Panel Header (Exactly "AL-898 — detail" on one line) -->
        <div class="panel-header">
          <h3 id="detail-panel-title" class="panel-title">
            {{ alert()!.id }} — detail
          </h3>
        </div>

        <div class="panel-body">
          <!-- Timeline Section -->
          <app-timeline [history]="alert()!.history" />

          <!-- Resolution Flow Section -->
          <app-resolve-form
            [alert]="alert()!"
            [isSaving]="isSaving()"
            (resolve)="resolve.emit($event)"
          />

          <!-- Optimistic Update Callout Card (Direct 1:1 match to reference wireframe) -->
          <div class="optimistic-callout-card" role="note" aria-label="Optimistic update explanation">
            <h5 class="callout-heading">Optimistic update</h5>
            <p class="callout-body">
              Row flips to RESOLVED instantly.<br>
              If mock save fails (20% chance):<br>
              <span class="callout-highlight">roll back + show error toast.</span>
            </p>
          </div>
        </div>
      </aside>
    }
  `,
  styles: [`
    .detail-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }
    .detail-card-empty {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 380px;
      padding: 32px;
      text-align: center;
    }
    .prompt-heading {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 6px 0;
    }
    .prompt-subtext {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0;
    }
    .panel-header {
      padding: 18px 22px 14px 22px;
    }
    .panel-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      white-space: nowrap;
      letter-spacing: -0.01em;
    }
    .panel-body {
      padding: 0 22px 22px 22px;
      display: flex;
      flex-direction: column;
    }
    /* Optimistic Callout Box (Exact match to reference wireframe) */
    .optimistic-callout-card {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 8px;
      padding: 14px 16px;
      margin-top: 18px;
    }
    .callout-heading {
      font-size: 0.95rem;
      font-weight: 700;
      color: #2563eb;
      margin: 0 0 6px 0;
    }
    .callout-body {
      font-size: 0.85rem;
      color: #334155;
      line-height: 1.45;
      margin: 0;
    }
    .callout-highlight {
      color: #dc2626;
      font-weight: 600;
    }

    [data-theme='dark'] .optimistic-callout-card {
      background: rgba(30, 58, 138, 0.2);
      border-color: #1e40af;
    }
    [data-theme='dark'] .callout-heading {
      color: #60a5fa;
    }
    [data-theme='dark'] .callout-body {
      color: #cbd5e1;
    }
    [data-theme='dark'] .callout-highlight {
      color: #f87171;
    }
  `]
})
export class DetailPanelComponent {
  public readonly alert = input<Alert | null>(null);
  public readonly isSaving = input<boolean>(false);

  public readonly close = output<void>();
  public readonly resolve = output<{ alertId: string; note: string }>();
}
