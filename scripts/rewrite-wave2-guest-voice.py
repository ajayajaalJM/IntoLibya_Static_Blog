#!/usr/bin/env python3
"""
Full Wave 2 rewrite: entertaining guest-facing English, place-specific where possible,
TourBuilder-only CTAs (no email / send us a note). Also scrub Wave 1 Soft CTA lines.
No hyphen characters in titles or body prose.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts/en"
CATALOG = ROOT / "content-review/next-200-seo-blog-posts.md"
SCHEDULE = ROOT / "content-review/next-200-publish-schedule.md"

CTA = """
<hr />

<h2>Build this trip in TourBuilder</h2>

<p>Open TourBuilder, pick your dates and must see list, and shape a licensed IntoLibya route with sponsorship, guides, and on ground logistics included in the plan. Browse packages if you want a starting shape, then customize.</p>

<p><a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a> · <a href="/tourbuilder/search">Browse activities</a></p>
""".strip()

# Readable titles (slug stays stable). No hyphen characters.
TITLE_FIX = {
    "three-day-cyrenaica-sampler-benghazi-shahat-susa-highlands": "A Three Day Cyrenaica Sampler from Benghazi to Shahat and Susa",
    "search-north-africa-find-libya-when-you-want-space": "Looking for Space in North Africa? Start with Libya",
    "unesco-world-heritage-across-north-africa-a-traveler-map": "UNESCO Sites Across North Africa: A Traveler Map",
    "morocco-tunisia-egypt-algeria-or-libya-which-fits-you": "Morocco, Tunisia, Egypt, Algeria, or Libya: Which Fits You",
    "how-to-build-a-maghreb-circuit-that-includes-libya": "How to Build a Maghreb Circuit That Includes Libya",
    "libya-tour-booking-steps-from-first-email-to-arrival": "Libya Tour Booking Steps from First Enquiry to Arrival",
    "how-to-describe-your-dream-libya-trip-in-one-message": "How to Describe Your Dream Libya Trip in One Clear Brief",
    "ptolemais-tolmeita-why-greek-east-libya-matters": "Ptolemais and Tolmeita: Why Greek East Libya Matters",
    "green-mountain-versus-sahara-two-libyas-in-one-trip": "Green Mountain Versus Sahara: Two Libyas in One Trip",
    "jebel-nafusa-versus-jebel-akhdar-highland-comparison": "Jebel Nafusa Versus Jebel Akhdar: Highland Comparison",
    "waddan-as-a-desert-rally-gateway-town": "Waddan as a Desert Rally Gateway Town",
    "apollonia-susa-harbor-days-beside-cyrene": "Apollonia and Susa Harbour Days Beside Cyrene",
    "qasr-libya-mosaics-what-visitors-come-to-see": "Qasr Libya Mosaics: What Visitors Come to See",
    "hattia-pyramids-in-the-libyan-sahara-explained": "Hattia Pyramids in the Libyan Sahara Explained",
    "tolmeita-guided-tour-of-greek-ruins-for-travelers": "Tolmeita Guided Tour of Greek Ruins",
    "old-city-of-ghat-walking-notes-for-tour-guests": "Walking the Old City of Ghat",
    "benghazi-path-totality-what-travelers-need-explained-simply": "Benghazi Path Totality Explained Simply for Travelers",
    "double-shafra-december-dates-what-guests-should-know": "Double Shafra December Dates: What Guests Should Know",
    "when-to-book-rally-te-te-waddan-for-november-travel": "When to Book Rally Te Te Waddan for November Travel",
}


def assert_no_hyphen(text: str, label: str) -> None:
    prose = re.sub(r'(href|src|class)="[^"]*"', "", text)
    prose = re.sub(r"<!--.*?-->", "", prose, flags=re.S)
    if "-" in prose:
        i = prose.index("-")
        raise ValueError(f"Hyphen in {label}: ...{prose[max(0,i-50):i+50]}...")


def wc(html: str) -> int:
    return len([w for w in re.sub(r"<[^>]+>", " ", html).split() if w])


def clean(html: str) -> str:
    parts = re.split(r"(<[^>]+>)", html)
    out = []
    for p in parts:
        if p.startswith("<"):
            out.append(p)
        else:
            out.append(p.replace("-", " "))
    return re.sub(r" +", " ", "".join(out))


def yaml_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def load_rows() -> list[dict]:
    rows = []
    for line in CATALOG.read_text().splitlines():
        if not re.match(r"\| \d+ \|", line):
            continue
        parts = [p.strip() for p in line.strip("|").split("|")]
        rows.append(
            {
                "id": int(parts[0]),
                "title": TITLE_FIX.get(parts[2].strip("`"), parts[1]),
                "orig_title": parts[1],
                "slug": parts[2].strip("`"),
                "primary": parts[3].strip("`"),
                "secondary": parts[4],
                "cluster": parts[6],
            }
        )
    dates = {}
    for line in SCHEDULE.read_text().splitlines():
        m = re.match(r"\| (20\d{2}-\d{2}-\d{2}) \|", line)
        if not m:
            continue
        for slug in re.findall(r"`([a-z0-9-]+)`", line):
            dates[slug] = m.group(1)
    for r in rows:
        r["publishedAt"] = dates[r["slug"]]
    return rows


def related(slug: str) -> str:
    links = [
        ("/en/how-to-visit-libya-as-a-tourist-in-2026", "How to Visit Libya as a Tourist in 2026"),
        ("/en/is-it-safe-to-travel-to-libya-right-now", "Is It Safe to Travel to Libya Right Now"),
        ("/en/how-to-book-a-libya-tour-with-intolibya", "How to Book a Libya Tour with IntoLibya"),
        ("/en/how-tourbuilder-works-for-custom-libya-trips", "How TourBuilder Works for Custom Libya Trips"),
        ("/en/destination/tripoli", "Tripoli"),
        ("/en/destination/leptis-magna", "Leptis Magna"),
    ]
    s = slug
    if any(k in s for k in ("cyrene", "shahat", "susa", "cyrenaica", "tolmeita", "ptolemais", "benghazi", "east", "qasr-libya", "akhdar", "bayda")):
        links[4] = ("/en/destination/shahat", "Shahat")
        links[5] = ("/en/destination/susa", "Susa")
    elif any(k in s for k in ("ghat", "acacus", "sahara", "fezzan", "ghadames", "germa", "hattia", "waddan", "mathendous")):
        links[4] = ("/en/destination/ghadames", "Ghadames")
        links[5] = ("/en/destination/acacus-mountains", "Acacus Mountains")
    elif "sabratha" in s:
        links[5] = ("/en/destination/sabratha", "Sabratha")
    items = "\n".join(f'<li><a href="{h}">{t}</a></li>' for h, t in links)
    return f"<h2>Related reading</h2>\n\n<ul>\n{items}\n</ul>"


# Place / theme color paragraphs keyed by token
PLACE = {
    "tripoli": "Tripoli is where most guests land and exhale: Mediterranean light, museum context, and a first taste of how guided days actually feel.",
    "leptis": "Leptis Magna is the quiet stunner. A full Roman city of forum, arches, and theatre, often with enough space to hear your own footsteps.",
    "sabratha": "Sabratha sets a Roman theatre against the sea. It photographs cleanly because visitor density stays low on licensed tour days.",
    "ghadames": "Ghadames is covered lanes, oasis hush, and desert edge evenings. It is a living old town, not a film set, so ask before you photograph people.",
    "ghat": "Ghat is the southwest gateway where Tuareg culture and Acacus expeditions meet. The old town deserves slow walking, not a rushed checklist.",
    "acacus": "The Acacus Mountains hold prehistoric rock art in wild stone country. Treat panels as heritage, not climbing walls.",
    "sahara": "Libyan Sahara days mix dune driving, oasis swimming, and camp nights that turn cold even when midday feels gentle.",
    "cyrene": "Cyrene and Shahat carry Greek Cyrenaica: temple platforms, hill light, and a classical story that is not Egypt and not Greece alone.",
    "susa": "Susa, ancient Apollonia, adds harbour ruins beside the Cyrene uplands. Sea air after highland roads feels like a second country.",
    "benghazi": "Benghazi works as an east hub for guests heading toward Greek ruins and Green Mountain country on planned circuits.",
    "nafusa": "Jebel Nafusa brings highland qasrs, olive country, and a non desert Libya west of Tripoli. Viewpoints earn the short climb.",
    "germa": "Germa points to Garamantian Sahara history, a different archaeology mood from coastal Romans.",
    "fezzan": "Fezzan routes ask for patience and heat respect. Lakes, ruins, and rock art reward guests who leave room in the calendar.",
    "misrata": "Misrata is a modern Mediterranean working city: markets, coast energy, and a deliberate contrast to ruin days.",
    "waddan": "Waddan sits in desert rally country. Treat it as a gateway town with event season energy when Rally Te Te is on the calendar.",
    "tolmeita": "Tolmeita, ancient Ptolemais, extends the Greek east story with coastal ruin walking that pairs well with Cyrene days.",
    "eclipse": "The 2027 total solar eclipse path near Benghazi is a once in a generation planning problem. Book early, add buffer days, and keep the rest of the east circuit honest.",
    "rally": "Rally Te Te in Waddan is fixed date adventure. Paperwork and flights need earlier clocks than a flexible coast week.",
    "festival": "Festival weeks reward culture curiosity and punish last minute visas. Confirm live dates in TourBuilder before you fantasize packing lists.",
    "winter": "Winter on the Libyan coast often feels milder than northern home weather. Desert nights still want a warm layer.",
    "family": "Family pacing means shorter walking blocks, clearer meal timing, and routes that do not punish kids with hero miles.",
    "muslim": "Muslim guests often care about prayer friendly pacing, modest dress comfort, and food notes. Say those needs early in TourBuilder.",
    "luxury": "Luxury here means private pacing and empty morning light at UNESCO sites, not a tower of hotel brand names.",
    "safety": "Safety questions deserve calm answers. Licensed sponsorship, guides, and required coordination turn abstract fear into ordinary tour days for many guests.",
    "unesco": "UNESCO grade sites in Libya often feel empty enough to think. That silence is the reason space seekers keep coming back in our enquiries.",
}


def tokens(slug: str) -> set[str]:
    s = slug.replace("-", " ")
    found = set()
    mapping = {
        "tripoli": ["tripoli", "sfenz", "ali gana", "football", "mitiga"],
        "leptis": ["leptis", "villa seline", "horse racing"],
        "sabratha": ["sabratha", "carthage"],
        "ghadames": ["ghadames", "qaser", "cafe", "dress"],
        "ghat": ["ghat"],
        "acacus": ["acacus", "rock art", "engravings", "mathendous"],
        "sahara": ["sahara", "desert", "oasis", "sandboard", "dune", "fezzan", "hattia", "gaberoun"],
        "cyrene": ["cyrene", "shahat", "zeus"],
        "susa": ["susa", "apollonia"],
        "benghazi": ["benghazi"],
        "nafusa": ["nafusa", "nalut", "tarmisa", "qaser"],
        "germa": ["germa", "garamant"],
        "fezzan": ["fezzan", "sebha", "waw"],
        "misrata": ["misrata"],
        "waddan": ["waddan"],
        "tolmeita": ["tolmeita", "ptolemais"],
        "eclipse": ["eclipse", "totality"],
        "rally": ["rally", "te te"],
        "festival": ["festival", "awessu", "double shafra", "shafra"],
        "winter": ["winter", "december", "january", "november", "chill", "cold", "snow", "holiday season"],
        "family": ["family", "families", "kid", "children"],
        "muslim": ["muslim", "prayer", "mosque", "halal", "ramadan"],
        "luxury": ["luxury", "private"],
        "safety": ["safe", "danger", "advisory", "advisories", "fear", "scam", "checkpoint"],
        "unesco": ["unesco", "empty", "crowd", "quiet", "space"],
    }
    for key, words in mapping.items():
        if any(w in s for w in words):
            found.add(key)
    return found


def color_paragraphs(slug: str) -> list[str]:
    toks = tokens(slug)
    paras = [PLACE[t] for t in toks if t in PLACE]
    # keep 2-4 unique
    out = []
    for p in paras:
        if p not in out:
            out.append(p)
        if len(out) >= 4:
            break
    if not out:
        out = [
            "Libya rewards travelers who want serious heritage without mega resort crowds. Licensed tours make that possible with sponsorship, guides, and clear day plans.",
            "Think coast Romans, oasis towns, and Sahara nights as chapters you can combine when leave allows. First timers often start west. Return visitors open the east and deeper desert.",
        ]
    return out


def body_for(row: dict) -> str:
    title = row["title"]
    slug = row["slug"]
    cluster = row["cluster"]
    primary = row["primary"]
    colors = color_paragraphs(slug)
    color_html = "\n".join(f"<p>{c}</p>" for c in colors)

    # Opening: never dump raw keyword title as a broken sentence
    if title.endswith("?"):
        open_p = f"<p>{title} Good. Let us answer like people who actually run these trips.</p>"
    elif title.lower().startswith(("how ", "what ", "where ", "why ", "when ", "who ", "is ", "can ", "do ")):
        open_p = f"<p>{title}? Here is the honest version from the IntoLibya team.</p>"
    else:
        open_p = f"<p>{title} sounds like a packing list until you stand there. This guide is the guest facing version: what you will feel, what to expect, and how to build it in TourBuilder.</p>"

    # Cluster specific middle
    if cluster.startswith("A."):
        mid = f"""
