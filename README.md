# Rivera & Cole — live operations dashboard

Demo asset. Fictional DTC brand, illustrative sample data only.
One view, three sources, always current.

## What it reads

A single row from `rc_kpi_snapshot` in Supabase — tiles, deltas, and the
30-day trend, which rides along as a jsonb array. That keeps each poll to
one small request instead of pulling thirty daily rows every minute.

Windows are computed server-side by the n8n job, so the numbers don't shift
with the viewer's timezone.

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in the anon key
npm run dev
```

Both env vars are public by design. The anon key is safe in a browser
bundle because RLS on these tables grants SELECT only. **The service_role
key must never appear here** — it lives in n8n and nowhere else.

## Deploy to Vercel

```bash
npx vercel --prod
```

Add the two `NEXT_PUBLIC_*` variables in Project Settings → Environment
Variables, then redeploy. The page is `force-dynamic`, so Vercel won't
serve a stale snapshot from the edge cache.

## One shell, a whole cluster of buyers

The shell isn't tied to one lead. Brand name, logo, palette, source labels
and KPI definitions all live in `dashboard.config.ts`, which holds a registry
of **variants** — each a complete board. The same build, reading the same
one-row snapshot, wears any of them:

| Variant | `?variant=` | Buyer | Headline | The joined tile |
|---|---|---|---|---|
| Rivera & Cole | `rivera-cole` *(default)* | DTC brand | Revenue | ROAS ← Store + Ads |
| Halyard Media | `agency` | Marketing agency | Spend under management | Blended ROAS ← Ads + Revenue |
| Meridian CFO | `cfo` | Fractional CFO | Recognised revenue | Current ratio ← Ledger + Billing |

Each variant reinterprets the same numeric columns for its buyer — the ROAS
column reads as *blended ROAS* for the agency and *current ratio* for the CFO;
CAC becomes *cost / lead*, then *DSO in days*. One row powers all three, so
there's nothing extra to seed to demo a reskin.

**A shared landing page** at `/showcase` lists all three boards — brand,
palette, who each is for, and links straight into the board (and its live
demo). It reads the same registry, so a new variant appears there on its own.
Good for a single link that lets someone browse the whole cluster.

**Pick a board two ways:**

- **Per link** — append `?variant=agency` or `?variant=cfo` to any URL. Ideal
  for outreach: send each buyer a link that already speaks their language, off
  one deployment. The page title and the board both follow the variant.
- **Per deployment** — set `NEXT_PUBLIC_DASHBOARD_VARIANT=cfo` in the project's
  environment to make a whole deployment default to one board.

**Pointing the right version at the right buyer:**

- **DTC / ecommerce founders** → default `rivera-cole`. Revenue, ROAS/CAC,
  orders/AOV, fulfilment — the operator's morning numbers.
- **Agencies & fractional marketers** → `agency`. Spend under management,
  blended ROAS, leads and cost-per-lead, reporting delivered on time — the
  book-of-clients view a retainer renews on.
- **Fractional CFOs & bookkeepers** → `cfo`. Recognised revenue, current ratio
  and DSO, gross margin, operating expenses, month-end close — a client-book
  board on a 90-day window.

**Add a buyer** by adding one entry to the `variants` registry. If you catch
yourself editing a component to change a label, a number format, or which way
"good" points, that belongs in the config instead.

## Recording the "always current" moment

Append `?demo` to the URL and a **Simulate today's sales** control appears
bottom-right. Each click (or the `S` key) pours a synthetic batch of orders
into the snapshot on screen — revenue, orders, AOV, ROAS, CAC and today's
trend point all move together, the stamp resets to "just now", and only the
digits that changed animate. `?demo=auto` ticks on its own every few seconds
for a hands-free shot.

It's synthetic and cover-safe: the numbers are derived from what's already
rendered, nothing is written to the database, and demo mode pauses the poll
so the momentum isn't clobbered mid-take. Without `?demo`, the public page is
exactly as before. Increments live in the `demo` block of `dashboard.config.ts`.

## Design notes

**Digit roll.** Only the characters that actually changed since the last
poll animate. Animating the whole value on every refresh would be
decoration; animating what moved is information.

**Provenance marks.** Three squares under each tile, filled where that feed
contributed. ROAS/CAC lights two — the argument of the demo, visible on the
tile rather than narrated over it.

**Morning ledger palette.** Warm putty paper and ink type rather than the
charcoal-and-neon dashboard default. This page replaces a printed morning
report, and light UI records more cleanly on video.
