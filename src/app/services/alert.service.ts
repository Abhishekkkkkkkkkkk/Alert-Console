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

/**
 * AlertService: Authoritative Central State Management for Alert Console.
 *
 * Implements:
 * 1. Master state for ~60 alerts generated at startup (sorted newest-first).
 * 2. Combinable dropdown filters (status, severity, source) with AND semantics.
 * 3. Master-detail selection tracking with consistency guarantee.
 * 4. Concurrency protection via inFlightIds lock.
 * 5. Resolution flow with 800ms async simulated save.
 * 6. Optimistic UI update with automatic state rollback on failure (Stretch Goal).
 */
@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private readonly toastService = inject(ToastService);

  // Master alerts signal (~60 items generated at startup, sorted newest-first)
  private readonly _alerts = signal<readonly Alert[]>(generateMockAlerts(60));
  public readonly alerts = this._alerts.asReadonly();

  // Multi-criteria combinable filters signal (AND semantics)
  private readonly _filters = signal<AlertFilters>({
    status: 'ALL',
    severity: 'ALL',
    source: 'ALL'
  });
  public readonly filters = this._filters.asReadonly();

  // Master-Detail selection: ID of the currently inspected alert
  private readonly _selectedAlertId = signal<string | null>(null);
  public readonly selectedAlertId = this._selectedAlertId.asReadonly();

  // Map tracking in-flight asynchronous operations: { [alertId]: boolean }
  private readonly _inFlightIds = signal<Record<string, boolean>>({});
  public readonly inFlightIds = this._inFlightIds.asReadonly();

  // Rollback snapshots cache for optimistic reversions
  private readonly rollbackSnapshots: Record<string, Alert> = {};

  // Stretch Goal failure rate: defaults to 20% random failure
  public failureRate = 0.20;

  constructor() {
    // Select AL-898 by default matching the reference wireframe
    const initial = this._alerts();
    const wireframeMatch = initial.find((a) => a.id === 'AL-898');
    if (wireframeMatch) {
      this._selectedAlertId.set('AL-898');
    } else if (initial.length > 0) {
      this._selectedAlertId.set(initial[0].id);
    }
  }

  /**
   * Computed: Selected alert entity.
   * Derives directly from `_alerts` so any mutation automatically syncs with the Detail Panel.
   */
  public readonly selectedAlert = computed<Alert | null>(() => {
    const id = this._selectedAlertId();
    if (!id) return null;
    return this._alerts().find((a) => a.id === id) ?? null;
  });

  /**
   * Computed: Filtered alerts matching all non-'ALL' criteria (AND semantics).
   */
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

  /**
   * Update a filter criterion
   */
  public setFilter(key: keyof AlertFilters, value: string): void {
    this._filters.update((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  /**
   * One-click clear filters back to 'ALL'
   */
  public clearFilters(): void {
    this._filters.set({
      status: 'ALL',
      severity: 'ALL',
      source: 'ALL'
    });
  }

  /**
   * Select an alert for Master-Detail inspection
   */
  public selectAlert(id: string | null): void {
    this._selectedAlertId.set(id);
  }

  /**
   * Resolves an alert with an operator note.
   *
   * Core Task 4 & Edge Cases:
   * 1. Rejects whitespace-only note
   * 2. Guards against double-submits while saving
   * 3. Performs OPTIMISTIC UI update instantly
   * 4. Simulates 800ms async backend save
   * 5. If rejected (~20% chance), rolls back state and triggers error toast
   */
  public async resolveAlert(alertId: string, noteText: string): Promise<void> {
    const validation = validateResolutionNote(noteText);
    if (!validation.valid) {
      throw new Error(validation.error ?? 'Invalid resolution note.');
    }
    const trimmedNote = (noteText ?? '').trim();

    // Guard: Prevent double-submit
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

    // 1. Snapshot previous state for rollback
    const snapshot: Alert = JSON.parse(JSON.stringify(currentAlert));
    this.rollbackSnapshots[alertId] = snapshot;

    // 2. Mark in-flight
    this._inFlightIds.update((prev) => ({ ...prev, [alertId]: true }));

    // 3. OPTIMISTIC UPDATE:
    // Flip status to RESOLVED and append pending entry immediately
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

    // 4. Dispatch simulated async save (800ms)
    try {
      await this.mockSaveResolution(alertId, trimmedNote);

      // SUCCESS: Clear optimistic flag
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
      // FAILURE: ROLLBACK OPTIMISTIC UPDATE (Stretch Goal Requirement)
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
      // Release in-flight lock
      this._inFlightIds.update((prev) => {
        const next = { ...prev };
        delete next[alertId];
        return next;
      });
    }
  }

  /**
   * Mock save resolution matching specification (800ms delay + stretch goal failure simulation)
   */
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
      }, 800); // 800 ms delay strictly per specification
    });
  }
}
