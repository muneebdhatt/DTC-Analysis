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

## Reskinning

`dashboard.config.ts` is the only file that changes: brand, palette, KPI
definitions, formats, and which direction counts as good. Two variants are
sketched at the bottom of that file — an agency client-performance board
and a fractional-CFO client-book board.

If you catch yourself editing a component to change a label or a number
format, that belongs in the config instead.

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
