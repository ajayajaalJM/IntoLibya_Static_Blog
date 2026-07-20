#!/usr/bin/env python3
"""
Improve Wave 2 cross-links:
1) Cluster-aware Related reading with higher uniqueness (siblings first, rotated hubs)
2) Inject 2–4 natural inline /en/ links into posts that have fewer than 2

Does not change publishedAt / heroes. Scrubs new prose hyphens. Validates hrefs.
"""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts/en"
DESTS = ROOT / "src/content/destinations/en"
CATALOG = ROOT / "content-review/next-200-seo-blog-posts.md"
SCHEDULE = ROOT / "content-review/next-200-publish-schedule.md"

HUB_VISIT = ("how-to-visit-libya-as-a-tourist-in-2026", "How to Visit Libya as a Tourist in 2026")
HUB_SAFE = ("is-it-safe-to-travel-to-libya-right-now", "Is It Safe to Travel to Libya Right Now")
HUB_BOOK = ("how-to-book-a-libya-tour-with-intolibya", "How to Book a Libya Tour with IntoLibya")
HUB_TB = ("how-tourbuilder-works-for-custom-libya-trips", "How TourBuilder Works for Custom Libya Trips")
HUB_TIME = ("best-time-to-visit-libya", "Best Time to Visit Libya")
HUB_TOUR = ("do-you-need-a-tour-to-visit-libya", "Do You Need a Tour to Visit Libya")

W1_PEERS: dict[str, list[tuple[str, str]]] = {
    "north": [
        ("tunisia-vs-libya-for-history-travelers", "Tunisia vs Libya for History Travelers"),
        ("egypt-vs-libya-for-ancient-ruins", "Egypt vs Libya for Ancient Ruins"),
        ("algeria-vs-libya-for-sahara-expeditions", "Algeria vs Libya for Sahara Expeditions"),
        ("why-visit-libya-instead-of-only-egypt-or-tunisia", "Why Visit Libya Instead of Only Egypt or Tunisia"),
        ("roman-ruins-tunisia-vs-libya", "Roman Ruins Tunisia vs Libya"),
        ("can-you-combine-tunis-and-tripoli-in-one-journey", "Can You Combine Tunis and Tripoli in One Journey"),
        ("north-africa-holiday-planner-where-libya-fits", "North Africa Holiday Planner Where Libya Fits"),
    ],
    "safety": [
        ("is-western-libya-safe-for-tourists", "Is Western Libya Safe for Tourists"),
        ("is-eastern-libya-open-for-tourists", "Is Eastern Libya Open for Tourists"),
        ("how-licensed-operators-keep-guests-safe-in-libya", "How Licensed Operators Keep Guests Safe in Libya"),
        ("common-safety-myths-about-traveling-to-libya", "Common Safety Myths About Traveling to Libya"),
        ("is-libya-safe-for-women-travelers", "Is Libya Safe for Women Travelers"),
        ("do-you-need-a-tour-to-visit-libya", "Do You Need a Tour to Visit Libya"),
    ],
    "event_eclipse": [
        ("total-solar-eclipse-2027-in-libya-guide", "Total Solar Eclipse 2027 in Libya Guide"),
        ("how-to-plan-a-libya-trip-around-fixed-event-dates", "How to Plan a Libya Trip Around Fixed Event Dates"),
    ],
    "event_rally": [
        ("rally-te-te-waddan-desert-rally-guide", "Rally Te Te Waddan Desert Rally Guide"),
        ("how-to-plan-a-libya-trip-around-fixed-event-dates", "How to Plan a Libya Trip Around Fixed Event Dates"),
    ],
    "event_shafra": [
        ("double-shafra-ghadames-trip-explained", "Double Shafra Ghadames Trip Explained"),
        ("double-shafra-sahara-trip-explained", "Double Shafra Sahara Trip Explained"),
    ],
    "event_ghat": [
        ("ghat-international-tourism-festival-guide", "Ghat International Tourism Festival Guide"),
        ("ghat-travel-guide-for-sahara-culture", "Ghat Travel Guide for Sahara Culture"),
    ],
    "winter": [
        ("visiting-libya-in-winter", "Visiting Libya in Winter"),
        ("best-time-to-visit-libya", "Best Time to Visit Libya"),
        ("libya-in-october-and-november", "Libya in October and November"),
    ],
    "book": [
        ("libya-tour-packages-explained", "Libya Tour Packages Explained"),
        ("private-libya-tour-vs-group-tour", "Private Libya Tour vs Group Tour"),
        ("what-happens-after-you-request-a-quote", "What Happens After You Request a Quote"),
        ("booking-a-libya-tour-from-abroad-timeline", "Booking a Libya Tour from Abroad Timeline"),
        ("libya-evisa-explained-step-by-step", "Libya eVisa Explained Step by Step"),
    ],
}

