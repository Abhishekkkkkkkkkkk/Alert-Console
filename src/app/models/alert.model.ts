/**
 * Strongly typed domain models for Alert Console
 * Strictly derived from assignment specifications.
 */

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'OPEN' | 'ESCALATED' | 'AUTO_CLOSED' | 'RESOLVED';

export type AlertSource = 'tracking-svc' | 'billing-svc' | 'auth-svc' | 'notify-svc';

export interface AlertHistoryEntry {
  readonly state: AlertStatus;
  readonly ts: string; // ISO 8601 string
  readonly note?: string;
  readonly isOptimistic?: boolean;
}

export interface Alert {
  readonly id: string;
  readonly source: AlertSource;
  readonly severity: AlertSeverity;
  readonly status: AlertStatus;
  readonly createdAt: string; // ISO 8601 string
  readonly history: readonly AlertHistoryEntry[];
}

export interface AlertFilters {
  readonly status: string;
  readonly severity: string;
  readonly source: string;
}

export interface ToastNotification {
  readonly id: string;
  readonly message: string;
  readonly type: 'success' | 'error' | 'info';
  readonly timestamp: number;
}

/**
 * Pure domain logic: Checks if an alert is eligible for resolution.
 * Rule: Only OPEN and ESCALATED alerts can be resolved.
 */
export function isAlertResolvable(status: AlertStatus): boolean {
  return status === 'OPEN' || status === 'ESCALATED';
}

/**
 * Pure domain logic: Validates a resolution note.
 * Rule: Note is mandatory and cannot be empty or whitespace-only.
 */
export function validateResolutionNote(note: string | null | undefined): {
  readonly valid: boolean;
  readonly error?: string;
} {
  const trimmed = (note ?? '').trim();
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Resolution note is required and cannot be whitespace only.'
    };
  }
  return { valid: true };
}
