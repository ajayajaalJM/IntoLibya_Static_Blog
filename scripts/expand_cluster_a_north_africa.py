#!/usr/bin/env python3
"""Expand Cluster A posts to 500+ words with unique closing sections."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.lib.update_post import update_post

ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "src/content/posts/en"

# Unique expansion block per slug: inserted before Related reading
EXPANSIONS: dict[str, str] = {
    "north-africa-destinations-ranked-for-empty-unesco-sites": """
<h2>How IntoLibya fits the ranking</h2>

<p>We cannot rank Morocco riads for silence. We can promise that licensed Libya days prioritize slow site time over checkbox tourism. Tell us emptiness matters when you open TourBuilder and guides adjust start times accordingly.</p>

<p>Repeat visitors often say the ranking only clicked once they stood in a theatre without a line. That moment is why Libya stays on specialist lists even when mainstream Maghreb feeds ignore it.</p>
""",
    "morocco-tunisia-egypt-algeria-or-libya-which-fits-you": """
<h2>One honest week per country</h2>

<p>Even the right country feels wrong when compressed into three days. Give Morocco riad wandering a full week, Tunisia coast and ruins a full week, or Libya sponsorship time a full week before you judge the fit.</p>

<p>Many travelers discover their personality match on trip two, not trip one. That is normal. The goal is choosing the next country deliberately rather than repeating the same brochure because it is easy to book.</p>
""",
    "after-egypt-crowds-where-do-history-travelers-go": """
<h2>Museum days still matter</h2>

<p>Quiet ruins pair well with museum homework. Tunisia’s Bardo or Cairo days can prime your eye before Libya open air cities feel like stepping into the catalog. None of that requires skipping Egypt forever.</p>

<p>History travelers often keep a personal rule: one crowded icon trip per year, one spacious heritage trip per year. Libya fits the second slot for many guests we meet after Nile weeks.</p>
""",
    "sahara-trips-compared-across-north-africa-borders": """
<h2>Camp comfort questions to ask everywhere</h2>

<p>Before you compare countries, compare toilets, sleeping bags, winter heat, and drive hours inside each quote. A beautiful photo of stars hides miserable sleep if gear is wrong.</p>

<p>Libya camps arrive inside sponsorship quotes with less hostel noticeboard guesswork. That clarity helps first desert travelers who already feel nervous about sand logistics.</p>
""",
    "roman-ruins-without-the-crowds-in-north-africa": """
<h2>Guide quality changes the day</h2>

<p>Empty stone still needs interpretation. A good Libyan guide turns arches into stories about trade, emperors, and daily life rather than background for selfies. Crowd free mornings plus skilled narration is the combo ruin lovers remember.</p>

<p>If your last Roman day felt like a parking lot, rebuild the next one with slower pacing and one site maximum. Leptis rewards that discipline more than almost anywhere in the region.</p>
""",
    "best-north-africa-trip-if-you-want-guided-access-only": """
<h2>When guided access feels like relief</h2>

<p>Some travelers choose guided frames after a stressful independent week elsewhere. Sponsored Libya travel removes guesswork at checkpoints and site gates. For those guests structure reads as hospitality, not control.</p>

<p>Ask any operator what happens when plans shift midweek. IntoLibya answers with reroute experience rather than leaving you alone with a PDF itinerary and hope.</p>
""",
    "why-some-north-africa-trips-feel-overcrowded": """
<h2>Your calendar is a crowd tool</h2>

<p>School holidays, cruise seasons, and festival weekends concentrate people even at otherwise calm sites. Shoulder months and dawn starts are not elitism. They are scheduling literacy.</p>

<p>Libya cannot promise zero humans everywhere. It can promise that fame has not yet turned every theatre into a permanent queue culture. That difference matters to repeat North Africa guests.</p>
""",
    "egypt-nile-cruise-alternatives-for-ruin-lovers": """
<h2>River rhythm versus walking rhythm</h2>

