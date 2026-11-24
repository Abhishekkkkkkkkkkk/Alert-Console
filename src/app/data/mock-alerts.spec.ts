import { describe, it, expect } from 'vitest';
import { generateMockAlerts, formatDisplayTimestamp } from './mock-alerts';
import { AlertSeverity, AlertStatus, AlertSource } from '../models/alert.model';

describe('Mock Data Generator (mock-alerts)', () => {
  const VALID_SEVERITIES: AlertSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const VALID_STATUSES: AlertStatus[] = ['OPEN', 'ESCALATED', 'AUTO_CLOSED', 'RESOLVED'];
  const VALID_SOURCES: AlertSource[] = ['tracking-svc', 'billing-svc', 'auth-svc', 'notify-svc'];

  it('should generate requested number of alerts', () => {
    const alerts = generateMockAlerts(60);
    expect(alerts.length).toBe(60);
  });

  it('should generate alerts with only allowed severities, statuses, and sources', () => {
    const alerts = generateMockAlerts(60);
    for (const alert of alerts) {
      expect(VALID_SEVERITIES).toContain(alert.severity);
      expect(VALID_STATUSES).toContain(alert.status);
      expect(VALID_SOURCES).toContain(alert.source);
      expect(alert.id).toMatch(/^AL-\d{3}$/);
      expect(isNaN(new Date(alert.createdAt).getTime())).toBe(false);
    }
  });

  it('should sort alerts newest-first by createdAt', () => {
    const alerts = generateMockAlerts(60);
    for (let i = 0; i < alerts.length - 1; i++) {
      const current = new Date(alerts[i].createdAt).getTime();
      const next = new Date(alerts[i + 1].createdAt).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it('should ensure chronological order of history entries for each alert', () => {
    const alerts = generateMockAlerts(60);
    for (const alert of alerts) {
      expect(alert.history.length).toBeGreaterThanOrEqual(1);
      for (let i = 0; i < alert.history.length - 1; i++) {
        const t1 = new Date(alert.history[i].ts).getTime();
        const t2 = new Date(alert.history[i + 1].ts).getTime();
        expect(t2).toBeGreaterThanOrEqual(t1);
      }
    }
  });

  it('should ensure current alert status matches the final history entry state', () => {
    const alerts = generateMockAlerts(60);
    for (const alert of alerts) {
      const lastHistory = alert.history[alert.history.length - 1];
      expect(alert.status).toBe(lastHistory.state);
    }
  });

  describe('formatDisplayTimestamp', () => {
    it('should format ISO timestamp to "DD MMM HH:mm" UTC cleanly', () => {
      const result = formatDisplayTimestamp('2026-08-17T22:10:00Z');
      expect(result).toBe('17 Aug 22:10');
    });

    it('should return "—" for falsy input', () => {
      expect(formatDisplayTimestamp('')).toBe('—');
    });

    it('should return raw string if unparseable', () => {
      expect(formatDisplayTimestamp('invalid-date')).toBe('invalid-date');
    });
  });
});
