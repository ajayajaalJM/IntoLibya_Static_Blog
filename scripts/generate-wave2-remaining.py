#!/usr/bin/env python3
"""
DISABLED permanently.

This script used to dump catalog Notes columns and SME planning boilerplate
into live guest articles (e.g. "Closing east sampler. Soft CTA. Accessible east."
plus "Hotels stay vague on purpose… SME confirmation…").

Wave 2 bodies already exist under src/content/posts/en/.
Do not revive this generator. Edit posts directly, or use guest-voice rewrite
tools that never inject catalog Notes.

Gate: scripts/lint-post-guest-prose.py (npm run lint:posts / prebuild).
"""
from __future__ import annotations

import sys

sys.stderr.write(
    "ERROR: scripts/generate-wave2-remaining.py is permanently disabled.\n"
    "It previously injected catalog Notes and SME boilerplate into guest articles.\n"
    "Edit posts under src/content/posts/en/ instead.\n"
)
sys.exit(2)
