import type { Source } from '@/dashboard.config';

const ORDER: Source[] = ['marketing', 'store', 'ops'];

/**
 * Three marks, one per feed, filled where that feed contributed.
 *
 * This isn't decoration — it's the argument. A tile lit in two places is
 * a number no single browser tab can produce, and the reader can see that
 * without anyone explaining it. The feed names come from the active board,
 * so an agency reads "Ads + Revenue" where a CFO reads "Ledger + Billing".
 */
export default function SourceMarks({
  sources,
  labels,
}: {
  sources: Source[];
  labels: Record<Source, string>;
}) {
  const used = ORDER.filter((s) => sources.includes(s));
  const caption =
    used.length > 1
      ? used.map((s) => labels[s]).join(' + ')
      : labels[used[0]];

  return (
    <div className="marks" title={`Source: ${caption}`}>
      <span className="marks-row" aria-hidden="true">
        {ORDER.map((s) => (
          <span key={s} className={sources.includes(s) ? 'mark on' : 'mark'} />
        ))}
      </span>
      <span className="marks-caption">
        {caption}
        {used.length > 1 ? ' · joined' : ''}
      </span>
    </div>
  );
}
