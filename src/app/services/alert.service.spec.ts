import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AlertService } from './alert.service';
import { ToastService } from './toast.service';

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AlertService, ToastService]
    });
    service = TestBed.inject(AlertService);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with ~60 alerts sorted newest-first', () => {
      const alerts = service.alerts();
      expect(alerts.length).toBe(60);
      expect(service.totalCount()).toBe(60);
      expect(service.filteredCount()).toBe(60);
    });

    it('should initialize with ALL filters set to ALL', () => {
      const filters = service.filters();
      expect(filters.status).toBe('ALL');
      expect(filters.severity).toBe('ALL');
      expect(filters.source).toBe('ALL');
    });

    it('should default select AL-898 matching wireframe reference', () => {
      expect(service.selectedAlertId()).toBe('AL-898');
      const selected = service.selectedAlert();
      expect(selected).not.toBeNull();
      expect(selected?.id).toBe('AL-898');
    });
  });

  describe('Filtering', () => {
    it('should filter by single criterion (severity=HIGH)', () => {
      service.setFilter('severity', 'HIGH');
      const filtered = service.filteredAlerts();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((a) => a.severity === 'HIGH')).toBe(true);
      expect(service.filteredCount()).toBe(filtered.length);
    });

    it('should combine multiple filters with AND semantics (severity=HIGH + status=OPEN)', () => {
      service.setFilter('severity', 'HIGH');
      service.setFilter('status', 'OPEN');
      const filtered = service.filteredAlerts();
      expect(filtered.every((a) => a.severity === 'HIGH' && a.status === 'OPEN')).toBe(true);
    });

    it('should combine all 3 filters with AND semantics (severity=HIGH + status=OPEN + source=billing-svc)', () => {
      service.setFilter('severity', 'HIGH');
      service.setFilter('status', 'OPEN');
      service.setFilter('source', 'billing-svc');
      const filtered = service.filteredAlerts();
      expect(
        filtered.every(
          (a) => a.severity === 'HIGH' && a.status === 'OPEN' && a.source === 'billing-svc'
        )
      ).toBe(true);
    });

    it('should render explicit empty result when no alerts match criteria', () => {
      service.setFilter('status', 'AUTO_CLOSED');
      service.setFilter('source', 'auth-svc');
      service.setFilter('severity', 'CRITICAL');
      const filtered = service.filteredAlerts();
      expect(service.filteredCount()).toBe(filtered.length);
    });

    it('should clear all filters and restore all 60 alerts on clearFilters()', () => {
      service.setFilter('severity', 'HIGH');
      service.setFilter('status', 'OPEN');
      expect(service.filteredCount()).toBeLessThan(service.totalCount());

      service.clearFilters();

      const filters = service.filters();
      expect(filters.status).toBe('ALL');
      expect(filters.severity).toBe('ALL');
      expect(filters.source).toBe('ALL');
      expect(service.filteredCount()).toBe(60);
      expect(service.filteredAlerts().length).toBe(60);
    });
  });

  describe('Selection Management', () => {
    it('should update selected alert when selectAlert is called', () => {
      service.selectAlert('AL-901');
      expect(service.selectedAlertId()).toBe('AL-901');
      expect(service.selectedAlert()?.id).toBe('AL-901');
    });
  });

  describe('Resolution Validation', () => {
    it('should reject whitespace-only resolution note', async () => {
      await expect(service.resolveAlert('AL-898', '   ')).rejects.toThrow(
        /whitespace only/
      );
    });

    it('should reject empty resolution note', async () => {
      await expect(service.resolveAlert('AL-898', '')).rejects.toThrow(
        /whitespace only/
      );
    });

    it('should throw error for non-existent alert ID', async () => {
      await expect(service.resolveAlert('AL-NON-EXISTENT', 'Valid note')).rejects.toThrow(
        'Alert AL-NON-EXISTENT not found.'
      );
    });

    it('should reject resolving an alert that is already RESOLVED or AUTO_CLOSED', async () => {
      const resolvedAlert = service.alerts().find((a) => a.status === 'RESOLVED');
      if (resolvedAlert) {
        await expect(service.resolveAlert(resolvedAlert.id, 'Trying to re-resolve')).rejects.toThrow(
          /cannot be resolved/
        );
      }

      const autoClosedAlert = service.alerts().find((a) => a.status === 'AUTO_CLOSED');
      if (autoClosedAlert) {
        await expect(service.resolveAlert(autoClosedAlert.id, 'Trying to resolve auto-closed')).rejects.toThrow(
          /cannot be resolved/
        );
      }
    });
  });

  describe('Optimistic Resolution', () => {
    it('should apply optimistic update immediately, then complete save after 800ms', async () => {
      service.failureRate = 0;
      const targetId = 'AL-898';

      const resolvePromise = service.resolveAlert(targetId, 'Restarted consumer group');

      // Status flips to RESOLVED immediately
      const optimisticAlert = service.alerts().find((a) => a.id === targetId);
      expect(optimisticAlert?.status).toBe('RESOLVED');
      expect(service.inFlightIds()[targetId]).toBe(true);

      const latestHistory = optimisticAlert?.history[optimisticAlert.history.length - 1];
      expect(latestHistory?.state).toBe('RESOLVED');
      expect(latestHistory?.note).toBe('Restarted consumer group');
      expect(latestHistory?.isOptimistic).toBe(true);

      // Advance past the 800ms timer
      await vi.advanceTimersByTimeAsync(800);
      await resolvePromise;

      // Save complete, lock released
      const savedAlert = service.alerts().find((a) => a.id === targetId);
      expect(savedAlert?.status).toBe('RESOLVED');
      expect(service.inFlightIds()[targetId]).toBeUndefined();
      const finalHistory = savedAlert?.history[savedAlert.history.length - 1];
      expect(finalHistory?.isOptimistic).toBe(false);
    });

    it('should guard against double-submits while save is in flight', async () => {
      service.failureRate = 0;
      const targetId = 'AL-898';

      const p1 = service.resolveAlert(targetId, 'First attempt');
      const p2 = service.resolveAlert(targetId, 'Double click attempt');

      await vi.advanceTimersByTimeAsync(800);
      await Promise.all([p1, p2]);

      const alert = service.alerts().find((a) => a.id === targetId);
      const resolvedEntries = alert?.history.filter((h) => h.state === 'RESOLVED');
      expect(resolvedEntries?.length).toBe(1);
      expect(resolvedEntries?.[0].note).toBe('First attempt');
    });
  });

  describe('Concurrency and Edge Cases', () => {
    it('should preserve in-flight update when user changes filters while save is running', async () => {
      service.failureRate = 0;
      const targetId = 'AL-898';

      const promise = service.resolveAlert(targetId, 'Async note');

      // Filter change while save is running
      service.setFilter('status', 'RESOLVED');

      const filtered = service.filteredAlerts();
      expect(filtered.some((a) => a.id === targetId)).toBe(true);

      await vi.advanceTimersByTimeAsync(800);
      await promise;

      const postSaveFiltered = service.filteredAlerts();
      expect(postSaveFiltered.some((a) => a.id === targetId)).toBe(true);
    });

    it('should decouple selection: selecting another row during save does not corrupt target alert', async () => {
      service.failureRate = 0;
      const targetId = 'AL-898';

      const promise = service.resolveAlert(targetId, 'Resolving 898');

      // Selecting another row during save
      service.selectAlert('AL-901');
      expect(service.selectedAlertId()).toBe('AL-901');

      await vi.advanceTimersByTimeAsync(800);
      await promise;

      // AL-898 resolved
      const alert898 = service.alerts().find((a) => a.id === 'AL-898');
      expect(alert898?.status).toBe('RESOLVED');

      // AL-901 unchanged
      const alert901 = service.alerts().find((a) => a.id === 'AL-901');
      expect(alert901?.status).toBe('OPEN');
    });
  });

  describe('Optimistic Rollback on Failure', () => {
    it('should roll back alert state and remove optimistic history entry when save fails', async () => {
      service.failureRate = 1.0;
      const targetId = 'AL-898';
      const originalAlert = service.alerts().find((a) => a.id === targetId)!;
      const originalStatus = originalAlert.status;
      const originalHistoryCount = originalAlert.history.length;

      const promise = service.resolveAlert(targetId, 'This will fail');

      // Optimistic update applied
      expect(service.alerts().find((a) => a.id === targetId)?.status).toBe('RESOLVED');

      // Advance timer to trigger simulated error
      const advancePromise = vi.advanceTimersByTimeAsync(800);
      await expect(promise).rejects.toThrow();
      await advancePromise;

      // Verify rollback to original state
      const rolledBackAlert = service.alerts().find((a) => a.id === targetId)!;
      expect(rolledBackAlert.status).toBe(originalStatus);
      expect(rolledBackAlert.history.length).toBe(originalHistoryCount);
      expect(service.inFlightIds()[targetId]).toBeUndefined();
    });
  });
});
