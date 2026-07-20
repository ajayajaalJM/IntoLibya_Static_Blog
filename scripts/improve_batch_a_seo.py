#!/usr/bin/env python3
"""
Improve Batch A posts for SEO, cross-links, and IntoLibya brand.
- Primary keyword in opening + SEO description
- Contextual destination + related post links
- Related reading block before CTA
- Stronger IntoLibya representation
- No hyphen characters in prose/excerpt/seo description
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts/en"
INDEX = ROOT / "content-review/batch-a-posts.md"

# Destination pages (EN)
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
}

# Cluster related posts (slug -> list of related slugs)
RELATED: dict[str, list[str]] = {}

CLUSTERS = {
    "visa": [
        "how-to-visit-libya-as-a-tourist-in-2026",
        "libya-evisa-explained-step-by-step",
        "what-is-a-libya-sponsor-letter-and-why-you-need-one",
        "how-long-does-a-libya-visa-take",
        "libya-visa-cost-for-tourists",
        "can-us-citizens-get-a-visa-for-libya",
        "can-uk-citizens-get-a-visa-for-libya",
        "can-eu-citizens-travel-to-libya",
        "libya-entry-requirements-checklist",
        "how-early-should-you-book-a-libya-tour",
        "can-tourists-visit-libya-yes-with-a-licensed-tour",
        "do-you-need-a-tour-to-visit-libya",
        "is-independent-travel-allowed-in-libya",
    ],
    "flights": [
        "flights-to-tripoli-how-travelers-arrive",
        "flying-to-libya-via-tunis",
        "flying-to-libya-via-cairo",
        "mitiga-airport-arrival-guide-for-tourists",
        "flying-tunis-to-tripoli-for-a-libya-tour",
        "can-you-combine-tunis-and-tripoli-in-one-journey",
    ],
    "practical": [
        "travel-insurance-for-libya-what-actually-works",
        "money-in-libya-cash-cards-and-atms",
        "sim-cards-and-internet-for-tourists-in-libya",
        "what-to-pack-for-a-libya-tour",
        "dress-code-for-travelers-in-libya",
        "photography-rules-for-tourists-in-libya",
    ],
    "safety": [
        "is-it-safe-to-travel-to-libya-right-now",
        "how-government-travel-advisories-affect-libya-trips",
        "is-western-libya-safe-for-tourists",
        "is-eastern-libya-open-for-tourists",
        "solo-travel-in-libya-what-is-allowed",
        "is-libya-safe-for-women-travelers",
        "safety-for-couples-visiting-libya",
        "what-tourist-police-escorts-mean-on-a-libya-tour",
        "checkpoints-in-libya-how-tours-handle-them",
        "common-safety-myths-about-traveling-to-libya",
        "how-licensed-operators-keep-guests-safe-in-libya",
        "libya-vs-travel-warnings-how-to-read-the-risk",
        "night-travel-and-road-safety-on-libya-tours",
        "health-and-medical-care-for-visitors-to-libya",
        "is-libya-safe-for-first-time-visitors-to-north-africa",
        "family-travel-safety-questions-for-libya",
        "what-happens-if-plans-change-for-security-reasons",
        "how-to-choose-a-trusted-libya-tour-company",
        "real-guest-experiences-feeling-safe-in-libya",
        "scams-and-tourist-risks-to-know-before-libya",
    ],
    "book": [
        "libya-tour-packages-explained",
        "how-to-book-a-libya-tour-with-intolibya",
        "what-is-included-in-an-all-inclusive-libya-tour",
        "all-inclusive-vs-lean-libya-tours",
        "how-much-does-a-libya-tour-cost",
        "libya-tour-deposit-and-payment-timeline",
        "private-libya-tour-vs-group-tour",
        "how-tourbuilder-works-for-custom-libya-trips",
        "best-libya-tour-for-first-timers",
        "best-libya-tour-for-history-lovers",
        "how-to-choose-a-trusted-libya-tour-company",
    ],
    "itinerary": [
        "4-day-libya-itinerary-for-first-visitors",
        "7-day-western-libya-itinerary",
        "10-day-libya-itinerary-coast-and-desert",
        "12-day-libya-adventure-itinerary",
        "18-day-full-country-libya-itinerary",
        "best-libya-tour-for-first-timers",
        "best-libya-tour-for-history-lovers",
    ],
    "bridge": [
        "tunisia-vs-libya-for-history-travelers",
        "egypt-vs-libya-for-ancient-ruins",
        "algeria-vs-libya-for-sahara-expeditions",
        "tunisia-holiday-ideas-that-lead-to-a-libya-trip",
        "can-you-combine-tunis-and-tripoli-in-one-journey",
        "flying-tunis-to-tripoli-for-a-libya-tour",
        "flying-to-libya-via-tunis",
    ],
}

for members in CLUSTERS.values():
    for slug in members:
        RELATED[slug] = [m for m in members if m != slug][:5]

# Extra cross-cluster edges
EXTRA = {
    "how-to-visit-libya-as-a-tourist-in-2026": [
        "libya-evisa-explained-step-by-step",
        "is-it-safe-to-travel-to-libya-right-now",
        "7-day-western-libya-itinerary",
        "how-to-book-a-libya-tour-with-intolibya",
    ],
    "is-it-safe-to-travel-to-libya-right-now": [
        "how-to-choose-a-trusted-libya-tour-company",
        "what-tourist-police-escorts-mean-on-a-libya-tour",
        "is-western-libya-safe-for-tourists",
        "how-to-visit-libya-as-a-tourist-in-2026",
    ],
    "7-day-western-libya-itinerary": [
        "best-libya-tour-for-first-timers",
        "leptis-magna",  # not a post - skip non posts
    ],
}
for k, v in EXTRA.items():
    RELATED[k] = [x for x in v if not x.startswith("leptis")] + RELATED.get(k, [])
    # dedupe preserve order
    seen = set()
    RELATED[k] = [x for x in RELATED[k] if not (x in seen or seen.add(x))][:5]

TITLE_BY_SLUG: dict[str, str] = {}
PRIMARY_BY_SLUG: dict[str, str] = {}


def load_index() -> list[str]:
    text = INDEX.read_text()
    slugs = re.findall(r"`src/content/posts/en/([^`]+)\.md`", text)
    for block in re.split(r"### ", text)[1:]:
        lines = block.splitlines()
        title_line = lines[0]
        # "1. How to Visit..."
        title = re.sub(r"^\d+\.\s*", "", title_line).strip()
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
    return slugs


def assert_no_hyphen(text: str, label: str) -> None:
    prose = re.sub(r'(href|src|class)="[^"]*"', "", text)
    prose = re.sub(r"<!--.*?-->", "", prose, flags=re.S)
    if "-" in prose:
        i = prose.index("-")
        raise ValueError(f"Hyphen in {label}: ...{prose[max(0, i - 40) : i + 40]}...")


def linkify_destinations(html: str) -> str:
    """Link first plain-text mention of key destinations (skip if already linked)."""
    # Work on text nodes roughly: only replace outside existing <a>...</a>
    parts = re.split(r"(<a\b[^>]*>.*?</a>)", html, flags=re.I | re.S)
    out = []
    for i, part in enumerate(parts):
        if i % 2 == 1:  # already a link
            out.append(part)
            continue
        chunk = part
        for name, href in sorted(DEST.items(), key=lambda x: -len(x[0])):
            # skip if already has this href nearby in chunk as linked
            if href in chunk:
                continue
            # first unlinked occurrence of exact name
            pattern = re.compile(rf"(?<![>/])\b({re.escape(name)})\b(?![^<]*>)")
            m = pattern.search(chunk)
            if not m:
                continue
            # avoid linking inside tags
            before = chunk[: m.start()]
            if before.rfind("<") > before.rfind(">"):
                continue
            chunk = chunk[: m.start()] + f'<a href="{href}">{name}</a>' + chunk[m.end() :]
        out.append(chunk)
    return "".join(out)


def ensure_keyword_opening(body: str, primary: str, title: str) -> str:
    if not primary:
        return body
    plain = re.sub(r"<[^>]+>", " ", body)
    first = " ".join(plain.split()[:90]).lower()
    if primary.lower() in first:
        return body
    # Insert a lead sentence after optional comment, before first <p> content end
    # Add as new first paragraph
    lead = (
        f"<p><strong>{primary[0].upper() + primary[1:]}</strong> is one of the first questions "
        f"travelers ask when planning with IntoLibya. This guide answers it with practical steps, "
        f"honest limits, and clear next actions.</p>\n\n"
    )
    # If primary already capitalized oddly, fine
    assert_no_hyphen(lead, "lead")
    # Place after comment if present
    if body.lstrip().startswith("<!--"):
        body = re.sub(
            r"(<!--.*?-->\s*)",
            r"\1" + lead,
            body,
            count=1,
            flags=re.S,
        )
        return body
    return lead + body


def brand_mid_article(body: str) -> str:
    """Ensure IntoLibya + TourBuilder mentioned beyond CTA if missing mid-body."""
    # Strip CTA for check
    main = re.split(r"<hr\s*/?>", body, maxsplit=1)[0]
    if "IntoLibya" in main and "TourBuilder" in main:
        return body
    insert = (
        "<h2>How IntoLibya helps</h2>\n\n"
        "<p>IntoLibya is a licensed Libyan tour operator. We sponsor tourist visits, build "
        "itineraries in TourBuilder, arrange guides and required tourist police coordination, "
        "and keep logistics honest when access shifts. You focus on the places. We handle the "
        "system that makes those places reachable.</p>\n\n"
    )
    assert_no_hyphen(insert, "brand")
    # Insert before final hr CTA
    if re.search(r"<hr\s*/?>", body):
        return re.sub(r"<hr\s*/?>", insert + "<hr />", body, count=1)
    return body + "\n\n" + insert


def related_reading_block(slug: str) -> str:
    related = RELATED.get(slug, [])
    # filter existing files
    items = []
    for r in related:
        if r == slug:
            continue
        path = POSTS / f"{r}.md"
        if not path.exists():
            continue
        title = TITLE_BY_SLUG.get(r) or r.replace("-", " ").title()
        # titles may have been written without hyphens already
        title_display = title
        # Avoid hyphen in display by replacing en-dash etc already
        if "-" in title_display and not title_display.startswith("http"):
            # slug-derived fallback shouldn't appear in prose if title has hyphen from index
            # Batch A titles should be hyphen-free; if any, rewrite spaces
            title_display = title_display.replace("-", " ")
        items.append(f'<li><a href="/en/{r}">{title_display}</a></li>')
        if len(items) >= 4:
            break
    # Always add key destinations for place-heavy posts
    dest_bits = []
    cluster_hint = ""
    for name, cslugs in CLUSTERS.items():
        if slug in cslugs:
            cluster_hint = name
            break
    if cluster_hint in ("itinerary", "bridge", "book", "safety", "visa", "flights", "practical"):
        for dname, dhref in [
            ("Tripoli", DEST["Tripoli"]),
            ("Leptis Magna", DEST["Leptis Magna"]),
            ("Ghadames", DEST["Ghadames"]),
        ]:
            dest_bits.append(f'<li><a href="{dhref}">{dname} destination guide</a></li>')
    if not items and not dest_bits:
        return ""
    block = "<h2>Related reading</h2>\n\n<ul>\n"
    block += "\n".join(items)
    if dest_bits:
        block += "\n" + "\n".join(dest_bits[:2])
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
    # Remove existing CTA from first hr to end if present
    if re.search(r"<hr\s*/?>", body):
        main = re.split(r"<hr\s*/?>", body, maxsplit=1)[0].rstrip() + "\n\n"
        return main + cta
    return body.rstrip() + "\n\n" + cta


def seo_description(primary: str, title: str, existing: str) -> str:
    # 120-155 chars, include primary, no hyphens
    base = existing.strip().strip("'\"")
    base = base.replace("—", ":").replace("–", ":").replace("-", " ")
    if primary and primary.lower() not in base.lower():
        base = f"{primary}: {base}"
    # trim
    if len(base) > 155:
        base = base[:152].rsplit(" ", 1)[0] + "."
    if len(base) < 110:
        base = (
            f"{base.rstrip('.')} Practical guidance from IntoLibya for licensed Libya tours."
        )
        if len(base) > 155:
            base = base[:152].rsplit(" ", 1)[0] + "."
    assert_no_hyphen(base, "seo")
    return base


def excerpt_from_body(body: str, primary: str) -> str:
    plain = re.sub(r"<[^>]+>", " ", body)
    plain = re.sub(r"\s+", " ", plain).strip()
    # skip related/cta noise
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


def update_frontmatter(fm: str, excerpt: str, seo_desc: str, primary: str, title: str) -> str:
    lines = fm.split("\n")
    out = []
    in_seo = False
    for line in lines:
        if line.startswith("excerpt:"):
            safe = excerpt.replace("'", "''")
            out.append(f"excerpt: '{safe}'")
            continue
        if line.strip() == "seo:":
            out.append(line)
            in_seo = True
            continue
        if in_seo and line.startswith("  title:"):
            # Ensure brand + keyword lean
            seo_title = f"{title} | IntoLibya"
            if primary and primary.lower() not in title.lower():
                seo_title = f"{title} ({primary}) | IntoLibya"
            # no parentheses with weirdness - keep simple
            seo_title = f"{title} | IntoLibya"
            # avoid hyphen in seo title
            seo_title = seo_title.replace("-", " ")
            # but title itself shouldn't have hyphens; slug paths elsewhere
            out.append(f"  title: {seo_title}")
            # yaml may need quotes if special
            if ":" in seo_title:
                out[-1] = f"  title: '{seo_title}'"
            continue
        if in_seo and line.startswith("  description:"):
            safe = seo_desc.replace("'", "''")
            out.append(f"  description: '{safe}'")
            continue
        if in_seo and line and not line.startswith(" ") and not line.startswith("\t"):
            in_seo = False
        out.append(line)
    return "\n".join(out)


def process(slug: str) -> None:
    path = POSTS / f"{slug}.md"
    raw = path.read_text()
    parts = raw.split("---", 2)
    fm, body = parts[1], parts[2]
    primary = PRIMARY_BY_SLUG.get(slug, "")
    title = TITLE_BY_SLUG.get(slug, slug)

    # Extract old seo desc
    m = re.search(r"description:\s*'([^']*)'", fm)
    old_desc = m.group(1) if m else title

    body = body.lstrip("\n")
    # Remove old Related reading sections to avoid dupes
    body = re.sub(
        r"<h2>Related reading</h2>.*?(?=<hr\s*/?>|<h2>Plan your Libya trip)",
        "",
        body,
        flags=re.S | re.I,
    )
    body = re.sub(
        r"<h2>How IntoLibya helps</h2>.*?(?=<hr\s*/?>|<h2>Related reading|<h2>Plan your Libya trip)",
        "",
        body,
        flags=re.S | re.I,
    )

    body = ensure_keyword_opening(body, primary, title)
    body = linkify_destinations(body)
    body = brand_mid_article(body)

    related = related_reading_block(slug)
    # Insert related before CTA hr
    if related:
        if re.search(r"<hr\s*/?>", body):
            body = re.sub(r"<hr\s*/?>", related + "<hr />", body, count=1)
        else:
            body = body + "\n\n" + related

    body = improve_cta(body)

    # Final hyphen check on full body
    assert_no_hyphen(body, slug)

    seo_desc = seo_description(primary, title, old_desc)
    excerpt = excerpt_from_body(body, primary)
    new_fm = update_frontmatter(fm, excerpt, seo_desc, primary, title)

    path.write_text(f"---{new_fm}---\n\n{body.rstrip()}\n")
    print(f"✓ {slug}")


def main() -> None:
    slugs = load_index()
    for slug in slugs:
        process(slug)
    print(f"\nImproved {len(slugs)} Batch A posts")


if __name__ == "__main__":
    main()
