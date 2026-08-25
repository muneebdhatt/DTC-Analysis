import type { DashboardConfig } from '@/dashboard.config';
import type { Snapshot } from '@/lib/data';

const round2 = (n: number) => Math.round(n * 100) / 100;
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) =>
  Math.floor(rand(min, max + 1));

/**
 * Produce the next synthetic snapshot from the current one — as if a fresh
 * batch of orders just landed and the n8n job recomputed the windows.
 *
 * Everything is derived from the numbers already on screen, so the tiles
 * stay internally consistent: revenue, orders, AOV, ROAS, CAC and today's
 * trend point all move together, and the "Updated" stamp resets to now.
 *
 * This never touches the database. It only advances the in-memory snapshot
 * the page is already rendering, which is enough for the digit roll to fire.
 * Synthetic, cover-safe, offline of the read path.
 */
export function simulateTick(
  s: Snapshot,
  demo?: DashboardConfig['demo']
): Snapshot {
  const newOrders = randInt(demo?.minOrders ?? 2, demo?.maxOrders ?? 6);

  const aov = s.aov ?? 82;
  const addedRevenue = round2(newOrders * aov * rand(0.85, 1.2));

  const revenue = round2((s.revenue ?? 0) + addedRevenue);
  const orders = (s.orders ?? 0) + newOrders;
  const newAov = round2(revenue / Math.max(orders, 1));

  // Ad spend ticks up a little slower than revenue, so ROAS drifts gently
  // upward — the growth story the recording wants to tell.
  const roas = s.roas ?? 3.3;
  const addedSpend = round2((addedRevenue / roas) * rand(0.8, 1.0));
  const adSpend = round2((s.ad_spend ?? 0) + addedSpend);
  const newRoas = round2(revenue / Math.max(adSpend, 1));

  // CAC is spend per *acquired customer*, not per order (repeat buyers mean
  // customers < orders), so it can't be recomputed from orders. Back the
  // implied customer count out of the current spend/CAC, grow it in step
  // with orders, and re-divide — which keeps CAC near its trajectory.
  const priorCustomers =
    s.cac && s.cac > 0 ? (s.ad_spend ?? 0) / s.cac : orders;
  const custPerOrder = s.orders ? priorCustomers / s.orders : 1;
  const totalCustomers = priorCustomers + newOrders * custPerOrder;
  const newCac = round2(adSpend / Math.max(totalCustomers, 1));

  const revenueDeltaPct =
    s.revenue_prev != null && s.revenue_prev !== 0
      ? round2(((revenue - s.revenue_prev) / s.revenue_prev) * 100)
      : s.revenue_delta_pct;

  // Nudge on-time fulfilment within a believable band, never past a ceiling.
  const onTime =
    s.on_time_pct == null
      ? s.on_time_pct
      : round2(Math.min(99.5, Math.max(85, s.on_time_pct + rand(-0.15, 0.25))));

  // Today is the last point on the trend; pour the new revenue into it so the
  // chart's leading edge lifts in step with the hero number.
  const trend = s.trend.slice();
  if (trend.length) {
    const last = trend[trend.length - 1];
    trend[trend.length - 1] = {
      ...last,
      revenue: round2(last.revenue + addedRevenue),
    };
  }

  return {
    ...s,
    revenue,
    revenue_delta_pct: revenueDeltaPct,
    orders,
    aov: newAov,
    ad_spend: adSpend,
    roas: newRoas,
    cac: newCac,
    on_time_pct: onTime,
    computed_at: new Date().toISOString(),
    trend,
  };
}
