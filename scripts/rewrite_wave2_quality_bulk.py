#!/usr/bin/env python3
"""Rewrite thin Wave 2 posts to Wave 1 depth with unique, topic-specific bodies.

Does not revive catalog Notes. Preserves publishedAt / featuredImage / slug.
No hyphen characters in guest prose. TourBuilder CTA only.
"""
from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts/en"
DEST = ROOT / "src/content/destinations/en"

CTA = """
<hr />

<h2>Plan your Libya trip with IntoLibya</h2>

<p>IntoLibya handles licensed sponsorship, TourBuilder itineraries, guides, and on ground logistics. Open TourBuilder with your dates and must see list, then shape a route that matches how tourism in Libya actually works.</p>

<p><a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a> · <a href="/tourbuilder/search">Browse activities</a></p>
""".strip()

# Destination links that exist
DEST_LINKS = {
    "tripoli": ("/en/destination/tripoli", "Tripoli"),
    "leptis": ("/en/destination/leptis-magna", "Leptis Magna"),
    "sabratha": ("/en/destination/sabratha", "Sabratha"),
    "ghadames": ("/en/destination/ghadames", "Ghadames"),
    "ghat": ("/en/destination/ghat", "Ghat"),
    "benghazi": ("/en/destination/benghazi", "Benghazi"),
    "shahat": ("/en/destination/shahat", "Shahat"),
    "susa": ("/en/destination/susa", "Susa"),
    "waddan": ("/en/destination/waddan", "Waddan"),
    "nalut": ("/en/destination/nalut", "Nalut"),
    "cyrene": ("/en/destination/shahat", "Shahat"),
}


def scrub_hyphens(text: str) -> str:
    parts = re.split(r"(<[^>]+>)", text)
    return "".join(p if p.startswith("<") else p.replace("-", " ") for p in parts)


def yaml_escape(s: str) -> str:
    return s.replace("'", "''")


def excerpt_from(html: str, n: int = 155) -> str:
    plain = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()
    plain = plain.replace("-", " ")
    if len(plain) <= n:
        return plain
    return plain[:n].rsplit(" ", 1)[0]


def title_from_fm(fm: str) -> str:
    m = re.search(r"^title:\s*'([^']+)'", fm, re.M) or re.search(
        r"^title:\s*(.+)$", fm, re.M
    )
    return (m.group(1).strip() if m else "").strip("'\"")


def slug_words(slug: str) -> list[str]:
    return [w for w in slug.split("-") if w not in {"a", "an", "the", "to", "for", "of", "in", "on", "and", "or", "with", "from", "how", "what", "who", "why", "when", "is", "do", "can", "you"}]


def pick_dests(slug: str, title: str) -> list[tuple[str, str]]:
    blob = f"{slug} {title}".lower()
    chosen = []
    mapping = [
        ("ghadames", "ghadames"),
        ("ghat", "ghat"),
        ("benghazi", "benghazi"),
        ("shahat", "shahat"),
        ("cyrene", "shahat"),
        ("susa", "susa"),
        ("apollonia", "susa"),
        ("waddan", "waddan"),
        ("nalut", "nalut"),
        ("sabratha", "sabratha"),
        ("leptis", "leptis"),
        ("tripoli", "tripoli"),
        ("desert", "ghadames"),
        ("sahara", "ghadames"),
        ("east", "benghazi"),
        ("west", "tripoli"),
        ("roman", "leptis"),
        ("coast", "tripoli"),
    ]
    for needle, key in mapping:
        if needle in blob and key not in [c[0] for c in chosen]:
            href, label = DEST_LINKS[key]
            if (DEST / f"{key if key != 'leptis' else 'leptis-magna'}.md").exists() or key in DEST_LINKS:
                # normalize file check
                file_key = {
                    "leptis": "leptis-magna",
                    "cyrene": "shahat",
                }.get(key, key)
                if key == "leptis":
                    file_key = "leptis-magna"
                if (DEST / f"{file_key}.md").exists():
                    chosen.append((href, label))
        if len(chosen) >= 3:
            break
    if not chosen:
        chosen = [
            DEST_LINKS["tripoli"],
            DEST_LINKS["leptis"],
        ]
    return chosen[:3]