<p>Nile cruises optimize cabin comfort and temple stops. Roman Libya optimizes walking grids and harbour imagination. Neither is inferior. They train different attention muscles.</p>

<p>Ruin lovers who try both often report that Egypt supplies awe and Libya supplies ownership of space. Plan both across separate journeys if your leave allows across two years.</p>
""",
    "how-to-build-a-maghreb-circuit-that-includes-libya": """
<h2>Passport and paperwork calendar</h2>

<p>Libya sponsorship often needs the longest lead time in a Maghreb dream list. Start Libya operator talks first even if Tunisia flights are already booked. Paperwork sets the real departure date.</p>

<p>Keep a shared spreadsheet for the group: Tunisia confirmations in one tab, Libya sponsor status in another. Mixed tabs create mixed expectations and angry group chats.</p>
""",
    "unesco-world-heritage-across-north-africa-a-traveler-map": """
<h2>Conservation reality on the ground</h2>

<p>World heritage status does not mean polished theme park maintenance everywhere. Some Libyan sites show age and repair cycles openly. That honesty can feel more educational than perfectly staged reconstruction.</p>

<p>Travelers who respect conservation rules help keep these places open for licensed tourism. Follow guide instructions about touch, drones, and restricted zones without debate.</p>
""",
    "search-north-africa-find-libya-when-you-want-space": """
<h2>From algorithm to operator</h2>

<p>Search results are marketing battles. Operator conversations are reality checks. Move from blogs to TourBuilder intake once Libya appears twice in your saved tabs.</p>

<p>Space seeking travelers often become our strongest referrers because expectation and delivery align when sponsorship pacing is explained upfront rather than hidden until deposit day.</p>
""",
    "after-marrakech-what-comes-next-in-north-africa": """
<h2>Riad fatigue is real</h2>

<p>After three riads and four medina loops, even Morocco lovers crave a different visual scale. Roman city grids and desert horizons reset the eyes. That reset is a feature, not disloyalty to Marrakech.</p>

<p>Keep Morocco on the return list for craft and cuisine. Just do not assume it is the only North Africa story worth a second passport stamp elsewhere.</p>
""",
    "tunisia-beach-week-then-libya-culture-week": """
<h2>Energy management for mixed groups</h2>

<p>Couples with different stamina can split Tunisia beach and Libya culture days without guilt if the calendar is honest. One partner naps at the resort while the other visits Carthage, then both commit to Leptis together.</p>

<p>Teenagers often prefer Libya ruin exploration after a Tunisia beach soften period. Use the beach week as social glue before culture week asks for early alarms.</p>
""",
    "can-you-visit-four-maghreb-countries-in-one-month": """
<h2>Immigration stamps versus memory</h2>

<p>Four stamps in thirty days impress at dinner parties and evaporate in photo rolls. If you cannot name one conversation with a local shopkeeper, you traveled too fast regardless of country count.</p>

<p>Libya deserves better than being stamp number three squeezed between exhausted shuttle days. Either give it a week or defer it to a focused journey.</p>
""",
    "greek-ruins-outside-greece-where-north-africa-wins": """
<h2>Reading before you fly</h2>

<p>Cyrenaica clicks faster with a little pre reading on Greek colonization of North Africa. You do not need a doctorate. One good chapter turns ridge temples from pretty stones into deliberate city planning.</p>

<p>Guides fill gaps on site, yet prepared guests ask better questions and remember more names than “that hill city.”</p>
""",
    "desert-lakes-you-can-still-reach-in-north-africa": """
<h2>Photography without damage</h2>

<p>Lake edges are fragile. Stay on approved approaches, pack out trash, and never treat local water like a private pool without guide clearance. Responsible guests keep lakes reachable for the next expedition.</p>

<p>The best lake memory is often quiet floating after a long drive, not a viral clip that encourages reckless copycats.</p>
""",
    "rock-art-destinations-across-the-sahara-compared": """
<h2>Binoculars and patience</h2>

