#!/usr/bin/env python3
"""Pass 3: final word count boost for Cluster A posts under 500 words."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.lib.update_post import update_post

POSTS_DIR = Path(__file__).resolve().parents[1] / "src/content/posts/en"

PASS3: dict[str, str] = {
    "after-egypt-crowds-where-do-history-travelers-go": """
<h2>Start TourBuilder with crowd tolerance written down</h2>
<p>When you open TourBuilder, state plainly that quiet ruins matter more than maximizing site count. IntoLibya guides then protect slow mornings at Leptis and Sabratha instead of treating them like checklist stops between transfers.</p>
""",
    "sahara-trips-compared-across-north-africa-borders": """
<h2>Write your desert thesis in one line</h2>
<p>Before deposits, finish this sentence: I want introduction sand, expedition sand, or coast plus sand. That line picks Morocco, Tunisia, Algeria, or Libya faster than comparing flag counts with friends who traveled different years under different access rules.</p>
<p>IntoLibya answers the coast plus sand brief with licensed Fezzan and Ghadames options when seasons support them.</p>
""",
    "egypt-nile-cruise-alternatives-for-ruin-lovers": """
<h2>Keep Egypt memories without repeating them</h2>
<p>Many ruin lovers still love Egypt and simply need a second chapter with different physics. Libya supplies that chapter without asking you to reject Nile memories. Sequence both across years and compare notes with guides who enjoy cross country conversations.</p>
""",
    "how-to-build-a-maghreb-circuit-that-includes-libya": """
<h2>Group chat discipline</h2>
<p>Maghreb group trips die in chat threads where Tunisia hotel links mix with Libya visa rumors. Appoint one document owner and one Libya coordinator. IntoLibya speaks to the coordinator so sponsorship status stays clear while friends still book their own Tunisian beach days independently.</p>
""",
    "unesco-world-heritage-across-north-africa-a-traveler-map": """
<h2>One theme per journey</h2>
<p>Trying to map every UNESCO entry in one month produces shuttle fatigue. Pick Roman west Libya, Greek east Libya, or Tunisia medina urbanism as the spine, then add one desert or museum day as accent. TourBuilder works best with a stated theme rather than a frantic pin map.</p>
""",
    "search-north-africa-find-libya-when-you-want-space": """
<h2>When curiosity becomes calendar</h2>
<p>Saved articles are not trips. Move to TourBuilder when you have passport scans, rough leave dates, and tolerance for sponsorship lead time. Libya rewards guests who treat space as a planning goal rather than a lucky accident on a crowded day.</p>
""",
    "after-marrakech-what-comes-next-in-north-africa": """
<h2>Let contrast be the point</h2>
<p>The best post Marrakech chapter should feel different on purpose. Roman grids, Greek ridges, or Saharan horizons reset travel fatigue better than another medina with different tile colors. Name the contrast you want before booking the next country.</p>
""",
    "tunisia-beach-week-then-libya-culture-week": """
<h2>Confirm Libya sponsorship before Tunis fares lock</h2>
<p>Beach weeks tempt nonrefundable Tunisian deals. Hold flexible Libya entry until sponsor letters look mature. IntoLibya tells you when paperwork is realistic so culture week does not collapse because visas lagged behind resort bookings.</p>
""",
    "can-you-visit-four-maghreb-countries-in-one-month": """
<h2>Quality control question</h2>
<p>After the trip, will you describe one meaningful site conversation or only airports? If you cannot imagine one, cut a country now. Libya especially deserves a week or a deferred year, not a exhausted transit fantasy between Morocco souvenirs and Tunisian sunburn.</p>
""",
    "greek-ruins-outside-greece-where-north-africa-wins": """
<h2>Eastern Libya needs honest pacing</h2>
<p>Cyrenaica rewards guests who accept drive time and access confirmation. Build east days into TourBuilder early so guides allocate nights and permissions before you assume Shahat fits as a casual afternoon from western hotels.</p>
""",
    "desert-lakes-you-can-still-reach-in-north-africa": """
<h2>Southern days are not bonus days</h2>
<p>Fezzan lake legs belong in the core itinerary, not as optional footnotes after exhausting coast sprints. IntoLibya schedules southern drives with recovery buffers so Gaberoun moments happen when guests still have energy to enjoy them.</p>
""",
    "rock-art-destinations-across-the-sahara-compared": """
<h2>Art weeks need specialist pacing</h2>
<p>Rock art travel is not general tourism with a camera. Plan fewer miles per day, more shade breaks, and explicit panel goals with guides who know Acacus conditions that week. Comparison shopping between countries still ends at operator honesty about what is reachable now.</p>
""",
    "oasis-towns-of-north-africa-beyond-the-usual-list": """
