import type { ValueFormat } from '@/dashboard.config';

/**
 * Locale is pinned to en-US everywhere. Left to the runtime, the server
 * and the browser can pick different locales and React throws a hydration
 * mismatch on the first render — which on a public demo link shows up as
 * a flash of wrong-looking numbers.
 */
const L = 'en-US';

const currency = new Intl.NumberFormat(L, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const currencyPrecise = new Intl.NumberFormat(L, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat(L);

export function formatValue(value: unknown, format: ValueFormat): string {
  if (value === null || value === undefined || value === '') return '—';

  if (format === 'text') return String(value);

  const n = Number(value);
  if (!Number.isFinite(n)) return '—';

  switch (format) {
    case 'currency':
      return n < 1000 ? currencyPrecise.format(n) : currency.format(n);
    case 'currency_compact':
      return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;
    case 'number':
      return plain.format(Math.round(n));
    case 'percent':
      return `${n.toFixed(1)}%`;
    case 'ratio':
      return `${n.toFixed(2)}×`;
    case 'days':
      return `${Math.round(n)} days`;
    default:
      return String(value);
  }
}

/** Percent change between two values, or null when there's no baseline. */
export function percentChange(now: unknown, was: unknown): number | null {
  const a = Number(now);
  const b = Number(was);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return ((a - b) / b) * 100;
}

/** Raw difference, for metrics already expressed in percentage points. */
export function pointChange(now: unknown, was: unknown): number | null {
  const a = Number(now);
  const b = Number(was);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return a - b;
}

export function formatDelta(
  value: number | null,
  style: 'percent' | 'points'
): string {
  if (value === null) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  const abs = Math.abs(value);
  return style === 'points'
    ? `${sign}${abs.toFixed(1)} pts`
    : `${sign}${abs.toFixed(1)}%`;
}

export function relativeTime(iso: string, now: number): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return 'unknown';

  const mins = Math.floor((now - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins === 1) return '1 minute ago';
  if (mins < 60) return `${mins} minutes ago`;

  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return '1 hour ago';
  if (hrs < 24) return `${hrs} hours ago`;

  const days = Math.floor(hrs / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

export function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(L, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
