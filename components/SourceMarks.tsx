import { SOURCE_LABELS, type Source } from '@/dashboard.config';

const ORDER: Source[] = ['marketing', 'store', 'ops'];

/**
 * Three marks, one per feed, filled where that feed contributed.
 *
 * This isn't decoration — it's the argument. A tile lit in two places is
 * a number no single browser tab can produce, and the reader can see that
 * without anyone explaining it.
 */
export default function SourceMarks({ sources }: { sources: Source[] }) {
  const used = ORDER.filter((s) => sources.includes(s));
  const caption =
    used.length > 1
      ? used.map((s) => SOURCE_LABELS[s]).join(' + ')
      : SOURCE_LABELS[used[0]];

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
