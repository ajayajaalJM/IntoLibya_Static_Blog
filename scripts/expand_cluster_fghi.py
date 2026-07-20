#!/usr/bin/env python3
"""Expand cluster F/G/H/I posts to 500+ words with extra topic sections."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.lib.update_post import update_post

ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "src/content/posts/en"

SKIP = {
    "benghazi-path-totality-what-travelers-need-explained-simply",
    "culture-days-at-the-ghat-international-tourism-festival",
}

EXTRA_SECTIONS: dict[str, list[tuple[str, str]]] = {}


def extra_for_market(slug: str) -> list[tuple[str, str]]:
    return [
        (
            "Document checklist before you buy flights",
            "Scan passports with long validity remaining. Collect passport photos that match current eVisa specifications. Share exact legal names in TourBuilder before anyone books nonrefundable tickets. IntoLibya sponsorship letters unlock the visa path. Until those exist, treat airfare quotes as provisional. Many travelers from your region also need travel insurance proof that explicitly mentions Libya on a licensed tour. Read that policy paragraph yourself rather than assuming brand marketing covers every country name.",
        ),
        (
            "Western first timer routes that work",
            "Most successful first itineraries combine Tripoli arrival logistics with Leptis Magna and Sabratha coast days, then add Ghadames oasis texture or a short Sahara camp when season allows. That shape delivers UNESCO scale without forcing Fezzan expedition mileage on week one. If you have more leave, ask about Shahat and Susa in east Libya as a second chapter rather than compressing Cyrenaica into a tired add on day.",
        ),
        (
            "Mistakes we see from distant markets",
            "Buying flights before sponsorship starts. Ignoring advisory insurance wording. Packing only resort clothing without modest city layers. Treating Libya like independent Morocco or Egypt travel. Announcing public travel dates before visa files look credible. Each mistake is preventable when TourBuilder leads the sequence and IntoLibya replies with document timing inside the planning flow.",
        ),
    ]


def extra_for_audience(slug: str) -> list[tuple[str, str]]:
    return [
        (
            "Questions to answer in TourBuilder notes",
            "Dates with flexibility if possible. Passport nationalities and exact spellings. Mixed ages or mobility limits. Dietary and prayer timing needs. Photography or filming intent. Prior North Africa travel history. Must see sites ranked honestly. The brief replaces vague email chains and lets IntoLibya quote a licensed route that matches real people, not brochure fantasy.",
        ),
        (
            "Season pairing for your traveler type",
            "Autumn and spring remain the comfort sweet spot for ruin walking and desert camps. Winter coast weeks attract northern guests who want mild Mediterranean air. Summer deep Sahara chapters need extra caution unless your group truly wants heat. Read best time to visit Libya on the site, then align leave calendars with weather honesty rather than cheapest fare roulette.",
        ),
        (
            "How licensed structure helps your segment",
            "Sponsorship, guides, known drivers, and planned checkpoints reduce uncertainty for every audience segment. Families gain pacing support. Muslim guests gain faith aligned meal timing when requested. Creators gain photo rule briefings. School groups gain document sequencing advice. Luxury guests gain private vehicle continuity. The structure is not bureaucracy theater. It is how legal tourism access works in Libya today.",
        ),
    ]


def extra_for_activity(slug: str) -> list[tuple[str, str]]:
    return [
        (
            "How to request this in TourBuilder",
            "Browse activities or add a custom note on your outline. Name preferred dates and whether the stop is essential or optional. IntoLibya confirms live availability rather than guaranteeing daily operations in marketing copy. Build core UNESCO or desert days first, then layer micro experiences that fit energy and weather. One or two add ons beat five half finished stops.",
        ),
        (
            "Pairing without wrecking the week",
            "Strong itineraries alternate heavy site mornings with lighter cultural or food stops. After long transfers, choose soft culture rather than new adventure sports. Before camp nights, avoid stacking multiple high energy activities. Guides know local timing. Trust their sequencing more than checklist ambition from late night research tabs.",
        ),
        (
            "Respect as access infrastructure",
            "Rock art, mosques, markets, festivals, and home visits stay open when guests behave well. Ask before filming people. Dress modestly in living communities. Follow guide paths at fragile ruins. Do not climb heritage fabric for photos. Respectful travelers preserve the quiet and access that make Libya special for the next guest.",
        ),
    ]


def get_extra(slug: str) -> list[tuple[str, str]]:
    if slug in EXTRA_SECTIONS:
        return EXTRA_SECTIONS[slug]
    if slug.startswith("how-to-travel-to-libya-from-"):
        return extra_for_market(slug)
    activity_markers = [
        "ride-around", "ali-gana", "abandoned", "villa-seline", "tolmeita", "hattia",
        "old-city", "ptolemais", "qasr-libya", "wadi-mathendous", "apollonia", "green-mountain-versus",
        "how-far-is-cyrene", "best-base", "three-day", "lunch-in-a-damos", "traditional-horse",
        "honey-and-tanour", "tarmisa", "sfenz", "omar-el-mukhtar", "sandboarding", "sebha",
        "al-bayda", "jebel-nafusa-versus", "misrata", "olive-culture", "ghadames-festival",
        "nalut-spring", "zuwarah", "ghadames-cafe", "ghadames-dress", "paragliding",
        "horse-riding", "spearfishing", "skydiving", "ziplining", "watching-a-football",
    ]
    if any(m in slug for m in activity_markers):
        return extra_for_activity(slug)
    return extra_for_audience(slug)


def inject_sections(body: str, extra: list[tuple[str, str]]) -> str:
    parts = []
    for title, para in extra:
        parts.append(f"<h2>{title}</h2>\n<p>{para}</p>")
    block = "\n\n".join(parts)
    marker = "<h2>Related reading</h2>"
    if marker not in body:
        return body + "\n\n" + block
    return body.replace(marker, block + "\n\n" + marker, 1)


def my_batch_slugs() -> list[str]:
    from scripts.rewrite_cluster_fghi import POSTS

    text = (ROOT / "content-review/next-200-publish-schedule.md").read_text(encoding="utf-8")
    schedule = re.findall(r"`([a-z0-9-]+)`", text)
    excluded = set()
    for s in schedule:
        if any(k in s for k in ["rally-te-te", "double-shafra", "ghat-festival", "combining-ghat"]):
            excluded.add(s)
        if "waddan" in s and "rally" in s:
            excluded.add(s)
        if s.startswith("november-in-libya-rally"):
            excluded.add(s)
        if "what-desert-rally" in s or "family-friendly-angles-on-a-desert-rally" in s:
            excluded.add(s)
    for s in schedule:
        if "eclipse" in s:
            excluded.add(s)
    excluded.update(
        {
            "north-africa-winter-sun-without-only-going-to-egypt",
            "escape-cold-weather-with-a-mild-libya-winter-trip",
            "libya-in-december-for-travelers-leaving-snow-behind",
            "libya-in-january-sunshine-without-summer-desert-heat",
            "holiday-season-travel-to-libya-without-mega-resort-crowds",
            "plan-a-chill-season-libya-trip-before-peak-summer-heat",
            "nordic-winter-escape-planning-a-libya-warm-break",
            "what-to-wear-for-chill-evenings-on-a-libya-winter-tour",
            "why-winter-is-a-smart-window-for-roman-ruin-days",
            "short-winter-break-ideas-for-a-four-day-libya-escape",
            "longer-winter-circuits-when-you-have-two-weeks-off",
            "green-mountain-cool-air-versus-sahara-mild-winter-days",
            "rain-chances-on-libya-winter-coast-days",
            "coastal-libya-temperatures-when-europe-feels-freezing",
            "desert-days-still-pleasant-in-libya-late-autumn",
        }
    )
    cluster_a = {
        "is-libya-part-of-a-north-africa-trip-plan",
        "north-africa-destinations-ranked-for-empty-unesco-sites",
        "morocco-tunisia-egypt-algeria-or-libya-which-fits-you",
        "after-egypt-crowds-where-do-history-travelers-go",
        "sahara-trips-compared-across-north-africa-borders",
        "roman-ruins-without-the-crowds-in-north-africa",
        "best-north-africa-trip-if-you-want-guided-access-only",
        "why-some-north-africa-trips-feel-overcrowded",
        "egypt-nile-cruise-alternatives-for-ruin-lovers",
        "how-to-build-a-maghreb-circuit-that-includes-libya",
        "unesco-world-heritage-across-north-africa-a-traveler-map",
        "search-north-africa-find-libya-when-you-want-space",
        "after-marrakech-what-comes-next-in-north-africa",
        "tunisia-beach-week-then-libya-culture-week",
        "can-you-visit-four-maghreb-countries-in-one-month",
        "greek-ruins-outside-greece-where-north-africa-wins",
        "desert-lakes-you-can-still-reach-in-north-africa",
        "rock-art-destinations-across-the-sahara-compared",
        "oasis-towns-of-north-africa-beyond-the-usual-list",
        "how-libya-fits-between-tunisia-and-egypt-on-a-map",
        "mediterranean-history-coast-from-tunis-to-benghazi",
        "planning-north-africa-without-only-doing-morocco",
        "algeria-sahara-dreams-what-libya-offers-instead",
        "siwa-style-oasis-travel-where-else-in-north-africa",
        "carthage-fans-what-to-see-next-across-the-border",
        "luxor-fans-why-leptis-magna-belongs-on-the-list",
        "north-africa-photography-trips-with-fewer-people-in-frame",
        "family-north-africa-without-theme-park-crowds",
        "muslim-friendly-north-africa-travel-beyond-the-usual-capitals",
        "adventure-travel-north-africa-when-you-want-real-desert-time",
        "off-the-beaten-path-north-africa-for-second-timers",
        "why-guided-libya-trips-sit-beside-tunisia-egypt-holidays",
        "desert-camping-styles-across-morocco-tunisia-algeria-libya",
        "history-teachers-choosing-a-north-africa-field-destination",
        "luxury-north-africa-without-only-atlas-and-nile-icons",
        "coast-first-or-desert-first-how-guests-decide",
        "coastal-north-africa-history-from-leptis-to-alexandria-ideas",
        "what-makes-a-north-africa-trip-feel-authentic",
        "film-and-photo-scouts-looking-at-north-africa-locations",
        "north-africa-for-people-who-hate-mega-resorts",
        "corporate-incentive-trips-looking-for-unusual-north-africa",
    }
    excluded.update(cluster_a)
    cluster_b = {
        "what-do-you-need-from-me-to-start-a-libya-tour-booking",
        "libya-tour-booking-steps-from-first-email-to-arrival",
        "passport-photos-and-forms-guests-usually-send-first",
        "how-flights-work-when-a-tour-company-guides-your-libya-entry",
        "who-arranges-hotels-on-a-guided-libya-tour",
        "where-should-first-timers-go-in-libya-first",
        "what-happens-on-day-one-after-you-land-in-libya",
        "how-long-before-travel-should-guests-send-documents",
        "what-guests-ask-most-before-paying-a-libya-tour-deposit",
        "what-intolibya-tripadvisor-guests-mention-most",
        "how-to-describe-your-dream-libya-trip-in-one-message",
        "where-to-go-map-ideas-before-you-open-tourbuilder",
        "how-custom-quotes-differ-from-fixed-libya-packages",
        "airport-pickup-and-dropoff-on-guided-libya-trips",
        "what-language-support-guests-get-on-libya-tours",
        "dietary-needs-how-to-tell-us-before-a-libya-tour",
        "fitness-level-what-libya-tours-expect-from-guests",
        "how-weather-windows-shape-where-you-should-go",
        "insurance-proof-and-emergency-contacts-guests-prepare",
        "how-cancellation-talks-work-before-you-travel",
        "event-travel-versus-flexible-tourbuilder-libya-trips",
        "can-you-add-extra-days-after-a-fixed-libya-package",
        "how-group-size-affects-a-libya-tour-day",
        "how-fixed-event-dates-change-your-libya-booking-timeline",
    }
    excluded.update(cluster_b)
    cluster_c = {
        "is-libya-dangerous-for-tourists-on-guided-trips",
        "why-people-search-is-libya-safe-and-what-changes-on-a-tour",
        "libya-safety-for-tourists-compared-with-headline-fear",
        "what-safe-feels-like-day-to-day-on-a-libya-tour",
        "is-libya-safe-enough-for-a-short-first-visit",
        "what-advisories-mean-when-you-still-want-to-visit-libya",
        "a-calm-checklist-before-you-decide-libya-is-for-you",
        "how-guests-talk-about-safety-after-returning-from-libya",
        "safety-questions-friends-will-ask-before-your-libya-trip",
        "how-tour-days-reduce-uncertainty-for-nervous-travelers",
        "libya-travel-fear-versus-on-the-ground-tour-rhythm",
        "is-the-libyan-sahara-safe-for-camping-guests",
        "city-walking-safety-on-guided-tripoli-days",
        "how-women-guests-describe-feeling-safe-in-libya",
        "is-libya-safe-for-photographers-who-follow-local-rules",
        "safety-for-older-travelers-on-supported-libya-itineraries",
        "scam-anxiety-versus-real-tourist-risks-in-libya",
        "how-communication-with-your-guide-builds-safety-confidence",
    }
    excluded.update(cluster_c)
    markets = {s for s in schedule if s.startswith("how-to-travel-to-libya-from-") and s not in excluded}
    return sorted((set(POSTS.keys()) | markets) - SKIP - excluded)


def main() -> None:
    slugs = my_batch_slugs()
    count = 0
    for slug in slugs:
        if slug in SKIP:
            continue
        path = POSTS_DIR / f"{slug}.md"
        if not path.exists():
            continue
        raw = path.read_text(encoding="utf-8")
        parts = raw.split("---", 2)
        if len(parts) < 3:
            continue
        fm = parts[1]
        body = parts[2].lstrip()
        # skip if already expanded
        if "Document checklist before you buy flights" in body or "How to request this in TourBuilder" in body:
            if "Mistakes we see from distant markets" in body or "Respect as access infrastructure" in body:
                continue
        new_body = inject_sections(body, get_extra(slug))
        if new_body == body:
            continue
        # preserve excerpt/seo from fm
        ex_m = re.search(r"^excerpt:\s*'([^']*(?:''[^']*)*)'", fm, re.M)
        seo_m = re.search(r"^  description:\s*'([^']*(?:''[^']*)*)'", fm, re.M)
        excerpt = ex_m.group(1).replace("''", "'") if ex_m else ""
        seo = seo_m.group(1).replace("''", "'") if seo_m else ""
        update_post(slug, new_body, excerpt, seo)
        count += 1
    print(f"Expanded {count} posts")


if __name__ == "__main__":
    main()
