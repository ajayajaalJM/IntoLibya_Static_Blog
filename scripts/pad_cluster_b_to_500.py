#!/usr/bin/env python3
"""Pad Cluster B posts below 500 words with unique closing sections."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.lib.update_post import update_post

POSTS_DIR = Path(__file__).resolve().parents[1] / "src/content/posts/en"

SLUGS = [
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
    "how-fixed-event-dates-change-your-libya-booking-timeline",
    "coast-first-or-desert-first-how-guests-decide",
    "east-libya-or-west-libya-how-to-choose-your-first-region",
    "can-families-book-libya-tours-with-mixed-ages",
    "how-custom-quotes-differ-from-fixed-libya-packages",
    "airport-pickup-and-dropoff-on-guided-libya-trips",
    "what-language-support-guests-get-on-libya-tours",
    "dietary-needs-how-to-tell-us-before-a-libya-tour",
    "fitness-level-what-libya-tours-expect-from-guests",
    "how-weather-windows-shape-where-you-should-go",
    "insurance-proof-and-emergency-contacts-guests-prepare",
    "how-cancellation-talks-work-before-you-travel",
    "how-group-size-affects-a-libya-tour-day",
    "can-you-add-extra-days-after-a-fixed-libya-package",
    "event-travel-versus-flexible-tourbuilder-libya-trips",
]

PAD: dict[str, str] = {
    "libya-tour-booking-steps-from-first-email-to-arrival": """
<h2>Keep one booking thread</h2>
<p>Visa updates, flight changes, and hotel notes stay easier when they live in one TourBuilder conversation. Scattered messages slow sponsor batches and confuse arrival pickup timing.</p>
""",
    "passport-photos-and-forms-guests-usually-send-first": """
<h2>Label files clearly</h2>
<p>Name scans LASTNAME_passport.pdf so group batches stay sorted. Coordinators handle dozens of files each week. Clear labels prevent your scan from sitting unopened behind a generic photo name.</p>
""",
    "how-flights-work-when-a-tour-company-guides-your-libya-entry": """
<h2>Share ticket changes fast</h2>
<p>Airline rebooks through Tunis happen. Message your coordinator when schedules shift so Mitiga pickup stays accurate and hotel hold times stay sensible.</p>
""",
    "who-arranges-hotels-on-a-guided-libya-tour": """
<h2>Trust the plan, flag the needs</h2>
<p>You choose comfort level in your brief. IntoLibya chooses workable properties inside licensed routes. That split keeps nights safe without turning you into a remote hotel researcher.</p>
""",
    "where-should-first-timers-go-in-libya-first": """
<h2>Book depth, not checklist noise</h2>
<p>One slow Leptis morning teaches more than three rushed sites in a day. Tell TourBuilder you want quality hours, not hero mileage, on your first visit.</p>
""",
    "what-happens-on-day-one-after-you-land-in-libya": """
<h2>Sleep is part of the itinerary</h2>
<p>Operators are not failing you if day one is light. Jet lag management protects day two at the ruins. Rest without guilt.</p>
""",
    "how-long-before-travel-should-guests-send-documents": """
<h2>Peak season rewards early files</h2>
<p>October and March departures fill sponsor queues. Early scans help you hold guide days before flights climb in price.</p>
""",
    "what-guests-ask-most-before-paying-a-libya-tour-deposit": """
<h2>There are no trick questions</h2>
<p>Asking about safety, visas, or cancel terms before deposit is smart, not rude. IntoLibya prefers clear guests to silent guessers who panic later.</p>
""",
    "what-intolibya-tripadvisor-guests-mention-most": """
<h2>Bring your own must sees</h2>
<p>Reviews describe past trips. Your TourBuilder brief shapes the next one. Mention quiet ruins or camp limits explicitly if those themes matter to you.</p>
""",
    "how-to-describe-your-dream-libya-trip-in-one-message": """
