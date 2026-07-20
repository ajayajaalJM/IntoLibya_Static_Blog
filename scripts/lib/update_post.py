"""Update EN post body while preserving frontmatter; enforce no-hyphen prose."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
POSTS = ROOT / "src/content/posts/en"


def assert_no_hyphen(text: str, label: str) -> None:
    prose = re.sub(r'(href|src|class)="[^"]*"', "", text)
    prose = re.sub(r"<!--.*?-->", "", prose, flags=re.S)
    if "-" in prose:
        i = prose.index("-")
        raise ValueError(f"Hyphen in {label}: ...{prose[max(0, i - 40) : i + 40]}...")


def update_post(slug: str, body_html: str, excerpt: str, seo_desc: str) -> None:
    assert_no_hyphen(body_html, f"{slug} body")
    assert_no_hyphen(excerpt, f"{slug} excerpt")
    assert_no_hyphen(seo_desc, f"{slug} seo")

    path = POSTS / f"{slug}.md"
    raw = path.read_text()
    parts = raw.split("---", 2)
    if len(parts) < 3:
        raise ValueError(f"Bad frontmatter: {slug}")
    fm = parts[1]
    rest = parts[2]
    comment = ""
    m = re.match(r"\s*(<!--.*?-->)\s*", rest, re.S)
    if m:
        comment = m.group(1) + "\n\n"

    lines = fm.split("\n")
    out: list[str] = []
    in_seo = False
    for line in lines:
        if line.startswith("excerpt:"):
            # Prefer plain YAML double quotes if special chars; use single with escape
            safe = excerpt.replace("'", "''")
            out.append(f"excerpt: '{safe}'")
            continue
        if line.strip() == "seo:":
            out.append(line)
            in_seo = True
            continue
        if in_seo and line.startswith("  description:"):
            safe = seo_desc.replace("'", "''")
            out.append(f"  description: '{safe}'")
            continue
        if in_seo and line and not line.startswith(" ") and not line.startswith("\t"):
            in_seo = False
        out.append(line)

    new_fm = "\n".join(out)
    path.write_text(f"---{new_fm}---\n\n{comment}{body_html.rstrip()}\n")
    print(f"✓ {slug} ({len(body_html)} chars)")