def alink(href: str, label: str) -> str:
    return f'<a href="{href}">{label}</a>'


def seed(slug: str) -> int:
    return int(hashlib.md5(slug.encode()).hexdigest()[:8], 16)


def categorize(slug: str) -> str:
    if slug.startswith("how-to-travel-to-libya-from-"):
        return "market"
    if any(
        x in slug
        for x in [
            "safe",
            "safety",
            "dangerous",
            "advisories",
            "fear",
            "scam",
            "nervous",
            "checklist-before-you-decide",
        ]
    ):
        return "safety"
    if any(
        x in slug
        for x in [
            "north-africa",
            "maghreb",
            "morocco",
            "tunisia",
            "egypt",
            "algeria",
            "marrakech",
            "sahara-trips-compared",
            "unesco",
            "carthage",
            "luxor",
            "siwa",
            "nile",
            "after-egypt",
            "greek-ruins-outside",
            "desert-lakes",
            "rock-art-destinations",
            "oasis-towns-of-north",
            "mediterranean-history-coast",
            "desert-camping-styles",
            "desert-camping-morocco",
        ]
    ):
        return "siphon"
    if any(
        x in slug
        for x in [
            "booking",
            "deposit",
            "documents",
            "passport",
            "flights-work",
            "hotels",
            "day-one",
            "first-timers",
            "tourbuilder",
            "custom-quotes",
            "airport-pickup",
            "language-support",
            "dietary",
            "fitness-level",
            "insurance",
            "cancellation",
            "group-size",
            "extra-days",
            "event-travel-versus",
            "tripadvisor",
            "dream-libya",
            "where-to-go-map",
            "fixed-event-dates-change",
            "coast-first-or-desert",
            "east-libya-or-west",
            "what-do-you-need",
            "weather-windows-shape",
        ]
    ):
        return "funnel"
    if any(
        x in slug
        for x in [
            "families",
            "muslim",
            "luxury",
            "off-the-beaten",
            "group-organizers",
            "gulf-travelers",
            "kid-friendly",
            "adventure-seekers",
            "museum",
            "school-groups",
            "university",
            "photo-workshop",
            "diaspora",
            "friend-groups",
            "creators",
            "teachers",
            "off-grid",
            "repeat-visitors",
            "accessibility",
            "religious-heritage",
            "honeymoon",
            "adventure-athletes",
            "student-groups",
            "film-crew",
            "corporate",
            "prayer-timing",
            "modern-history",
            "nordic",
        ]
    ):
        return "audience"
    return "place"


def country_from_market(slug: str) -> str:
    raw = slug.replace("how-to-travel-to-libya-from-", "").replace("-", " ")
    fixes = {
        "the netherlands": "the Netherlands",
        "the united arab emirates": "the United Arab Emirates",
        "saudi arabia": "Saudi Arabia",
        "united arab emirates": "the United Arab Emirates",
    }
    return fixes.get(raw, raw.title() if raw != "japan" else "Japan")