DEST_MAP = [
    (("shahat", "cyrene", "zeus"), [("shahat", "Shahat"), ("susa", "Susa")]),
    (("susa", "apollonia"), [("susa", "Susa"), ("shahat", "Shahat")]),
    (("benghazi", "eclipse", "totality"), [("benghazi", "Benghazi"), ("shahat", "Shahat")]),
    (("tobruk",), [("tobruk", "Tobruk"), ("benghazi", "Benghazi")]),
    (("akhdar", "bayda", "olive", "qasr-libya", "green-mountain"), [("jebel-akhdar", "Jebel Akhdar"), ("shahat", "Shahat")]),
    (("ptolemais", "tolmeita"), [("ptolemais", "Ptolemais"), ("shahat", "Shahat")]),
    (("ghat", "acacus"), [("ghat", "Ghat"), ("acacus-mountains", "Acacus Mountains")]),
    (("waddan", "rally"), [("waddan", "Waddan"), ("tripoli", "Tripoli")]),
    (("gaberoun", "ubari", "oasis", "fezzan", "germa", "mathendous", "sebha", "hattia"), [("gaberoun", "Gaberoun"), ("ghadames", "Ghadames")]),
    (("ghadames", "shafra", "nafusa", "nalut", "qaser", "tarmisa"), [("ghadames", "Ghadames"), ("jebel-nafusa", "Jebel Nafusa")]),
    (("sabratha",), [("sabratha", "Sabratha"), ("tripoli", "Tripoli")]),
    (("leptis", "villa-seline", "horse-racing"), [("leptis-magna", "Leptis Magna"), ("tripoli", "Tripoli")]),
    (("misrata",), [("misrata", "Misrata"), ("tripoli", "Tripoli")]),
    (("tripoli", "mitiga", "museum", "football", "sfenz"), [("tripoli", "Tripoli"), ("leptis-magna", "Leptis Magna")]),
    (("norway", "sweden", "denmark", "netherlands", "poland", "japan", "ireland", "belgium", "switzerland", "austria", "qatar", "saudi", "emirates"), [("tripoli", "Tripoli"), ("leptis-magna", "Leptis Magna")]),
]

# Plain-text phrases we can wrap if unlinked
WRAP_PHRASES = [
    ("Leptis Magna", "/en/destination/leptis-magna"),
    ("Sabratha", "/en/destination/sabratha"),
    ("Ghadames", "/en/destination/ghadames"),
    ("Benghazi", "/en/destination/benghazi"),
    ("Waddan", "/en/destination/waddan"),
    ("Shahat", "/en/destination/shahat"),
    ("Tripoli", "/en/destination/tripoli"),
    ("Ghat", "/en/destination/ghat"),
    ("Nalut", "/en/destination/nalut"),
    ("Misrata", "/en/destination/misrata"),
    ("Susa", "/en/destination/susa"),
    ("TourBuilder", "/tourbuilder/booking"),
]


def seed(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)


def title_from_slug(slug: str) -> str:
    path = POSTS / f"{slug}.md"
    if path.exists():
        m = re.search(r"^title:\s*['\"]?(.*?)['\"]?\s*$", path.read_text(), re.M)
        if m:
            return m.group(1).strip().strip("'\"")
    return slug.replace("-", " ").title()


def dest_exists(slug: str) -> bool:
    return (DESTS / f"{slug}.md").exists()


def post_exists(slug: str) -> bool:
    return (POSTS / f"{slug}.md").exists()


def load_catalog() -> list[dict]:
    rows = []
    for line in CATALOG.read_text().splitlines():
        if not re.match(r"\| \d+ \|", line):
            continue
        parts = [p.strip() for p in line.strip("|").split("|")]
        if len(parts) < 7:
            continue
        pid = int(parts[0])
        if pid < 201:
            continue
        slug = parts[2].strip("`")
        rows.append({"id": pid, "slug": slug, "cluster": parts[6], "title": parts[1]})
    return rows


def wave2_slugs() -> list[str]:
    return list(dict.fromkeys(re.findall(r"`([a-z0-9-]+)`", SCHEDULE.read_text())))


def cluster_key(cluster: str) -> str:
    c = cluster.lower()
    for letter in "ABCDEFGHI":
        if c.startswith(f"{letter.lower()}."):
            return letter
    return "X"


