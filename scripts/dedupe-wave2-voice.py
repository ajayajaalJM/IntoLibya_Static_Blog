#!/usr/bin/env python3
"""
Strip Wave 2 stock metaphors and shared boilerplate so each post sounds fresh.
Replaces packing-list openers and removes sections that were stamped on every article.
"""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts/en"
CATALOG = ROOT / "content-review/next-200-seo-blog-posts.md"

# Exact sections stamped on nearly every Wave 2 post
BOILERPLATE_H2 = [
    "The fun part",
    "Little joys that do not show up in packing lists",
    "How to shape the trip without overthinking",
    "What IntoLibya handles so you can look up",
    "Why guests say they will come back",
    "Before you close the tab",
]

STOCK_PARAS = [
    r"<p>The best Libya days feel like discovery with adult supervision:.*?</p>",
    r"<p>Open TourBuilder and put this idea on a calendar\..*?</p>",
    r"<p>The sudden quiet inside a theatre when your group stops talking\..*?</p>",
    r"<p>Those moments are why people rebuild North Africa plans around Libya.*?</p>",
    r"<p>Start with leave dates and a short must see list\..*?</p>",
    r"<p>Keep flight plans flexible until sponsorship paperwork looks solid\..*?</p>",
    r"<p>Sponsorship support, guiding, transport, practical lodging or camps,.*?</p>",
    r"<p>Because the sites still feel like discovery\..*?</p>",
    r"<p>When you are ready, open TourBuilder and make the outline real\..*?</p>",
    r"<p>If a friend asks why Libya, show them an empty theatre photo.*?</p>",
    r"<p>That is the whole pitch, told without slogans\.</p>",
    r"<p>Save the places that made you curious\..*?</p>",
    r"<p>We will meet you on the other side of that draft.*?</p>",
    r"<p>Libya rewards travelers who want serious heritage without mega resort crowds\..*?</p>",
    r"<p>Think coast Romans, oasis towns, and Sahara nights as chapters you can combine when leave allows\..*?</p>",
]

# Varied openers — never packing-list metaphor. {hook} = short topic hook from title.
OPENERS = [
    "Here is a straight answer on {hook}, written for guests who want licensed Libya travel without the marketing fog.",
    "If you are weighing {hook}, start here. We keep the tone practical and the next step inside TourBuilder.",
    "{hook} is one of those planning questions that gets clearer once you see how licensed tours actually run.",
    "Guests ask us about {hook} more than they expect to. This page is the clean version of what we tell them.",
    "Skip the rumour mill on {hook}. Below is how IntoLibya frames it for real itineraries.",
    "Planning around {hook} should feel usable, not dramatic. Read this, then shape dates in TourBuilder.",
    "A good Libya week hangs on clear choices. {hook} is one of them, so we wrote it out plainly.",
    "Think of this as field notes on {hook}: what matters, what does not, and how to build the trip.",
    "You do not need another vague brochure paragraph about {hook}. You need a workable angle for your leave.",
    "IntoLibya guests often arrive at {hook} after comparing North Africa options. Here is our take.",
    "This guide keeps {hook} grounded in sponsorship, guiding, and TourBuilder planning, not internet folklore.",
    "If {hook} is on your mind, you are already past the curiosity stage. Let us make the logistics honest.",
    "We wrote {hook} the way we brief guests before they lock flights: calm, specific, and next step ready.",
    "Some topics need poetry. {hook} needs clarity. This page aims for the second.",
    "Whether you are a first timer or a return visitor, {hook} changes how the week should be drawn.",
    "Open this if you want a human answer on {hook} before you open TourBuilder and start clicking days.",
    "The short path on {hook} is below. The longer path is customizing a licensed route that matches it.",
    "People overcomplicate {hook}. Licensed travel makes most of it ordinary once the outline is solid.",
    "Use this page as a briefing note on {hook}, then move the useful bits into your TourBuilder draft.",
    "Curiosity about {hook} is welcome. Invented rules are not. Here is the version we stand behind.",
    "From the IntoLibya desk: how we talk about {hook} when a guest is ready to book, not just browse.",
    "If friends keep asking you about {hook}, send them this page and keep planning the fun parts.",
    "A Libya itinerary gets better when {hook} is decided early. Here is how we help guests decide.",
    "This is not a packing list speech. It is a working brief on {hook} for licensed tourist travel.",
    "We meet a lot of guests who almost skipped Libya because of confusion around {hook}. Read on.",
    "Treat {hook} as a design choice for your trip, then let TourBuilder hold the calendar together.",
    "Honest pacing beats hype. That is the spirit of this note on {hook}.",
    "You came for {hook}. We will keep the answer guest friendly and the call to action on TourBuilder only.",
    "North Africa plans change once {hook} clicks into place. Here is the IntoLibya framing.",
    "Below: what {hook} looks like inside a sponsored tour week, without the recycled metaphors.",
]

