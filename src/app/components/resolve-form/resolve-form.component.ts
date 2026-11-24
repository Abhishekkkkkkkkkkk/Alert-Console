import { Component, input, output, signal, effect, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Alert, validateResolutionNote } from '../../models/alert.model';

@Component({
  selector: 'app-resolve-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    @if (canResolve()) {
      <div class="resolve-section">
        <form (ngSubmit)="handleSubmit()" novalidate>
          <div class="form-group">
            <label [for]="'resolve-note-' + alert().id" class="form-label">
              Resolution note (required)
            </label>
            <input
              type="text"
              [id]="'resolve-note-' + alert().id"
              class="resolve-input"
              [class.input-error]="!!validationError()"
              placeholder="Restarted consumer group"
              [(ngModel)]="noteText"
              name="resolutionNote"
              (input)="onInputChange()"
              [disabled]="isSaving()"
              [attr.aria-invalid]="!!validationError()"
              [attr.aria-describedby]="validationError() ? 'error-' + alert().id : null"
            />

            <!-- Inline validation error message — strictly NO alert() -->
            @if (validationError()) {
              <div
                [id]="'error-' + alert().id"
                class="inline-error-message animate-shake"
                role="alert"
                aria-live="assertive"
              >
                <span>{{ validationError() }}</span>
              </div>
            }
          </div>

          <!-- Resolve Button with 800ms Spinner -->
          <button
            type="submit"
            class="resolve-btn"
            [class.btn-loading]="isSaving()"
            [disabled]="isSaving()"
            [attr.aria-busy]="isSaving()"
          >
            @if (isSaving()) {
              <span class="spinner-ring" aria-hidden="true"></span>
              <span>Resolving (~800ms)...</span>
            } @else {
              <span>Resolve</span>
            }
          </button>
        </form>
      </div>
    } @else {
      <div class="resolved-note-summary">
        <span class="resolved-badge">✓ Status: {{ alert().status }}</span>
      </div>
    }
  `,
  styles: [`
    .resolve-section {
      margin-top: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 14px;
    }
    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .resolve-input {
      width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 9px 12px;
      color: var(--text-primary);
      font-size: 0.875rem;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.15s ease;
    }
    .resolve-input:focus {
      border-color: #10b981;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
    }
    .resolve-input.input-error {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.04);
    }
    .inline-error-message {
      color: #ef4444;
      font-size: 0.8rem;
      font-weight: 500;
      margin-top: 4px;
    }
    .resolve-btn {
      width: 100%;
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 10px 18px;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      transition: background 0.15s ease;
    }
    .resolve-btn:hover:not(:disabled) {
      background: #059669;
    }
    .resolve-btn:disabled {
      opacity: 0.8;
      cursor: not-allowed;
    }
    .resolve-btn.btn-loading {
      background: #047857;
    }
    /* Animated Loading Spinner */
    .spinner-ring {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.35);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      display: inline-block;
    }
    .resolved-note-summary {
      padding: 10px 14px;
      background: var(--bg-surface-elevated);
      border-radius: 6px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-top: 14px;
    }
    .resolved-badge {
      font-weight: 600;
      color: #10b981;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }
    .animate-shake {
      animation: shake 0.25s ease-in-out;
    }
  `]
})
export class ResolveFormComponent {
  public readonly alert = input.required<Alert>();
  public readonly isSaving = input<boolean>(false);
  public readonly resolve = output<{ alertId: string; note: string }>();

  public noteText = '';
  public readonly validationError = signal<string>('');

  private currentAlertId = '';

  constructor() {
    // Reset form state cleanly whenever the selected alert changes
    effect(() => {
      const id = this.alert().id;
      if (id !== this.currentAlertId) {
        this.currentAlertId = id;
        this.noteText = '';
        this.validationError.set('');
      }
    });
  }

  /**
   * The form remains visible for OPEN/ESCALATED alerts,
   * AND remains mounted while saving so the operator clearly sees the 800ms spinner.
   */
  public canResolve(): boolean {
    const s = this.alert().status;
    return s === 'OPEN' || s === 'ESCALATED' || this.isSaving();
  }

  public onInputChange(): void {
    if (this.validationError()) {
      this.validationError.set('');
    }
  }

  public handleSubmit(): void {
    const validation = validateResolutionNote(this.noteText);

    // Edge Case: "Whitespace-only note blocked with an inline message."
    if (!validation.valid) {
      this.validationError.set(validation.error ?? 'Resolution note is required.');
      return;
    }

    this.resolve.emit({
      alertId: this.alert().id,
      note: this.noteText.trim()
    });
  }

  public resetForm(): void {
    this.noteText = '';
    this.validationError.set('');
  }
}