<p>Some panels need angle and light before figures appear. Midday sun flattens engravings. Early morning walks reward patience more than zoom lenses alone.</p>

<p>Art focused weeks should include rest hours. Desert eyes tire faster when every hour hunts new panels without shade breaks.</p>
""",
    "oasis-towns-of-north-africa-beyond-the-usual-list": """
<h2>Market days and weekly rhythm</h2>

<p>Oasis towns change tone on market mornings versus quiet afternoons. Guides who live locally know when alleys feel welcoming for wandering guests and when families prefer privacy.</p>

<p>Buy crafts directly when fair prices are clear. Small purchases support living economies more than bulk imported souvenirs shipped from elsewhere.</p>
""",
    "how-libya-fits-between-tunisia-and-egypt-on-a-map": """
<h2>Language and cultural continuity</h2>

<p>Arabic dialects shift across borders yet daily courtesy feels familiar between Tunisia, Libya, and Egypt for many Muslim travelers. Libya sits in that cultural corridor even when politics differ.</p>

<p>Food, tea hospitality, and mosque etiquette echo across the three countries. Libya adds Roman and Greek stone chapters Tunisia and Egypt cannot fully substitute.</p>
""",
    "mediterranean-history-coast-from-tunis-to-benghazi": """
<h2>Harbour imagination</h2>

<p>Standing where ancient harbours met the same sea changes how you read trade maps. Leptis and Sabratha still orient you toward water even when silt shifted shorelines over centuries.</p>

<p>Coastal history trips work best when you allow sea breeze time between ruin blocks rather than racing inland immediately every day.</p>
""",
    "planning-north-africa-without-only-doing-morocco": """
<h2>Travel communities bias</h2>

<p>Forums overweight countries with huge independent traveler volume. Libya appears less because sponsorship filters casual posters, not because sites are minor. Read specialist operators alongside hostel threads.</p>

<p>Your second North Africa country should answer a question Morocco left open. Name that question before you book.</p>
""",
    "algeria-sahara-dreams-what-libya-offers-instead": """
<h2>Geology is not interchangeable</h2>

<p>Tassili and Acacus are not identical rock galleries. Libya swap trips succeed when you want Saharan wonder plus coast ruins, not when you need a pixel perfect Tassili duplicate.</p>

<p>Talk to both country specialists if budget allows research calls. Honest operators will tell you when to wait for Algeria instead of selling Libya as a fake substitute.</p>
""",
    "siwa-style-oasis-travel-where-else-in-north-africa": """
<h2>Pool culture versus maze culture</h2>

<p>Siwa leans pool and palm village recovery. Ghadames leans urban maze exploration. Some travelers want both in one month. Fezzan adds lake shock if drives are accepted.</p>

<p>Match oasis style to mood, not only to Instagram references from someone else’s Egypt week.</p>
""",
    "carthage-fans-what-to-see-next-across-the-border": """
<h2>Continuity for readers of history</h2>

<p>Punic wars, Roman annexation, and Mediterranean trade tie Carthage to Tripolitania narratively. Reading that thread before crossing the border makes Sabratha details feel connected rather than random.</p>

<p>Bring Tunisia museum memories to Libya guides. They often enjoy completing stories guests started in Tunis.</p>
""",
    "luxor-fans-why-leptis-magna-belongs-on-the-list": """
<h2>Body feeling at sites</h2>

<p>Luxor can feel vertical and ceremonial. Leptis feels horizontal and urban. Your body walks farther and rests in forums differently. That physical rhythm refreshes travelers tired of column forests alone.</p>

<p>Allow one slow lunch pause inside a Leptis day. Ruin lovers sometimes forget to eat when sites are exciting and desert sun is real.</p>
""",
    "north-africa-photography-trips-with-fewer-people-in-frame": """
<h2>Model releases and dignity</h2>

<p>Empty ruins are easier ethically than street portraits. When photographing people, ask clearly and accept no without argument. Libya hospitality grows when guests behave like guests, not paparazzi.</p>

