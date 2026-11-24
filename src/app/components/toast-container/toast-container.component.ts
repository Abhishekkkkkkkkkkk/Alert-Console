import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toastService.toasts().length > 0) {
      <div
        class="toast-container"
        role="region"
        aria-label="System Notifications"
        aria-live="polite"
      >
        @for (toast of toastService.toasts(); track toast.id) {
          <div
            [class]="'toast-item toast-' + toast.type + ' animate-slide-in'"
            role="alert"
          >
            <div class="toast-icon">
              @if (toast.type === 'error') {
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f87171" stroke-width="2" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              } @else if (toast.type === 'success') {
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#34d399" stroke-width="2" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              } @else {
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#60a5fa" stroke-width="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              }
            </div>

            <div class="toast-content">
              <div class="toast-title">
                {{ toast.type === 'error' ? 'Action Failed (Rolled Back)' : toast.type === 'success' ? 'Success' : 'Notice' }}
              </div>
              <div class="toast-message">{{ toast.message }}</div>
            </div>

            <button
              type="button"
              (click)="toastService.remove(toast.id)"
              class="toast-close-btn"
              aria-label="Dismiss notification"
              title="Dismiss"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 100;
      max-width: 420px;
      width: calc(100% - 48px);
    }
    .toast-item {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
      color: #f8fafc;
    }
    .toast-error {
      border-left: 4px solid #ef4444;
      background: #1e1b2e;
    }
    .toast-success {
      border-left: 4px solid #10b981;
      background: #0d2818;
    }
    .toast-info {
      border-left: 4px solid #3b82f6;
      background: #0f172a;
    }
    .toast-content {
      flex: 1;
    }
    .toast-title {
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 2px;
    }
    .toast-message {
      font-size: 0.8rem;
      color: #cbd5e1;
      line-height: 1.35;
    }
    .toast-close-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 2px;
    }
    .toast-close-btn:hover {
      color: #ffffff;
    }
    @keyframes slideIn {
      from {
        transform: translateY(16px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    .animate-slide-in {
      animation: slideIn 0.25s ease-out forwards;
    }
  `]
})
export class ToastContainerComponent {
  public readonly toastService = inject(ToastService);
}
