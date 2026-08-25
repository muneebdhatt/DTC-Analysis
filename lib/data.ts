import config from '@/dashboard.config';

export interface TrendPoint {
  date: string;
  revenue: number;
}

export interface Snapshot {
  id: number;
  computed_at: string;
  window_days: number;

  revenue: number | null;
  revenue_prev: number | null;
  revenue_delta_pct: number | null;

  roas: number | null;
  roas_prev: number | null;
  cac: number | null;
  cac_prev: number | null;

  orders: number | null;
  orders_prev: number | null;
  aov: number | null;
  aov_prev: number | null;

  ad_spend: number | null;
  ad_spend_prev: number | null;
  top_channel: string | null;
  top_channel_share: number | null;

  on_time_pct: number | null;
  on_time_pct_prev: number | null;

  trend: TrendPoint[];
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * One row powers the entire page — tiles, deltas, and the trend chart,
 * which rides along as a jsonb array. That keeps the 60-second poll to a
 * single small request instead of pulling 30 daily rows every minute.
 *
 * Every window is computed server-side in n8n, so the numbers don't shift
 * with the viewer's timezone. A browser-computed "last 30 days" would show
 * one thing in Karachi and another in New York.
 */
export async function fetchSnapshot(): Promise<Snapshot | null> {
  if (!url || !key) return null;

  const res = await fetch(`${url}/rest/v1/${config.data.snapshotPath}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const rows = (await res.json()) as Snapshot[];
  const row = rows?.[0];
  if (!row) return null;

  return { ...row, trend: Array.isArray(row.trend) ? row.trend : [] };
}
