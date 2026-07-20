# 200 SEO blog posts index
All English drafts use `draft: true` and heroes at `/media/posts/{slug}/hero.webp`.
Grade 11 English. No hyphen characters in titles or body prose.
CDN product facts: bind IDs from tours/activities/events JSON. Translate later via blog writer.

## Batch files
- [Batch A](batch-a-posts.md) — 64 posts (access, safety, book, hero itineraries, top bridges, core FAQs)
- [Batch B](batch-b-posts.md) — 65 posts (commercial, itineraries, destinations, activities)
- [Batch C](batch-c-posts.md) — 71 posts (seasonal, events, audience, bridges, AI FAQs)

**Total: 200**

## How to translate
1. `npm run writer`
2. Open each EN draft
3. Translate & save all (needs `OPENAI_API_KEY`)
4. When ready to **schedule**: set `draft: false` and a `publishedAt` date (future dates stay hidden until that day)
5. When ready to **publish immediately**: set `draft: false` and `publishedAt` to today or earlier

## Scheduled publishing
- Live sites only include posts where `draft` is not true **and** `publishedAt` is on or before build time (`src/lib/publish.ts`).
- A GitHub Action (`.github/workflows/publish-schedule.yml`) rebuilds production **daily at 06:00 UTC** via a Vercel Deploy Hook.
- Repo secret required: `VERCEL_DEPLOY_HOOK_URL` (Vercel → Project → Settings → Git → Deploy Hooks → create hook for `main`).
- You can also run **Actions → Publish schedule → Run workflow** for an early release.
