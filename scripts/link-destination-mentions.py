#!/usr/bin/env python3
"""
Link destination mentions in EN post bodies to /en/destination/{slug}.

Rules:
- When a destination (or alias) appears in main-body prose, ensure 1–2 links.
- Never more than 2 links to the same destination slug per article.
- Prefer keeping / adding links in the main body; unwrap excess (usually in
  Related reading) so the cap holds.
- Do not wrap text already inside <a>…</a>.
- Preserve matched link text (Cyrene → /en/destination/shahat).
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts/en"
DESTS = ROOT / "src/content/destinations/en"
MAX_LINKS = 2

# Longest phrases first. (phrase, slug) — aliases share one quota.
PHRASES: list[tuple[str, str]] = [
    ("Leptis Magna", "leptis-magna"),
    ("Lepcis Magna", "leptis-magna"),
    ("Jebel Akhdar", "jebel-akhdar"),
    ("Green Mountain", "jebel-akhdar"),
    ("Jebel Nafusa", "jebel-nafusa"),
    ("Nafusa Mountains", "jebel-nafusa"),
    ("Acacus Mountains", "acacus-mountains"),
    ("Tadrart Acacus", "acacus-mountains"),
    ("Wadi Mathendous", "wadi-mathendous"),
    ("Waw an Namus", "waw-an-namus"),
    ("Wau an Namus", "waw-an-namus"),
    ("Qasr Libya", "qasr-libya"),
    ("Qasr Libia", "qasr-libya"),
    ("Gasr Libya", "qasr-libya"),
    ("Um el Ma", "um-el-ma"),
    ("Um El Ma", "um-el-ma"),
    ("Gaberoun", "gaberoun"),
    ("Ghadames", "ghadames"),
    ("Sabratha", "sabratha"),
    ("Benghazi", "benghazi"),
    ("Ptolemais", "ptolemais"),
    ("Tolmeita", "ptolemais"),
    ("Tolmita", "ptolemais"),
    ("Misrata", "misrata"),
    ("Tripoli", "tripoli"),
    ("Tobruk", "tobruk"),
    ("Tubruq", "tobruk"),
    ("Waddan", "waddan"),
    ("Shahat", "shahat"),
    ("Cyrene", "shahat"),
    ("Susa", "susa"),
    ("Apollonia", "susa"),
    ("Germa", "germa"),
    ("Garama", "germa"),
    ("Ghat", "ghat"),
    ("Sebha", "sebha"),
    ("Sabha", "sebha"),
    ("Acacus", "acacus-mountains"),
]

ALL_SLUGS = sorted({s for _, s in PHRASES if (DESTS / f"{s}.md").exists()})

RELATED_SPLIT = re.compile(r"(?i)(<h2>\s*Related reading\s*</h2>)")
CTA_SPLIT = re.compile(r"(?i)(<h2>\s*Plan your Libya trip with IntoLibya\s*</h2>)")
DEST_A_RE = re.compile(
    r'<a\s+([^>]*?)href="(/en/destination/([a-z0-9-]+))"([^>]*)>(.*?)</a>',
    re.I | re.S,
)


def dest_exists(slug: str) -> bool:
    return (DESTS / f"{slug}.md").exists()


def split_frontmatter(raw: str) -> tuple[str, str]:
    if not raw.startswith("---"):
        return "", raw
    end = raw.find("\n---", 3)
    if end < 0:
        return "", raw
    # Keep closing fence + following newline if present
    close_end = end + 4
    if close_end < len(raw) and raw[close_end] == "\n":
        close_end += 1
    return raw[:close_end], raw[close_end:]


def main_body(body: str) -> tuple[str, str]:
    m_rel = RELATED_SPLIT.search(body)
    m_cta = CTA_SPLIT.search(body)
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


def count_links(html: str, slug: str) -> int:
    return len(re.findall(rf'href="/en/destination/{re.escape(slug)}"', html))


def unwrap_excess_links(html: str, slug: str, keep: int) -> tuple[str, int]:
    """Keep the first `keep` destination links for slug; unwrap the rest to plain text."""
    removed = 0
    seen = 0

    def repl(m: re.Match[str]) -> str:
        nonlocal removed, seen
        if m.group(3).lower() != slug:
            return m.group(0)
        seen += 1
        if seen <= keep:
            return m.group(0)
        removed += 1
        return m.group(5)  # inner text

    return DEST_A_RE.sub(repl, html), removed


def fix_nested_dest_links(html: str) -> str:
    """Collapse accidental double wraps: <a href=dest><a href=dest>Text</a></a>."""
    prev = None
    while prev != html:
        prev = html
        html = re.sub(
            r'<a\s+href="(/en/destination/[a-z0-9-]+)"\s*>\s*'
            r'<a\s+href="\1"\s*>(.*?)</a>\s*</a>',
            r'<a href="\1">\2</a>',
            html,
            flags=re.I | re.S,
        )
    return html


def enforce_caps(prefix: str, suffix: str) -> tuple[str, str, int]:
    """
    Prefer main-body links. For each slug:
    - Keep up to MAX_LINKS in prefix
    - Keep remaining quota in suffix
    - Unwrap everything beyond that
    """
    removed = 0
    prefix = fix_nested_dest_links(prefix)
    suffix = fix_nested_dest_links(suffix)
    for slug in ALL_SLUGS:
        in_pre = count_links(prefix, slug)
        keep_pre = min(in_pre, MAX_LINKS)
        if in_pre > keep_pre:
            prefix, n = unwrap_excess_links(prefix, slug, keep_pre)
            removed += n
        remaining = MAX_LINKS - count_links(prefix, slug)
        in_suf = count_links(suffix, slug)
        keep_suf = min(in_suf, remaining)
        if in_suf > keep_suf:
            suffix, n = unwrap_excess_links(suffix, slug, keep_suf)
            removed += n
    return prefix, suffix, removed


def wrap_in_text_nodes(html: str, quotas: dict[str, int]) -> tuple[str, int]:
    parts = re.split(r"(<[^>]+>)", html)
    inside_a = 0
    added = 0
    used = {s: 0 for s in quotas}

    phrase_pats: list[tuple[re.Pattern[str], str]] = []
    for phrase, slug in PHRASES:
        if slug not in quotas or quotas[slug] <= 0:
            continue
        if not dest_exists(slug):
            continue
        pat = re.compile(rf"(?<![A-Za-z0-9])({re.escape(phrase)})(?![A-Za-z0-9])")
        phrase_pats.append((pat, slug))

    for i, part in enumerate(parts):
        if part.startswith("<"):
            low = part.lower()
            if low.startswith("<a ") or low.startswith("<a>"):
                inside_a += 1
            elif low.startswith("</a"):
                inside_a = max(0, inside_a - 1)
            continue
        if inside_a or not part:
            continue

        candidates: list[tuple[int, int, str, str]] = []
        for pat, slug in phrase_pats:
            for m in pat.finditer(part):
                candidates.append((m.start(), m.end(), slug, m.group(1)))

        candidates.sort(key=lambda c: (-(c[1] - c[0]), c[0]))
        chosen: list[tuple[int, int, str, str]] = []
        occupied: list[tuple[int, int]] = []
        picks = {s: 0 for s in quotas}

        for start, end, slug, text in candidates:
            if used[slug] + picks[slug] >= quotas[slug]:
                continue
            if any(not (end <= a or start >= b) for a, b in occupied):
                continue
            chosen.append((start, end, slug, text))
            occupied.append((start, end))
            picks[slug] += 1

        if not chosen:
            continue

        chosen.sort(key=lambda c: c[0])
        out: list[str] = []
        last = 0
        for start, end, slug, text in chosen:
            out.append(part[last:start])
            out.append(f'<a href="/en/destination/{slug}">{text}</a>')
            used[slug] += 1
            added += 1
            last = end
        out.append(part[last:])
        parts[i] = "".join(out)

    return "".join(parts), added


def process_body(body: str) -> tuple[str, int, int]:
    prefix, suffix = main_body(body)
    prefix, suffix, removed = enforce_caps(prefix, suffix)

    quotas: dict[str, int] = {}
    combined = prefix + suffix
    for slug in ALL_SLUGS:
        quotas[slug] = max(0, MAX_LINKS - count_links(combined, slug))

    new_prefix, added = wrap_in_text_nodes(prefix, quotas)
    # Re-enforce after wrap (shouldn't be needed, but safe)
    new_prefix, suffix, removed2 = enforce_caps(new_prefix, suffix)
    return new_prefix + suffix, added, removed + removed2


def process_file(path: Path, dry_run: bool = False) -> tuple[int, int]:
    raw = path.read_text(encoding="utf-8")
    fm, body = split_frontmatter(raw)
    new_body, added, removed = process_body(body)
    if added == 0 and removed == 0:
        return 0, 0
    if new_body == body:
        return 0, 0
    if not dry_run:
        path.write_text(fm + new_body, encoding="utf-8")
    return added, removed


def verify() -> list[str]:
    issues = []
    for path in sorted(POSTS.glob("*.md")):
        body = split_frontmatter(path.read_text(encoding="utf-8"))[1]
        for slug in ALL_SLUGS:
            n = count_links(body, slug)
            if n > MAX_LINKS:
                issues.append(f"{path.name}: {slug} has {n} links")
    return issues


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    files = sorted(POSTS.glob("*.md"))
    touched = 0
    add_total = 0
    rem_total = 0
    for path in files:
        added, removed = process_file(path, dry_run=args.dry_run)
        if added or removed:
            touched += 1
            add_total += added
            rem_total += removed

    mode = "dry-run" if args.dry_run else "wrote"
    print(f"{mode}: {touched} posts · +{add_total} links · -{rem_total} excess unwrapped")

    if not args.dry_run:
        issues = verify()
        if issues:
            print(f"CAP VIOLATIONS ({len(issues)}):")
            for line in issues[:40]:
                print(" ", line)
            raise SystemExit(1)
        print(f"All caps OK (≤{MAX_LINKS} per destination slug per post).")


if __name__ == "__main__":
    main()