<h2>The North Africa plot twist</h2>
<p>Plenty of Maghreb trips are wonderful and loud. Egypt can be iconic and elbow heavy. Libya’s job on the map is different: quieter UNESCO mornings, oasis towns, and desert nights on a licensed plan.</p>
{color_html}
<h2>How to choose without turning travel into a fight</h2>
<p>Give each country one job. Do not ask Libya to be Luxor. Do not ask Tunisia to be the Acacus. If you want space at Roman stone or Greek Cyrenaica, you are in the right article.</p>
<p>Neighbor holidays stay with their own specialists. We only plan Libya, and we are happy when your multi year map includes everyone fairly.</p>
<h2>A traveler story we hear every month</h2>
<p>Someone finishes a crowded icon trip, opens photos, and realizes the memory is mostly waiting. Then they ask whether North Africa has a quieter chapter. Yes. It is usually a guided Libya week that starts on the western coast and grows from there.</p>
"""
    elif cluster.startswith("B."):
        mid = f"""
<h2>What booking actually feels like</h2>
<p>Forget vague email tennis. In TourBuilder you choose dates, must sees, and pacing. We turn that into a licensed route with sponsorship support, guides, transport, and practical lodging. You will see what is included before you commit.</p>
{color_html}
<h2>Documents without the mystery novel</h2>
<p>When the route is agreed, you upload sharp passport details through the process we outline in TourBuilder. Follow the live checklist there. Blurry scans are the villain of otherwise beautiful trips.</p>
<h2>Flights and hotels, said plainly</h2>
<p>Most guests arrive via Tripoli Mitiga through hubs like Tunis or Cairo. Keep tickets flexible until paperwork looks solid. Hotels and camps are arranged inside the tour plan. Tell us comfort needs in TourBuilder notes instead of hunting brand names across the internet.</p>
<h2>First timer map</h2>
<p>Coast first wins for most newcomers: Tripoli, Leptis Magna, Sabratha. Add Ghadames when leave allows. Save deep Sahara or east circuits for longer calendars unless that is your one true love.</p>
"""
    elif cluster.startswith("C."):
        mid = f"""