<h2>Stay inside the rhythm</h2>
<p>Oasis towns reward guests who accept slower evenings and early market mornings. Rushing Ghadames into a single afternoon after a long drive wastes the maze atmosphere that overnight guests describe as the real prize of Libyan oasis travel.</p>
""",
    "how-libya-fits-between-tunisia-and-egypt-on-a-map": """
<h2>Two neighbor trips beat one overstuffed triangle</h2>
<p>Tunisia plus Libya or Egypt plus Libya across separate years teaches more than a frantic Tunis Tripoli Cairo triangle in fourteen days. Geography invites connection. Calendars still demand respect.</p>
""",
    "mediterranean-history-coast-from-tunis-to-benghazi": """
<h2>Coast weeks need sea buffers</h2>
<p>Schedule breezy lunch pauses and late light theatre time between major sites. Mediterranean history is not only stone. It is salt air and harbour orientation that help ruins feel inhabited rather than abstract.</p>
""",
    "planning-north-africa-without-only-doing-morocco": """
<h2>Second country homework</h2>
<p>Pick Tunisia for ease, Libya for quiet monuments, Egypt for icons, or Algeria for deep desert. Read one long guide from each candidate country before choosing. Morocco forums alone will never advertise Libya sponsorship advantages fairly.</p>
""",
    "algeria-sahara-dreams-what-libya-offers-instead": """
<h2>Parallel desert dreams</h2>
<p>Some travelers keep Algeria on a future list while doing Libya now. That is healthy planning, not failure. Two deserts across two years beat waiting forever for one perfect permit window that never aligns with leave anyway.</p>
""",
    "siwa-style-oasis-travel-where-else-in-north-africa": """
<h2>Match oasis fantasy to stamina</h2>
<p>Siwa fans who love pools but hate long drives may prefer Ghadames urban oasis days without Fezzan lake approaches. Tell TourBuilder which Siwa memory you chase so routes do not force the wrong southern miles.</p>
""",
    "carthage-fans-what-to-see-next-across-the-border": """
<h2>Bookend the Punic Roman story</h2>
<p>Carthage begins a Mediterranean narrative that Sabratha and Leptis continue with Roman confidence. Bring Tunis museum questions to Libyan guides. They often enjoy completing threads you started at Carthage without treating the border as cultural reset.</p>
""",
    "luxor-fans-why-leptis-magna-belongs-on-the-list": """
<h2>Schedule a forum lunch pause</h2>
<p>Leptis days work best with a deliberate slow middle: shade, water, and time to sit inside urban space without photographing every arch in one hour. Luxor graduates often need that pacing shift to enjoy Roman cities fully.</p>
""",
    "north-africa-photography-trips-with-fewer-people-in-frame": """
<h2>Scout weather daily</h2>
<p>Coastal wind and desert haze change shots faster than forecasts suggest. Flexible guides who reschedule one ruin hour save frames that rigid bus schedules lose. Tell us photography priority when booking so pacing stays elastic.</p>
""",
    "family-north-africa-without-theme-park-crowds": """
<h2>Build rest days into culture weeks</h2>
<p>Family Libya trips need pool or hotel recovery afternoons between big ruin mornings, especially with younger children. Theme park crowds disappear, yet fatigue still exists. Honest rest protects the wonder days.</p>
""",
    "muslim-friendly-north-africa-travel-beyond-the-usual-capitals": """
<h2>Mosque visit briefings</h2>
<p>Ask guides the night before mosque days about dress, photo rules, and prayer time adjustments. Capital mosques and oasis mosques differ in etiquette details. Licensed operators handle timing so faith practice and tourism respect stay aligned.</p>
""",
    "adventure-travel-north-africa-when-you-want-real-desert-time": """
<h2>Training before departure</h2>
<p>Real desert adventure starts with walking stamina and heat hydration habits at home. Libya routes reward fit guests but do not require athlete vanity. Honest self assessment prevents miserable camp nights for everyone in the vehicle.</p>
""",
    "off-the-beaten-path-north-africa-for-second-timers": """
<h2>Defer flag guilt</h2>
<p>Second timers sometimes feel lazy for revisiting one country deeply. Depth is the opposite of lazy. Libya weeks with unhurried Leptis and Ghadames beat four shallow passes through the same medina photo lane.</p>
""",
    "why-guided-libya-trips-sit-beside-tunisia-egypt-holidays": """