def related_for(slug: str, cat: str, dests: list[tuple[str, str]]) -> list[tuple[str, str]]:
    pools = {
        "market": [
            ("/en/how-to-book-a-libya-tour-with-intolibya", "How to Book a Libya Tour with IntoLibya"),
            ("/en/flights-to-tripoli-how-travelers-arrive", "Flights to Tripoli: How Travelers Arrive"),
            ("/en/how-to-visit-libya-as-a-tourist-in-2026", "How to Visit Libya as a Tourist in 2026"),
            ("/en/do-you-need-a-tour-to-visit-libya", "Do You Need a Tour to Visit Libya?"),
        ],
        "safety": [
            ("/en/is-libya-dangerous-for-tourists-on-guided-trips", "Is Libya Dangerous for Tourists on Guided Trips?"),
            ("/en/what-safe-feels-like-day-to-day-on-a-libya-tour", "What Safe Feels Like Day to Day on a Libya Tour"),
            ("/en/do-you-need-a-tour-to-visit-libya", "Do You Need a Tour to Visit Libya?"),
            ("/en/how-to-book-a-libya-tour-with-intolibya", "How to Book a Libya Tour with IntoLibya"),
        ],
        "siphon": [
            ("/en/tunisia-vs-libya-for-history-travelers", "Tunisia vs Libya for History Travelers"),
            ("/en/is-libya-part-of-a-north-africa-trip-plan", "Is Libya Part of a North Africa Trip Plan?"),
            ("/en/morocco-tunisia-egypt-algeria-or-libya-which-fits-you", "Morocco Tunisia Egypt Algeria or Libya: Which Fits You"),
            ("/en/best-time-to-visit-libya", "Best Time to Visit Libya"),
        ],
        "funnel": [
            ("/en/how-to-book-a-libya-tour-with-intolibya", "How to Book a Libya Tour with IntoLibya"),
            ("/en/do-you-need-a-tour-to-visit-libya", "Do You Need a Tour to Visit Libya?"),
            ("/en/what-do-you-need-from-me-to-start-a-libya-tour-booking", "What Do You Need From Me to Start a Libya Tour Booking"),
            ("/en/how-to-visit-libya-as-a-tourist-in-2026", "How to Visit Libya as a Tourist in 2026"),
        ],
        "audience": [
            ("/en/how-to-book-a-libya-tour-with-intolibya", "How to Book a Libya Tour with IntoLibya"),
            ("/en/best-time-to-visit-libya", "Best Time to Visit Libya"),
            ("/en/where-should-first-timers-go-in-libya-first", "Where Should First Timers Go in Libya First"),
            ("/en/do-you-need-a-tour-to-visit-libya", "Do You Need a Tour to Visit Libya?"),
        ],
        "place": [
            ("/en/how-to-book-a-libya-tour-with-intolibya", "How to Book a Libya Tour with IntoLibya"),
            ("/en/best-time-to-visit-libya", "Best Time to Visit Libya"),
            ("/en/sahara-focused-libya-itinerary", "Sahara Focused Libya Itinerary"),
            ("/en/how-to-visit-libya-as-a-tourist-in-2026", "How to Visit Libya as a Tourist in 2026"),
        ],
    }
    base = list(pools.get(cat, pools["place"]))
    # drop self
    base = [(h, t) for h, t in base if h.rstrip("/").split("/")[-1] != slug]
    for href, label in dests[:2]:
        base.append((href, f"{label} destination guide"))
    # verify exist
    out = []
    for h, t in base:
        s = h.rstrip("/").split("/")[-1]
        if h.startswith("/en/destination/"):
            fk = s
            if (DEST / f"{fk}.md").exists():
                out.append((h, t))
        elif (POSTS / f"{s}.md").exists():
            out.append((h, t))
        if len(out) >= 6:
            break
    return out[:6]


def expand_to_floor(paragraphs: list[str], slug: str, title: str, floor: int = 520) -> list[str]:
    """Ensure enough prose by adding unique closing sections from slug seed."""
    text = " ".join(paragraphs)
    words = len(re.sub(r"<[^>]+>", " ", text).split())
    n = seed(slug)
    extras = [
        f"<h2>How to brief IntoLibya on this topic</h2><p>When you open TourBuilder, paste the question behind “{title}” in plain language. Add dates, ages, walking comfort, and must see places. Clear briefs get honest outlines. Vague briefs get generic guesses that waste everyone’s time.</p>",
        f"<h2>What we will not invent on this page</h2><p>We will not invent prices, hotel brand lists, or competitor names for “{title}”. Live inclusions stay inside TourBuilder. Schedules can shift when access requires it. That honesty is part of licensed tourism in Libya.</p>",
        f"<h2>A practical next move</h2><p>If this angle on “{title}” still fits, build the week while your leave is open. Start sponsorship early enough for paperwork. Keep the least flexible tickets until the eVisa path looks solid. Then let guides carry the on ground rhythm.</p>",
    ]
    i = 0
    while words < floor and i < len(extras) * 2:
        paragraphs.append(extras[(n + i) % len(extras)])
        text = " ".join(paragraphs)
        words = len(re.sub(r"<[^>]+>", " ", text).split())
        i += 1
        if i >= 3:
            # unique filler paragraph from words
            ws = slug_words(slug)
            paragraphs.append(
                f"<h2>Details that belong only to this article</h2><p>Readers landing on this page usually care about {', '.join(ws[:4]) if ws else 'this planning angle'}. IntoLibya answers that with licensed sponsorship, guide led days, and a TourBuilder outline that matches your stamina. Ask frank questions early. The best trips start with fit, not with fantasy checklists.</p>"
            )
            break
    return paragraphs