<h2>Fear is loud. Tour days are often quieter.</h2>
<p>We read the same headlines you do. We also meet guests at the airport, walk empty theatres with them, and hear the same sentence at dinner: “I did not expect it to feel this ordinary and this extraordinary at once.”</p>
{color_html}
<h2>What “safe enough” means with IntoLibya</h2>
<p>Licensed sponsorship. eVisa steps. Guides. Required tourist police coordination on routes that need it. Drivers who know sensible roads. Plans that can change if access requires it. Photography and dress guidance that protects everyone.</p>
<p>That is a method, not a slogan. Independent freestyle tourist travel is not the product.</p>
<h2>A calm decision checklist</h2>
<ol>
<li>Read your advisory fully.</li>
<li>Build a concrete route in TourBuilder.</li>
<li>Match the day list to regional notes.</li>
<li>Confirm insurance.</li>
<li>Travel only if you accept guided licensed structure.</li>
</ol>
<p>If the answer is not yes yet, wait. Libya will still have stone tomorrow.</p>
"""
    elif cluster.startswith("D."):
        mid = f"""
<h2>Fixed dates change the mood</h2>
<p>A flexible coast week can slide by a day. Rally weekends, December cultural trips, festival windows, and eclipse totality cannot. That is why TourBuilder event listings matter: you lock the real calendar, then build buffers around it.</p>
{color_html}
<h2>What we want you to decide early</h2>
<p>Which event is the point. How many buffer days you can afford. Whether you also want classical sightseeing around an east eclipse trip. Whether winter desert nights are part of the fun or a hard no.</p>
<p>We keep prices and live availability inside TourBuilder rather than inventing numbers here.</p>
<h2>Packing for event energy</h2>
<p>Closed shoes, modest comfortable clothes, layers for cold nights, and patience for busy operational days. Festival and rally weeks are social. Eclipse mornings are about light and timing. Different joys, same need for early planning.</p>
"""
    elif cluster.startswith("E."):
        mid = f"""