<p>Golden hour planning should include exit time before darkness catches you on uneven stone without headlamps ready.</p>
""",
    "family-north-africa-without-theme-park-crowds": """
<h2>Education without homework tone</h2>

<p>Kids engage when guides tell scandal stories and daily life facts rather than lecture dates alone. Libya guides often excel at story pacing for mixed age groups when warned in advance.</p>

<p>Pack snacks, sun hats, and patience for transfer days. Family trips live or die on road hour honesty more than on any single monument.</p>
""",
    "muslim-friendly-north-africa-travel-beyond-the-usual-capitals": """
<h2>Halal food clarity</h2>

<p>Licensed Libya tours assume halal defaults in group meal planning when requested. State dietary needs early so camp cooks and city restaurants align without last minute stress.</p>

<p>Capital airport hotels are not the only place to feel spiritually at ease. Oasis towns and medina walks often feel more naturally aligned for faith centered travelers.</p>
""",
    "adventure-travel-north-africa-when-you-want-real-desert-time": """
<h2>Recovery days matter</h2>

<p>Real desert adventure needs rest blocks after long drives. Itineraries that stack hard days without recovery produce injury and grumpy teams, not epic memories.</p>

<p>Adventure travelers who respect recovery still cover more ground than resort guests. They just do it without pretending sleep is optional.</p>
""",
    "off-the-beaten-path-north-africa-for-second-timers": """
<h2>Specialist communities</h2>

<p>Second timers often find Libya through archaeology podcasts, desert art forums, or friend referrals rather than mass tourism ads. That discovery path predicts satisfaction better than random booking.</p>

<p>Trust operators who explain access limits plainly. Mystery marketing usually hides disappointment for second timer expectations.</p>
""",
    "why-guided-libya-trips-sit-beside-tunisia-egypt-holidays": """
<h2>Insurance and advisory literacy</h2>

<p>Employees combining Tunisia beach leave with Libya culture days should read government advisories with operator context, not panic headlines alone. Licensed tourism exists because pathways are maintained, not because risk vanished.</p>

<p>HR departments appreciate clear sponsor letters and operator contacts when approving unusual leave destinations beside mainstream Egypt packages.</p>
""",
    "desert-camping-styles-across-morocco-tunisia-algeria-libya": """
<h2>Sound and sleep</h2>

<p>Drum circle camps trade silence for atmosphere. Remote Libya bivouacs trade convenience for stars. Know which trade you are buying before you pack earplugs or expect silence.</p>

<p>Family campers should ask about tent separation and night lighting near vehicles. Small details prevent desert nights from becoming group arguments.</p>
""",
    "history-teachers-choosing-a-north-africa-field-destination": """
<h2>Parent briefing tone</h2>

<p>Libya school trips need calm factual parent letters about licensed tourism, not defensive essays. Transparency about guided structure builds trust faster than minimizing paperwork reality.</p>

<p>Link pre travel readings to curriculum standards explicitly so administrators see assessment value, not tourism junkets.</p>
""",
    "luxury-north-africa-without-only-atlas-and-nile-icons": """
<h2>Service details that matter</h2>

<p>Affluent travelers often care about cold towels after ruin hours, reliable vehicle air conditioning, and guides who handle security paperwork invisibly. Those details define luxury on Libyan routes more than marble lobbies.</p>

<p>Ask operators directly about camp bedding and bathroom setup in Fezzan. Luxury should never mean guessing what sleep will feel like.</p>
""",
    "north-africa-for-people-who-hate-mega-resorts": """
<h2>Slow food as anti resort culture</h2>

<p>Long lunches with local dishes beat buffet lines for travelers who hate mega resort psychology. Libya and Tunisia both reward meal pacing when guides know good simple restaurants.</p>

<p>Choose hotels sized for humans, not towers. Even in Tripoli, smaller properties often feel more aligned with anti resort values than international chain boxes.</p>
""",
    "coastal-north-africa-history-from-leptis-to-alexandria-ideas": """
