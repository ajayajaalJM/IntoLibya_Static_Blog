## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Unpublished post QA board

In the local writer (`npm run writer`), open the **QA** nav tab (or Dashboard → QA board). It infinite-scrolls every unpublished English post (draft or future `publishedAt`) with automated error/warning chips and highlighted hits. Use **Open in editor** to fix a post in place.

This stays in the writer only — it is not part of the public Astro site.

## Images tab (local writer)

Open **Images** in `npm run writer` to browse `public/media`, edit tags/alt/credits, copy URL / Markdown / HTML, and see English usage counts.

- Uploads write a **lossless WebP master** plus responsive `.w{width}.webp` derivatives (400–1920). Content paths always point at the master.
- Catalog: `data/media-catalog.json` (manual edits preserved). Rebuild with **Re-index** or `npm run media:index`.
- Optional: `npm run media:backfill-derivatives` for older assets missing `.w*.webp` files.
- Post/destination frontmatter may include private `tags` and `featuredImageAlt` (writer UX / SEO — no public tag pages).
- Destination quick-tags come from `DESTINATION_TRANSLATION_GROUPS`. Do not auto-delete unused or credited pool assets.
- **Duplicates:** **Review duplicates** always re-indexes first. **Auto-merge exact duplicates** consolidates every byte-identical group after one batch preview. In similar groups, select matching images to merge, or mark the entire group not similar; reviewed decisions persist in `data/media-duplicate-decisions.json`. Redundant files move to `media-quarantine/` (gitignored), not deleted. CLI: `npm run media:consolidate -- --list`.
- Click an image to edit **default alt** (autosaves) and **per-use alts** on each English usage. “Fill missing per-use alts” only fills empty ones.
- Public **image sitemap**: `/image-sitemap.xml` (also listed in `robots.txt`) — published masters only.

## Guest post prose (hard rule)

Catalog Notes in `content-review/` (Soft CTA, SME confirm, Hotels stay vague, Accessible east, etc.) are **internal planning only**. Never paste them into `src/content/posts/` or destination bodies.

- CTAs go to TourBuilder (`/tourbuilder/booking`), not email.
- `scripts/generate-wave2-remaining.py` is permanently disabled; do not revive it.
- Before build: `npm run lint:posts` (also runs in `prebuild`).

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