def hubs_pool(key: str, slug: str) -> list[tuple[str, str]]:
    if key == "C" or any(x in slug for x in ("safe", "danger", "fear", "advisory", "scam", "nervous")):
        return [HUB_SAFE, HUB_VISIT, HUB_TOUR, HUB_BOOK]
    if key == "B" or any(x in slug for x in ("book", "quote", "deposit", "tourbuilder", "passport", "document", "cancel", "insurance", "dietary", "fitness", "airport-pickup")):
        return [HUB_BOOK, HUB_TB, HUB_VISIT, HUB_TOUR]
    if key == "A":
        return [HUB_VISIT, HUB_BOOK, HUB_TIME, HUB_TOUR]
    if key == "E" or any(x in slug for x in ("winter", "january", "december", "chill", "cold", "nordic", "november")):
        return [HUB_TIME, HUB_VISIT, HUB_BOOK]
    if key in ("G",):
        return [HUB_VISIT, HUB_BOOK, HUB_TB]
    if key in ("H", "I"):
        return [HUB_VISIT, HUB_TB, HUB_TIME]
    return [HUB_VISIT, HUB_BOOK, HUB_TIME, HUB_TOUR]


def pick_rotated(items: list[tuple[str, str]], slug: str, n: int) -> list[tuple[str, str]]:
    if not items:
        return []
    start = seed(slug) % len(items)
    rotated = items[start:] + items[:start]
    out = []
    seen = set()
    for s, t in rotated:
        if s in seen or not post_exists(s):
            continue
        seen.add(s)
        out.append((s, t))
        if len(out) >= n:
            break
    return out


def w1_peers_for(slug: str, key: str) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    if key == "A" or any(x in slug for x in ("egypt", "tunisia", "morocco", "algeria", "maghreb", "north-africa", "luxor", "marrakech", "nile", "siwa")):
        out += W1_PEERS["north"]
    if key == "C" or any(x in slug for x in ("safe", "danger", "fear", "advisory", "scam", "nervous")):
        out += W1_PEERS["safety"]
    if "eclipse" in slug or "totality" in slug:
        out += W1_PEERS["event_eclipse"]
    if "rally" in slug or "waddan" in slug:
        out += W1_PEERS["event_rally"]
    if "shafra" in slug:
        out += W1_PEERS["event_shafra"]
    if "ghat" in slug and "festival" in slug:
        out += W1_PEERS["event_ghat"]
    if key == "E" or any(x in slug for x in ("winter", "january", "december", "november", "chill", "cold", "nordic")):
        out += W1_PEERS["winter"]
    if key == "B":
        out += W1_PEERS["book"]
    return [(s, t) for s, t in out if post_exists(s)]


def dests_for(slug: str) -> list[tuple[str, str]]:
    for keys, dests in DEST_MAP:
        if any(k in slug for k in keys):
            return [(d, name) for d, name in dests if dest_exists(d)]
    return [(d, n) for d, n in [("tripoli", "Tripoli"), ("leptis-magna", "Leptis Magna")] if dest_exists(d)]


