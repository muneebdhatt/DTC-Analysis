'use client';

import { useState } from 'react';
import type { TrendPoint } from '@/lib/data';
import { formatValue, shortDate } from '@/lib/format';

function buildPath(points: TrendPoint[], w: number, h: number, pad: number) {
  const values = points.map((p) => Number(p.revenue) || 0);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const stepX = points.length > 1 ? (w - pad * 2) / (points.length - 1) : 0;

  const coords = values.map((v, i) => ({
    x: pad + i * stepX,
    y: pad + (h - pad * 2) * (1 - (v - min) / span),
  }));

  const line = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(2)},${c.y.toFixed(2)}`)
    .join(' ');

  const area = `${line} L${coords[coords.length - 1]?.x.toFixed(2)},${h - pad} L${coords[0]?.x.toFixed(2)},${h - pad} Z`;

  return { coords, line, area, max, min };
}

/** Small, unlabelled, sits beside the hero number. */
export function Sparkline({ points }: { points: TrendPoint[] }) {
  if (points.length < 2) return null;
  const w = 200;
  const h = 56;
  const { line, area } = buildPath(points, w, h, 3);

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Revenue over the last 30 days"
    >
      <path d={area} className="spark-area" />
      <path d={line} className="spark-line" />
    </svg>
  );
}

/** Full-width trend. Hovering reads out a single day. */
export function TrendChart({
  points,
  format,
}: {
  points: TrendPoint[];
  format: 'currency' | 'currency_compact';
}) {
  const [active, setActive] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <p className="empty">
        The trend appears once the pipeline has written a few days of history.
      </p>
    );
  }

  const w = 900;
  const h = 220;
  const pad = 8;
  const { coords, line, area, max } = buildPath(points, w, h, pad);

  const shown = active ?? points.length - 1;
  const point = points[shown];

  return (
    <div className="trend">
      <div className="trend-readout">
        <span className="trend-readout-date">{shortDate(point.date)}</span>
        <span className="trend-readout-value">
          {formatValue(point.revenue, 'currency')}
        </span>
      </div>

      <svg
        className="trend-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        onMouseLeave={() => setActive(null)}
        role="img"
        aria-label={`Daily revenue, ${points.length} days, peaking at ${formatValue(max, 'currency')}`}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={w}
            y1={h * f}
            y2={h * f}
            className="grid-line"
          />
        ))}

        <path d={area} className="trend-area" />
        <path d={line} className="trend-line" />

        {coords[shown] ? (
          <>
            <line
              x1={coords[shown].x}
              x2={coords[shown].x}
              y1={0}
              y2={h}
              className="trend-cursor"
            />
            <circle
              cx={coords[shown].x}
              cy={coords[shown].y}
              r={4}
              className="trend-dot"
            />
          </>
        ) : null}

        {coords.map((c, i) => (
          <rect
            key={i}
            x={c.x - (w - pad * 2) / points.length / 2}
            y={0}
            width={(w - pad * 2) / points.length}
            height={h}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
          />
        ))}
      </svg>

      <div className="trend-axis">
        <span>{shortDate(points[0].date)}</span>
        <span>{shortDate(points[points.length - 1].date)}</span>
      </div>
    </div>
  );
}
