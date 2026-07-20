#!/usr/bin/env python3
"""
Improve any batch index (A/B/C) for SEO, cross-links, IntoLibya brand.
Usage: python3 scripts/improve_batch_seo.py content-review/batch-b-posts.md
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts/en"

DEST = {
    "Tripoli": "/en/destination/tripoli",
    "Leptis Magna": "/en/destination/leptis-magna",
    "Sabratha": "/en/destination/sabratha",
    "Ghadames": "/en/destination/ghadames",
    "Acacus Mountains": "/en/destination/acacus-mountains",
    "Ghat": "/en/destination/ghat",
    "Gaberoun": "/en/destination/gaberoun",
    "Germa": "/en/destination/germa",
    "Jebel Nafusa": "/en/destination/jebel-nafusa",
    "Benghazi": "/en/destination/benghazi",
    "Shahat": "/en/destination/shahat",
    "Tobruk": "/en/destination/tobruk",
    "Misrata": "/en/destination/misrata",
    "Jebel Akhdar": "/en/destination/jebel-akhdar",
    "Waw an Namus": "/en/destination/waw-an-namus",
}

TITLE_BY_SLUG: dict[str, str] = {}
PRIMARY_BY_SLUG: dict[str, str] = {}
RELATED: dict[str, list[str]] = {}


def assert_no_hyphen(text: str, label: str) -> None:
    prose = re.sub(r'(href|src|class)="[^"]*"', "", text)
    prose = re.sub(r"<!--.*?-->", "", prose, flags=re.S)
    if "-" in prose:
        i = prose.index("-")
        raise ValueError(f"Hyphen in {label}: ...{prose[max(0, i - 40) : i + 40]}...")


def load_index(index_path: Path) -> list[str]:
    text = index_path.read_text()
    slugs = re.findall(r"`src/content/posts/en/([^`]+)\.md`", text)
    for block in re.split(r"### ", text)[1:]:
        lines = block.splitlines()
        title = re.sub(r"^\d+\.\s*", "", lines[0]).strip()
        slug = primary = None
        for line in lines:
            if "**Slug:**" in line:
                slug = re.search(r"`([^`]+)`", line).group(1)
            if "**Primary:**" in line:
                primary = line.split("**Primary:**", 1)[1].strip()
        if slug:
            TITLE_BY_SLUG[slug] = title
            if primary:
                PRIMARY_BY_SLUG[slug] = primary
    # Build related: nearby in index list (previous/next) + shared keyword tokens
    for i, slug in enumerate(slugs):
        nearby = []
        for j in range(max(0, i - 3), min(len(slugs), i + 4)):
            if j != i:
                nearby.append(slugs[j])
        RELATED[slug] = nearby[:5]
    return slugs


def linkify_destinations(html: str) -> str:
    parts = re.split(r"(<a\b[^>]*>.*?</a>)", html, flags=re.I | re.S)
    out = []
    for i, part in enumerate(parts):
        if i % 2 == 1:
            out.append(part)
            continue
        chunk = part
        for name, href in sorted(DEST.items(), key=lambda x: -len(x[0])):
            if href in chunk:
                continue
            pattern = re.compile(rf"(?<![>/])\b({re.escape(name)})\b(?![^<]*>)")
            m = pattern.search(chunk)
            if not m:
                continue
            before = chunk[: m.start()]
            if before.rfind("<") > before.rfind(">"):
                continue
            chunk = chunk[: m.start()] + f'<a href="{href}">{name}</a>' + chunk[m.end() :]
        out.append(chunk)
    return "".join(out)


def ensure_keyword_opening(body: str, primary: str) -> str:
    if not primary:
        return body
    plain = re.sub(r"<[^>]+>", " ", body)
    first = " ".join(plain.split()[:90]).lower()
    if primary.lower() in first:
        return body
    lead = (
        f"<p><strong>{primary[0].upper() + primary[1:]}</strong> is a core planning question for "
        f"IntoLibya guests. This guide answers it with clear steps, tradeoffs, and booking next actions.</p>\n\n"
    )
    assert_no_hyphen(lead, "lead")
    if body.lstrip().startswith("<!--"):
        return re.sub(r"(<!--.*?-->\s*)", r"\1" + lead, body, count=1, flags=re.S)
    return lead + body


def brand_mid_article(body: str) -> str:
    main = re.split(r"<hr\s*/?>", body, maxsplit=1)[0]
    if "IntoLibya" in main and ("TourBuilder" in main or main.count("IntoLibya") >= 2):
        return body
    insert = (
        "<h2>How IntoLibya helps</h2>\n\n"
        "<p>IntoLibya is a licensed Libyan tour operator. We sponsor tourist visits, build itineraries "
        "in TourBuilder, arrange guides and required tourist police coordination, and keep logistics "
        "honest when access shifts. You focus on the places. We handle the system that makes those "
        "places reachable.</p>\n\n"
    )
    assert_no_hyphen(insert, "brand")
    if re.search(r"<hr\s*/?>", body):
        return re.sub(r"<hr\s*/?>", insert + "<hr />", body, count=1)
    return body + "\n\n" + insert


def related_reading_block(slug: str) -> str:
    items = []
    for r in RELATED.get(slug, []):
        if r == slug or not (POSTS / f"{r}.md").exists():
            continue
        title = TITLE_BY_SLUG.get(r, r.replace("-", " ").title()).replace("-", " ")
        items.append(f'<li><a href="/en/{r}">{title}</a></li>')
        if len(items) >= 4:
            break
    dest_bits = [
        f'<li><a href="{DEST["Tripoli"]}">Tripoli destination guide</a></li>',
        f'<li><a href="{DEST["Leptis Magna"]}">Leptis Magna destination guide</a></li>',
    ]
    if not items and not dest_bits:
        return ""
    block = "<h2>Related reading</h2>\n\n<ul>\n" + "\n".join(items)
    if dest_bits:
        block += "\n" + "\n".join(dest_bits)
    block += "\n</ul>\n\n"
    assert_no_hyphen(block, f"related {slug}")
    return block


def improve_cta(body: str) -> str:
    cta = """<hr />

