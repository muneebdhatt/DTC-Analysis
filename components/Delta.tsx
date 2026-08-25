import type { GoodDirection } from '@/dashboard.config';
import { formatDelta } from '@/lib/format';

/**
 * Colour follows whether the movement is good, not whether it's up.
 * CAC dropping is a win and reads green; ad spend has no inherent
 * direction and stays neutral.
 */
export default function Delta({
  value,
  goodDirection,
  style = 'percent',
  suffix,
}: {
  value: number | null;
  goodDirection: GoodDirection;
  style?: 'percent' | 'points';
  suffix?: string;
}) {
  if (value === null) {
    return <span className="delta delta-none">no prior period</span>;
  }

  const rising = value > 0;
  const flat = Math.abs(value) < 0.05;

  let tone = 'delta-neutral';
  if (!flat && goodDirection !== 'neutral') {
    const good = goodDirection === 'up' ? rising : !rising;
    tone = good ? 'delta-good' : 'delta-bad';
  }

  const arrow = flat ? '→' : rising ? '↑' : '↓';

  return (
    <span className={`delta ${tone}`}>
      <span className="delta-arrow" aria-hidden="true">
        {arrow}
      </span>
      {formatDelta(value, style)}
      {suffix ? <span className="delta-suffix">{suffix}</span> : null}
    </span>
  );
}
