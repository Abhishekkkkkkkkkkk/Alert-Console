import { Injectable, signal } from '@angular/core';
import { ToastNotification } from '../models/alert.model';

// Simple toast notification service using signals
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _toasts = signal<readonly ToastNotification[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  public add(
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
    duration = 5000
  ): string {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastNotification = { id, message, type, timestamp: Date.now() };

    this._toasts.update((current) => [...current, newToast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  public success(message: string, duration?: number): string {
    return this.add(message, 'success', duration);
  }

  public error(message: string, duration = 6500): string {
    return this.add(message, 'error', duration);
  }

  public info(message: string, duration?: number): string {
    return this.add(message, 'info', duration);
  }

  public remove(id: string): void {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
