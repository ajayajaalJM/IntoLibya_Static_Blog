# IntoLibya Static Blog

High-performance Astro site for [intolibya.com](https://intolibya.com) — conversion-focused homepage, multilingual blog, and TourBuilder integration.

## Setup

```bash
npm install
cp .env.example .env   # add WP / OpenAI / GA credentials
```

Set `PUBLIC_GA_MEASUREMENT_ID` in `.env` to your GA4 Measurement ID (`G-XXXXXXXXXX`). Leave it blank to disable analytics.

## Run locally

Start the Astro blog and the dev blog writer together:

```bash
./scripts/start.sh
```

- **Blog** — http://localhost:4321
- **Writer** — http://localhost:5174 (local only, not deployed)

Press `Ctrl+C` to stop both. To run them separately: `npm run dev` and `npm run writer`.

Open Graph share images (1200×630) and the Pinterest pin (1000×1500) are generated with `npm run generate:og` (also runs automatically before `npm run build`).

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

## Google Analytics

Set your GA4 Measurement ID in `.env` (and in Vercel env vars for production):

```bash
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

When set, every page loads GA4 and fires click events for CTAs, nav, footer, contact (phone / email / WhatsApp), social, TourBuilder cards, blog links, and outbound links. Leave blank to disable.

## Images

Production uses **Vercel Image Optimization** (AVIF/WebP + responsive `srcset`) via Astro’s `<Picture>` component. Hero LCP is preloaded. Keep `imageService: true` on the Vercel adapter in `astro.config.mjs`.

## Dev blog writer (local only)

```bash
npm run writer
```

Opens at **http://localhost:5174** — local only, not deployed (see `.vercelignore`).

- Write in **English only**
- Click **Translate & save all** to auto-translate into all blog languages and save to `src/content/posts/`
- Use the **Library** tab to browse and edit existing post groups
- Use the **Instagram** tab (`#instagram`) to curate the homepage Instagram tiles (`data/instagram-feed.json` + posters in `public/media/instagram/`). Paste/edit Reel URLs, click **Fetch OG** to pull the poster, then **Save feed** and deploy. Homepage shows a 3×3 Reels-style grid.

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
