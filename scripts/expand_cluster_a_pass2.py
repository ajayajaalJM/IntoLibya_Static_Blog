#!/usr/bin/env python3
"""Pass 2: expand Cluster A posts still under 500 words."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.lib.update_post import update_post

ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "src/content/posts/en"

PASS2: dict[str, str] = {
    "morocco-tunisia-egypt-algeria-or-libya-which-fits-you": """
<h2>Budget without fake price wars</h2>
<p>IntoLibya does not publish competitor price tables. Compare value by included sponsorship, guide days, and site access rather than headline day rates alone. Libya quotes reflect licensed logistics that cheaper countries handle differently.</p>
""",
    "after-egypt-crowds-where-do-history-travelers-go": """
<h2>Guidebooks age quickly</h2>
<p>Access rules shift in North Africa faster than print editions update. Use operator calls for Libya and Algeria timing. Use guidebooks for context, not gospel, on border and site hours.</p>
""",
    "sahara-trips-compared-across-north-africa-borders": """
<h2>Photography goals change the pick</h2>
<p>Landscape shooters chasing clean horizons often lean Libya or Algeria. Social travelers wanting drum circles lean Morocco. Name your output before choosing sand.</p>
""",
    "best-north-africa-trip-if-you-want-guided-access-only": """
<h2>Medical and evacuation clarity</h2>
<p>Guided access countries still need insurance that names your destination. Ask operators what hospitals they use on route and how evacuation would start if a guest breaks an ankle on ruin stone.</p>
""",
    "why-some-north-africa-trips-feel-overcrowded": """
<h2>Private timing inside groups</h2>
<p>Even in Libya, small private tours feel emptier than large convoys. Group size is a crowd variable you can control with booking choices.</p>
""",
    "egypt-nile-cruise-alternatives-for-ruin-lovers": """
<h2>Mosaic lovers take note</h2>
<p>Libya and Tunisia both reward mosaic attention after Nile weeks heavy on stone columns. Add museum time if tesserae detail is your quiet joy.</p>
""",
    "how-to-build-a-maghreb-circuit-that-includes-libya": """
<h2>Embassy reality check</h2>
<p>Some passports need different lead times per country. Build the Maghreb spreadsheet around the slowest visa, usually Libya sponsorship, not the fastest Tunisian arrival.</p>
""",
    "unesco-world-heritage-across-north-africa-a-traveler-map": """
<h2>Repeat UNESCO without repeat emotion</h2>
<p>Second visits to the same country can still feel fresh when you change theme from medina to desert or west to east. Libya supports that pivot inside one nation when weeks allow.</p>
""",
    "search-north-africa-find-libya-when-you-want-space": """
<h2>Referral trust</h2>
<p>Many Libya bookings start when a friend returns from Leptis with disbelief in their voice. Personal referrals beat anonymous rankings for space seeking travelers.</p>
""",
    "after-marrakech-what-comes-next-in-north-africa": """
<h2>Food continuity</h2>
<p>Maghreb flavors echo between Morocco, Tunisia, and Libya even when sites change. Culinary comfort can smooth transitions while archaeology supplies novelty.</p>
""",
    "tunisia-beach-week-then-libya-culture-week": """
<h2>Baggage handoffs</h2>
<p>Pack one modest outfit bag ready for Libya medina and ruin days while beach gear stays in Tunisia storage if you loop back. Light transfers reduce stress at airports.</p>
""",
    "can-you-visit-four-maghreb-countries-in-one-month": """
<h2>Corporate leave reality</h2>
<p>Thirty day calendars rarely equal thirty travel days. Subtract meetings, jet lag, and one buffer day per border before boasting about four countries.</p>
""",
    "greek-ruins-outside-greece-where-north-africa-wins": """
<h2>Combine with Roman week</h2>
<p>East Libya Greek sites pair narratively with west Libya Roman cities on long leaves. That arc is rare outside North Africa and worth calendar space when access aligns.</p>
""",
    "desert-lakes-you-can-still-reach-in-north-africa": """