<h2>Winter sun with adult expectations</h2>
<p>Northern guests often arrive hungry for daylight. Libya’s coast can feel blessedly mild compared with home. It is not a promise of hot swimming every hour. It is usable ruin weather, jacket evenings, and the chance to walk Leptis without peak summer blaze.</p>
{color_html}
<h2>Desert nights still bite</h2>
<p>If Sahara camping is on your TourBuilder outline, pack warmth. Midday can smile. Midnight can surprise you. Ask for camp notes when you customize the trip.</p>
<h2>Holiday weeks and quiet weeks</h2>
<p>November and December sometimes overlap rally or cultural dates. If you want those, pick them in TourBuilder early. If you want silence and Romans only, say so and we will keep the plan flexible and calm.</p>
"""
    elif cluster.startswith("F."):
        mid = f"""
<h2>Your kind of traveler, your kind of day</h2>
<p>Families need softer miles. Muslim guests often need prayer friendly pacing and food clarity. Luxury guests want private timing at empty sites. Adventure guests want honest fitness talk. Quiet seekers want mornings that do not sound like a tour bus horn.</p>
{color_html}
<h2>Respect is part of the itinerary</h2>
<p>Ask before photographing people. Dress for local comfort. Treat rock art and living towns as places with dignity, not content farms. If you create videos, show the licensed path so copycats do not invent freestyle myths.</p>
<h2>Groups welcome, chaos not</h2>
<p>School and workshop groups should appoint one coordinator and start early in TourBuilder. Many passports move slower than one couple’s paperwork. Filming requests need real confirmation, not hope.</p>
"""
    elif cluster.startswith("G."):
        mid = f"""
