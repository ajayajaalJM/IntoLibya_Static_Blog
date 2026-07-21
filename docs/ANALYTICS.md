# Analytics (IntoLibya blog)

The Astro blog and TourBuilder web app share one GA4 web stream:

**Measurement ID:** `G-H6N6QW4W7T`  
**Env var:** `PUBLIC_GA_MEASUREMENT_ID` (leave blank to disable)

Canonical event definitions live in the TourBuilder repo:  
`TourBuilder/analytics/events.json`

GA4 Admin runbook (custom dimensions, key events, Explorations):  
`TourBuilder/docs/GA4_CUSTOM_DIMENSIONS.md`

## What we send

Every custom event includes:

| Param | Value |
|-------|--------|
| `site_area` | `blog` |
| `content_type` | `home`, `hub`, `post`, `destination`, `destinations_index`, … |
| `content_id` | slug when applicable |
| `content_language` | page language |

### Click taxonomy

| Event | When |
|-------|------|
| `select_item` | Activity / tour / event card (with `items[]`) |
| `cta_click` | Generic TourBuilder CTAs (`build_trip`, `browse_activities`, …) |
| `content_select` | Post, destination, hub links |
| `resource_link_click` | Trip resource bar (explicit `data-ga-event`) |
| `contact_click` / `social_click` | tel, mailto, WhatsApp, social |
| `nav_click` / `footer_click` / `outbound_click` / `link_click` | Fallback |

**Classifier rule:** `selectedTour` / `selectedEvent` / activity paths beat bare `/tourbuilder/booking` so tour cards are not mislabeled as `build_trip`.

### Markup helpers

- `data-ga-section` — section name
- `data-ga-event` / `data-ga-label` / `data-ga-cta` — explicit events
- `data-ga-item-id` / `data-ga-item-type` / `data-ga-item-name` / `data-ga-item-index` — item identity on cards

Classifier implementation: [`src/lib/analytics.ts`](../src/lib/analytics.ts)  
Loader: [`src/components/GoogleAnalytics.astro`](../src/components/GoogleAnalytics.astro)

## Blog → TourBuilder handoff

On click to `/tourbuilder…`, the blog writes short-lived `sessionStorage` key `il_tb_entry_v1` with:

- `entry_page`, `entry_content_id`, `entry_section`, `entry_item_id`

TourBuilder reads and clears it once, then emits `tourbuilder_entry`.  
**Do not** add internal UTMs for same-host handoff — that would rewrite acquisition.

## Policies

- No PII in GA payloads (no email, phone, names, free-text forms).
- Consent Mode v2 is deferred.
- Native TourBuilder apps are out of scope for this blog doc; see TourBuilder `ANALYTICS.md`.

## DebugView checklist

1. Open a post with `?debug_mode=true` or use GA DebugView / Tag Assistant.
2. Click a tour card → expect `select_item` with `item_category=tour` and `item_id`.
3. Click Build Your Trip → expect `cta_click` / `cta_name=build_trip`.
4. Click a destination → expect `content_select` / `content_type=destination`.
5. Follow a TourBuilder link → in TourBuilder DebugView expect one `tourbuilder_entry` and `site_area=tourbuilder`.

Run unit checks: `npm run test:analytics`