<h2>Shorter is usually better</h2>
<p>One structured paragraph beats three pages of pasted blog links. Coordinators read briefs daily. Respect their time and yours with clear constraints.</p>
""",
    "where-to-go-map-ideas-before-you-open-tourbuilder": """
<h2>Delete pins until the week breathes</h2>
<p>Every extra stop costs driving hours in Libya. Trim the map once, then open TourBuilder with a spine that human bodies can actually travel.</p>
""",
    "how-fixed-event-dates-change-your-libya-booking-timeline": """
<h2>Event weeks are not coast weeks</h2>
<p>Do not apply flexible trip cancel habits to rally or eclipse products. Read event terms as their own category before you deposit.</p>
""",
    "coast-first-or-desert-first-how-guests-decide": """
<h2>Talk to your travel partner early</h2>
<p>One person wants camps. One person wants hotels. Resolve that before deposit instead of debating at the Ghadames turnoff.</p>
""",
    "east-libya-or-west-libya-how-to-choose-your-first-region": """
<h2>Second trips flip the map</h2>
<p>Many guests treat west and east as separate journeys across years. That is wisdom, not failure. Depth beats coverage.</p>
""",
    "can-families-book-libya-tours-with-mixed-ages": """
<h2>Family success is pacing</h2>
<p>Libya rewards families who accept guided structure and refuse hero days. Build rest into the quote, not as an apology on day three.</p>
""",
    "how-custom-quotes-differ-from-fixed-libya-packages": """
<h2>Custom is not chaos</h2>
<p>Custom quotes still follow licensed routes and checkpoint reality. Flexibility lives in pacing and nights, not freelance wandering.</p>
""",
    "airport-pickup-and-dropoff-on-guided-libya-trips": """
<h2>Save coordinator numbers offline</h2>
<p>Store WhatsApp or phone contacts where roaming lag cannot hide them. Mitiga arrivals feel calmer when you can reach your team instantly.</p>
""",
    "what-language-support-guests-get-on-libya-tours": """
<h2>Confirm language in the quote</h2>
<p>English guiding is normal yet should appear in your written inclusions for peace of mind. Special language requests need lead time.</p>
""",
    "dietary-needs-how-to-tell-us-before-a-libya-tour": """
<h2>Specific beats shy</h2>
<p>Operators cannot guess severity from silence. Write allergies and preferences plainly in TourBuilder so kitchens and guides can protect you.</p>
""",
    "fitness-level-what-libya-tours-expect-from-guests": """
<h2>Slow days are allowed</h2>
<p>Request shade breaks without embarrassment. Good operators prefer honest limits to collapsed guests at a theatre mid day.</p>
""",
    "how-weather-windows-shape-where-you-should-go": """
<h2>Season beats social media</h2>
<p>Photos online rarely show the month they were taken. Tell coordinators your travel month first so routes respect heat and cold honestly.</p>
""",
    "insurance-proof-and-emergency-contacts-guests-prepare": """
<h2>Home contacts matter</h2>
<p>One reachable person who knows your dates reduces anxiety on both sides of the Mediterranean. Share coordinator contacts with them too.</p>
""",
    "how-cancellation-talks-work-before-you-travel": """
<h2>Ask in writing</h2>
<p>Verbal assurances fade. Written quote terms survive staff turnover and timezone gaps. Clarity before deposit prevents sour surprises.</p>
""",
    "how-group-size-affects-a-libya-tour-day": """
<h2>Count every traveler</h2>
<p>Infants and quiet teens still need passport names on sponsor lists. Quote the real headcount early so vehicles and rooms fit on day one.</p>
""",
    "can-you-add-extra-days-after-a-fixed-libya-package": """
<h2>Merge before the eVisa step</h2>
<p>Add buffer nights in TourBuilder before visa dates lock when possible. One sponsor itinerary is cleaner than retroactive patches.</p>
""",
    "event-travel-versus-flexible-tourbuilder-libya-trips": """
