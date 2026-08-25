'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { DashboardConfig } from '@/dashboard.config';
import type { Snapshot } from '@/lib/data';
import {
  channelLabel,
  formatValue,
  percentChange,
  pointChange,
  relativeTime,
} from '@/lib/format';
import RollingNumber from './RollingNumber';
import SourceMarks from './SourceMarks';
import Delta from './Delta';
import { Sparkline, TrendChart } from './Charts';
import { simulateTick } from '@/lib/simulate';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type DemoMode = false | 'manual' | 'auto';

/** Read a snapshot column by name; the config decides which one a tile uses. */
const field = (snap: Snapshot, name?: string): unknown =>
  name ? (snap as unknown as Record<string, unknown>)[name] : null;

export default function Dashboard({
  config,
  initial,
}: {
  config: DashboardConfig;
  initial: Snapshot | null;
}) {
  const [snap, setSnap] = useState<Snapshot | null>(initial);
  const [now, setNow] = useState<number | null>(null);
  const [pulling, setPulling] = useState(false);
  const [demo, setDemo] = useState<DemoMode>(false);

  // Palette rides on the active board, applied here so `?variant=` reskins
  // the whole page — background included — with no flash on first paint.
  const theme = config.theme as unknown as CSSProperties;

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
  }, [config.data.snapshotPath]);

  // Advance the on-screen snapshot with a synthetic batch of orders, as if
  // fresh data just arrived. Resets the stamp to "just now" and pulses the
  // freshness dot, so the digit roll reads as a live update. Never writes
  // to the database — see lib/simulate.ts.
  const simulate = useCallback(() => {
    setSnap((cur) => (cur ? simulateTick(cur, config.demo) : cur));
    setNow(Date.now());
    setPulling(true);
    setTimeout(() => setPulling(false), 600);
  }, [config.demo]);

  // Demo mode is URL-driven so the public page stays untouched: `?demo`
  // shows the control, `?demo=auto` also ticks on its own. Read after mount
  // to avoid a hydration mismatch — the first render matches the server.
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('demo');
    if (value === null) return;
    setDemo(value === 'auto' ? 'auto' : 'manual');
  }, []);

  // Relative time is computed after mount only — rendering it on the server
  // would bake in the build-time clock and mismatch on hydration.
  useEffect(() => {
    setNow(Date.now());
    const tick = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    // In demo mode the local simulation drives the numbers; a background
    // poll would fetch the real row mid-recording and snap them back down.
    if (demo) return;

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
  }, [refresh, demo, config.data.refreshIntervalMs]);

  // While demo mode is on, "S" ticks by hand and `?demo=auto` ticks itself.
  useEffect(() => {
    if (!demo) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 's' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        simulate();
      }
    };
    window.addEventListener('keydown', onKey);

    const auto =
      demo === 'auto'
        ? setInterval(simulate, config.demo?.autoIntervalMs ?? 4000)
        : undefined;

    return () => {
      window.removeEventListener('keydown', onKey);
      if (auto) clearInterval(auto);
    };
  }, [demo, simulate, config.demo?.autoIntervalMs]);

  if (!snap) {
    return (
      <div className="page" style={theme}>
        <main className="shell">
          <p className="empty">
            No data yet. Run the sync workflow, then reload this page.
          </p>
        </main>
      </div>
    );
  }

  const ageMinutes =
    now === null ? 0 : (now - Date.parse(snap.computed_at)) / 60000;
  const stale = ageMinutes > config.data.staleAfterMinutes;

  const heroValue = field(snap, config.hero.field);
  const heroDelta = percentChange(
    heroValue,
    field(snap, config.hero.prevField)
  );

  return (
    <div className="page" style={theme}>
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
              value={formatValue(heroValue, config.hero.format)}
            />
            <div className="hero-meta">
              <Delta
                value={heroDelta}
                goodDirection={config.hero.goodDirection}
                suffix={config.hero.deltaSuffix}
              />
              <SourceMarks
                sources={config.hero.sources}
                labels={config.sourceLabels}
              />
            </div>
          </div>

          <div className="hero-right">
            <Sparkline points={snap.trend} />
          </div>
        </section>

        <section className="tiles">
          {config.kpis.map((kpi) => {
            // Channels render by category, never by brand — cover-safe.
            const rawValue = field(snap, kpi.field);
            const value =
              kpi.field === 'top_channel' ? channelLabel(rawValue) : rawValue;
            const prev = field(snap, kpi.prevField);

            const delta =
              kpi.deltaStyle === 'points'
                ? pointChange(rawValue, prev)
                : percentChange(rawValue, prev);

            const rawSub = field(snap, kpi.subField);
            const subValue =
              kpi.subField === 'top_channel' ? channelLabel(rawSub) : rawSub;
            const subPrev = field(snap, kpi.subPrevField);

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
                    ) : kpi.showChannelShare && snap.top_channel_share ? (
                      <span className="tile-share">
                        {snap.top_channel_share.toFixed(0)}% of spend
                      </span>
                    ) : null}
                  </p>
                ) : null}

                <p className="tile-note">{kpi.note}</p>
                <SourceMarks sources={kpi.sources} labels={config.sourceLabels} />
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

        {demo ? (
          <button type="button" className="sim" onClick={simulate}>
            <span className="sim-dot" aria-hidden="true" />
            {config.demo?.label ?? "Simulate today's sales"}
            <kbd className="sim-key" aria-hidden="true">
              S
            </kbd>
          </button>
        ) : null}
      </main>
    </div>
  );
}
