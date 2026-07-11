# IntoLibya Static Blog

High-performance Astro site for [intolibya.com](https://intolibya.com) — conversion-focused homepage, multilingual blog, and TourBuilder integration.

## Setup

```bash
npm install
cp .env.example .env   # add WP credentials for import
npm run dev
```

## WordPress import (slow, resumable)

Imports posts to `src/content/posts/{lang}/{slug}.md` with checkpointing in `.import-state/`.

```bash
npm run import:status          # progress only
npm run import:wp                # resume (3 posts/batch, 3s delay)
npm run import:wp -- --limit 15  # import next 15 pending
npm run import:wp -- --retry-failed
npm run import:wp -- --from-cache   # WP down — write from local cache
```

Throttle via `.env`: `IMPORT_BATCH_SIZE`, `IMPORT_DELAY_MS`, `IMPORT_PAGE_DELAY_MS`.

## Dev blog writer (local only)

```bash
npm run writer   # http://localhost:5174 — not deployed (see .vercelignore)
```

## Build

```bash
npm run build
npm run preview
```

## Structure

- `src/content/posts/` — blog Markdown (552 posts from WP)
- `data/site.json` — homepage hero, CTAs, logo paths
- `public/assets/branding/` — logo upload target
- `scripts/import-wordpress-to-md.ts` — resumable WP exporter
