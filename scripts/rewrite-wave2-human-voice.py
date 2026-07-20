#!/usr/bin/env python3
"""
Rewrite Wave 2 bulk posts in clear human English (IntoLibya staff voice).
Skips the early hand written batch (no jargon markers).
No catalog notes, SME flags, SEO jargon, or Soft CTA language in body prose.
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts/en"
MEDIA = ROOT / "public/media/posts"
HERO_SRC = Path("/tmp/il-heroes")
CATALOG = ROOT / "content-review/next-200-seo-blog-posts.md"
SCHEDULE = ROOT / "content-review/next-200-publish-schedule.md"

POOL_FILES = {
    "tripoli": "tripoli.jpg",
    "leptis": "leptis.jpg",
    "sabratha": "sabratha.jpg",
    "ghadames": "ghadames.jpg",
    "sahara": "sahara.jpg",
    "acacus": "acacus.jpg",
    "nafusa": "nafusa.webp",
    "east": "east.jpg",
    "ghat": "ghat.webp",
    "tour": "tour.jpg",
    "cairo": "cairo.jpg",
    "abstract": "abstract.jpg",
    "rally": "event-event_rally_te_te_waddan.jpg",
    "eclipse": "event-event_total_solar_eclipse_2027_libya.jpg",
    "ghatfest": "event-event_ghat_international_tourism_festival.jpg",
    "shafra": "event-event_double_shafra_ghadames.jpg",
}

CTA = """
<hr />

<h2>Plan your Libya trip with IntoLibya</h2>

<p>IntoLibya handles licensed sponsorship, TourBuilder itineraries, guides, and on ground logistics. Tell us your dates and must see list. We will reply with a route that matches how tourism in Libya actually works.</p>

<p><a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a> · <a href="/tourbuilder/search">Browse activities</a></p>
""".strip()

JARGON_RE = re.compile(
    r"Traveler angle for|Soft CTA|SME confirm|Wave 1 already|One more planning reminder|"
    r"this article sent you|Planning notes for|supports destination SEO|soft CTAs|"
    r"Product facts belong|CDN |display true| Closing east|Accessible east\.",
    re.I,
)


def assert_no_hyphen(text: str, label: str) -> None:
    prose = re.sub(r'(href|src|class)="[^"]*"', "", text)
    prose = re.sub(r"<!--.*?-->", "", prose, flags=re.S)
    if "-" in prose:
        i = prose.index("-")
        raise ValueError(f"Hyphen in {label}: ...{prose[max(0, i - 40) : i + 40]}...")


def word_count(html: str) -> int:
    return len([w for w in re.sub(r"<[^>]+>", " ", html).split() if w])


def strip_hyphens_outside_tags(html: str) -> str:
    parts = re.split(r"(<[^>]+>)", html)
    return "".join(p if p.startswith("<") else p.replace("-", " ") for p in parts)


def yaml_str(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"


def load_rows() -> list[dict]:
    text = CATALOG.read_text()
    rows = []
    for line in text.splitlines():
        if not re.match(r"\| \d+ \|", line):
            continue
        parts = [p.strip() for p in line.strip("|").split("|")]
        if len(parts) < 10:
            continue
        rows.append(
            {
                "id": int(parts[0]),
                "title": parts[1],
                "slug": parts[2].strip("`"),
                "primary": parts[3].strip("`"),
                "secondary": parts[4],
                "intent": parts[5],
                "cluster": parts[6],
                "priority": parts[9],
            }
        )
    sched = SCHEDULE.read_text()
    dates = {}
    for line in sched.splitlines():
        m = re.match(r"\| (20\d{2}-\d{2}-\d{2}) \|", line)
        if not m:
            continue
        for slug in re.findall(r"`([a-z0-9-]+)`", line):
            dates[slug] = m.group(1)
    for r in rows:
        r["publishedAt"] = dates[r["slug"]]
    return rows


def pick_pool(row: dict) -> str:
    s = (row["slug"] + " " + row["title"] + " " + row["cluster"]).lower()
    if "eclipse" in s or "totality" in s:
        return "eclipse"
    if "rally" in s or "waddan" in s:
        return "rally"
    if "shafra" in s:
        return "shafra"
    if "ghat festival" in s or "ghat international" in s:
        return "ghatfest"
    if "acacus" in s or "rock art" in s or "mathendous" in s:
        return "acacus"
    if re.search(r"\bghat\b", s):
        return "ghat"
    if "nafusa" in s or "nalut" in s or "tarmisa" in s:
        return "nafusa"
    if any(
        k in s
        for k in (
            "cyrene",
            "shahat",
            "susa",
            "tolmeita",
            "ptolemais",
            "tobruk",
            "cyrenaica",
            "east",
            "bayda",
            "qasr libya",
            "apollonia",
            "benghazi",
        )
    ):
        return "east"
    if any(k in s for k in ("sahara", "desert", "oasis", "fezzan", "germa", "hattia", "sandboard")):
        return "sahara"
    if "sabratha" in s or "carthage" in s:
        return "sabratha"
    if "leptis" in s or "roman" in s or "villa seline" in s:
        return "leptis"
    if "ghadames" in s or "qaser" in s:
        return "ghadames"
    if "egypt" in s or "nile" in s or "luxor" in s or "cairo" in s:
        return "cairo"
    if "tripoli" in s or "sfenz" in s or "ali gana" in s or "football" in s:
        return "tripoli"
    if row["cluster"].startswith(("B.", "C.", "G.")):
        return "tour"
    return "abstract"


def ensure_hero(slug: str, pool: str) -> str:
    src = HERO_SRC / POOL_FILES.get(pool, "tour.jpg")
    if not src.exists():
        src = HERO_SRC / "tour.jpg"
    dest_dir = MEDIA / slug
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / "hero.webp"
    if not dest.exists() or dest.stat().st_size < 1000:
        subprocess.run(
            [
                "node",
                "--input-type=module",
                "-e",
                f"""