<h2>Document folders for HR and family</h2>
<p>Keep Tunisia resort confirmations separate from Libya sponsor letters when explaining leave to employers or relatives. Clear paperwork reduces fear narratives about the guided chapter beside mainstream beach or Nile holidays.</p>
""",
    "desert-camping-styles-across-morocco-tunisia-algeria-libya": """
<h2>Try one country per desert chapter</h2>
<p>Comparing camps across four countries in one month confuses sleep quality memories. Sample Morocco or Tunisia first, then book Libya camps when you know your sand tolerance and toilet expectations clearly.</p>
""",
    "history-teachers-choosing-a-north-africa-field-destination": """
<h2>Post trip assessment design</h2>
<p>Plan reflection assignments before departure so administrators see measurable learning outcomes. Libya field days support primary source style reflection about empire, trade, and daily life better than generic vacation essays.</p>
""",
    "luxury-north-africa-without-only-atlas-and-nile-icons": """
<h2>Concierge expectations translated</h2>
<p>Luxury in Libya may mean private dawn entry coordination and cold towels after ruin hours rather than marble lobbies. State comfort priorities in TourBuilder so operators upgrade the right details instead of the wrong ones.</p>
""",
    "north-africa-for-people-who-hate-mega-resorts": """
<h2>Read hotel maps carefully</h2>
<p>Even anti resort travelers get trapped in airport strip boxes if they book quickly. Choose medina proximity or ruin proximity in Tripoli and coastal bases. Small human scaled hotels beat anonymous towers for this travel personality.</p>
""",
    "coastal-north-africa-history-from-leptis-to-alexandria-ideas": """
<h2>Accept multi year arcs</h2>
<p>Leptis to Alexandria as an intellectual line rarely fits one vacation. Western Libya this year, Egypt Ptolemaic follow up later is honest planning that still honors the coastal story without shuttle burnout.</p>
""",
    "what-makes-a-north-africa-trip-feel-authentic": """
<h2>Leave one afternoon unplanned</h2>
<p>Authentic moments often appear in unscripted tea offers or market chats when schedules breathe. Build one loose afternoon per week so guides can say yes to spontaneous hospitality without breaking security plans.</p>
""",
    "film-and-photo-scouts-looking-at-north-africa-locations": """
<h2>Location bibles need local rows</h2>
<p>Scout decks should list backup angles, curfew times, and sponsor contact numbers beside pretty photos. Libya locations change usability by season. Local operator rows matter more than Pinterest mood boards alone.</p>
""",
    "corporate-incentive-trips-looking-for-unusual-north-africa": """
<h2>Debrief while memory is fresh</h2>
<p>Schedule a twenty minute team debrief the night after Leptis or desert camp before buses head to airports. Unusual incentives succeed when stories crystallize immediately, not weeks later in slide decks alone.</p>
""",
    "desert-camping-morocco-tunisia-algeria-or-libya": """
<h2>Upgrade gear between countries</h2>
<p>Guests who learned sleep lessons in Morocco arrive better prepared for Libya camps. Bring learned gear rather than repeating the same thin sleeping bag mistake across borders expecting different results.</p>
""",
}


def wc(html: str) -> int:
    return len(re.sub(r"<[^>]+>", " ", html).split())


def main() -> int:
    marker = "<h2>Related reading</h2>"
    for slug, block in PASS3.items():
        path = POSTS_DIR / f"{slug}.md"
        raw = path.read_text()
        body = raw.split("---", 2)[2]
        if block.strip() in body:
            continue
        new_body = body.replace(marker, block + "\n" + marker, 1)
        fm = raw.split("---", 2)[1]
        ex = re.search(r"^excerpt: '(.+)'$", fm, re.M).group(1).replace("''", "'")
        se = re.search(r"^  description: '(.+)'$", fm, re.M).group(1).replace("''", "'")
        update_post(slug, new_body.strip(), ex, se)
        print(f"{slug}: {wc(new_body)}")

    import importlib.util
    ROOT = Path(__file__).resolve().parents[1]
    spec = importlib.util.spec_from_file_location("rw", ROOT / "scripts/rewrite_cluster_a_north_africa.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    low = []
    counts = []
    for slug, _, _, _ in mod.POSTS:
        p = POSTS_DIR / f"{slug}.md"
        w = wc(p.read_text().split("---", 2)[2])
        counts.append(w)
        if w < 500:
            low.append((slug, w))
    print(f"\nRange: {min(counts)}-{max(counts)}")
    if low:
        print("Still low:", low)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
