/**
 * dashboard.config.ts
 *
 * The ONLY file that changes when this shell is reskinned.
 * Brand, colours, KPI definitions, data bindings — all here.
 *
 * If you catch yourself editing a component to change a label, a number
 * format, or which way "good" points, that belongs here instead.
 *
 * Reskin variants are noted at the bottom.
 */

export type ValueFormat =
  | 'currency'
  | 'currency_compact'
  | 'number'
  | 'percent'
  | 'ratio'
  | 'text';

/** Which direction is good. CAC falling is a win; revenue falling isn't. */
export type GoodDirection = 'up' | 'down' | 'neutral';

/** Which mock feed a number came from. Drives the provenance marks. */
export type Source = 'marketing' | 'store' | 'ops';

export interface KpiDefinition {
  id: string;
  label: string;
  /** Column on rc_kpi_snapshot holding the current value. */
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
  /** Feeds this number depends on. Two or more is the demo's whole argument. */
  sources: Source[];
  /** Shown under the tile. Keep it to one plain-language line. */
  note: string;
}

export interface DashboardConfig {
  brand: {
    name: string;
    /** Sits above the hero number. Says what the page is for. */
    eyebrow: string;
    initials: string;
    footerNote: string;
  };
  theme: Record<string, string>;
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
    deltaField: string;
    format: ValueFormat;
    sources: Source[];
  };
  kpis: KpiDefinition[];
  trend: { label: string; format: ValueFormat };
}

export const config: DashboardConfig = {
  brand: {
    name: 'Rivera & Cole',
    eyebrow: 'Operations',
    initials: 'RC',
    footerNote: 'Illustrative sample data. Not a real company.',
  },

  /**
   * "Morning ledger" palette — warm putty paper, ink type, earth-tone
   * deltas. Deliberately not the charcoal-and-neon dashboard look: this
   * page is replacing a printed morning report, and it should feel like
   * the thing it replaces.
   */
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
    deltaField: 'revenue_delta_pct',
    format: 'currency',
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
      sources: ['marketing'],
      note: 'Meta and Google combined.',
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
};

export const SOURCE_LABELS: Record<Source, string> = {
  marketing: 'Ads',
  store: 'Store',
  ops: 'Ops',
};

export default config;

/* ---------------------------------------------------------------------
 * RESKIN VARIANTS — noted, not built. Same shell, same snapshot contract,
 * different config. Each needs source tables on the same daily grain.
 *
 * (a) AGENCY CLIENT-PERFORMANCE BOARD
 *     Spend under management · blended ROAS · leads and CPL ·
 *     active campaigns · reports delivered on time (ops)
 *     Adds a client_id column and a client selector.
 *
 * (b) FRACTIONAL-CFO CLIENT-BOOK BOARD
 *     Recognised revenue · gross margin % · cash runway ·
 *     AR overdue (goodDirection: 'down') · close checklist complete (ops)
 *     Widen the window to 90 days.
 * ------------------------------------------------------------------ */
