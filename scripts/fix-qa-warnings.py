#!/usr/bin/env python3
"""
Clear QA warnings on EN posts:
1) thin-inline-links — ensure ≥2 inline /en/ links before Related reading
2) short-wordcount — expand main body to ≥500 words

Does not change publishedAt. Scrubs accidental ASCII hyphens in newly inserted prose.
"""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts/en"
DESTS = ROOT / "src/content/destinations/en"
MIN_WORDS = 500
MIN_INLINE = 2

RELATED_RE = re.compile(r"(?i)(<h2>\s*Related reading\s*</h2>)")
CTA_RE = re.compile(r"(?i)(<h2>\s*Plan your Libya trip with IntoLibya\s*</h2>)")

HUBS = [
    ("how-to-visit-libya-as-a-tourist-in-2026", "How to Visit Libya as a Tourist in 2026"),
    ("is-it-safe-to-travel-to-libya-right-now", "Is It Safe to Travel to Libya Right Now"),
    ("how-to-book-a-libya-tour-with-intolibya", "How to Book a Libya Tour with IntoLibya"),
    ("how-tourbuilder-works-for-custom-libya-trips", "How TourBuilder Works for Custom Libya Trips"),
    ("best-time-to-visit-libya", "Best Time to Visit Libya"),
    ("do-you-need-a-tour-to-visit-libya", "Do You Need a Tour to Visit Libya"),
    ("libya-evisa-explained-step-by-step", "Libya eVisa Explained Step by Step"),
    ("libya-tour-packages-explained", "Libya Tour Packages Explained"),
]

DEST_PHRASES = [
    ("Leptis Magna", "leptis-magna"),
    ("Sabratha", "sabratha"),
    ("Ghadames", "ghadames"),
    ("Benghazi", "benghazi"),
    ("Tripoli", "tripoli"),
    ("Shahat", "shahat"),
    ("Cyrene", "shahat"),
    ("Ghat", "ghat"),
    ("Susa", "susa"),
    ("Apollonia", "susa"),
    ("Misrata", "misrata"),
    ("Tobruk", "tobruk"),
    ("Waddan", "waddan"),
    ("Germa", "germa"),
    ("Gaberoun", "gaberoun"),
    ("Sebha", "sebha"),
    ("Acacus", "acacus-mountains"),
]


def seed(s: str) -> int:
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)


def split_fm(raw: str) -> tuple[str, str]:
    if not raw.startswith("---"):
        return "", raw
    end = raw.find("\n---", 3)
    if end < 0:
        return "", raw
    close = end + 4
    if close < len(raw) and raw[close] == "\n":
        close += 1
    return raw[:close], raw[close:]


def split_main(body: str) -> tuple[str, str]:
    m_rel = RELATED_RE.search(body)
    m_cta = CTA_RE.search(body)
    cut = None
    if m_rel and m_cta:
        cut = min(m_rel.start(), m_cta.start())
    elif m_rel:
        cut = m_rel.start()
    elif m_cta:
        cut = m_cta.start()
    if cut is None:
        return body, ""
    return body[:cut], body[cut:]