<h2>From your airport map to Mitiga</h2>
<p>Most international guests connect through hubs such as Tunis or Cairo into Tripoli. Build a buffer when you can. Long haul guests should not stack jet lag onto a brutal first desert transfer.</p>
{color_html}
<h2>Start the trip in TourBuilder</h2>
<p>Choose dates, note your nationality, and list must sees. That brief replaces vague back and forth. We reply inside the planning flow with a licensed route and document next steps.</p>
<h2>Season tips for distant guests</h2>
<p>Coast first weeks are kinder after long flights. Winter mildness helps northern travelers. Gulf guests often ask for culture comfort and quieter heritage days. Put those preferences in your TourBuilder notes.</p>
"""
    elif cluster.startswith("H."):
        mid = f"""
<h2>An activity day with a pulse</h2>
<p>This is the fun layer on top of a solid route: a city loop, a cultural house visit, a viewpoint, a ruin side stop, a food morning, a desert add on. Availability can depend on season and local timing, so confirm it while you build the trip.</p>
{color_html}
<h2>How to add it without wrecking the week</h2>
<p>First timers should choose one or two add ons, not five. Repeat visitors with longer leave can play. Match energy: soft culture after long transfers, adventure only when legs and weather agree.</p>
<p>Browse the activity in TourBuilder, drop it onto your outline, and keep the core Romans or oasis days intact.</p>
"""
    else:
        mid = f"""
<h2>What makes this stop worth the drive</h2>
<p>East Libya and the highlands are not a footnote. Greek ruins, harbour stone, mosaic rooms, and green escarpment air give you a second Libya beside the western classics and Sahara story.</p>
{color_html}
<h2>A sample rhythm that guests love</h2>
<p>Use Benghazi as a practical hub when the circuit needs it. Give Shahat and the Cyrene story a full looking day. Add Susa harbour light when the sea calls. Slip highland viewpoints into the cooler hours. Keep one buffer afternoon so wonder does not turn into blur.</p>
<p>First timers with only a week often stay west first. Guests with more leave, or return visitors, open this east sampler and suddenly understand why Cyrenaica has its own fans.</p>
<h2>On the ground truths</h2>
<p>Drives can be long. Ruins are uneven. Lodging stays practical inside the tour plan. We confirm museum timing when your dates are live. Ask before photographing people. Do not climb heritage panels for a heroic pose.</p>
"""

    close = f"""
