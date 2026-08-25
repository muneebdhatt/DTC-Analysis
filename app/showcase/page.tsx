import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { config as defaultConfig, variants } from '@/dashboard.config';

export const metadata: Metadata = {
  title: 'Live operations boards — pick a view',
  description: 'One engine, three buyers. Illustrative sample data.',
};

// Registry order — the same three boards the build can wear. Add a variant to
// the registry and it shows up here automatically.
const ORDER = ['rivera-cole', 'agency', 'cfo'];

export default function Showcase() {
  const pageTheme = defaultConfig.theme as unknown as CSSProperties;
  const boards = ORDER.map((id) => variants[id]).filter(Boolean);

  return (
    <div className="landing" style={pageTheme}>
      <main className="lp-shell">
        <header className="lp-head">
          <p className="lp-eyebrow">Live operations dashboards</p>
          <h1 className="lp-title">One engine, three boards.</h1>
          <p className="lp-lede">
            The same build, reading the same live data row, reskinned for three
            different buyers. Pick a board to open it — each stays current on its
            own. Illustrative sample data throughout.
          </p>
        </header>

        <section className="lp-grid">
          {boards.map((b) => {
            const cardStyle = {
              '--accent-card': b.theme['--accent'],
            } as unknown as CSSProperties;
            const swatches = ['--paper', '--card', '--accent', '--ink'].map(
              (k) => b.theme[k]
            );

            return (
              <article key={b.id} className="lp-card" style={cardStyle}>
                <div className="lp-card-top">
                  <span className="lp-mark">{b.brand.initials}</span>
                  <div>
                    <p className="lp-brand">{b.brand.name}</p>
                    <p className="lp-brand-eyebrow">{b.brand.eyebrow}</p>
                  </div>
                </div>

                <p className="lp-tagline">{b.tagline}</p>

                <dl className="lp-meta">
                  <div>
                    <dt>For</dt>
                    <dd>{b.audience}</dd>
                  </div>
                  <div>
                    <dt>Headline</dt>
                    <dd>{b.hero.label}</dd>
                  </div>
                </dl>

                <div className="lp-swatches" aria-hidden="true">
                  {swatches.map((c, i) => (
                    <span
                      key={i}
                      className="lp-swatch"
                      style={{ background: c }}
                    />
                  ))}
                </div>

                <div className="lp-actions">
                  <a className="lp-open" href={`/?variant=${b.id}`}>
                    Open board →
                  </a>
                  <a className="lp-demo" href={`/?variant=${b.id}&demo`}>
                    Live demo
                  </a>
                </div>
              </article>
            );
          })}
        </section>

        <footer className="lp-foot">
          <span>Illustrative sample data. Fictional brands, synthetic numbers.</span>
          <span>One view, three sources, always current.</span>
        </footer>
      </main>
    </div>
  );
}