CLOSERS = [
    "<p>When the outline feels right, open TourBuilder and lock the dates that match your leave.</p>",
    "<p>Ready to move from reading to a real route? Build the week in TourBuilder and we will keep it licensed.</p>",
    "<p>Put the must sees into TourBuilder next. That is where this page turns into a trip you can travel.</p>",
    "<p>If this answered the question that brought you here, customize the days in TourBuilder while the idea is fresh.</p>",
    "<p>Browse a package shape or go fully custom in TourBuilder. Either way, keep sponsorship and guiding in the plan.</p>",
    "<p>Save this angle, then draft the calendar in TourBuilder so the logistics can catch up with the curiosity.</p>",
]


def load_w2() -> list[dict]:
    rows = []
    for line in CATALOG.read_text().splitlines():
        if not re.match(r"\| \d+ \|", line):
            continue
        parts = [p.strip() for p in line.strip("|").split("|")]
        if int(parts[0]) < 201:
            continue
        rows.append(
            {
                "id": int(parts[0]),
                "title": parts[1],
                "slug": parts[2].strip("`"),
                "primary": parts[3].strip("`"),
            }
        )
    return rows


def pick(slug: str, options: list[str]) -> str:
    h = int(hashlib.md5(slug.encode()).hexdigest(), 16)
    return options[h % len(options)]


def topic_hook(title: str, primary: str) -> str:
    t = title.strip()
    # soften title case for mid sentence use
    if t.lower().startswith(("how to ", "can ", "is ", "are ", "do ", "what ", "why ", "when ", "where ")):
        hook = t[0].lower() + t[1:] if t else primary
    else:
        hook = t
    # avoid hyphen chars
    hook = hook.replace("-", " ")
    if len(hook) > 90:
        hook = primary.replace("-", " ")
    return hook


def unique_opener(slug: str, title: str, primary: str, existing_first: str) -> str:
    # Keep bold short answers for question posts
    m = re.match(r"(<p><strong>.*?</strong>.*?</p>)", existing_first, re.S)
    if m and re.search(r"<strong>\s*(Yes|No|Nope|Not really|It definitely)", m.group(1), re.I):
        # Keep the answer line; replace any packing-list follow-up with a fresh second line
        answer = m.group(1)
        follow = pick(
            slug + "-follow",
            [
                "<p>Here is how that plays out on a licensed IntoLibya itinerary, and how to shape it in TourBuilder.</p>",
                "<p>The rest of this page is the practical version: what to expect, and how to build the days.</p>",
                "<p>Read on for the planning detail, then customize the route in TourBuilder.</p>",
                "<p>We expand the short answer below so you can plan without second guessing.</p>",
            ],
        )
        return answer + "\n" + follow

    hook = topic_hook(title, primary)
    template = pick(slug, OPENERS)
    text = template.format(hook=hook)
    # no hyphen in prose
    text = text.replace("-", " ")
    return f"<p>{text}</p>"


def strip_boilerplate(body: str) -> str:
    # Split off related + CTA
    related_m = re.search(r"<h2>Related reading</h2>.*", body, re.S | re.I)
    related = related_m.group(0).strip() if related_m else ""
    core = body[: related_m.start()] if related_m else body

    # Remove boilerplate h2 sections (from that h2 until next h2 or end)
    for heading in BOILERPLATE_H2:
        core = re.sub(
            rf"<h2>{re.escape(heading)}</h2>.*?(?=<h2>|\Z)",
            "",
            core,
            flags=re.S | re.I,
        )

    for pat in STOCK_PARAS:
        core = re.sub(pat, "", core, flags=re.S | re.I)

    # Remove packing-list / honest-version first paragraphs later via opener replace
    core = re.sub(r"\n{3,}", "\n\n", core).strip()
    return core, related


def replace_opener(core: str, new_opener: str) -> str:
    # Replace first <p>...</p>
    if re.match(r"\s*<p>", core):
        return re.sub(r"^\s*<p>.*?</p>", new_opener, core, count=1, flags=re.S)
    return new_opener + "\n" + core


