# IntoLibya Static Blog

High-performance Astro site for [intolibya.com](https://intolibya.com) — conversion-focused homepage, multilingual blog, and TourBuilder integration.

## Setup

```bash
npm install
cp .env.example .env   # add WP / Ollama (or OpenAI) / GA credentials
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

## Translations (Ollama on Mac Mini)

Automatic translations default to **local Ollama** (`TRANSLATE_PROVIDER=ollama`, model `qwen2.5:14b`). Run the **backlog batches on the 16GB Mac Mini** after pulling latest `main` — not on a smaller laptop.

Full steps: [content-review/mac-mini-translation-runbook.md](content-review/mac-mini-translation-runbook.md).

```bash
# On the Mac Mini, after git pull + ollama pull qwen2.5:14b:
npm run translate:status
npm run translate:missing -- --dry-run --wave 1 --limit 5
npm run translate:missing -- --wave 1 --kind destinations
npm run translate:missing -- --wave 1 --kind posts --limit 20   # chunk overnight; re-run to resume
npm run translate:missing -- --wave 1 --retry-failed
```

Progress is checkpointed in `.translate-state/` (gitignored). Re-run the same command after a crash — completed locale files are skipped.

Optional paid fallback: set `TRANSLATE_PROVIDER=openai` and `OPENAI_API_KEY`.

## Google Analytics

Blog and TourBuilder web share GA4 stream **`G-H6N6QW4W7T`**.

```bash
PUBLIC_GA_MEASUREMENT_ID=G-H6N6QW4W7T
```

Leave blank to disable. Full taxonomy, handoff, and DebugView steps: [docs/ANALYTICS.md](docs/ANALYTICS.md).  
GA4 Admin dimensions / Explorations: see TourBuilder `docs/GA4_CUSTOM_DIMENSIONS.md`.

Run classifier tests: `npm run test:analytics`

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

Requires Ollama running locally (default) or `OPENAI_API_KEY` if `TRANSLATE_PROVIDER=openai`. For the SEO backlog, prefer `npm run translate:missing` on the Mac Mini.

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
- `scripts/translate-missing.ts` — batch locale translation (Ollama / OpenAI)