import sharp from 'sharp';
await sharp({str(src)!r}).rotate().resize({{width:1920,height:1920,fit:'inside',withoutEnlargement:true}}).webp({{quality:80}}).toFile({str(dest)!r});
""",
            ],
            cwd=str(ROOT),
            check=True,
        )
    return f"/media/posts/{slug}/hero.webp"


def related(row: dict) -> str:
    links = [
        ("/en/how-to-visit-libya-as-a-tourist-in-2026", "How to Visit Libya as a Tourist in 2026"),
        ("/en/is-it-safe-to-travel-to-libya-right-now", "Is It Safe to Travel to Libya Right Now"),
        ("/en/how-to-book-a-libya-tour-with-intolibya", "How to Book a Libya Tour with IntoLibya"),
        ("/en/how-tourbuilder-works-for-custom-libya-trips", "How TourBuilder Works for Custom Libya Trips"),
        ("/en/destination/tripoli", "Tripoli destination guide"),
        ("/en/destination/leptis-magna", "Leptis Magna destination guide"),
    ]
    if "east" in row["slug"] or "cyrene" in row["slug"] or "shahat" in row["slug"] or "cyrenaica" in row["slug"]:
        links[4] = ("/en/destination/shahat", "Shahat destination guide")
        links[5] = ("/en/destination/susa", "Susa destination guide")
    elif "ghat" in row["slug"] or "acacus" in row["slug"] or "sahara" in row["slug"]:
        links[5] = ("/en/destination/ghadames", "Ghadames destination guide")
        links.append(("/en/destination/acacus-mountains", "Acacus Mountains destination guide"))
    items = "\n".join(f'<li><a href="{h}">{t}</a></li>' for h, t in links[:6])
    return f"<h2>Related reading</h2>\n\n<ul>\n{items}\n</ul>"


def body_for(row: dict) -> str:
    title = row["title"]
    primary = row["primary"]
    cluster = row["cluster"]
    c = cluster[0]  # A-I roughly

    # Natural opening: answer the title as a real question when possible
    if title.lower().startswith(("how ", "what ", "where ", "why ", "when ", "who ", "is ", "can ", "do ")):
        open_q = title
    else:
        open_q = title

    sections: list[str] = []

    if cluster.startswith("A."):
        sections = [
            f"<p>{open_q} is a fair question if you are planning North Africa and do not want another crowded holiday. Morocco, Tunisia, Egypt, Algeria, and Libya each ask for different seasons and booking styles. Libya fits when you want quieter heritage days and you are ready to travel with a licensed operator.</p>",
            f"<p>We are IntoLibya, a licensed Libyan tour company. We only plan Libya. If you also want Tunis beaches or a Nile week, book those parts with specialists there. Our job is the Libya chapter: sponsorship, guides, and a clear route.</p>",
            f"<h2>What people usually mean by {primary}</h2>\n<p>Most travelers typing that search want space at serious sites, not another packed souvenir corridor. In Libya that often means Roman cities such as <a href=\"/en/destination/leptis-magna\">Leptis Magna</a> and <a href=\"/en/destination/sabratha\">Sabratha</a>, oasis towns like <a href=\"/en/destination/ghadames\">Ghadames</a>, and Sahara nights when leave allows.</p>\n<p>You visit on a sponsored tour with an eVisa process, guides, and required tourist police coordination. Independent freestyle tourist travel is not how visiting works here. The structure is what keeps guest days calm and workable.</p>",
            "<h2>How to place Libya next to other countries</h2>\n<p>Give each country one job. Morocco for cities and mountains. Tunisia for short breaks and beaches. Egypt for pharaonic icons. Algeria for certain Sahara expeditions with Algeria specialists. Libya for empty classical mornings and oasis culture on a guided plan.</p>\n<p>Many guests spread these trips across years so visas and energy stay human. You can still add Libya after a Tunisia week or a Cairo stopover flight if each segment keeps its own booking reality.</p>",
            "<h2>Practical tips from our planning desk</h2>\n<p>Start early enough for sponsorship paperwork. Keep flights flexible until your documents are in good shape. Tell us what you have already seen so we do not repeat it. Ask before you photograph people. Pack layers if desert nights are on the plan.</p>\n<p>If you are escaping crowds, say that plainly in your first message. We will draft fewer transfers and more time to look.</p>",
            "<h2>A simple next step</h2>\n<p>Write us your dates, nationalities, and must see list. Open TourBuilder if you want to click package shapes first. We will reply with a route that matches how tourism in Libya actually works, without pretending one company can sell the whole Maghreb as a single freestyle ticket.</p>",
        ]
    elif cluster.startswith("B."):
        sections = [
            f"<p>{open_q} comes up in almost every first conversation with us. People are not trying to be difficult. They want to know what happens after the pretty photos, who handles hotels and flights, and what we need from them before anyone pays a deposit.</p>",
            f"<p>Here is how we handle <strong>{primary}</strong> at IntoLibya, in plain language.</p>",
            f"<h2>What we need to start</h2>\n<p>Send approximate dates, who is traveling, passport nationalities, must see places, walking comfort, and any diet notes. A short clear message is enough. You do not need a perfect spreadsheet on day one.</p>\n<p>When you are ready to move forward, we will ask for sharp passport scans and any forms that match your booking. Exact photo rules can change, so follow the checklist we send you in the booking thread rather than an old screenshot from the internet.</p>",
            "<h2>Flights and hotels</h2>\n<p>Most guests fly into Tripoli Mitiga through hubs such as Tunis or Cairo. We help you choose sensible timing. Who buys the ticket should be clear in your quote conversation. Do not lock the least flexible fare before your paperwork story is solid.</p>\n<p>Hotels and camps on our tours are arranged as part of the plan. We keep lodging practical on purpose. This is not a brand name scavenger hunt. If you need quieter rooms, twin beds, or ground floor when possible, just tell us.</p>",
            "<h2>Where first timers usually go</h2>\n<p>Start on the western coast: Tripoli for orientation, Leptis Magna for Roman city scale, Sabratha for theatre and sea light. Add Ghadames when you have more days. Save deep Sahara or east Libya Greek sites for longer trips unless that is your main dream.</p>",
            "<h2>Before you pay a deposit</h2>\n<p>You should understand the route shape, what is included, who books flights, how lodging is handled, and what documents come next. Ask until the answers feel ordinary. A deposit should feel like a clear next step, not a leap into fog.</p>\n<p>When you are ready, we start sponsorship work, you complete the official eVisa steps with our sponsor pack, you share flight details, and we meet you on arrival.</p>",
        ]
    elif cluster.startswith("C."):
        sections = [
            f"<p>{open_q} is the question behind most hesitant enquiries we receive. Headlines are loud. Guest days on a licensed tour often feel very different: airport meeting, guided days, tea, stone, and ordinary check points handled as routine.</p>",
            f"<p>We will not pretend every street in a large country is a playground. We also will not scare you with politics. Our job is to explain how tourist travel works with IntoLibya when people search about <strong>{primary}</strong>.</p>",
            "<h2>What safe enough looks like on tour</h2>\n<p>You travel with sponsorship documents, an eVisa process, guides, and required tourist police coordination on the routes that need it. Drivers know which roads make sense. Plans can change if access requires it. Guests follow dress and photography guidance. Insurance should match the trip.</p>\n<p>That method is the product. Freestyle independent tourist travel is not.</p>",
            "<h2>How to decide without panic</h2>\n<ol>\n<li>Read your government advisory fully.</li>\n<li>Ask us for a concrete route, not a vague promise.</li>\n<li>Compare the day list with advisory regional notes.</li>\n<li>Confirm travel insurance.</li>\n<li>Book only if you accept guided licensed travel.</li>\n</ol>",
            "<h2>What guests tell us afterward</h2>\n<p>Many people say the nerves peaked on the flight and dropped once they met the team. Reviews often mention relief, clear guiding, and surprise at how empty major sites can feel. Use reviews as texture. Use a real itinerary as the decision tool.</p>",
            "<h2>If you are still unsure</h2>\n<p>Message us with your dates and worries in plain words. Ask what western coast days look like hour to hour. Ask what happens if plans must change. Honest answers beat slogans. If the trip is not right for you this year, we would rather say so than rush a deposit.</p>",
        ]
    elif cluster.startswith("D."):
        sections = [
            f"<p>{open_q} matters because fixed dates do not wait for slow paperwork. Rally weekends, December cultural trips, festival windows, and the 2027 eclipse near Benghazi all reward earlier planning and clearer flight buffers.</p>",
            f"<p>IntoLibya lists live events in TourBuilder. This page explains how we help guests think through <strong>{primary}</strong> without inventing prices or promising permits we have not confirmed for your party.</p>",
            "<h2>Why event trips feel different</h2>\n<p>A flexible coast week can shift by a day. An event cannot. That means sponsorship and eVisa work should start sooner. It also means arrival buffers matter. A tight connection that lands at midnight before a long desert transfer is rarely kind.</p>",
            "<h2>What to ask us early</h2>\n<p>Which dates are confirmed this year. Who the trip is for, including any Libyan only cohort rules when those apply. What fitness the days ask for. Whether coast sightseeing can sit around an eclipse or festival. What packing looks like for cold desert nights in winter.</p>\n<p>We will answer from the live trip notes, not from guesswork.</p>",
            "<h2>Flights and lodging around events</h2>\n<p>Share landing times as soon as tickets exist. Hotels and camps stay part of the operator plan and stay practical. Neighbor hub nights in Tunis or Cairo are usually your own booking unless we note otherwise.</p>",
            "<h2>Event trip or flexible custom trip</h2>\n<p>Choose an event when the date is the whole point. Choose a custom TourBuilder outline when you want season flexibility more than a fixed calendar. Either way, send nationalities and must sees so we can keep the plan honest.</p>",
        ]
    elif cluster.startswith("E."):
        sections = [
            f"<p>{open_q} is for travelers tired of dark afternoons at home. Libya’s Mediterranean coast is often milder than northern Europe or North America in winter. That does not mean tropical beach weather every hour. It means usable outdoor days, jacket evenings, and kinder ruin walking than peak summer heat.</p>",
            f"<p>When guests ask us about <strong>{primary}</strong>, we talk climate honestly first, then route shape.</p>",
            "<h2>Coast days in the cooler months</h2>\n<p>Tripoli, Leptis Magna, and Sabratha work well when you want history without the hardest desert heat. Rain can appear on the coast. Pack a light shell and layers. Closed comfortable shoes still matter for long site walks.</p>",
            "<h2>Desert nights still need warmth</h2>\n<p>Sahara days can feel pleasant while nights turn cold. If camping is on your outline, bring a serious warm layer. Ask us what camp setup usually looks like in your week so you do not overpack furniture and underpack socks.</p>",
            "<h2>Holiday weeks and fixed dates</h2>\n<p>November and December can overlap rally or cultural event windows in some years. If those dates excite you, say so early. If you only want a quiet custom week, we can keep the plan flexible around your leave.</p>",
            "<h2>How to enquire for a winter escape</h2>\n<p>Tell us your month, whether you want coast only or some desert, and how much walking you enjoy. Keep flights changeable until documents are solid. We will send a draft that matches mild season realities, not a fantasy of endless hot swimming.</p>",
        ]
    elif cluster.startswith("F."):
        sections = [
            f"<p>{open_q} is written for a specific kind of traveler. Families, Muslim guests, luxury paced private trips, adventure seekers, quiet seekers, school groups, photographers, and diaspora family visits each need different day shapes. We plan those differences on purpose.</p>",
            f"<p>At IntoLibya we listen for what <strong>{primary}</strong> means in your message, then build the route around energy, respect, and licensed access.</p>",
            "<h2>How we adjust the days</h2>\n<p>Families often need shorter walking blocks and clearer meal timing. Muslim travelers often care about prayer friendly pacing, modest dress comfort, and food notes. Luxury guests often want private pacing and unhurried mornings at empty sites. Adventure guests need honest fitness talk before dunes.</p>\n<p>Quiet seekers should say they hate crowds. We will protect morning light and cut optional shopping drift.</p>",
            "<h2>Respect on the ground</h2>\n<p>Ask before you photograph people. Follow dress guidance. Mosque visits and home meals need extra care. Rock art and living towns are not props. If you create content for social media, model the licensed path so other travelers do not copy unsafe freestyle ideas.</p>",
            "<h2>Groups and organizers</h2>\n<p>Schools, universities, and workshops should name one document coordinator and start early. Collecting many passport scans always takes longer than you think. If filming is involved, ask us what is possible before you promise a crew a location day. We will not invent permission stories.</p>",
            "<h2>Modern history questions</h2>\n<p>Some guests are curious about recent history. Our guides keep answers travel practical and respectful. We do not turn trips into political debates or sensational content. If that boundary matters to you, say so and we will keep the tone careful.</p>",
        ]
    elif cluster.startswith("G."):
        sections = [
            f"<p>{open_q} is for guests starting from a specific country or region. The big pieces are the same everywhere: licensed tour, sponsorship, eVisa steps, and a clear meeting plan. The small pieces change with hubs, flight time, and how early you should begin paperwork.</p>",
            f"<p>When you write to us about <strong>{primary}</strong>, include your nationality, dates, and must see list so we can answer with your route in mind.</p>",
            "<h2>Typical flight patterns</h2>\n<p>Many travelers connect through Tunis or Cairo into Tripoli Mitiga. Other hubs appear by season. Build a buffer when you can. A cheap fare that destroys your first site morning is not a bargain.</p>\n<p>Who buys the ticket should be confirmed in your quote thread. Keep tickets flexible until documents look solid.</p>",
            "<h2>Documents and timing</h2>\n<p>Start the conversation early, especially for school holidays or long haul leave. We will tell you what passport files and photos we need for your party. Follow that live checklist. Processing can vary, so we avoid fake universal day counts on the blog.</p>",
            "<h2>Season notes for distant guests</h2>\n<p>Jet lag plus hard desert heat is a rough pair. Coast first weeks are kinder after long flights. Winter escapes work well for northern travelers who want milder air and Roman sites. Gulf travelers often ask for culture comfort and quieter heritage days. Tell us which story is yours.</p>",
            "<h2>Language and comfort details</h2>\n<p>Ask what language support your group needs. Share diet notes and prayer timing needs early. Share walking limits honestly. Those details make the first week feel hosted rather than improvised.</p>",
        ]
    elif cluster.startswith("H."):
        sections = [
            f"<p>{open_q} explains an experience you can add to a wider IntoLibya itinerary. Some activities run often. Others depend on season, weather, or local timing. We will confirm what is available for your dates when we draft your trip.</p>",
            f"<p>Think of <strong>{primary}</strong> as a flavor day inside a coast, oasis, or desert week, not as a standalone holiday by itself.</p>",
            "<h2>How it usually fits</h2>\n<p>City loops and cultural houses deepen Tripoli days. Qaser visits and viewpoints deepen Nafusa or Ghadames chapters. Villa visits and local sports color Leptis days. East Libya food and Greek ruin stops deepen Cyrenaica circuits. Sahara walks and pyramid visits deepen Fezzan stories.</p>",
            "<h2>What we need from you</h2>\n<p>Tell us your fitness, fear of heights if relevant, diet notes, and whether photography is a priority. Adventure options need extra honesty about weather. Culture stops need time and consent. Ask before you photograph people.</p>",
            "<h2>Pacing advice</h2>\n<p>First timers should not stack five optional thrills onto a short coast week. Choose one or two add ons that match your energy. Repeat visitors with longer leave can build richer activity menus.</p>",
            "<h2>How to book it</h2>\n<p>Draft your core route with us first, then add the activity. Open TourBuilder if you want to browse. We will keep prices and availability in the quote where they belong, not as invented numbers on a blog page.</p>",
        ]
    else:  # destination micro I
        sections = [
            f"<p>{open_q} is for travelers who already know the big names and want a clearer picture of a specific place or short circuit. East Libya, highland country, and deeper desert stops reward that kind of curiosity.</p>",
            f"<p>We plan these days as part of a licensed IntoLibya tour. Below is how we talk about <strong>{primary}</strong> with guests who ask for a practical outline.</p>",
            "<h2>What you come to see</h2>\n<p>Greek ruins and harbour light around places like Shahat and Susa. Mosaic heritage at sites such as Qasr Libya. Rock art ethics at Wadi Mathendous. Rally gateway context around Waddan. Market energy in modern coastal cities like Misrata. Green Mountain air as a contrast to Sahara heat.</p>\n<p>Your exact mix depends on leave, season, and whether this is a first Libya trip or a return visit.</p>",
            "<h2>How we usually pair the days</h2>\n<p>A short Cyrenaica sampler might use Benghazi as a hub, then Shahat and Susa, with highland views if time allows. Fezzan days pair rock art, oasis swimming, and desert camps when conditions fit. Highland olive country pairs with ruin mornings and cooler evenings.</p>\n<p>First timers with one week often stay on the western coast first. Longer leave unlocks east and deep desert without blur.</p>",
            "<h2>Practical expectations</h2>\n<p>Drives can be long. Sites are ancient and uneven. Lodging is arranged as part of the tour and stays practical. We will give drive time estimates in your quote rather than guessing exact minutes here. Museum opening details can change, so we confirm them when your dates are real.</p>",
            "<h2>Care at heritage places</h2>\n<p>Do not climb rock art panels. Watch your step on mosaics. Ask before photographing people in towns and villages. Empty sites still deserve respect. That care is part of why these places still feel special for visitors.</p>",
        ]

    # Shared human closing without jargon
    sections.append(
        "<h2>What our team sees go wrong</h2>\n<p>People lock rigid flights too early. They send blurry passport photos. They try to see the whole country in five days. They expect freestyle nightlife from a classical heritage week. They compare Libya to Luxor and feel disappointed by the wrong measuring stick.</p>\n<p>Avoid those, and the trip usually feels clear.</p>"
    )
    sections.append(
        "<h2>A day on the ground, in ordinary words</h2>\n<p>Morning briefing. Sensible road time. A guide who can slow down when a site deserves it. Lunch that respects the diet notes you sent. Photo guidance that protects local dignity. An evening that leaves enough sleep for tomorrow. That rhythm is what nervous travelers usually remember later, more than any slogan.</p>\n<p>If access requires a redesign, we say so and rebuild the day. Guests who accept that flexibility enjoy Libya more than guests who need every hour frozen in advance.</p>"
    )
    sections.append(
        "<h2>Packing and season honesty</h2>\n<p>Closed shoes for ruins. Modest clothes that still feel comfortable in heat. A warm layer for desert nights even when daytime feels mild. Sun protection on bright stone. A light shell for coast rain in winter months. Leave the costume expedition outfit at home unless we specifically ask for something technical.</p>\n<p>Tell us if you hate camping, need slower mornings, or cannot do long transfers. Those sentences help us draft the right Libya, not a fantasy week.</p>"
    )
    sections.append(
        f"<h2>Ready to talk through {primary}?</h2>\n<p>Send IntoLibya a short note with your dates, who is coming, and what you most want to see. We will come back with a draft route, document next steps, and honest notes on season and walking load. You can also start in TourBuilder and message us from there.</p>\n<p>We write these guides the same way we brief guests: plain English, no invented fees, and no drama that does not help you pack.</p>"
    )

    body = "\n\n".join(sections) + "\n\n" + related(row) + "\n\n" + CTA + "\n"
    body = strip_hyphens_outside_tags(body)
    body = re.sub(r" +", " ", body)
    body = re.sub(r" \n", "\n", body)
    return body


def needs_rewrite(slug: str) -> bool:
    path = POSTS / f"{slug}.md"
    if not path.exists():
        return True
    raw = path.read_text()
    body = raw.split("---", 2)[-1]
    if JARGON_RE.search(body):
        return True
    if word_count(body) < 700:
        # Only rewrite thin posts that are in the wave2 date window
        if re.search(r"publishedAt: '2026-1[0-2]-|publishedAt: '2027-01-", raw):
            return True
    return False


def write_post(row: dict) -> tuple[str, int]:
    slug = row["slug"]
    title = row["title"]
    assert_no_hyphen(title, f"title {row['id']}")
    body = body_for(row)
    assert_no_hyphen(body, f"body {row['id']}")
    if JARGON_RE.search(body):
        raise ValueError(f"jargon leaked into {slug}")

    featured = ensure_hero(slug, pick_pool(row))
    # preserve existing hero path if present
    existing = POSTS / f"{slug}.md"
    if existing.exists():
        m = re.search(r"featuredImage:\s*(\S+)", existing.read_text())
        if m:
            featured = m.group(1)

    excerpt = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", body)).strip()[:160]
    assert_no_hyphen(excerpt, "excerpt")
    seo = f"{title}. Clear IntoLibya guidance for travelers planning licensed Libya tours."
    seo = strip_hyphens_outside_tags(seo)
    seo = re.sub(r"\s+", " ", seo).strip()[:155]
    assert_no_hyphen(seo, "seo")

    fm = "\n".join(
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
    (POSTS / f"{slug}.md").write_text(fm)
    return slug, word_count(body)


def main() -> None:
    rows = load_rows()
    todo = [r for r in rows if needs_rewrite(r["slug"])]
    print(f"Rewriting {len(todo)} posts in human staff voice...")
    low = []
    for i, row in enumerate(todo, 1):
        slug, wc = write_post(row)
        if wc < 700:
            low.append((slug, wc))
        if i % 25 == 0 or i == len(todo):
            print(f"  {i}/{len(todo)} {slug} ({wc})")
    print(f"Done. Under 700: {len(low)}")
    for s, w in low[:20]:
        print(f"  LOW {w} {s}")

    # verify no jargon left in wave2
    left = []
    for r in rows:
        body = (POSTS / f"{r['slug']}.md").read_text().split("---", 2)[-1]
        if JARGON_RE.search(body):
            left.append(r["slug"])
    print(f"Jargon remaining: {len(left)}")
    if left:
        print(left[:10])


if __name__ == "__main__":
    main()
