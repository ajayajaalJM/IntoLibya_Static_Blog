#!/usr/bin/env python3
"""Second expansion pass for cluster F/G/H/I posts still under 500 words."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.expand_cluster_fghi import my_batch_slugs, inject_sections
from scripts.lib.update_post import update_post

ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "src/content/posts/en"

FINAL_SECTION = (
    "Closing practical notes for your dates",
    "Open TourBuilder with must sees ranked honestly, not as a vague wish list. Deposit early enough for sponsorship letters and eVisa batches before anyone buys rigid flights. Share passport names exactly as printed, mobility limits, and dietary needs in writing. Read your government advisory and buy insurance that actually covers Libya on a licensed tour when possible. Pack modest city clothing, sun protection, and layers for highland or desert nights depending on route shape. Libya rewards guests who plan documents first and treat guides as partners in a readable day rhythm rather than obstacles to freestyle travel.",
)


def word_count(body: str) -> int:
    main = body.split("<h2>Related reading</h2>")[0]
    text = re.sub(r"<[^>]+>", " ", main)
    return len(text.split())


def main() -> None:
    count = 0
    for slug in my_batch_slugs():
        path = POSTS_DIR / f"{slug}.md"
        raw = path.read_text(encoding="utf-8")
        parts = raw.split("---", 2)
        body = parts[2].lstrip()
        if word_count(body) >= 500:
            continue
        if FINAL_SECTION[0] in body:
            continue
        new_body = inject_sections(body, [FINAL_SECTION])
        fm = parts[1]
        ex_m = re.search(r"^excerpt:\s*'([^']*(?:''[^']*)*)'", fm, re.M)
        seo_m = re.search(r"^  description:\s*'([^']*(?:''[^']*)*)'", fm, re.M)
        excerpt = ex_m.group(1).replace("''", "'") if ex_m else ""
        seo = seo_m.group(1).replace("''", "'") if seo_m else ""
        update_post(slug, new_body, excerpt, seo)
        count += 1
    print(f"Pass 2 expanded {count} posts")


if __name__ == "__main__":
    main()