<h2>Swim expectations</h2>
<p>Desert lakes vary in swim friendliness by season and guide advice. Gaberoun surprises guests. Crater lakes may be look only. Confirm daily rather than assuming pool rules.</p>
""",
    "rock-art-destinations-across-the-sahara-compared": """
<h2>Copycat damage</h2>
<p>Viral panels suffer when tourists replicate risky poses. Follow guide paths so Acacus and Tassili panels survive for the next art pilgrim generation.</p>
""",
    "oasis-towns-of-north-africa-beyond-the-usual-list": """
<h2>Overnight versus day trip</h2>
<p>Ghadames deserves sleep inside the old town rhythm when lodging allows. Day tripping from distant hotels flattens the maze magic that overnight guests describe.</p>
""",
    "how-libya-fits-between-tunisia-and-egypt-on-a-map": """
<h2>Flight hubs matter</h2>
<p>Tunis, Tripoli, and Cairo hubs each change ticket math. Compare multi city fares once Libya sponsorship dates look solid rather than guessing handoffs early.</p>
""",
    "mediterranean-history-coast-from-tunis-to-benghazi": """
<h2>Wind and wardrobe</h2>
<p>Coastal ruin days need wind layers even when photos look tropical. Benghazi and Tripoli region breezes chill guests who packed only desert heat clothing.</p>
""",
    "planning-north-africa-without-only-doing-morocco": """
<h2>Language skills as unlock</h2>
<p>French helps Tunisia. Arabic crumbs help everywhere. English fluent guides in Libya reduce language fear for first Maghreb steps beyond Morocco.</p>
""",
    "algeria-sahara-dreams-what-libya-offers-instead": """
<h2>Combo itineraries</h2>
<p>Some guests do Algeria later and Libya now rather than waiting years for one perfect desert. Sequential deserts beat stalled dreaming.</p>
""",
    "siwa-style-oasis-travel-where-else-in-north-africa": """
<h2>Drive stamina</h2>
<p>Fezzan lake approaches require honest road hour acceptance. Siwa veterans who hate long drives may prefer Ghadames maze days without southern lake legs.</p>
""",
    "carthage-fans-what-to-see-next-across-the-border": """
<h2>Evening light at Sabratha</h2>
<p>Coastal theatre light late day rewards photographers and romantics alike. Ask guides about sunset timing when building west Libya weeks after Tunisian Carthage mornings.</p>
""",
    "luxor-fans-why-leptis-magna-belongs-on-the-list": """
<h2>Harbour stories for Nile graduates</h2>
<p>Trade and empire economics at Leptis complement temple theology heavy Egypt weeks. Together they widen ancient literacy rather than repeating monument awe alone.</p>
""",
    "north-africa-photography-trips-with-fewer-people-in-frame": """
<h2>Backup cards and dust</h2>
<p>Desert and ruin environments kill gear softly. Carry redundant storage and cleaning kits. The best frame is worthless if sand claims your only card reader.</p>
""",
    "family-north-africa-without-theme-park-crowds": """
<h2>Grandparent pacing</h2>
<p>Multi generation Libya trips work when hotel nights replace camp nights for elders while teens still get one supervised desert night if fitness allows.</p>
""",
    "muslim-friendly-north-africa-travel-beyond-the-usual-capitals": """
<h2>Ramadan travel notes</h2>
<p>Ramadan hours shift meal and site rhythm across North Africa. Licensed operators adjust schedules. Independent travelers should research fasting etiquette in each country separately.</p>
""",
    "adventure-travel-north-africa-when-you-want-real-desert-time": """
<h2>Navigation trust</h2>
<p>Real desert adventure means trusting guides when tracks disappear. Fighting local navigation instinct for phone maps is how teams get stuck unnecessarily.</p>
""",
    "off-the-beaten-path-north-africa-for-second-timers": """
<h2>Journal versus Instagram</h2>
<p>Second timers often switch from public posting to private journals at sensitive heritage sites. Libya rewards that maturity with deeper guide conversations.</p>
""",
    "why-guided-libya-trips-sit-beside-tunisia-egypt-holidays": """
