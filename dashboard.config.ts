/**
 * dashboard.config.ts
 *
 * The shell serves a whole cluster of buyers, not one lead. Brand, logo,
 * palette, source labels, KPI definitions and data bindings all live here;
 * the components read them and never hard-code a label, a number format, or
 * which way "good" points.
 *
 * Three variants ship in the registry below, all driven by the same build
 * and the same one-row snapshot contract:
 *
 *   rivera-cole  — a DTC brand's operations board        (default)
 *   agency       — an agency's client-performance board
 *   cfo          — a fractional CFO's client-book board
 *
 * Pick one per request with `?variant=agency`, or per deployment with the
 * NEXT_PUBLIC_DASHBOARD_VARIANT environment variable. See resolveVariant().
 */

export type ValueFormat =
  | 'currency'
  | 'currency_compact'
  | 'number'
  | 'percent'
  | 'ratio'
  | 'days'
  | 'text';

/** Which direction is good. CAC falling is a win; revenue falling isn't. */
export type GoodDirection = 'up' | 'down' | 'neutral';

/** Which mock feed a number came from. Drives the provenance marks. */
export type Source = 'marketing' | 'store' | 'ops';

export interface KpiDefinition {
  id: string;
  label: string;
  /** Column on the snapshot holding the current value. */
  field: string;
  /** Column holding the prior-window value, for the delta. */
  prevField?: string;
  format: ValueFormat;
  goodDirection: GoodDirection;
  /** Delta rendered as a percent change, or as a raw point difference. */
  deltaStyle?: 'percent' | 'points';
  /** Second line under the headline number. */
  subLabel?: string;
  subField?: string;
  subPrevField?: string;
  subFormat?: ValueFormat;
  subGoodDirection?: GoodDirection;
  /** Append "N% of spend" after a text sub-value (the leading-channel tile). */
  showChannelShare?: boolean;
  /** Feeds this number depends on. Two or more is the demo's whole argument. */
  sources: Source[];
  /** Shown under the tile. Keep it to one plain-language line. */
  note: string;
}

export interface DashboardConfig {
  /** Stable key; matches the registry and the ?variant value. */
  id: string;
  brand: {
    name: string;
    /** Sits above the hero number. Says what the page is for. */
    eyebrow: string;
    /** The on-page logo: the initials shown in the brand mark. */
    initials: string;
    footerNote: string;
  };
  theme: Record<string, string>;
  /** What each feed is called on this board — reskins the provenance marks. */
  sourceLabels: Record<Source, string>;
  data: {
    snapshotPath: string;
    windowLabel: string;
    refreshIntervalMs: number;
    staleAfterMinutes: number;
  };
  hero: {
    label: string;
    field: string;
    prevField: string;
    format: ValueFormat;
    goodDirection: GoodDirection;
    /** Trailing text on the hero delta, e.g. " vs prior 30 days". */
    deltaSuffix: string;
    sources: Source[];
  };
  kpis: KpiDefinition[];
  trend: { label: string; format: ValueFormat };
  /**
   * Recording aid. Off by default and invisible on the public page — it
   * only wakes up when the URL carries `?demo` (button) or `?demo=auto`
   * (hands-free tick). Every number it produces is synthetic, derived from
   * the snapshot already on screen; it never writes to the database.
   */
  demo?: {
    label: string;
    /** New orders poured in per tick, picked in this inclusive range. */
    minOrders: number;
    maxOrders: number;
    /** Cadence of the `?demo=auto` tick, in milliseconds. */
    autoIntervalMs: number;
  };
}

/* =====================================================================
 * (default) RIVERA & COLE — DTC brand operations board
 * "Morning ledger" palette: warm putty paper, ink type, earth-tone deltas.
 * Deliberately not the charcoal-and-neon dashboard look — this page
 * replaces a printed morning report and should feel like the thing it
 * replaces.
 * ===================================================================== */