<h2>Name the mode in line one</h2>
<p>Write eclipse, rally, festival, or flexible coast week in your first message. One anchor word routes you to the correct TourBuilder path faster.</p>
""",
}

PAD2: dict[str, str] = {
    "east-libya-or-west-libya-how-to-choose-your-first-region": """
<h2>Start west if unsure</h2>
<p>When in doubt, western Leptis and Sabratha weeks remain the safest first timer proof. You can chase Cyrene on a return leave window with more days and clearer purpose.</p>
""",
    "can-you-add-extra-days-after-a-fixed-libya-package": """
<h2>Package spine, custom rhythm</h2>
<p>Fixed packages give sensible driving math. Extra days let you breathe inside that math. IntoLibya merges both into one sponsor file when you extend before deposit.</p>
""",
    "fitness-level-what-libya-tours-expect-from-guests": """
<h2>Heat beats distance</h2>
<p>Midsummer coast walks tire people faster than kilometer counts suggest. Tell coordinators if you need early starts and midday rest rather than proud silence.</p>
""",
    "how-long-before-travel-should-guests-send-documents": """
<h2>Do not wait for flights</h2>
<p>Many guests buy tickets before scans. Reverse that habit when you can. Sponsor timing should lead flight shopping, not chase it.</p>
""",
    "how-custom-quotes-differ-from-fixed-libya-packages": """
<h2>Same licensed frame</h2>
<p>Custom or package, you still travel with guides and sponsorship. The difference is how quickly the outline arrives and how tightly days are preset.</p>
""",
    "how-cancellation-talks-work-before-you-travel": """
<h2>Event terms differ</h2>
<p>Eclipse and rally products often carry stricter change language than flexible coast weeks. Read category specific terms instead of assuming one policy fits all.</p>
""",
    "can-families-book-libya-tours-with-mixed-ages": """
<h2>One pace for the slowest walker</h2>
<p>Family routes succeed when the slowest member sets the daily limit. Teens can explore wings with guides while grandparents rest without shame.</p>
""",
    "what-happens-on-day-one-after-you-land-in-libya": """
<h2>Tomorrow starts early</h2>
<p>Day one rest protects day two dawn at the ruins. Operators plan early starts when heat demands them. Sleep tonight is part of that plan.</p>
""",
    "insurance-proof-and-emergency-contacts-guests-prepare": """
<h2>Evacuation cover matters</h2>
<p>Standard holiday insurance may thin out in remote Sahara legs. Read geography clauses before you assume your card is enough.</p>
""",
    "how-to-describe-your-dream-libya-trip-in-one-message": """
<h2>Must sees beat mood boards</h2>
<p>Three named sites and one hard limit beat ten adjectives about wonder. Coordinators translate concrete lists into licensed days faster than poetry.</p>
""",
    "how-fixed-event-dates-change-your-libya-booking-timeline": """
<h2>Buffers are not optional extras</h2>
<p>Event travel without spare days assumes perfect flights and weather. That assumption fails often enough that buffers should be budgeted, not treated as luxury.</p>
""",
    "event-travel-versus-flexible-tourbuilder-libya-trips": """
<h2>Wrong mode wastes leave</h2>
<p>Flexible guests who need fixed eclipse timing should not resist event products. Event guests who want open coast pacing should not buy rally weekend shapes by mistake.</p>
""",
    "how-group-size-affects-a-libya-tour-day": """
<h2>Meals take longer in big groups</h2>
<p>Restaurant seating and bathroom stops scale with headcount more than maps admit. Build patience into large private groups without treating delays as operator failure.</p>
""",
    "dietary-needs-how-to-tell-us-before-a-libya-tour": """
<h2>Remote days need planning</h2>
<p>Desert camp menus cannot improvise severe allergy coverage on arrival. Remote legs deserve the clearest notes you can write.</p>
""",
    "how-weather-windows-shape-where-you-should-go": """
<h2>Camp nights need wardrobe honesty</h2>
<p>Cold Sahara midnight air surprises guests who packed only t shirts. Weather planning includes what you put in the bag, not only which pin you click.</p>
""",
    "what-guests-ask-most-before-paying-a-libya-tour-deposit": """