def ensure_word_count(core: str, slug: str) -> str:
    plain = re.sub(r"<[^>]+>", " ", core)
    words = len(plain.split())
    if words >= 520:
        return core
    closer = pick(slug + "-close", CLOSERS)
    # mild unique color by theme tokens
    extras = []
    if any(k in slug for k in ("safe", "danger", "fear", "advisory")):
        extras.append(
            "<p>Read advisories, then compare them with a concrete TourBuilder outline. Structure is what turns worry into ordinary tour days for many guests.</p>"
        )
    elif any(k in slug for k in ("sahara", "desert", "oasis", "ghat", "acacus", "camping")):
        extras.append(
            "<p>Desert chapters need season honesty and enough nights to breathe. Rushing the south is how beautiful places turn into a transfer montage.</p>"
        )
    elif any(k in slug for k in ("cyrene", "shahat", "east", "benghazi", "eclipse")):
        extras.append(
            "<p>East Libya rewards guests who leave room for Greek stone and highland air, not only a single highlight stop.</p>"
        )
    elif any(k in slug for k in ("winter", "january", "december", "november", "chill", "cold")):
        extras.append(
            "<p>Mild coast days still pair with cool desert nights. Pack a layer and keep the first day light after travel.</p>"
        )
    elif any(k in slug for k in ("family", "kid", "children")):
        extras.append(
            "<p>Match walking blocks to the youngest traveler in the group. A shorter honest week beats a heroic map no one enjoys.</p>"
        )
    else:
        extras.append(
            "<p>Keep flights flexible until sponsorship paperwork looks solid, then lean into the places that made you curious in the first place.</p>"
        )
    return core.rstrip() + "\n\n" + "\n".join(extras) + "\n" + closer


def update_excerpt(fm: str, body_core: str) -> str:
    plain = re.sub(r"<[^>]+>", " ", body_core)
    plain = re.sub(r"\s+", " ", plain).strip()
    # skip related noise if any
    plain = plain.split("Related reading")[0].strip()
    excerpt = plain[:160]
    if len(plain) > 160:
        excerpt = excerpt.rsplit(" ", 1)[0]
    excerpt = excerpt.replace("-", " ")
    excerpt_y = excerpt.replace("'", "''")
    if re.search(r"^excerpt:\s*", fm, re.M):
        return re.sub(r"^excerpt:\s*'.*'\s*$", f"excerpt: '{excerpt_y}'", fm, count=1, flags=re.M)
    return fm


def process(row: dict) -> bool:
    path = POSTS / f"{row['slug']}.md"
    if not path.exists():
        return False
    raw = path.read_text()
    if raw.count("---") < 2:
        return False
    fm, body = raw.split("---", 2)[1], raw.split("---", 2)[2]

    core, related = strip_boilerplate(body)
    # capture old first para
    first_m = re.search(r"<p>.*?</p>", core, re.S)
    first = first_m.group(0) if first_m else ""
    opener = unique_opener(row["slug"], row["title"], row["primary"], first)
    core = replace_opener(core, opener)
    # strip leftover packing list / honest version if still present mid body
    core = re.sub(
        r"<p>[^<]*sounds like a packing list until you stand there[^<]*</p>",
        "",
        core,
        flags=re.I,
    )
    core = re.sub(
        r"<p>[^<]*Here is the honest version from the IntoLibya team\.?</p>",
        "",
        core,
        flags=re.I,
    )
    core = re.sub(
        r"<p>Here is what you will feel on the ground, what to expect day to day, and how to shape the trip in TourBuilder\.</p>",
        "",
        core,
        flags=re.I,
    )
    core = ensure_word_count(core, row["slug"])
    core = re.sub(r"\n{3,}", "\n\n", core).strip()

    # hyphen scrub in prose only
    parts = re.split(r"(<[^>]+>)", core)
    core = "".join(p if p.startswith("<") else p.replace("-", " ") for p in parts)

    new_body = core + "\n\n" + related.strip() + "\n"
    fm = update_excerpt(fm, core)
    path.write_text("---" + fm + "---\n" + new_body)
    return True


def main() -> None:
    rows = load_w2()
    n = 0
    for row in rows:
        if process(row):
            n += 1
    print(f"refreshed voice on {n} Wave 2 posts")

    # QA counts
    phrases = [
        "sounds like a packing list",
        "discovery with adult supervision",
        "plastic pyramid",
        "Mint tea after dusty shoes",
        "Why guests say they will come back",
        "Little joys that do not show up",
        "Beauty plus a workable plan",
        "That is the whole pitch",
        "Here is the honest version from the IntoLibya team",
    ]
    for p in phrases:
        c = 0
        for row in rows:
            t = (POSTS / f"{row['slug']}.md").read_text()
            if p.lower() in t.lower():
                c += 1
        print(f"  remaining '{p}': {c}")


if __name__ == "__main__":
    main()