<h2>Jet lag sequencing</h2>
<p>Beach Tunisia first can rest jet lag before Libya early ruin starts. Egypt red eye arrivals into immediate temple days exhaust guests before culture absorbs.</p>
""",
    "desert-camping-styles-across-morocco-tunisia-algeria-libya": """
<h2>Toilet expectations</h2>
<p>Ask plainly about camp toilet setups before romanticizing stars. Family comfort often hinges on this answer more than tent fabric quality.</p>
""",
    "history-teachers-choosing-a-north-africa-field-destination": """
<h2>Behavior contracts</h2>
<p>Student behavior agreements at mosques and ruins prevent one careless moment from ending future school access for other groups.</p>
""",
    "luxury-north-africa-without-only-atlas-and-nile-icons": """
<h2>Privacy as luxury</h2>
<p>Private vehicles and small groups are luxury in Libya even when hotel brands are modest. Define privacy expectations explicitly in TourBuilder intake.</p>
""",
    "north-africa-for-people-who-hate-mega-resorts": """
<h2>Transit hotel traps</h2>
<p>Airport zone chain hotels feel like resort lite. Stay medina centered or ruin proximate when possible even if stars are fewer.</p>
""",
    "coastal-north-africa-history-from-leptis-to-alexandria-ideas": """
<h2>Library before luggage</h2>
<p>One Mediterranean history book on the flight beats scrambling names on site without context. Leptis details unlock faster with prep.</p>
""",
    "what-makes-a-north-africa-trip-feel-authentic": """
<h2>Slow shopping</h2>
<p>Buying one meaningful craft slowly beats ten rushed souvenirs. Artisans remember polite conversations longer than hurried haggling performances.</p>
""",
    "film-and-photo-scouts-looking-at-north-africa-locations": """
<h2>Sunset permit buffers</h2>
<p>Golden hour shoots need exit plans before darkness. Scouts who ignore security curfew realities lose shots to rushed departures.</p>
""",
    "corporate-incentive-trips-looking-for-unusual-north-africa": """
<h2>Executive time protection</h2>
<p>Senior leaders need shorter heat exposure and private decompression time even on group incentives. Build tiers without shame so everyone completes the week.</p>
""",
    "desert-camping-morocco-tunisia-algeria-or-libya": """
<h2>Repeat desert travelers</h2>
<p>Guests who camped in Morocco often book Libya next for fewer drum circles and more horizon silence. Expectations shift with experience.</p>
""",
}


def wc(html: str) -> int:
    return len(re.sub(r"<[^>]+>", " ", html).split())


def main() -> int:
    for slug, block in PASS2.items():
        path = POSTS_DIR / f"{slug}.md"
        body = path.read_text().split("---", 2)[2]
        marker = "<h2>Related reading</h2>"
        if block.strip() in body:
            continue
        new_body = body.replace(marker, block + "\n" + marker, 1)
        fm = path.read_text().split("---", 2)[1]
        ex = re.search(r"^excerpt: '(.+)'$", fm, re.M).group(1).replace("''", "'")
        se = re.search(r"^  description: '(.+)'$", fm, re.M).group(1).replace("''", "'")
        update_post(slug, new_body.strip(), ex, se)
        w = wc(new_body)
        print(f"{slug}: {w}")

    # verify all 41
    import importlib.util
    spec = importlib.util.spec_from_file_location("rw", ROOT / "scripts/rewrite_cluster_a_north_africa.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    low = []
    counts = []
    for slug, _, _, _ in mod.POSTS:
        w = wc(path.read_text().split("---", 2)[2]) if (path := POSTS_DIR / f"{slug}.md").exists() else 0
        counts.append(w)
        if w < 500:
            low.append((slug, w))
    print(f"\nRange: {min(counts)}-{max(counts)}, low={len(low)}")
    return 1 if low else 0


if __name__ == "__main__":
    sys.exit(main())
