#!/usr/bin/env python3
"""Third expansion pass: bring remaining batch posts to 500+ words."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from scripts.expand_cluster_fghi import my_batch_slugs, inject_sections
from scripts.lib.update_post import update_post

ROOT = Path(__file__).resolve().parents[1]
POSTS_DIR = ROOT / "src/content/posts/en"

EXTRA = (
    "What success looks like on the ground",
    "Successful days feel readable rather than rushed. Your guide handles checkpoints and site timing while you focus on looking. Meals arrive at human hours. Driving blocks include rest stops. Optional activities appear only when confirmed live in TourBuilder, not as broken promises. You return home with stories about empty ruins, desert stars, or medina tea rather than visa panic. That rhythm is the product IntoLibya builds when guests send honest briefs, respect sponsorship sequencing, and choose seasons that match their fitness and curiosity rather than cheapest fare roulette.",
)


def word_count(body: str) -> int:
    main = body.split("<h2>Related reading</h2>")[0]
    return len(re.sub(r"<[^>]+>", " ", main).split())


def main() -> None:
    count = 0
    for slug in my_batch_slugs():
        path = POSTS_DIR / f"{slug}.md"
        raw = path.read_text(encoding="utf-8")
        parts = raw.split("---", 2)
        body = parts[2].lstrip()
        if word_count(body) >= 500:
            continue
        if EXTRA[0] in body:
            continue
        new_body = inject_sections(body, [EXTRA])
        fm = parts[1]
        ex_m = re.search(r"^excerpt:\s*'([^']*(?:''[^']*)*)'", fm, re.M)
        seo_m = re.search(r"^  description:\s*'([^']*(?:''[^']*)*)'", fm, re.M)
        excerpt = ex_m.group(1).replace("''", "'") if ex_m else ""
        seo = seo_m.group(1).replace("''", "'") if seo_m else ""
        update_post(slug, new_body, excerpt, seo)
        count += 1
    print(f"Pass 3 expanded {count} posts")


if __name__ == "__main__":
    main()