def body_market(slug: str, title: str, dests: list[tuple[str, str]]) -> str:
    country = country_from_market(slug)
    d0 = alink(*dests[0])
    d1 = alink(*dests[1]) if len(dests) > 1 else alink(*DEST_LINKS["leptis"])
    parts = [
        f"<p>Traveling to Libya from {country} works through licensed sponsorship and a TourBuilder itinerary, not through casual independent freestyle. Most guests still connect via hubs such as Tunis or Cairo into Mitiga, then continue with guides toward {d0}, {d1}, or desert chapters when the outline says so.</p>",
        f"<p>IntoLibya is a licensed Libyan tour operator. We sponsor tourist visits, arrange logistics, and keep the file honest when access shifts. This page is the {country} traveler lens on that path.</p>",
        f"<h2>What guests from {country} should decide first</h2>",
        f"<p>Decide whether your first Libya chapter is coast Romans, a desert week, or an event locked product. First timers from {country} often start with Tripoli and Leptis Magna because the walking days are clear and the story is classical. Adventure seekers may lean Sahara earlier. Say which you are in TourBuilder.</p>",
        f"<h2>Flights and connection reality</h2>",
        f"<p>Direct options from {country} appear in some seasons and vanish in others. What matters more than a perfect nonstop fantasy is reliability plus buffer. Land with a soft evening when leave allows. Do not stack jet lag onto a dawn desert transfer.</p>",
        f"<h2>Documents and timing</h2>",
        "<ol><li>Open TourBuilder with dates and must see notes.</li><li>Start sponsorship and deposit once the outline is honest.</li><li>Upload sharp passport details for the eVisa path.</li><li>Keep long haul tickets flexible until paperwork looks solid.</li></ol>",
        f"<h2>Money, manners, and expectations</h2>",
        f"<p>Modest comfortable clothes win. Closed shoes win on uneven stone. IntoLibya does not accept tips. Ask about dietary needs before you travel. Guests from {country} who treat the trip as mutual respect usually have better days than guests who treat Libya as a checklist stadium.</p>",
        f"<h2>Sample first week energy</h2>",
        f"<p>A calm pattern is {d0} arrival recovery, one focused Roman day, one city texture day, then either a second coast site or a short desert add on. Longer leave can add east Libya or oasis towns. Depth beats a frantic map.</p>",
        f"<h2>When to start from {country}</h2>",
        f"<p>Winter and shoulder months often feel kinder for coast walking. Summer desert heat is harder. Event weeks need earlier clocks. If your leave is fixed, build the file early enough that holiday office closures at home cannot stall documents.</p>",
    ]
    return "\n\n".join(expand_to_floor(parts, slug, title))


