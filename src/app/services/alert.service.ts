import { Injectable, computed, signal, inject } from '@angular/core';
import {
  Alert,
  AlertFilters,
  AlertHistoryEntry,
  isAlertResolvable,
  validateResolutionNote
} from '../models/alert.model';
import { generateMockAlerts } from '../data/mock-alerts';
import { ToastService } from './toast.service';

// State management for alerts, filtering, and resolution
@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly toastService = inject(ToastService);

  // Initial alerts generated at startup
  private readonly _alerts = signal<readonly Alert[]>(generateMockAlerts(60));
  public readonly alerts = this._alerts.asReadonly();

  // Active filter dropdown state
  private readonly _filters = signal<AlertFilters>({
    status: 'ALL',
    severity: 'ALL',
    source: 'ALL'
  });
  public readonly filters = this._filters.asReadonly();

  // Selected alert id for the detail panel
  private readonly _selectedAlertId = signal<string | null>(null);
  public readonly selectedAlertId = this._selectedAlertId.asReadonly();

  // Tracks alerts currently being saved
  private readonly _inFlightIds = signal<Record<string, boolean>>({});
  public readonly inFlightIds = this._inFlightIds.asReadonly();

  // Previous states saved for rollback
  private readonly rollbackSnapshots: Record<string, Alert> = {};

  // 20% random failure rate per stretch goal
  public failureRate = 0.20;

  constructor() {
    // Default to AL-898 matching the wireframe
    const initial = this._alerts();
    const wireframeMatch = initial.find((a) => a.id === 'AL-898');
    if (wireframeMatch) {
      this._selectedAlertId.set('AL-898');
    } else if (initial.length > 0) {
      this._selectedAlertId.set(initial[0].id);
    }
  }

  // Current alert shown in the detail panel
  public readonly selectedAlert = computed<Alert | null>(() => {
    const id = this._selectedAlertId();
    if (!id) return null;
    return this._alerts().find((a) => a.id === id) ?? null;
  });

  // Combined AND filter evaluation
  public readonly filteredAlerts = computed<readonly Alert[]>(() => {
    const list = this._alerts();
    const f = this._filters();

    return list.filter((alert) => {
      const matchStatus = f.status === 'ALL' || alert.status === f.status;
      const matchSeverity = f.severity === 'ALL' || alert.severity === f.severity;
      const matchSource = f.source === 'ALL' || alert.source === f.source;
      return matchStatus && matchSeverity && matchSource;
    });
  });

  public readonly totalCount = computed(() => this._alerts().length);
  public readonly filteredCount = computed(() => this.filteredAlerts().length);

  // Update a single filter field
  public setFilter(key: keyof AlertFilters, value: string): void {
    this._filters.update((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  // Reset all filters back to ALL
  public clearFilters(): void {
    this._filters.set({
      status: 'ALL',
      severity: 'ALL',
      source: 'ALL'
    });
  }

  // Select an alert by ID
  public selectAlert(id: string | null): void {
    this._selectedAlertId.set(id);
  }

  // Handles optimistic alert resolution and rollback on failure
  public async resolveAlert(alertId: string, noteText: string): Promise<void> {
    const validation = validateResolutionNote(noteText);
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Invalid resolution note.');
    }
    const trimmedNote = (noteText ?? '').trim();

    // Prevent multiple clicks while saving
    if (this._inFlightIds()[alertId]) {
      return;
    }

    const currentAlert = this._alerts().find((a) => a.id === alertId);
    if (!currentAlert) {
      throw new Error(`Alert ${alertId} not found.`);
    }

    if (!isAlertResolvable(currentAlert.status)) {
      throw new Error(`Alert ${alertId} is already ${currentAlert.status} and cannot be resolved.`);
    }

    // Save snapshot before mutating state
    const snapshot: Alert = JSON.parse(JSON.stringify(currentAlert));
    this.rollbackSnapshots[alertId] = snapshot;

    // Mark alert as in-flight
    this._inFlightIds.update((prev) => ({ ...prev, [alertId]: true }));

    // Optimistically update status to RESOLVED
    const optimisticTimestamp = new Date().toISOString();
    const optimisticEntry: AlertHistoryEntry = {
      state: 'RESOLVED',
      ts: optimisticTimestamp,
      note: trimmedNote,
      isOptimistic: true
    };

    this._alerts.update((prevAlerts) =>
      prevAlerts.map((item) => {
        if (item.id === alertId) {
          return {
            ...item,
            status: 'RESOLVED',
            history: [...item.history, optimisticEntry]
          };
        }
        return item;
      })
    );

    // Simulate 800ms save
    try {
      await this.mockSaveResolution(alertId, trimmedNote);

      // Save succeeded, confirm optimistic update
      this._alerts.update((prevAlerts) =>
        prevAlerts.map((item) => {
          if (item.id === alertId) {
            return {
              ...item,
              history: item.history.map((h) =>
                h.isOptimistic ? { ...h, isOptimistic: false } : h
              )
            };
          }
          return item;
        })
      );

      delete this.rollbackSnapshots[alertId];
      this.toastService.success(`Alert ${alertId} marked as RESOLVED.`);
    } catch (err: unknown) {
      // Save failed, restore previous snapshot
      const previousState = this.rollbackSnapshots[alertId];
      if (previousState) {
        this._alerts.update((prevAlerts) =>
          prevAlerts.map((item) => (item.id === alertId ? previousState : item))
        );
        delete this.rollbackSnapshots[alertId];
      }

      const errorMessage =
        err instanceof Error ? err.message : 'Resolution failed on server. Changes rolled back.';
      this.toastService.error(`Failed to resolve ${alertId}: ${errorMessage}`);
      throw err;
    } finally {
      // Clear in-flight lock
      this._inFlightIds.update((prev) => {
        const next = { ...prev };
        delete next[alertId];
        return next;
      });
    }
  }

  // Simulated async save with 800ms delay
  public mockSaveResolution(id: string, note: string): Promise<{ id: string; note: string }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const shouldFail = Math.random() < this.failureRate;
        if (shouldFail) {
          reject(
            new Error(
              `[503 Service Unavailable] Incident dispatcher service timed out resolving alert ${id}.`
            )
          );
        } else {
          resolve({ id, note });
        }
      }, 800); // 800ms simulated network delay
    });
  }
}