const riveraCole: DashboardConfig = {
  id: 'rivera-cole',
  brand: {
    name: 'Rivera & Cole',
    eyebrow: 'Operations',
    initials: 'RC',
    footerNote: 'Illustrative sample data. Not a real company.',
  },
  theme: {
    '--paper': '#E8E4DA',
    '--card': '#FAF8F4',
    '--ink': '#14130F',
    '--ink-soft': '#5C574B',
    '--ink-faint': '#8C8574',
    '--rule': '#CFC8B9',
    '--rule-soft': '#DED8CB',
    '--accent': '#6B2737',
    '--positive': '#3F5D45',
    '--negative': '#9A3B27',
    '--radius': '3px',
  },
  sourceLabels: { marketing: 'Ads', store: 'Store', ops: 'Ops' },
  data: {
    snapshotPath: 'rc_kpi_snapshot?id=eq.1&select=*',
    windowLabel: 'Trailing 30 days',
    refreshIntervalMs: 60_000,
    staleAfterMinutes: 30,
  },
  hero: {
    label: 'Revenue',
    field: 'revenue',
    prevField: 'revenue_prev',
    format: 'currency',
    goodDirection: 'up',
    deltaSuffix: ' vs prior 30 days',
    sources: ['store'],
  },
  kpis: [
    {
      id: 'roas',
      label: 'ROAS',
      field: 'roas',
      prevField: 'roas_prev',
      format: 'ratio',
      goodDirection: 'up',
      deltaStyle: 'percent',
      subLabel: 'CAC',
      subField: 'cac',
      subPrevField: 'cac_prev',
      subFormat: 'currency',
      subGoodDirection: 'down',
      sources: ['store', 'marketing'],
      note: 'Store revenue against ad spend. Neither platform can tell you this alone.',
    },
    {
      id: 'orders',
      label: 'Orders',
      field: 'orders',
      prevField: 'orders_prev',
      format: 'number',
      goodDirection: 'up',
      deltaStyle: 'percent',
      subLabel: 'AOV',
      subField: 'aov',
      subPrevField: 'aov_prev',
      subFormat: 'currency',
      subGoodDirection: 'up',
      sources: ['store'],
      note: 'Order count and average basket.',
    },
    {
      id: 'ad_spend',
      label: 'Ad spend',
      field: 'ad_spend',
      prevField: 'ad_spend_prev',
      format: 'currency',
      goodDirection: 'neutral',
      deltaStyle: 'percent',
      subLabel: 'Leading channel',
      subField: 'top_channel',
      subFormat: 'text',
      showChannelShare: true,
      sources: ['marketing'],
      note: 'Paid social and search combined.',
    },
    {
      id: 'on_time',
      label: 'On-time fulfilment',
      field: 'on_time_pct',
      prevField: 'on_time_pct_prev',
      format: 'percent',
      goodDirection: 'up',
      deltaStyle: 'points',
      sources: ['ops'],
      note: 'From the warehouse sheet. Counted, not estimated.',
    },
  ],
  trend: { label: 'Revenue by day', format: 'currency_compact' },
  demo: {
    label: "Simulate today's sales",
    minOrders: 2,
    maxOrders: 6,
    autoIntervalMs: 4000,
  },
};

/* =====================================================================
 * AGENCY — client-performance board (Halyard Media)
 * Same snapshot, read as an agency's book of managed accounts. Cooler
 * "studio" palette so the reskin is unmistakable at a glance.
 * ===================================================================== */
const agency: DashboardConfig = {
  id: 'agency',
  brand: {
    name: 'Halyard Media',
    eyebrow: 'Client performance',
    initials: 'HM',
    footerNote: 'Illustrative sample data. Not a real agency.',
  },
  theme: {
    '--paper': '#E6EAEF',
    '--card': '#F7F9FB',
    '--ink': '#151A22',
    '--ink-soft': '#4C5666',
    '--ink-faint': '#8792A2',
    '--rule': '#C8D0DB',
    '--rule-soft': '#DBE1EA',
    '--accent': '#2F4A6B',
    '--positive': '#2E6B52',
    '--negative': '#A23A2E',
    '--radius': '4px',
  },
  sourceLabels: { marketing: 'Ads', store: 'Revenue', ops: 'Delivery' },
  data: {
    snapshotPath: 'rc_kpi_snapshot?id=eq.1&select=*',
    windowLabel: 'Trailing 30 days',
    refreshIntervalMs: 60_000,
    staleAfterMinutes: 30,
  },
  hero: {
    label: 'Spend under management',
    field: 'ad_spend',
    prevField: 'ad_spend_prev',
    format: 'currency',
    goodDirection: 'up',
    deltaSuffix: ' vs prior 30 days',
    sources: ['marketing'],
  },
  kpis: [
    {
      id: 'blended_roas',
      label: 'Blended ROAS',
      field: 'roas',
      prevField: 'roas_prev',
      format: 'ratio',
      goodDirection: 'up',
      deltaStyle: 'percent',
      subLabel: 'Cost / lead',
      subField: 'cac',
      subPrevField: 'cac_prev',
      subFormat: 'currency',
      subGoodDirection: 'down',
      sources: ['marketing', 'store'],
      note: 'Client revenue against the spend we manage — the number a retainer renews on.',
    },
    {
      id: 'leads',
      label: 'Leads',
      field: 'orders',
      prevField: 'orders_prev',
      format: 'number',
      goodDirection: 'up',
      deltaStyle: 'percent',
      subLabel: 'Avg. lead value',
      subField: 'aov',
      subPrevField: 'aov_prev',
      subFormat: 'currency',
      subGoodDirection: 'up',
      sources: ['marketing'],
      note: 'New leads delivered across the book this period.',
    },
    {
      id: 'channel',
      label: 'Leading channel',
      field: 'top_channel',
      format: 'text',
      goodDirection: 'neutral',
      subLabel: '% of managed spend',
      subField: 'top_channel_share',
      subFormat: 'percent',
      sources: ['marketing'],
      note: 'Where the managed budget is working hardest.',
    },
    {
      id: 'reports',
      label: 'Reports on time',
      field: 'on_time_pct',
      prevField: 'on_time_pct_prev',
      format: 'percent',
      goodDirection: 'up',
      deltaStyle: 'points',
      sources: ['ops'],
      note: 'Client reporting delivered on schedule. Counted, not estimated.',
    },
  ],
  trend: { label: 'Managed spend by day', format: 'currency_compact' },
  demo: {
    label: "Simulate today's leads",
    minOrders: 2,
    maxOrders: 6,
    autoIntervalMs: 4000,
  },
};