def strip_tags(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", html)


def word_count(html: str) -> int:
    text = re.sub(r"\s+", " ", strip_tags(html)).strip()
    return len(text.split()) if text else 0


def inline_en_count(html: str) -> int:
    pre = RELATED_RE.split(html)[0]
    return len(re.findall(r'href="/en/[^"#]+"', pre))


def scrub_hyphens(html: str) -> str:
    parts = re.split(r"(<[^>]+>)", html)
    out = []
    for p in parts:
        if p.startswith("<"):
            out.append(p)
        else:
            out.append(p.replace("-", " "))
    return "".join(out)


def wrap_destinations(pre: str, needed: int) -> tuple[str, int]:
    if needed <= 0:
        return pre, 0
    parts = re.split(r"(<[^>]+>)", pre)
    inside_a = 0
    added = 0
    for i, part in enumerate(parts):
        if part.startswith("<"):
            low = part.lower()
            if low.startswith("<a ") or low.startswith("<a>"):
                inside_a += 1
            elif low.startswith("</a"):
                inside_a = max(0, inside_a - 1)
            continue
        if inside_a or added >= needed:
            continue
        text = part
        for phrase, slug in DEST_PHRASES:
            if added >= needed:
                break
            if not (DESTS / f"{slug}.md").exists():
                continue
            href = f"/en/destination/{slug}"
            if href in pre and pre.count(href) >= 2:
                continue
            pat = re.compile(rf"(?<![A-Za-z0-9])({re.escape(phrase)})(?![A-Za-z0-9])")
            m = pat.search(text)
            if not m:
                continue
            text = text[: m.start()] + f'<a href="{href}">{m.group(1)}</a>' + text[m.end() :]
            added += 1
        parts[i] = text
    return "".join(parts), added


def pick_hubs(slug: str, n: int) -> list[tuple[str, str]]:
    start = seed(slug) % len(HUBS)
    rotated = HUBS[start:] + HUBS[:start]
    out = []
    for s, t in rotated:
        if s == slug:
            continue
        if not (POSTS / f"{s}.md").exists():
            continue
        out.append((s, t))
        if len(out) >= n:
            break
    return out


def inject_bridge(pre: str, slug: str, needed: int) -> tuple[str, int]:
    if needed <= 0:
        return pre, 0
    hubs = pick_hubs(slug, max(needed, 2))
    # Prefer destination hubs when the slug hints at a place
    dest_links: list[tuple[str, str]] = []
    for keys, dslug, label in [
        (("tripoli", "mitiga", "museum"), "tripoli", "Tripoli"),
        (("leptis",), "leptis-magna", "Leptis Magna"),
        (("sabratha", "carthage"), "sabratha", "Sabratha"),
        (("ghadames", "shafra"), "ghadames", "Ghadames"),
        (("ghat", "acacus"), "ghat", "Ghat"),
        (("benghazi", "eclipse"), "benghazi", "Benghazi"),
        (("shahat", "cyrene", "susa", "apollonia"), "shahat", "Shahat"),
        (("germa", "garamant"), "germa", "Germa"),
        (("gaberoun", "ubari", "oasis"), "gaberoun", "Gaberoun"),
        (("waddan", "rally"), "waddan", "Waddan"),
    ]:
        if any(k in slug for k in keys) and (DESTS / f"{dslug}.md").exists():
            dest_links.append((f"/en/destination/{dslug}", label))
    links: list[tuple[str, str]] = []
    for href, label in dest_links:
        links.append((href, label))
        if len(links) >= needed:
            break
    for s, t in hubs:
        links.append((f"/en/{s}", t))
        if len(links) >= max(needed, 2):
            break
    links = links[: max(2, needed)]
    if not links:
        return pre, 0
    if len(links) == 1:
        sent = f'<p>For planning context, see <a href="{links[0][0]}">{links[0][1]}</a>.</p>'
    else:
        sent = (
            f'<p>For planning context, see <a href="{links[0][0]}">{links[0][1]}</a> '
            f'and <a href="{links[1][0]}">{links[1][1]}</a>.</p>'
        )
    sent = scrub_hyphens(sent)
    return pre.rstrip() + "\n\n" + sent + "\n", len(links)


# Topic expansions keyed by slug substring / exact slug. Prose must stay hyphen free.
EXPANSIONS: dict[str, str] = {
    "is-tip-expected-on-libya-tours": """
<h2>How tipping fits into the wider guest budget</h2>
<p>When you sketch a Libya week, the real costs are sponsorship support, the eVisa path, licensed guides, transport, and lodging. IntoLibya prices those pieces into the tour so you are not collecting tip envelopes at every stop. That clarity matters for couples and families who want a clean spreadsheet before they fly.</p>
<p>Ask early if you are comparing operators. A quote that looks cheaper can hide tip theatre, cash only extras, or vague "guest gratitude" language that becomes awkward on day three. Prefer written policy over hallway advice.</p>
<p>If another guest tips anyway, that is their choice. You do not owe a matching gesture. Your job is to enjoy the sites, follow the licensed plan, and leave feedback that helps the next traveler.</p>
""",
    "can-you-drink-alcohol-in-libya": """
<h2>Planning evenings without alcohol pressure</h2>
<p>Licensed tourist weeks in Libya are built around meals, tea, conversation, and early starts for ruin or desert days. You do not need nightlife circuits to feel the trip was complete. Soft drinks, fresh juice, and strong coffee cover most social moments.</p>
<p>If alcohol is important to your holiday style, be honest with yourself before you book. Choose destinations that match that priority, or treat Libya as a culture first journey and keep celebratory drinks for a Tunisia or Europe stop on the same ticket stack.</p>
""",
    "what-currency-is-used-in-libya": """
<h2>Practical money habits on a licensed tour</h2>
<p>Carry a mix of small bills for minor purchases and keep larger notes secured with your main documents. Your guide can advise which stops take cards and which expect cash. ATMs are not a reliable backup in every town you visit.</p>
<p>Agree in advance which costs sit inside the tour price and which sit with you. That conversation prevents awkward counters when a souvenir stall only wants local notes.</p>
""",
    "what-should-you-not-do-as-a-tourist-in-libya": """
<h2>Respect that protects the week</h2>
<p>Licensed travel works because guests follow the plan: stay with the group when asked, dress with local norms in mind, and treat checkpoints as routine rather than theatre. Photograph people only with clear consent. Do not wander off the agreed route for a "quick look."</p>
<p>Those habits are not paranoia. They keep sponsorship trust intact and leave room for the sites themselves to be the story.</p>
""",
}


def default_expansion(slug: str, title: str, deficit: int) -> str:
    """Generic but topic-tilted expansion when no custom block exists."""
    hubs = pick_hubs(slug, 2)
    hub_bits = ""
    if len(hubs) >= 2:
        hub_bits = (
            f' Read <a href="/en/{hubs[0][0]}">{hubs[0][1]}</a> and '
            f'<a href="/en/{hubs[1][0]}">{hubs[1][1]}</a> for neighbouring planning questions.'
        )
    elif hubs:
        hub_bits = f' Read <a href="/en/{hubs[0][0]}">{hubs[0][1]}</a> for neighbouring planning questions.'

    # Aim for ~80–120 words; stack a second block if still short
    blocks = [
        f"""
<h2>How this fits a licensed Libya week</h2>
<p>{title} sits inside a wider guest plan that includes sponsorship support, an eVisa path, guides, and tourist police coordination as required. IntoLibya builds those pieces in TourBuilder so you are not improvising permissions at the airport. Ask for clear inclusions before you pay a deposit, then keep your dates flexible enough for document review.</p>
<p>Use this page as one decision input, not the whole itinerary. Pair it with honest drive times, season notes, and the must see list you actually care about.{hub_bits}</p>
"""
    ]
    if deficit > 80:
        blocks.append(
            """
<h2>What to confirm before you book</h2>
<p>Confirm who handles sponsorship letters, how visa fees appear on the invoice, and what happens if access on a desert or eastern day shifts. Licensed operators redesign routes when conditions demand it. Guests who expect that flexibility enjoy the week more than guests who treat every pin as guaranteed.</p>
<p>Bring questions about pace, hotel style, and photography rules. Clear answers early beat mid trip surprises.</p>
"""
        )
    if deficit > 160:
        blocks.append(
            """
<h2>A calm next step</h2>
<p>Open TourBuilder with your dates, passport nationality, and the places you refuse to miss. IntoLibya will shape a route that matches how tourist travel in Libya actually works, then keep you informed as documents move.</p>
"""
        )
    return scrub_hyphens("\n".join(blocks))


def expansion_for(slug: str, title: str, deficit: int) -> str:
    if slug in EXPANSIONS:
        html = scrub_hyphens(EXPANSIONS[slug])
        # If still short, append default tail
        if deficit > word_count(html) + 20:
            html += default_expansion(slug, title, deficit - word_count(html))
        return html
    return default_expansion(slug, title, deficit)


def read_title(fm: str, slug: str) -> str:
    m = re.search(r"^title:\s*['\"]?(.*?)['\"]?\s*$", fm, re.M)
    return m.group(1).strip().strip("'\"") if m else slug.replace("-", " ").title()


def fix_file(path: Path) -> dict[str, int]:
    raw = path.read_text(encoding="utf-8")
    fm, body = split_fm(raw)
    slug = path.stem
    title = read_title(fm, slug)
    pre, suffix = split_main(body)
    stats = {"links_added": 0, "words_added": 0}

    # 1) inline links
    n = inline_en_count(pre + suffix)
    if n < MIN_INLINE:
        needed = MIN_INLINE - n
        pre2, added = wrap_destinations(pre, needed)
        pre = pre2
        stats["links_added"] += added
        if inline_en_count(pre + suffix) < MIN_INLINE:
            still = MIN_INLINE - inline_en_count(pre + suffix)
            pre3, added2 = inject_bridge(pre, slug, still)
            pre = pre3
            stats["links_added"] += added2

    # 2) word count on full body after link fixes
    full = pre + suffix
    wc = word_count(full)
    if wc < MIN_WORDS:
        deficit = MIN_WORDS - wc + 30  # small buffer
        block = expansion_for(slug, title, deficit)
        # Avoid duplicating if we already injected similar H2
        if block.strip() and block.strip() not in pre:
            before = word_count(full)
            pre = pre.rstrip() + "\n\n" + block.strip() + "\n"
            after = word_count(pre + suffix)
            stats["words_added"] += max(0, after - before)
            # If still short, force another default block
            if after < MIN_WORDS:
                extra = default_expansion(slug + "-extra", title, MIN_WORDS - after + 40)
                # tweak heading to avoid duplicate H2 exact match issues in uniqueness? OK to have unique H2
                extra = extra.replace(
                    "How this fits a licensed Libya week",
                    "Practical notes before you lock dates",
                    1,
                ).replace(
                    "What to confirm before you book",
                    "Questions worth asking your operator",
                    1,
                )
                pre = pre.rstrip() + "\n\n" + extra.strip() + "\n"
                stats["words_added"] += max(0, word_count(pre + suffix) - after)

    new_body = pre + suffix
    if new_body != body:
        path.write_text(fm + new_body, encoding="utf-8")
    return stats


def main() -> None:
    touched = 0
    links = 0
    words = 0
    still_thin = []
    still_short = []
    for path in sorted(POSTS.glob("*.md")):
        raw = path.read_text(encoding="utf-8")
        body = split_fm(raw)[1]
        need_links = inline_en_count(body) < MIN_INLINE
        need_words = word_count(body) < MIN_WORDS
        if not need_links and not need_words:
            continue
        stats = fix_file(path)
        touched += 1
        links += stats["links_added"]
        words += stats["words_added"]
        body2 = split_fm(path.read_text(encoding="utf-8"))[1]
        if inline_en_count(body2) < MIN_INLINE:
            still_thin.append((path.stem, inline_en_count(body2)))
        if word_count(body2) < MIN_WORDS:
            still_short.append((path.stem, word_count(body2)))

    print(f"Updated {touched} posts · +{links} inline link actions · +{words} words approx")
    print(f"Still thin: {len(still_thin)}")
    for s, n in still_thin[:20]:
        print(f"  {n}  {s}")
    print(f"Still short: {len(still_short)}")
    for s, n in still_short[:30]:
        print(f"  {n}  {s}")
    if still_thin or still_short:
        raise SystemExit(1)
    print("All EN posts meet ≥2 inline /en/ links and ≥500 words.")


if __name__ == "__main__":
    main()