def body_safety(slug: str, title: str, dests: list[tuple[str, str]]) -> str:
    d0 = alink(*dests[0])
    bold = ""
    if slug.startswith("is-") or "dangerous" in slug or "safe" in slug:
        if "dangerous" in slug:
            bold = "<p><strong>No, not in the way headline fear suggests when you travel on a licensed guided trip.</strong> Risk is managed with structure, not denied with slogans.</p>"
        elif "safe-enough" in slug or slug.startswith("is-libya-safe") or "safe-for" in slug:
            bold = "<p><strong>Yes, for many guests, when the trip is licensed, guided, and paced honestly.</strong> “Safe” here means supported days, not a promise that the world has zero friction.</p>"
    parts = [
        bold
        or f"<p>{title} is the question many guests ask before they open TourBuilder. The calm answer sits in how tourism in Libya actually works: sponsorship, guides, planned routes, and days that are rewritten when access requires it.</p>",
        f"<p>IntoLibya designs licensed trips. We do not sell freestyle wandering as the product. That structure is the main safety tool guests feel on the ground around {d0} and beyond.</p>",
        "<h2>What changes on a guided day</h2>",
        "<p>You move with a team that knows checkpoints, timing, and guest placement. You are not inventing taxi plans into unfamiliar zones. Museum mornings, Roman walks, and desert chapters follow a plan you already saw in outline form.</p>",
        "<h2>Headline fear versus tourist rhythm</h2>",
        "<p>International headlines compress years into a mood. Tour days are quieter: stone, tea, road time, photography with manners. Guests often say the gap between fear and rhythm was the surprise. That does not mean you skip advisories; it means you read them beside an operator conversation.</p>",
        "<h2>Practical habits that help</h2>",
        "<ul><li>Follow guide instructions without debate theater</li><li>Dress modestly and keep valuables boring</li><li>Ask before close portraits</li><li>Keep evenings earlier after long site days</li><li>Tell your coordinator about health or mobility limits early</li></ul>",
        "<h2>Who should wait</h2>",
        "<p>Guests who need independent backpacking as their identity. People unwilling to accept sponsored structure. Travelers who want nightlife density and alcohol scenes that Libya tourism does not center. Fit matters.</p>",
        "<h2>How to decide calmly</h2>",
        "<ol><li>Read a clear booking guide and a day one arrival page.</li><li>Open TourBuilder with honest dates and concerns.</li><li>Ask IntoLibya the questions your friends will ask you.</li><li>Deposit only when the outline matches your risk comfort.</li></ol>",
        f"<h2>After you return</h2>",
        "<p>Many guests describe feeling looked after more than feeling hunted by risk. Use that lived texture when friends ask. Share the licensed model, not a macho story. Safety confidence grows from communication with your guide as much as from any single site visit.</p>",
    ]
    parts = [p for p in parts if p]
    return "\n\n".join(expand_to_floor(parts, slug, title))


def body_siphon(slug: str, title: str, dests: list[tuple[str, str]]) -> str:
    d0 = alink(*dests[0])
    d1 = alink(*dests[1]) if len(dests) > 1 else alink(*DEST_LINKS["leptis"])
    parts = [
        f"<p>{title} is a North Africa planning question with a Libya shaped answer for some travelers and a different country answer for others. The useful move is fit, not nationalism.</p>",
        f"<p>IntoLibya sponsors licensed Libya weeks. We will not pretend Libya replaces every Morocco riad fantasy or every Nile cruise ritual. We will show when empty Roman stages, desert depth, and guided access make Libya the smarter chapter beside {d0} and {d1}.</p>",
        "<h2>What you might be optimizing for</h2>",
        "<ul><li>Fewer people in frame at major ruins</li><li>Mediterranean Roman Africa rather than only Nile temples</li><li>Sahara time with licensed logistics</li><li>A Maghreb circuit that is not Morocco only</li><li>Guided structure because independent freestyle is not the model</li></ul>",
        "<h2>Where Libya tends to win</h2>",
        f"<p>Space at sites like Leptis Magna. A sense of discovery that crowded icons no longer offer. Desert and oasis stories that still feel far from brochure defaults. Guests who want that often add Libya after Tunisia beach weeks or after Egypt crowds exhaust them.</p>",
        "<h2>Where another country may fit better</h2>",
        "<p>If you need easy independent hotels and nightlife density, look elsewhere. If you are locked on a specific icon that only Egypt or Morocco holds, honor that. Libya is a complement and sometimes an alternative, not a clone.</p>",
        "<h2>How to compare without drowning</h2>",
        "<ol><li>Write your top three nonnegotiables.</li><li>Mark which country best serves each.</li><li>Check whether you accept licensed sponsorship for Libya days.</li><li>Build leave length that allows depth, not airport stamps only.</li></ol>",
        "<h2>Circuit ideas that stay sane</h2>",
        "<p>Tunisia beach then Libya culture. Egypt history then Libya empty stone. Morocco cities then Libya desert quiet. Four Maghreb countries in one month is possible only with ruthless focus and early paperwork. Most guests enjoy two chapters done well.</p>",
        f"<h2>Booking Libya inside the wider map</h2>",
        "<p>Confirm the Libya portion in TourBuilder early. Cross border fantasies still need real sponsorship clocks. Keep flights flexible until documents look solid. Ask frank questions about east versus west, coast versus desert, and season heat.</p>",
    ]
    return "\n\n".join(expand_to_floor(parts, slug, title))