/* =====================================================================
 * CFO — fractional-CFO client-book board (Meridian CFO)
 * Same snapshot, read as a finance book: liquidity, collections, margin,
 * cost and close progress. Ledger-green palette, 90-day window.
 * ===================================================================== */
const cfo: DashboardConfig = {
  id: 'cfo',
  brand: {
    name: 'Meridian CFO',
    eyebrow: 'Client book',
    initials: 'MC',
    footerNote: 'Illustrative sample data. Not a real firm.',
  },
  theme: {
    '--paper': '#E7E9E0',
    '--card': '#F8F9F3',
    '--ink': '#14170F',
    '--ink-soft': '#4C5346',
    '--ink-faint': '#878E7E',
    '--rule': '#CCD0C2',
    '--rule-soft': '#DCE0D4',
    '--accent': '#1F4A38',
    '--positive': '#2F6B4E',
    '--negative': '#9A3B27',
    '--radius': '2px',
  },
  sourceLabels: { marketing: 'Billing', store: 'Ledger', ops: 'Close' },
  data: {
    snapshotPath: 'rc_kpi_snapshot?id=eq.1&select=*',
    windowLabel: 'Trailing 90 days',
    refreshIntervalMs: 60_000,
    staleAfterMinutes: 30,
  },
  hero: {
    label: 'Recognised revenue',
    field: 'revenue',
    prevField: 'revenue_prev',
    format: 'currency',
    goodDirection: 'up',
    deltaSuffix: ' vs prior 90 days',
    sources: ['store'],
  },
  kpis: [
    {
      id: 'liquidity',
      label: 'Current ratio',
      field: 'roas',
      prevField: 'roas_prev',
      format: 'ratio',
      goodDirection: 'up',
      deltaStyle: 'percent',
      subLabel: 'DSO',
      subField: 'cac',
      subPrevField: 'cac_prev',
      subFormat: 'days',
      subGoodDirection: 'down',
      sources: ['store', 'marketing'],
      note: 'Liquidity, and how many days of sales sit in receivables.',
    },
    {
      id: 'margin',
      label: 'Gross margin',
      field: 'top_channel_share',
      format: 'percent',
      goodDirection: 'up',
      sources: ['store'],
      note: 'Revenue kept after the cost of delivery.',
    },
    {
      id: 'opex',
      label: 'Operating expenses',
      field: 'ad_spend',
      prevField: 'ad_spend_prev',
      format: 'currency',
      goodDirection: 'down',
      deltaStyle: 'percent',
      sources: ['store'],
      note: 'Total run-rate costs recognised this period.',
    },
    {
      id: 'close',
      label: 'Close checklist',
      field: 'on_time_pct',
      prevField: 'on_time_pct_prev',
      format: 'percent',
      goodDirection: 'up',
      deltaStyle: 'points',
      sources: ['ops'],
      note: 'Month-end close progress. Counted, not estimated.',
    },
  ],
  trend: { label: 'Recognised revenue by day', format: 'currency_compact' },
  demo: {
    label: "Simulate today's postings",
    minOrders: 2,
    maxOrders: 6,
    autoIntervalMs: 4000,
  },
};

/** Every board this build can wear. Add a buyer by adding an entry here. */
export const variants: Record<string, DashboardConfig> = {
  'rivera-cole': riveraCole,
  agency,
  cfo,
};

export const DEFAULT_VARIANT = 'rivera-cole';

/**
 * Resolve the active board. A `?variant=` value wins (so one deployment can
 * show any buyer their own board from a link); otherwise the build-time
 * NEXT_PUBLIC_DASHBOARD_VARIANT is used; otherwise the default.
 */
export function resolveVariant(requested?: string | null): DashboardConfig {
  const name =
    (requested && requested.trim()) ||
    process.env.NEXT_PUBLIC_DASHBOARD_VARIANT ||
    DEFAULT_VARIANT;
  return variants[name] ?? variants[DEFAULT_VARIANT];
}

export const config = riveraCole;
export default config;
