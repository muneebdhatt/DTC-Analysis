'use client';

import { useCallback, useEffect, useState } from 'react';
import config from '@/dashboard.config';
import type { Snapshot } from '@/lib/data';
import {
  formatValue,
  percentChange,
  pointChange,
  relativeTime,
} from '@/lib/format';
import RollingNumber from './RollingNumber';
import SourceMarks from './SourceMarks';
import Delta from './Delta';
import { Sparkline, TrendChart } from './Charts';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function Dashboard({ initial }: { initial: Snapshot | null }) {
  const [snap, setSnap] = useState<Snapshot | null>(initial);
  const [now, setNow] = useState<number | null>(null);
  const [pulling, setPulling] = useState(false);

  const refresh = useCallback(async () => {
    if (!url || !key) return;
    setPulling(true);
    try {
      const res = await fetch(`${url}/rest/v1/${config.data.snapshotPath}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const rows = (await res.json()) as Snapshot[];
        if (rows?.[0]) setSnap(rows[0]);
      }
    } catch {
      // Keep the last good snapshot on screen. A network blip should age
      // the timestamp, not blank the page.
    } finally {
      setTimeout(() => setPulling(false), 600);
    }
  }, []);

  // Relative time is computed after mount only — rendering it on the server
  // would bake in the build-time clock and mismatch on hydration.
  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const poll = setInterval(refresh, config.data.refreshIntervalMs);
    // Coming back to the tab should pull immediately rather than waiting
    // out the interval — this is the path you'll take on camera.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  if (!snap) {
    return (
      <main className="shell">
        <p className="empty">
          No data yet. Run the sync workflow, then reload this page.
        </p>
      </main>
    );
  }

  const ageMinutes =
    now === null ? 0 : (now - Date.parse(snap.computed_at)) / 60000;
  const stale = ageMinutes > config.data.staleAfterMinutes;

  return (
    <main className="shell">
      <header className="masthead">
        <div className="brand">
          <span className="brand-mark">{config.brand.initials}</span>
          <span className="brand-name">{config.brand.name}</span>
          <span className="brand-eyebrow">{config.brand.eyebrow}</span>
        </div>

        <div className={`stamp ${stale ? 'stamp-stale' : ''}`}>
          <span className={`pulse ${pulling ? 'pulse-active' : ''}`} />
          {now === null ? (
            <span className="stamp-text">Checking…</span>
          ) : (
            <span className="stamp-text">
              Updated {relativeTime(snap.computed_at, now)}
            </span>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-left">
          <p className="hero-label">
            {config.hero.label}
            <span className="hero-window"> · {config.data.windowLabel}</span>
          </p>
          <RollingNumber
            className="hero-value"
            value={formatValue(snap.revenue, config.hero.format)}
          />
          <div className="hero-meta">
            <Delta
              value={snap.revenue_delta_pct}
              goodDirection="up"
              suffix=" vs prior 30 days"
            />
            <SourceMarks sources={config.hero.sources} />
          </div>
        </div>

        <div className="hero-right">
          <Sparkline points={snap.trend} />
        </div>
      </section>

      <section className="tiles">
        {config.kpis.map((kpi) => {
          const value = (snap as unknown as Record<string, unknown>)[kpi.field];
          const prev = kpi.prevField
            ? (snap as unknown as Record<string, unknown>)[kpi.prevField]
            : null;

          const delta =
            kpi.deltaStyle === 'points'
              ? pointChange(value, prev)
              : percentChange(value, prev);

          const subValue = kpi.subField
            ? (snap as unknown as Record<string, unknown>)[kpi.subField]
            : null;
          const subPrev = kpi.subPrevField
            ? (snap as unknown as Record<string, unknown>)[kpi.subPrevField]
            : null;

          const joined = kpi.sources.length > 1;

          return (
            <article
              key={kpi.id}
              className={`tile ${joined ? 'tile-joined' : ''}`}
            >
              <p className="tile-label">{kpi.label}</p>

              <RollingNumber
                className="tile-value"
                value={formatValue(value, kpi.format)}
              />

              {kpi.prevField ? (
                <Delta
                  value={delta}
                  goodDirection={kpi.goodDirection}
                  style={kpi.deltaStyle ?? 'percent'}
                />
              ) : null}

              {kpi.subField ? (
                <p className="tile-sub">
                  <span className="tile-sub-label">{kpi.subLabel}</span>
                  <RollingNumber
                    className="tile-sub-value"
                    value={formatValue(subValue, kpi.subFormat ?? 'text')}
                  />
                  {kpi.subPrevField ? (
                    <Delta
                      value={percentChange(subValue, subPrev)}
                      goodDirection={kpi.subGoodDirection ?? 'up'}
                    />
                  ) : kpi.id === 'ad_spend' && snap.top_channel_share ? (
                    <span className="tile-share">
                      {snap.top_channel_share.toFixed(0)}% of spend
                    </span>
                  ) : null}
                </p>
              ) : null}

              <p className="tile-note">{kpi.note}</p>
              <SourceMarks sources={kpi.sources} />
            </article>
          );
        })}
      </section>

      <section className="panel">
        <p className="panel-label">{config.trend.label}</p>
        <TrendChart points={snap.trend} format="currency_compact" />
      </section>

      <footer className="footer">
        <span>{config.brand.footerNote}</span>
        <span className="footer-right">
          Three sources, one view · refreshes every{' '}
          {Math.round(config.data.refreshIntervalMs / 1000)}s
        </span>
      </footer>
    </main>
  );
}