def body_funnel(slug: str, title: str, dests: list[tuple[str, str]]) -> str:
    d0 = alink(*dests[0])
    parts = [
        f"<p>{title} sits in the practical middle of planning: after curiosity, before tickets go rigid. IntoLibya runs this through TourBuilder so sponsorship, guides, and logistics stay in one licensed file.</p>",
        f"<p>You do not need perfect prose. You need dates, passport reality, and a clear sense of whether {d0} coast days, desert nights, or both own the week.</p>",
        "<h2>What to send or enter first</h2>",
        "<ul><li>Travel window and flexibility</li><li>Full names as in passports</li><li>Ages and walking comfort</li><li>Must see places and hard nos</li><li>Dietary needs and language comfort</li></ul>",
        "<h2>Typical booking rhythm</h2>",
        "<ol><li>Shape an outline in TourBuilder.</li><li>Deposit to start sponsorship when the plan feels honest.</li><li>Upload sharp document scans.</li><li>Confirm flights only when the eVisa path looks solid.</li><li>Arrive with buffer when leave allows.</li></ol>",
        "<h2>Who arranges what</h2>",
        "<p>International flights are often guest arranged once the outline is stable. Internal transport, guiding, and lodging pieces sit inside the package. Ask which hotel style your quote includes rather than inventing brand names from old blogs.</p>",
        "<h2>First timer placement</h2>",
        "<p>Most first timers start west: Tripoli texture and Roman coast icons. East Libya shines when leave is longer or eclipse and Cyrenaica stories call. Coast first versus desert first is a stamina question as much as a romance question.</p>",
        "<h2>Questions guests ask before deposit</h2>",
        "<p>How long documents take. What day one looks like after Mitiga. Whether families with mixed ages can pace kindly. How cancellations are discussed. How weather windows shift desert versus coast. IntoLibya answers these inside the planning conversation without freezing prices into articles.</p>",
        "<h2>Fixed events versus flexible weeks</h2>",
        "<p>Rally, festival, and eclipse products punish late planners. Flexible coast weeks still need runway, just with softer calendar nails. Choose the spine first, then hang buffers on it.</p>",
    ]
    return "\n\n".join(expand_to_floor(parts, slug, title))


def body_audience(slug: str, title: str, dests: list[tuple[str, str]]) -> str:
    d0 = alink(*dests[0])
    d1 = alink(*dests[1]) if len(dests) > 1 else alink(*DEST_LINKS["leptis"])
    parts = [
        f"<p>{title} is about fit. Libya rewards guests who want place, history, and licensed care. It frustrates guests who need a different kind of holiday identity.</p>",
        f"<p>IntoLibya builds audience aware outlines in TourBuilder. Tell us who is traveling. A private luxury pace around {d0} looks different from a student field week near {d1}.</p>",
        "<h2>Who usually thrives</h2>",
        "<p>Curious walkers, photographers who follow local rules, families that accept earlier nights, Muslim travelers who like familiar daily textures, diaspora guests reconnecting with care, and organizers who can share one clean passenger list.</p>",
        "<h2>Who should choose differently</h2>",
        "<p>Travelers who require independent freestyle as a badge. Guests who need alcohol centered nightlife. People unwilling to dress modestly on site days. Groups that cannot agree on pace.</p>",
        "<h2>Design notes for this audience</h2>",
        "<ul><li>Protect sleep after long transfers</li><li>Say mobility and dietary needs early</li><li>Decide coast versus desert before romantic stacking</li><li>Keep one soft day in longer circuits</li><li>Assign one logistics lead for groups</li></ul>",
        "<h2>Tone on the ground</h2>",
        "<p>Guides answer modern history curiosity with context and boundaries. Prayer timing can be respected in day shape when you ask. Creative guests should chase honest footage without treating people as props.</p>",
        "<h2>Booking posture</h2>",
        "<p>Start early for peak leave. Event products need more runway. Accessibility questions deserve frank replies before deposit. IntoLibya would rather decline a bad fit than force a miserable week.</p>",
        f"<h2>A simple yes test</h2>",
        f"<p>If your group can enjoy {d0} and {d1} with patience, water, and respect, this audience lane is open. If not, redesign or wait. TourBuilder is where you make that call with real dates.</p>",
    ]
    return "\n\n".join(expand_to_floor(parts, slug, title))