def siblings(rows: list[dict], row: dict, n: int = 4) -> list[tuple[str, str]]:
    key = cluster_key(row["cluster"])
    same = [r for r in rows if cluster_key(r["cluster"]) == key and r["slug"] != row["slug"]]
    tokens = set(row["slug"].split("-")) - {
        "a", "the", "for", "and", "in", "on", "of", "to", "with", "how", "what", "who", "is", "libya", "libyan", "from"
    }

    def score(r: dict) -> tuple:
        overlap = len(tokens & set(r["slug"].split("-")))
        # rotate near-ties by slug hash so adjacent IDs don't clone
        jitter = seed(row["slug"] + r["slug"]) % 7
        return (-overlap, jitter, abs(r["id"] - row["id"]))

    same.sort(key=score)
    # offset window by seed so different posts pick different sibling bands
    if same:
        off = seed(row["slug"]) % max(1, len(same) // 3 + 1)
        same = same[off:] + same[:off]
    out = []
    for r in same:
        if post_exists(r["slug"]):
            out.append((r["slug"], title_from_slug(r["slug"])))
        if len(out) >= n:
            break
    return out


def build_related_items(rows: list[dict], row: dict) -> list[tuple[str, str]]:
    """Return up to 6 (href_path_without_domain_style, title) as (slug_or_dest_path, title)."""
    key = cluster_key(row["cluster"])
    slug = row["slug"]
    items: list[tuple[str, str]] = []  # href, title

    def add_post(s: str, title: str):
        if s == slug or not post_exists(s):
            return
        href = f"/en/{s}"
        if any(h == href for h, _ in items):
            return
        items.append((href, title))

    def add_dest(d: str, name: str):
        if not dest_exists(d):
            return
        href = f"/en/destination/{d}"
        if any(h == href for h, _ in items):
            return
        items.append((href, f"{name} destination guide"))

    # siblings first for uniqueness
    for s, t in siblings(rows, row, 3):
        add_post(s, t)
    # one rotated hub
    for s, t in pick_rotated(hubs_pool(key, slug), slug, 1):
        add_post(s, t)
    # rotated W1 peers
    for s, t in pick_rotated(w1_peers_for(slug, key), slug, 2):
        add_post(s, t)
    # destinations
    dests = dests_for(slug)
    dstart = seed(slug) % max(1, len(dests))
    dests = dests[dstart:] + dests[:dstart]
    for d, name in dests[:2]:
        add_dest(d, name)
    # fill if short
    if len(items) < 6:
        for s, t in pick_rotated(hubs_pool(key, slug), slug + "fill", 3):
            add_post(s, t)
            if len(items) >= 6:
                break
    return items[:6]


RELATED_RE = re.compile(r"<h2>Related reading</h2>\s*<ul>.*?</ul>", re.S | re.I)


def update_related(rows: list[dict]) -> int:
    updated = 0
    for row in rows:
        path = POSTS / f"{row['slug']}.md"
        if not path.exists():
            continue
        raw = path.read_text()
        items = build_related_items(rows, row)
        lis = "\n".join(f'<li><a href="{h}">{t}</a></li>' for h, t in items)
        block = f"<h2>Related reading</h2>\n\n<ul>\n{lis}\n</ul>"
        if RELATED_RE.search(raw):
            new = RELATED_RE.sub(block, raw, count=1)
        else:
            continue
        if new != raw:
            path.write_text(new)
            updated += 1
    return updated


def inline_count(body: str) -> int:
    pre = body.split("<h2>Related reading</h2>")[0] if "<h2>Related reading</h2>" in body else body
    return len(re.findall(r'href="(/en/[^"#]+|/tourbuilder/[^"#]+)"', pre))


def existing_hrefs(html: str) -> set[str]:
    return set(re.findall(r'href="([^"]+)"', html))


def wrap_plain_destinations(pre: str, needed: int) -> tuple[str, int]:
    """Wrap plain destination names once each, outside existing tags."""
    added = 0
    parts = re.split(r"(<[^>]+>)", pre)
    for i, part in enumerate(parts):
        if part.startswith("<") or added >= needed:
            continue
        for phrase, href in WRAP_PHRASES:
            if added >= needed:
                break
            if href.startswith("/en/destination/") and not dest_exists(href.split("/")[-1]):
                continue
            # already linked nearby in this chunk
            if href in part:
                continue
            # avoid wrapping inside existing anchors leftover text oddly
            if phrase not in part:
                continue
            # only replace first plain occurrence not already inside an <a>
            # since we're in a text node, safe
            parts[i] = part.replace(phrase, f'<a href="{href}">{phrase}</a>', 1)
            part = parts[i]
            added += 1
    return "".join(parts), added


def inject_bridge_sentence(pre: str, slug: str, peers: list[tuple[str, str]], dests: list[tuple[str, str]], needed: int) -> tuple[str, int]:
    """Append a short topic bridge paragraph with 1–2 links before related."""
    if needed <= 0:
        return pre, 0
    links = []
    for d, name in dests:
        if dest_exists(d):
            links.append((f"/en/destination/{d}", name))
        if len(links) >= needed:
            break
    for s, t in peers:
        if post_exists(s) and s != slug:
            links.append((f"/en/{s}", t))
        if len(links) >= max(needed, 2):
            break
    links = links[: max(2, min(3, needed + 1))]
    if not links:
        return pre, 0
    # build sentence without hyphens
    if len(links) == 1:
        h, t = links[0]
        sent = f'<p>For more planning context, see <a href="{h}">{t}</a>.</p>'
    elif len(links) == 2:
        sent = (
            f'<p>Pair this with <a href="{links[0][0]}">{links[0][1]}</a> '
            f'and <a href="{links[1][0]}">{links[1][1]}</a> when you sketch the week.</p>'
        )
    else:
        sent = (
            f'<p>Useful next reads include <a href="{links[0][0]}">{links[0][1]}</a>, '
            f'<a href="{links[1][0]}">{links[1][1]}</a>, and '
            f'<a href="{links[2][0]}">{links[2][1]}</a>.</p>'
        )
    # scrub hyphens in text nodes
    parts = re.split(r"(<[^>]+>)", sent)
    sent = "".join(p if p.startswith("<") else p.replace("-", " ") for p in parts)
    # insert before last closing content — append to pre
    if pre.rstrip().endswith("</p>") or pre.rstrip().endswith("</ul>") or pre.rstrip().endswith("</ol>"):
        new_pre = pre.rstrip() + "\n\n" + sent + "\n"
    else:
        new_pre = pre.rstrip() + "\n\n" + sent + "\n"
    return new_pre, len(links)


def improve_inline(rows_by_slug: dict[str, dict], rows: list[dict]) -> tuple[int, int]:
    improved = 0
    still_thin = 0
    for slug in wave2_slugs():
        path = POSTS / f"{slug}.md"
        if not path.exists():
            continue
        raw = path.read_text()
        if "---" not in raw:
            continue
        fm, body = raw.split("---", 2)[1], raw.split("---", 2)[2]
        if "<h2>Related reading</h2>" not in body:
            continue
        pre, post = body.split("<h2>Related reading</h2>", 1)
        n = inline_count(body)
        if n >= 2:
            continue
        needed = 2 - n
        row = rows_by_slug.get(slug)
        dests = dests_for(slug)
        peers = []
        if row:
            peers = siblings(rows, row, 4)
            peers += pick_rotated(w1_peers_for(slug, cluster_key(row["cluster"])), slug, 3)
        else:
            peers = pick_rotated([HUB_VISIT, HUB_BOOK, HUB_TIME], slug, 3)

        new_pre, added = wrap_plain_destinations(pre, needed)
        if added < needed:
            new_pre2, added2 = inject_bridge_sentence(
                new_pre, slug, peers, dests, needed - added
            )
            new_pre = new_pre2
            added += added2

        if new_pre != pre:
            new_body = new_pre + "<h2>Related reading</h2>" + post
            path.write_text("---" + fm + "---\n" + new_body.lstrip("\n"))
            improved += 1
        if inline_count((POSTS / f"{slug}.md").read_text().split("---", 2)[-1]) < 2:
            still_thin += 1
    return improved, still_thin


def validate(rows: list[dict]) -> dict:
    broken = []
    rel_sets = []
    inline_thin = []
    linked_to = set()
    for row in rows:
        path = POSTS / f"{row['slug']}.md"
        if not path.exists():
            continue
        body = path.read_text().split("---", 2)[-1]
        m = RELATED_RE.search(body)
        rel = re.findall(r'href="(/en/[^"#]+)"', m.group(0)) if m else []
        rel_sets.append(tuple(rel))
        for href in re.findall(r'href="(/en/[^"#]+)"', body):
            s = href.rstrip("/").split("/")[-1]
            if href.startswith("/en/destination/"):
                if not dest_exists(s):
                    broken.append((row["slug"], href))
            else:
                if not post_exists(s):
                    broken.append((row["slug"], href))
                else:
                    linked_to.add(s)
        if inline_count(body) < 2:
            inline_thin.append(row["slug"])
    w2 = {r["slug"] for r in rows}
    orphans = sorted(w2 - linked_to)
    return {
        "broken": broken,
        "unique_rel": len(set(rel_sets)),
        "total": len(rel_sets),
        "inline_thin": inline_thin,
        "orphans": orphans,
    }


def main() -> None:
    rows = load_catalog()
    rows_by_slug = {r["slug"]: r for r in rows}
    n_rel = update_related(rows)
    print(f"related blocks updated: {n_rel}")
    n_inline, still = improve_inline(rows_by_slug, rows)
    print(f"inline improved: {n_inline}; still <2 inline: {still}")
    # second pass on still thin
    if still:
        n2, still2 = improve_inline(rows_by_slug, rows)
        print(f"inline second pass: {n2}; still <2: {still2}")
    stats = validate(rows)
    print(
        f"unique related sets: {stats['unique_rel']}/{stats['total']} | "
        f"broken: {len(stats['broken'])} | "
        f"inline thin: {len(stats['inline_thin'])} | "
        f"w2 orphans (unlinked-to): {len(stats['orphans'])}"
    )
    if stats["broken"][:5]:
        print("broken sample:", stats["broken"][:5])
    if stats["inline_thin"][:8]:
        print("thin sample:", stats["inline_thin"][:8])


if __name__ == "__main__":
    main()