<h2>Compare quotes fairly</h2>
<p>Two seven day totals may hide different meal counts, camp gear, or eVisa fee handling. Line items beat headline price anxiety.</p>
""",
    "where-to-go-map-ideas-before-you-open-tourbuilder": """
<h2>Read one guide per region</h2>
<p>Destination pages explain access without hype. Pair one guide with three map pins, then stop scrolling before ambition outruns calendar days.</p>
""",
    "passport-photos-and-forms-guests-usually-send-first": """
<h2>Children need files too</h2>
<p>Family batches stall on one missing teen scan more often than on adult typos. Send every traveler in one organized batch when possible.</p>
""",
    "what-language-support-guests-get-on-libya-tours": """
<h2>Evenings need clarity too</h2>
<p>Ask guides to recap tomorrow timing at dinner if your group includes anxious travelers. Five minutes prevents morning confusion at checkpoints.</p>
""",
    "airport-pickup-and-dropoff-on-guided-libya-trips": """
<h2>Departure mirrors arrival</h2>
<p>Checkout and checkpoint buffers matter leaving too. Share outbound flights when booked so hotel pickup timing includes margin, not hope.</p>
""",
    "what-intolibya-tripadvisor-guests-mention-most": """
<h2>Patterns, not promises</h2>
<p>Reviews show recurring themes about quiet ruins and handled logistics. Your month, route, and guide assignment still make the final week yours.</p>
""",
    "coast-first-or-desert-first-how-guests-decide": """
<h2>Camp fear is valid data</h2>
<p>Guests who fear cold camps should say so before routing desert first. Honesty beats bravado when night temperature drops in Fezzan.</p>
""",
    "how-flights-work-when-a-tour-company-guides-your-libya-entry": """
<h2>Tunis connections are common</h2>
<p>Many Europeans hub through Tunis to Mitiga. Build connection margin on both legs. One tight ticket can waste a visa week.</p>
""",
    "where-should-first-timers-go-in-libya-first": """
<h2>Ghadames rewards time</h2>
<p>If leave allows, one night in the old oasis town upgrades a coast week from sampler to story. Ask TourBuilder where Ghadames fits without rushing south.</p>
""",
}


def wc(html: str) -> int:
    return len([w for w in re.sub(r"<[^>]+>", " ", html).split() if w])


def parse_post(path: Path) -> tuple[str, str, str]:
    raw = path.read_text()
    parts = raw.split("---", 2)
    fm = parts[1]
    body = parts[2].lstrip()
    excerpt_m = re.search(r"^excerpt: '(.+)'$", fm, re.M)
    seo_m = re.search(r"^  description: '(.+)'$", fm, re.M)
    excerpt = excerpt_m.group(1).replace("''", "'") if excerpt_m else ""
    seo = seo_m.group(1).replace("''", "'") if seo_m else ""
    return body, excerpt, seo


def main() -> int:
    counts = []
    for slug in SLUGS:
        path = POSTS_DIR / f"{slug}.md"
        body, excerpt, seo = parse_post(path)
        changed = False
        for block in (PAD, PAD2):
            if slug not in block:
                continue
            if wc(body) >= 500:
                break
            if block[slug].strip() not in body:
                body = body.replace(
                    "<h2>Related reading</h2>",
                    block[slug].strip() + "\n\n<h2>Related reading</h2>",
                    1,
                )
                changed = True
        if changed:
            update_post(slug, body.strip(), excerpt, seo)
        counts.append((slug, wc(body)))

    print("\nWord counts:")
    min_slug, min_wc = min(counts, key=lambda x: x[1])
    for slug, n in sorted(counts, key=lambda x: x[1]):
        flag = " LOW" if n < 500 else ""
        print(f"  {n:4d}{flag}  {slug}")
    print(f"\nMin: {min_wc} ({min_slug})")
    return 1 if min_wc < 500 else 0


if __name__ == "__main__":
    raise SystemExit(main())
