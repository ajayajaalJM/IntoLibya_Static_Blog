## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Unpublished post QA board

In the local writer (`npm run writer`), open the **QA** nav tab (or Dashboard → QA board). It infinite-scrolls every unpublished English post (draft or future `publishedAt`) with automated error/warning chips and highlighted hits. Use **Open in editor** to fix a post in place.

This stays in the writer only — it is not part of the public Astro site.

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