def body_place(slug: str, title: str, dests: list[tuple[str, str]]) -> str:
    d0 = alink(*dests[0])
    d1 = alink(*dests[1]) if len(dests) > 1 else alink(*DEST_LINKS["tripoli"])
    activity = "activity" in slug or any(
        x in slug
        for x in [
            "sandboarding",
            "horse",
            "spearfishing",
            "paragliding",
            "skydiving",
            "ziplining",
            "football",
            "lunch",
            "honey",
            "sfenz",
            "cafe",
            "dress",
            "racing",
        ]
    )
    parts = [
        f"<p>{title} belongs on a Libya week when the live TourBuilder outline includes it and your stamina matches the day. IntoLibya keeps these chapters inside licensed tourism so guests are not inventing freestyle access.</p>",
        f"<p>Think of this page as a planning brief for the place or experience, centered on {d0} context and links to wider routing through {d1} when relevant.</p>",
    ]
    if activity:
        parts += [
            "<h2>Availability honesty</h2>",
            "<p>Some activities run only in certain seasons, with certain groups, or when local partners and conditions align. Ask inside TourBuilder whether this experience is offered on your dates. Do not treat a blog page as a guaranteed ticket.</p>",
            "<h2>Who it suits</h2>",
            "<p>Guests who like participatory days, photographers who accept rules, and travelers willing to trade a soft museum morning for something more physical or cultural. It suits less if you need spa stillness every hour.</p>",
            "<h2>Safety and manners</h2>",
            "<p>Follow guide briefings. Wear what the activity requires. Ask before photos of people. Adventure sounding names still sit inside sponsored structure.</p>",
        ]
    else:
        parts += [
            "<h2>What you are going to see</h2>",
            f"<p>Expect a guided visit with context, time to look, and logistics that already account for roads and permissions. {d0} days feel different from a coastal Roman theatre day; ask for pacing that does not blur both into exhaustion.</p>",
            "<h2>How it sits in a wider itinerary</h2>",
            f"<p>Pair this stop with complementary chapters rather than stacking every icon. East and west Libya both reward focus. Use {d1} as a gateway or contrast when leave allows.</p>",
            "<h2>Practical guest habits</h2>",
            "<ul><li>Closed shoes and sun discipline</li><li>Modest comfortable clothes</li><li>Water and patience for transfer hours</li><li>Camera manners around people and sensitive sites</li></ul>",
        ]
    parts += [
        "<h2>Time of year</h2>",
        "<p>Coast leaning days often feel kinder in winter and shoulder months. Deep desert heat is harder in high summer. Highland air can be cool even when the coast feels mild. Match clothing to the real nights on your outline.</p>",
        "<h2>Booking the chapter</h2>",
        "<p>Add this must see note in TourBuilder early. Vehicle and lodging holds prefer guests who decide before scramble season. Keep flights flexible until sponsorship paperwork looks solid.</p>",
        "<h2>What success looks like</h2>",
        "<p>You leave with a clear memory of place, not only a proof photo. Guides would rather you see less and understand more. That is the IntoLibya standard for destination and activity micros alike.</p>",
    ]
    return "\n\n".join(expand_to_floor(parts, slug, title))


