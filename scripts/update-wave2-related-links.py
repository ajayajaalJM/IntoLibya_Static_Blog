#!/usr/bin/env python3
"""
Refresh Wave 2 Related reading blocks with cluster-aware cross-links.

Keeps 1–2 evergreen hubs, adds same-cluster siblings, Wave 1 peers when relevant,
and matching destination pages. Validates every href against the EN content tree.
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts/en"
DESTS = ROOT / "src/content/destinations/en"
CATALOG = ROOT / "content-review/next-200-seo-blog-posts.md"

# Evergreen hubs (prefer fewer per post)
HUB_VISIT = ("how-to-visit-libya-as-a-tourist-in-2026", "How to Visit Libya as a Tourist in 2026")
HUB_SAFE = ("is-it-safe-to-travel-to-libya-right-now", "Is It Safe to Travel to Libya Right Now")
HUB_BOOK = ("how-to-book-a-libya-tour-with-intolibya", "How to Book a Libya Tour with IntoLibya")
HUB_TB = ("how-tourbuilder-works-for-custom-libya-trips", "How TourBuilder Works for Custom Libya Trips")

# Wave 1 peers by topic keyword
W1_PEERS: dict[str, list[tuple[str, str]]] = {
    "north": [
        ("tunisia-vs-libya-for-history-travelers", "Tunisia vs Libya for History Travelers"),
        ("egypt-vs-libya-for-ancient-ruins", "Egypt vs Libya for Ancient Ruins"),
        ("algeria-vs-libya-for-sahara-expeditions", "Algeria vs Libya for Sahara Expeditions"),
        ("why-visit-libya-instead-of-only-egypt-or-tunisia", "Why Visit Libya Instead of Only Egypt or Tunisia"),
        ("roman-ruins-tunisia-vs-libya", "Roman Ruins Tunisia vs Libya"),
    ],
    "safety": [
        ("is-western-libya-safe-for-tourists", "Is Western Libya Safe for Tourists"),
        ("is-eastern-libya-open-for-tourists", "Is Eastern Libya Open for Tourists"),
        ("how-licensed-operators-keep-guests-safe-in-libya", "How Licensed Operators Keep Guests Safe in Libya"),
        ("what-tourist-police-escorts-mean-on-a-libya-tour", "What Tourist Police Escorts Mean on a Libya Tour"),
        ("is-libya-safe-for-women-travelers", "Is Libya Safe for Women Travelers"),
        ("do-you-need-a-tour-to-visit-libya", "Do You Need a Tour to Visit Libya"),
    ],
    "event_eclipse": [
        ("total-solar-eclipse-2027-in-libya-guide", "Total Solar Eclipse 2027 in Libya Guide"),
    ],
    "event_rally": [
        ("rally-te-te-waddan-desert-rally-guide", "Rally Te Te Waddan Desert Rally Guide"),
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
    (("waddan", "rally"), [("waddan", "Waddan"), ("ghadames", "Ghadames")]),
    (("gaberoun", "ubari", "oasis", "fezzan", "germa", "mathendous", "namus", "sebha"), [("gaberoun", "Gaberoun"), ("germa", "Germa")]),
    (("ghadames", "shafra", "nafusa", "nalut", "qaser"), [("ghadames", "Ghadames"), ("jebel-nafusa", "Jebel Nafusa")]),
    (("sabratha",), [("sabratha", "Sabratha"), ("tripoli", "Tripoli")]),
    (("leptis", "villa-seline", "horse-racing"), [("leptis-magna", "Leptis Magna"), ("tripoli", "Tripoli")]),
    (("misrata",), [("misrata", "Misrata"), ("tripoli", "Tripoli")]),
    (("tripoli", "mitiga", "museum", "fish-market", "football", "sfenz"), [("tripoli", "Tripoli"), ("leptis-magna", "Leptis Magna")]),
]


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
        cluster = parts[6]
        rows.append({"id": pid, "slug": slug, "cluster": cluster, "title": parts[1]})
    return rows


def cluster_key(cluster: str) -> str:
    c = cluster.lower()
    if c.startswith("a."):
        return "A"
    if c.startswith("b."):
        return "B"
    if c.startswith("c."):
        return "C"
    if c.startswith("d."):
        return "D"
    if c.startswith("e."):
        return "E"
    if c.startswith("f."):
        return "F"
    if c.startswith("g."):
        return "G"
    if c.startswith("h."):
        return "H"
    if c.startswith("i."):
        return "I"
    return "X"


def hubs_for(key: str, slug: str) -> list[tuple[str, str]]:
    if key == "C" or "safe" in slug or "danger" in slug or "fear" in slug or "advisory" in slug:
        return [HUB_SAFE, HUB_VISIT]
    if key == "B" or "book" in slug or "quote" in slug or "deposit" in slug or "tourbuilder" in slug:
        return [HUB_BOOK, HUB_TB]
    if key == "A":
        return [HUB_VISIT, HUB_BOOK]
    if key == "D":
        return [HUB_BOOK, HUB_VISIT]
    if key == "E":
        return [HUB_VISIT, ("best-time-to-visit-libya", "Best Time to Visit Libya")]
    if key == "G":
        return [HUB_VISIT, HUB_BOOK]
    if key in ("H", "I"):
        return [HUB_VISIT, HUB_TB]
    return [HUB_VISIT, HUB_BOOK]


def w1_peers_for(slug: str, key: str) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    if key == "A" or any(x in slug for x in ("egypt", "tunisia", "morocco", "algeria", "maghreb", "north-africa", "luxor", "marrakech", "nile", "siwa")):
        out += W1_PEERS["north"]
    if key == "C" or any(x in slug for x in ("safe", "danger", "fear", "advisory", "myth", "checkpoint")):
        out += W1_PEERS["safety"]
    if "eclipse" in slug or "totality" in slug:
        out += W1_PEERS["event_eclipse"]
    if "rally" in slug or "waddan" in slug:
        out += W1_PEERS["event_rally"]
    if "shafra" in slug:
        out += W1_PEERS["event_shafra"]
    if "ghat-festival" in slug or "ghat-international" in slug or ("ghat" in slug and "festival" in slug):
        out += W1_PEERS["event_ghat"]
    if key == "E" or any(x in slug for x in ("winter", "january", "december", "november", "chill", "cold", "nordic")):
        out += W1_PEERS["winter"]
    if key == "B":
        out += W1_PEERS["book"]
    # dedupe preserve order
    seen = set()
    uniq = []
    for s, t in out:
        if s not in seen and post_exists(s):
            seen.add(s)
            uniq.append((s, t))
    return uniq


def dests_for(slug: str) -> list[tuple[str, str]]:
    for keys, dests in DEST_MAP:
        if any(k in slug for k in keys):
            return [(d, name) for d, name in dests if dest_exists(d)]
    # defaults
    defaults = [("tripoli", "Tripoli"), ("leptis-magna", "Leptis Magna")]
    return [(d, n) for d, n in defaults if dest_exists(d)]


def siblings(rows: list[dict], row: dict, n: int = 3) -> list[tuple[str, str]]:
    key = cluster_key(row["cluster"])
    same = [r for r in rows if cluster_key(r["cluster"]) == key and r["slug"] != row["slug"]]
    tokens = set(row["slug"].split("-")) - {
        "a", "the", "for", "and", "in", "on", "of", "to", "with", "how", "what", "who", "is", "libya", "libyan"
    }

    def score(r: dict) -> tuple:
        overlap = len(tokens & set(r["slug"].split("-")))
        return (-overlap, abs(r["id"] - row["id"]))

    same.sort(key=score)
    out = []
    for r in same:
        if post_exists(r["slug"]):
            out.append((r["slug"], title_from_slug(r["slug"])))
        if len(out) >= n:
            break
    return out


def build_related(rows: list[dict], row: dict) -> str:
    key = cluster_key(row["cluster"])
    slug = row["slug"]
    items: list[tuple[str, str, str]] = []  # href kind

    def add_post(s: str, title: str):
        if s == slug or not post_exists(s):
            return
        href = f"/en/{s}"
        if any(h == href for h, _, _ in items):
            return
        items.append((href, title, "post"))

    def add_dest(d: str, name: str):
        if not dest_exists(d):
            return
        href = f"/en/destination/{d}"
        if any(h == href for h, _, _ in items):
            return
        items.append((href, name, "dest"))

    for s, t in hubs_for(key, slug)[:2]:
        add_post(s, t)
    for s, t in siblings(rows, row, 3):
        add_post(s, t)
    for s, t in w1_peers_for(slug, key)[:2]:
        add_post(s, t)
    for d, name in dests_for(slug)[:2]:
        add_dest(d, name)

    # Cap at 6
    items = items[:6]
    lis = "\n".join(f'<li><a href="{h}">{t}</a></li>' for h, t, _ in items)
    return f"<h2>Related reading</h2>\n\n<ul>\n{lis}\n</ul>"


RELATED_RE = re.compile(
    r"<h2>Related reading</h2>\s*<ul>.*?</ul>",
    re.S | re.I,
)


def main() -> None:
    rows = load_catalog()
    updated = 0
    missing = []
    for row in rows:
        path = POSTS / f"{row['slug']}.md"
        if not path.exists():
            missing.append(row["slug"])
            continue
        raw = path.read_text()
        block = build_related(rows, row)
        if RELATED_RE.search(raw):
            new = RELATED_RE.sub(block, raw, count=1)
        else:
            # insert before CTA hr if possible
            if re.search(r"<hr\s*/?>", raw):
                new = re.sub(r"(<hr\s*/?>)", block + "\n\n\\1", raw, count=1)
            else:
                new = raw.rstrip() + "\n\n" + block + "\n"
        if new != raw:
            path.write_text(new)
            updated += 1

    print(f"updated {updated}/{len(rows)} Wave 2 posts")
    if missing:
        print("missing files:", missing[:10])

    # validate links
    broken = []
    for row in rows:
        path = POSTS / f"{row['slug']}.md"
        if not path.exists():
            continue
        for href in re.findall(r'href="(/en/[^"]+)"', RELATED_RE.search(path.read_text()).group(0) if RELATED_RE.search(path.read_text()) else ""):
            if href.startswith("/en/destination/"):
                d = href.split("/")[-1]
                if not dest_exists(d):
                    broken.append((row["slug"], href))
            else:
                s = href.split("/")[-1]
                if not post_exists(s):
                    broken.append((row["slug"], href))
    print(f"broken related links: {len(broken)}")
    for b in broken[:15]:
        print(" ", b)


if __name__ == "__main__":
    main()