<h2>Plan your Libya trip with IntoLibya</h2>

<p>IntoLibya handles licensed sponsorship, TourBuilder itineraries, guides, and on ground logistics. Tell us your dates and must see list. We will reply with a route that matches how tourism in Libya actually works.</p>

<p><a href="/tourbuilder/booking">Build Your Trip</a> · <a href="/tourbuilder/tour-packages">Browse tour packages</a> · <a href="/tourbuilder/search">Browse activities</a></p>
"""
    assert_no_hyphen(cta, "cta")
    # Strip only a trailing Plan CTA block; never truncate main article at an early <hr />
    body = re.sub(
        r"(?:<hr\s*/?>\s*)?<h2>Plan your Libya trip with IntoLibya</h2>.*\Z",
        "",
        body,
        flags=re.S | re.I,
    )
    return body.rstrip() + "\n\n" + cta


def seo_description(primary: str, title: str, existing: str) -> str:
    base = existing.strip().strip("'\"").replace("—", ":").replace("–", ":").replace("-", " ")
    if primary and primary.lower() not in base.lower():
        base = f"{primary}: {base}"
    if len(base) > 155:
        base = base[:152].rsplit(" ", 1)[0] + "."
    if len(base) < 110:
        base = f"{base.rstrip('.')} Practical guidance from IntoLibya for licensed Libya tours."
        if len(base) > 155:
            base = base[:152].rsplit(" ", 1)[0] + "."
    assert_no_hyphen(base, "seo")
    return base


def excerpt_from_body(body: str, primary: str) -> str:
    plain = re.sub(r"<[^>]+>", " ", body)
    plain = re.sub(r"\s+", " ", plain).strip()
    plain = plain.split("Related reading")[0].split("Plan your Libya trip")[0]
    text = plain[:157]
    if len(plain) > 157:
        text = text.rsplit(" ", 1)[0]
    if primary and primary.lower() not in text.lower():
        text = f"{primary}. {text}"
        text = text[:157].rsplit(" ", 1)[0]
    text = text.replace("-", " ")
    assert_no_hyphen(text, "excerpt")
    return text


def update_frontmatter(fm: str, excerpt: str, seo_desc: str, title: str) -> str:
    lines = fm.split("\n")
    out = []
    in_seo = False
    for line in lines:
        if line.startswith("excerpt:"):
            out.append(f"excerpt: '{excerpt.replace(chr(39), chr(39)+chr(39))}'")
            continue
        if line.strip() == "seo:":
            out.append(line)
            in_seo = True
            continue
        if in_seo and line.startswith("  title:"):
            seo_title = f"{title} | IntoLibya".replace("-", " ")
            out.append(f"  title: '{seo_title}'" if ":" in seo_title else f"  title: {seo_title}")
            if ":" in seo_title or "|" in seo_title:
                out[-1] = f"  title: '{seo_title}'"
            continue
        if in_seo and line.startswith("  description:"):
            out.append(f"  description: '{seo_desc.replace(chr(39), chr(39)+chr(39))}'")
            continue
        if in_seo and line and not line.startswith(" ") and not line.startswith("\t"):
            in_seo = False
        out.append(line)
    return "\n".join(out)


def process(slug: str) -> None:
    path = POSTS / f"{slug}.md"
    raw = path.read_text()
    parts = raw.split("---", 2)
    fm, body = parts[1], parts[2].lstrip("\n")
    primary = PRIMARY_BY_SLUG.get(slug, "")
    title = TITLE_BY_SLUG.get(slug, slug)
    m = re.search(r"description:\s*'([^']*)'", fm)
    old_desc = m.group(1) if m else title

    # Remove only the standard SEO helper sections (stop at next h2/hr), never wipe
    # following article sections that happen to sit after a mid article brand block.
    body = re.sub(
        r"<h2>Related reading</h2>\s*(?:<ul>.*?</ul>\s*)?",
        "",
        body,
        flags=re.S | re.I,
    )
    body = re.sub(
        r"<h2>How IntoLibya helps</h2>\s*(?:<p>.*?</p>\s*)?",
        "",
        body,
        flags=re.S | re.I,
    )

    body = ensure_keyword_opening(body, primary)
    body = linkify_destinations(body)
    body = brand_mid_article(body)
    related = related_reading_block(slug)
    if related:
        if re.search(r"<hr\s*/?>", body):
            body = re.sub(r"<hr\s*/?>", related + "<hr />", body, count=1)
        else:
            body += "\n\n" + related
    body = improve_cta(body)
    assert_no_hyphen(body, slug)

    seo_desc = seo_description(primary, title, old_desc)
    excerpt = excerpt_from_body(body, primary)
    new_fm = update_frontmatter(fm, excerpt, seo_desc, title)
    path.write_text(f"---{new_fm}---\n\n{body.rstrip()}\n")
    print(f"✓ {slug}")


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/improve_batch_seo.py content-review/batch-b-posts.md")
        sys.exit(1)
    index = ROOT / sys.argv[1]
    slugs = load_index(index)
    for slug in slugs:
        process(slug)
    print(f"\nImproved {len(slugs)} posts from {index.name}")


if __name__ == "__main__":
    main()