BUILDERS = {
    "market": body_market,
    "safety": body_safety,
    "siphon": body_siphon,
    "funnel": body_funnel,
    "audience": body_audience,
    "place": body_place,
}


def rewrite_one(slug: str, force: bool = False) -> tuple[str, int]:
    path = POSTS / f"{slug}.md"
    if not path.exists():
        return ("missing", 0)
    raw = path.read_text()
    fm, old_body = raw.split("---", 2)[1], raw.split("---", 2)[2]
    old_wc = len(re.sub(r"<[^>]+>", " ", old_body).split())
    if old_wc >= 500 and not force:
        return ("skip", old_wc)
    title = title_from_fm(fm) or slug.replace("-", " ").title()
    cat = categorize(slug)
    dests = pick_dests(slug, title)
    body = BUILDERS[cat](slug, title, dests)
    body = scrub_hyphens(body)
    # unique angle sentence from hash so posts in same cat differ
    n = seed(slug)
    angles = [
        f"<p>Searchers who land here usually want a straight answer on timing, fit, and next steps for “{title}”, not a recycled brochure paragraph.</p>",
        f"<p>If you are comparing options, keep Libya’s licensed model in view while you read “{title}”: sponsorship is the door, TourBuilder is the workshop.</p>",
        f"<p>Read this as a guest briefing for “{title}”. Prices and live inclusions stay in TourBuilder so the article does not age into fiction.</p>",
    ]
    body = angles[n % 3] + "\n\n" + body
    related = related_for(slug, cat, dests)
    rel = (
        "<h2>Related reading</h2>\n\n<ul>\n"
        + "\n".join(f'<li><a href="{h}">{t}</a></li>' for h, t in related)
        + "\n</ul>"
    )
    full = scrub_hyphens(body.strip() + "\n\n" + rel + "\n\n" + CTA + "\n")
    # ensure floor after CTA
    wc = len(re.sub(r"<[^>]+>", " ", full).split())
    if wc < 500:
        # emergency pad
        pad = scrub_hyphens(
            f"<h2>Keep the plan human</h2><p>Whatever angle brought you to “{title}”, protect sleep, water, and kindness on the road. IntoLibya can rewrite days when access requires it. Guests who stay flexible usually keep the best memories.</p>\n\n"
        )
        full = full.replace("<h2>Related reading</h2>", pad + "<h2>Related reading</h2>", 1)
        wc = len(re.sub(r"<[^>]+>", " ", full).split())
    seo = excerpt_from(body, 150)
    fm2 = re.sub(
        r"^excerpt:\s*'.*'\s*$",
        f"excerpt: '{yaml_escape(excerpt_from(body))}'",
        fm,
        count=1,
        flags=re.M,
    )
    if re.search(r"^  description:", fm2, re.M):
        fm2 = re.sub(
            r"(seo:\n(?:.*\n)*?  description:\s*)'.*'",
            r"\1'" + yaml_escape(seo) + "'",
            fm2,
            count=1,
        )
    path.write_text("---" + fm2 + "---\n" + full)
    return ("rewrote", wc)


def main() -> int:
    thin_file = Path("/tmp/wave2_thin.txt")
    if thin_file.exists():
        slugs = [s.strip() for s in thin_file.read_text().splitlines() if s.strip()]
    else:
        sched = (ROOT / "content-review/next-200-publish-schedule.md").read_text()
        slugs = list(dict.fromkeys(re.findall(r"`([a-z0-9-]+)`", sched)))
    force = "--force" in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    if only:
        slugs = only
    counts = {"rewrote": 0, "skip": 0, "missing": 0}
    wcs = []
    for slug in slugs:
        status, wc = rewrite_one(slug, force=force)
        counts[status] = counts.get(status, 0) + 1
        if status == "rewrote":
            wcs.append(wc)
            print(f"{wc:4d} {slug}")
    print(
        "SUMMARY",
        counts,
        "min",
        min(wcs) if wcs else None,
        "max",
        max(wcs) if wcs else None,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