<h2>The fun part</h2>
<p>The best Libya days feel like discovery with adult supervision: empty stone, good guiding, tea that arrives at the right minute, and photos you did not have to fight a crowd to take. That is the mood we design for.</p>
<p>Open TourBuilder and put this idea on a calendar. Customize until the route matches your leave, fitness, and curiosity. We will handle the licensed structure that makes the pretty parts possible.</p>
"""

    body = "\n".join(
        [
            open_p,
            mid.strip(),
            close.strip(),
            related(slug),
            CTA,
        ]
    )
    return clean(body) + "\n"


def write_post(row: dict) -> tuple[str, int]:
    slug = row["slug"]
    title = row["title"]
    assert_no_hyphen(title, f"title {row['id']}")
    body = body_for(row)
    assert_no_hyphen(body, f"body {row['id']}")

    path = POSTS / f"{slug}.md"
    featured = f"/media/posts/{slug}/hero.webp"
    if path.exists():
        m = re.search(r"featuredImage:\s*(\S+)", path.read_text())
        if m:
            featured = m.group(1)

    excerpt = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", body)).strip()[:160]
    assert_no_hyphen(excerpt, "excerpt")
    seo = clean(f"{title}. Plan a licensed Libya trip with IntoLibya TourBuilder.")
    seo = re.sub(r"\s+", " ", seo).strip()[:155]
    assert_no_hyphen(seo, "seo")

    text = "\n".join(
        [
            "---",
            f"title: {yaml_str(title)}",
            f"slug: {slug}",
            f"canonicalPath: /en/{slug}",
            "lang: en",
            f"publishedAt: '{row['publishedAt']}'",
            f"translationGroup: {slug}",
            f"featuredImage: {featured}",
            "draft: false",
            "galleries: []",
            f"excerpt: {yaml_str(excerpt)}",
            "seo:",
            f"  title: {yaml_str(title + ' | IntoLibya')}",
            f"  description: {yaml_str(seo)}",
            f"  canonical: https://intolibya.com/en/{slug}",
            "---",
            "",
            f"<!-- primary-keyword: {row['primary']} | secondary: {row['secondary']} -->",
            "",
            body.rstrip(),
            "",
        ]
    )
    path.write_text(text)
    return slug, wc(body)


def scrub_wave1() -> int:
    n = 0
    for path in POSTS.glob("*.md"):
        raw = path.read_text()
        # only touch if Soft CTA present
        if "Soft CTA" not in raw and "soft CTA" not in raw:
            continue
        new = raw.replace("Soft CTA:", "Next step:")
        new = re.sub(r"Soft CTA\b", "Next step", new)
        new = re.sub(r"soft CTA\b", "next step", new)
        if new != raw:
            # ensure no hyphen introduced in prose beyond urls - Soft CTA removal is fine
            path.write_text(new)
            n += 1
    return n


def scrub_wave2_email_titles_in_body() -> None:
    """Retitle awkward email language inside booking posts to enquiry/TourBuilder."""
    replacements = {
        "from first email to arrival": "from first enquiry to arrival",
        "First email or TourBuilder": "First TourBuilder draft",
        "vague email tennis": "vague back and forth",
        "email IntoLibya": "contact IntoLibya through TourBuilder",
    }
    for path in POSTS.glob("*.md"):
        raw = path.read_text()
        if "publishedAt: '2026-10-" not in raw and "publishedAt: '2026-11-" not in raw and "publishedAt: '2026-12-" not in raw and "publishedAt: '2027-01-" not in raw:
            continue
        new = raw
        for a, b in replacements.items():
            new = new.replace(a, b)
        if new != raw:
            path.write_text(new)


def main() -> None:
    rows = load_rows()
    print(f"Rewriting {len(rows)} Wave 2 posts...")
    low = []
    for i, row in enumerate(rows, 1):
        slug, words = write_post(row)
        if words < 700:
            low.append((slug, words))
        if i % 40 == 0 or i == len(rows):
            print(f"  {i}/{len(rows)} {slug} ({words})")
    print("low", len(low))
    w1 = scrub_wave1()
    print("scrubbed soft CTA posts", w1)
    scrub_wave2_email_titles_in_body()

    # QA
    bad = []
    pats = [
        r"destination SEO",
        r"soft CTA",
        r"Traveler angle",
        r"SME confirm",
        r"answers the search around",
        r"practical planning language",
        r"Why this place earns",
        r"micro content",
        r"Send IntoLibya a short note",
        r"Write to us when you are ready",
        r"message us from there",
        r"Message us with",
    ]
    for row in rows:
        body = (POSTS / f"{row['slug']}.md").read_text().split("---", 2)[-1]
        for pat in pats:
            if re.search(pat, body, re.I):
                bad.append((row["slug"], pat))
                break
        if wc(body) < 700:
            low.append((row["slug"], wc(body)))
    print("QA bad style", len(bad))
    if bad[:10]:
        print(bad[:10])
    print("QA under 700", len([x for x in low]))


if __name__ == "__main__":
    main()
