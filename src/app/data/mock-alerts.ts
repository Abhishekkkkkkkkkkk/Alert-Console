import { Alert, AlertSeverity, AlertStatus, AlertSource, AlertHistoryEntry } from '../models/alert.model';

const SEVERITIES: readonly AlertSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const SOURCES: readonly AlertSource[] = ['tracking-svc', 'billing-svc', 'auth-svc', 'notify-svc'];

/**
 * Format a Date object to exact UTC string (e.g. "17 Aug 22:10")
 * matching the assignment wireframe specification.
 */
export function formatDisplayTimestamp(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = months[d.getUTCMonth()];
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day} ${month} ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

/**
 * Generates an initial dataset of ~60 mock alerts matching specification schema.
 * Seeds with the reference wireframe alerts first for visual consistency.
 * Guarantees that:
 * 1. Current status strictly equals the state of the final history entry.
 * 2. History entries are strictly chronologically ordered.
 * 3. Alerts are returned sorted newest-first.
 */
export function generateMockAlerts(count = 60): Alert[] {
  const wireframeAlerts: Alert[] = [
    {
      id: 'AL-901',
      source: 'tracking-svc',
      severity: 'CRITICAL',
      status: 'OPEN',
      createdAt: '2026-08-18T10:15:00Z',
      history: [
        {
          state: 'OPEN',
          ts: '2026-08-18T10:15:00Z',
          note: 'Telemetry threshold exceeded'
        }
      ]
    },
    {
      id: 'AL-898',
      source: 'billing-svc',
      severity: 'HIGH',
      status: 'ESCALATED',
      createdAt: '2026-08-17T22:10:00Z',
      history: [
        {
          state: 'OPEN',
          ts: '2026-08-17T22:10:00Z',
          note: 'Initial alert triggered'
        },
        {
          state: 'ESCALATED',
          ts: '2026-08-18T06:00:00Z',
          note: 'Escalated to Tier-2 on-call'
        }
      ]
    },
    {
      id: 'AL-882',
      source: 'auth-svc',
      severity: 'MEDIUM',
      status: 'RESOLVED',
      createdAt: '2026-08-17T18:30:00Z',
      history: [
        {
          state: 'OPEN',
          ts: '2026-08-17T18:30:00Z',
          note: 'Token refresh latency elevated'
        },
        {
          state: 'RESOLVED',
          ts: '2026-08-17T19:45:00Z',
          note: 'Restarted auth-svc replica pods and cleared token cache.'
        }
      ]
    },
    {
      id: 'AL-871',
      source: 'tracking-svc',
      severity: 'LOW',
      status: 'AUTO_CLOSED',
      createdAt: '2026-08-17T14:00:00Z',
      history: [
        {
          state: 'OPEN',
          ts: '2026-08-17T14:00:00Z',
          note: 'Packet drop rate anomaly'
        },
        {
          state: 'AUTO_CLOSED',
          ts: '2026-08-17T15:00:00Z',
          note: 'Packet rate normalized automatically below 0.5%.'
        }
      ]
    },
    {
      id: 'AL-864',
      source: 'notify-svc',
      severity: 'HIGH',
      status: 'OPEN',
      createdAt: '2026-08-17T11:20:00Z',
      history: [
        {
          state: 'OPEN',
          ts: '2026-08-17T11:20:00Z',
          note: 'Certificate expiry warning'
        }
      ]
    }
  ];

  const generatedAlerts: Alert[] = [];
  const baseTimestamp = new Date('2026-08-17T10:00:00Z').getTime();

  for (let i = 6; i <= count; i++) {
    const id = `AL-${String(860 - (i - 5) * 7).padStart(3, '0')}`;
    const source = SOURCES[i % SOURCES.length];
    const severity = SEVERITIES[i % SEVERITIES.length];

    let status: AlertStatus;
    if (i % 5 === 0) {
      status = 'AUTO_CLOSED';
    } else if (i % 4 === 0) {
      status = 'RESOLVED';
    } else if (i % 3 === 0) {
      status = 'ESCALATED';
    } else {
      status = 'OPEN';
    }

    const timeDeltaMinutes = (i - 5) * 35;
    const alertTime = new Date(baseTimestamp - timeDeltaMinutes * 60 * 1000);
    const createdAt = alertTime.toISOString();

    const history: AlertHistoryEntry[] = [
      {
        state: 'OPEN',
        ts: createdAt,
        note: `Initial alert triggered on ${source}`
      }
    ];

    if (status === 'ESCALATED' || status === 'RESOLVED') {
      const escalatedTime = new Date(alertTime.getTime() + 20 * 60 * 1000).toISOString();
      history.push({
        state: 'ESCALATED',
        ts: escalatedTime,
        note: 'Escalated due to threshold breach.'
      });
    }

    if (status === 'AUTO_CLOSED') {
      const autoClosedTime = new Date(alertTime.getTime() + 45 * 60 * 1000).toISOString();
      history.push({
        state: 'AUTO_CLOSED',
        ts: autoClosedTime,
        note: 'Metric returned to normal range.'
      });
    }

    if (status === 'RESOLVED') {
      const resolvedTime = new Date(alertTime.getTime() + 60 * 60 * 1000).toISOString();
      history.push({
        state: 'RESOLVED',
        ts: resolvedTime,
        note: 'Restarted consumer group and verified offset drain.'
      });
    }

    generatedAlerts.push({
      id,
      source,
      severity,
      status,
      createdAt,
      history
    });
  }

  const allAlerts = [...wireframeAlerts, ...generatedAlerts];

  // Core Task 1: Rows sorted newest-first by createdAt
  return allAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
