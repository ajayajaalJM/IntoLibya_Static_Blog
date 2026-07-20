#!/usr/bin/env python3
"""
Fail the build if published post/destination markdown contains planning jargon.

Catalog Notes (Soft CTA, SME confirm, Hotels stay vague, etc.) must never appear
in guest-facing bodies. This gate is the permanent backstop after Wave 2 generator
bugs dumped Notes into articles.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCAN_ROOTS = [
    ROOT / "src/content/posts",
    ROOT / "src/content/destinations",
]

# Patterns that mean "internal planning leaked into guest copy"
FORBIDDEN = [
    (r"(?i)\bSoft CTA\b", "Soft CTA (planning jargon)"),
    (r"(?i)\bSoft next step\b", "Soft next step (planning jargon)"),
    (r"(?i)\bNext step:", "Next step: (planning jargon prefix)"),
    (r"(?i)\bTraveler angle\b", "Traveler angle (template heading)"),
    (r"(?i)\bSME confirm\b", "SME confirm (internal flag)"),
    (r"(?i)\bSME review\b", "SME review (internal flag)"),
    (r"(?i)\bSME confirmation\b", "SME confirmation (internal flag)"),
    (r"(?i)when notes flag uncertainty", "notes flag uncertainty (generator boilerplate)"),
    (r"(?i)Hotels stay vague on purpose", "Hotels stay vague on purpose (generator boilerplate)"),
    (r"(?i)Access is guided and licensed\. Hotels stay vague", "Access/hotels SME boilerplate"),
    (r"(?i)\bdestination SEO\b", "destination SEO (shop talk)"),
    (r"(?i)\bsupports destination SEO\b", "supports destination SEO"),
    (r"(?i)\bmicro content\b", "micro content (shop talk)"),
    (r"(?i)\bsoft CTAs\b", "soft CTAs (shop talk)"),
    (r"(?i)answers the search around", "answers the search around (SEO template)"),
    (r"(?i)Why this place earns its own page", "Why this place earns its own page (SEO template)"),
    (r"(?i)\bearns its own page\b", "earns its own page (SEO template)"),
    (r"(?i)Closing east sampler", "Closing east sampler (catalog Notes)"),
    (r"(?i)\bAccessible east\b", "Accessible east (catalog Notes)"),
    (r"(?i)\bguest facing version\b", "guest facing version (meta shop talk)"),
    (r"(?i)\bpackage bones\b", "package bones (shop talk)"),
    (r"(?i)\bWave 1\b", "Wave 1 (internal content wave label)"),
    (r"(?i)\bWave 2\b", "Wave 2 (internal content wave label)"),
    (r"(?i)send us a note\b", "send us a note (email CTA)"),
    (r"(?i)send a short note\b", "send a short note (email CTA)"),
    (r"<!--\s*primary-keyword", "primary-keyword HTML comment in body"),
    (r"<!--\s*cdn-refs", "cdn-refs HTML comment in body"),
    # Stamp metaphors / shared Wave 2 boilerplate
    (r"(?i)sounds like a packing list", "packing list metaphor (stale stamp)"),
    (r"(?i)discovery with adult supervision", "adult supervision metaphor (stale stamp)"),
    (r"(?i)plastic pyramid", "plastic pyramid metaphor (stale stamp)"),
    (r"(?i)Mint tea after dusty shoes", "mint tea stamp metaphor"),
    (r"(?i)Why guests say they will come back", "Why guests say they will come back (stale h2)"),
    (r"(?i)Little joys that do not show up", "Little joys packing list (stale h2)"),
    (r"(?i)Beauty plus a workable plan", "Beauty plus workable plan (stale closer)"),
    (r"(?i)That is the whole pitch", "whole pitch closer (stale stamp)"),
    (r"(?i)Here is the honest version from the IntoLibya team", "honest version stamp opener"),
]


def visible_text(raw: str) -> str:
    """Body after frontmatter, with HTML comments stripped for phrase checks
    that are not themselves comment bans. Comment bans still scan raw body."""
    if raw.count("---") >= 2:
        return raw.split("---", 2)[2]
    return raw


def main() -> int:
    failures: list[str] = []
    files_scanned = 0

    for root in SCAN_ROOTS:
        if not root.exists():
            continue
        for path in sorted(root.rglob("*.md")):
            files_scanned += 1
            raw = path.read_text(encoding="utf-8")
            body = visible_text(raw)
            rel = path.relative_to(ROOT)
            for pat, label in FORBIDDEN:
                # Comment-specific rules scan body including comments
                haystack = body
                m = re.search(pat, haystack)
                if m:
                    start = max(0, m.start() - 40)
                    end = min(len(haystack), m.end() + 60)
                    snip = haystack[start:end].replace("\n", " ")
                    failures.append(f"{rel}: {label}\n    …{snip}…")

    if failures:
        print(f"lint-post-guest-prose: FAILED ({len(failures)} hit(s) in {files_scanned} files)\n")
        for f in failures:
            print(f"  {f}\n")
        print(
            "Guest-facing posts must not contain catalog Notes, SME flags, or SEO template jargon.\n"
            "Fix the article prose. Do not re-run scripts/generate-wave2-remaining.py."
        )
        return 1

    print(f"lint-post-guest-prose: OK ({files_scanned} files, 0 forbidden phrases)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