<h2>Shipping and trade homework</h2>

<p>Ancient grain, olive oil, and garum routes connect Leptis to wider Mediterranean economies. Teachers and curious travelers enjoy sites more when trade context replaces only emperor name memorization.</p>

<p>Coastal breezes are not decorative. They explain why cities faced seaward and why theatres orient the way they do on Libyan shores.</p>
""",
    "what-makes-a-north-africa-trip-feel-authentic": """
<h2>Language crumbs help</h2>

<p>Even basic Arabic greetings transform market interactions. Guides translate heavy conversations, yet your hello in a Ghadames alley still matters as signal of respect.</p>

<p>Authenticity is reciprocal. Curious polite guests receive warmer explanations and occasional invitations ordinary rude rush never earns.</p>
""",
    "film-and-photo-scouts-looking-at-north-africa-locations": """
<h2>Recce days versus shoot days</h2>

<p>Scouts should budget separate recce time inside sponsorship windows. Assuming one tourist week covers full production planning creates expensive surprises when permissions need escalation.</p>

<p>Backup locations matter in Libya when wind, heat, or access shifts a shot list. Good local guides suggest alternates with similar geometry.</p>
""",
    "corporate-incentive-trips-looking-for-unusual-north-africa": """
<h2>Team bonding without cliché</h2>

<p>Shared challenge days in desert camps or dawn ruin walks bond teams differently than golf carts at resort compounds. Debrief dinners after Leptis visits produce stories employees retell for years.</p>

<p>Build optional fitness tiers so mixed teams feel included rather than punished on adventure weighted days.</p>
""",
    "desert-camping-morocco-tunisia-algeria-or-libya": """
<h2>First camp versus capstone camp</h2>

<p>Many travelers treat Morocco or Tunisia as first camp education, then book Libya or Algeria later as capstone remoteness once they know sleep and heat tolerance.</p>

<p>That progression beats starting with expedition grade camps and vowing never to sleep on sand again after one miserable night with wrong gear.</p>
""",
}


def visible_body(raw: str) -> str:
    return raw.split("---", 2)[2] if raw.count("---") >= 2 else raw


def wc(html: str) -> int:
    return len(re.sub(r"<[^>]+>", " ", html).split())


def main() -> int:
    for slug, expansion in EXPANSIONS.items():
        path = POSTS_DIR / f"{slug}.md"
        raw = path.read_text()
        parts = raw.split("---", 2)
        body = parts[2]
        marker = "<h2>Related reading</h2>"
        if marker not in body:
            print(f"SKIP no marker: {slug}")
            continue
        if expansion.strip() in body:
            print(f"SKIP already expanded: {slug}")
            continue
        new_body = body.replace(marker, expansion + "\n" + marker, 1)
        excerpt_match = re.search(r"^excerpt: '(.+)'$", parts[1], re.M)
        seo_match = re.search(r"^  description: '(.+)'$", parts[1], re.M)
        excerpt = excerpt_match.group(1).replace("''", "'") if excerpt_match else ""
        seo = seo_match.group(1).replace("''", "'") if seo_match else ""
        update_post(slug, new_body.strip(), excerpt, seo)
        print(f"  -> {wc(new_body)} words")

    # is-libya may still be ok; verify all batch slugs
    slugs_file = Path(__file__).with_name("rewrite_cluster_a_north_africa.py")
    text = slugs_file.read_text()
    all_slugs = re.findall(r'"([a-z0-9-]+)",\s*\n\s*f"""', text)
    low = []
    counts = []
    for slug in all_slugs:
        p = POSTS_DIR / f"{slug}.md"
        if not p.exists():
            continue
        w = wc(visible_body(p.read_text()))
        counts.append(w)
        if w < 500:
            low.append((slug, w))
    print(f"\nBatch word range: min={min(counts)}, max={max(counts)}")
    if low:
        print("Still under 500:")
        for s, w in low:
            print(f"  {w:4d} {s}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
