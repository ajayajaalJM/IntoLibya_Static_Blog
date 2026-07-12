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
npm run writer
```

Opens at **http://localhost:5174** — local only, not deployed (see `.vercelignore`).

- Write in **English only**
- Click **Translate & save all** to auto-translate into all blog languages and save to `src/content/posts/`
- Use the **Library** tab to browse and edit existing post groups

Requires `OPENAI_API_KEY` in `.env` for automatic translations.

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
