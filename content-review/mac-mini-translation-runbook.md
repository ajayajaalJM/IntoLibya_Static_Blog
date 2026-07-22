# Mac Mini translation runbook

Run **overnight translation batches only on the 16GB Mac Mini**. The Cursor/dev machine ships tooling to `main`; this machine pulls and executes.

Progress is checkpointed in `.translate-state/` (gitignored). Re-run the same command after a crash or Ctrl+C — completed locale files are skipped automatically.

## Prerequisites

- Node.js ≥ 22.12
- [Ollama](https://ollama.com) installed
- Git remote access to this repo

## One-time setup

```bash
git fetch origin
git checkout main
git pull origin main
npm install
cp .env.example .env
# Confirm in .env:
#   TRANSLATE_PROVIDER=ollama
#   OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
#   OLLAMA_MODEL=qwen2.5:14b
ollama pull qwen2.5:14b
```

Ensure Ollama is running (`ollama serve` if needed).

## Before each session

```bash
git pull origin main
npm install
```

## Check backlog

```bash
npm run translate:status
```

Shows completed / pending / failed counts for the current filter set. After your first run, bare `npm run translate:missing` resumes using the saved session filters (wave, langs, kind).

## Dry-run (no model calls)

```bash
npm run translate:missing -- --dry-run --wave 1 --limit 5
npm run translate:missing -- --dry-run --kind destinations --langs de
```

Jobs are ordered **destinations first**, then posts, each sorted by earliest `publishedAt`.

## Pilot (recommended before a full wave)

Translate one known post into Spanish and Arabic, then eyeball HTML + tone:

```bash
npm run translate:missing -- --group can-tourists-go-to-libya --langs es,ar
```

Review:

- `src/content/posts/es/can-tourists-go-to-libya-es.md`
- `src/content/posts/ar/can-tourists-go-to-libya-ar.md`

Check that headings, links, and IntoLibya / place names look right. If structural checks fail, the CLI retries once and logs failures to `content-review/translate-log.md`.

## Production waves

Run one language wave at a time. **Translate destinations first**, then posts.

| Wave | Languages |
|------|-----------|
| 1 — EU high traffic | `es, de, fr, it` |
| 2 — Other European | `pt, nl, pl` |
| 3 — Russian | `ru` |
| 4 — Harder pairs | `ja, zh, ar` |

### Wave 1 — destinations (48 jobs)

All 12 untranslated destinations × 4 langs:

```bash
npm run translate:missing -- --wave 1 --kind destinations
```

### Wave 1 — posts (chunk overnight)

1,600 jobs total (400 posts × 4 langs). Use `--limit` for manageable chunks:

```bash
npm run translate:missing -- --wave 1 --kind posts --limit 20
```

After Ctrl+C or a crash, re-run the **same command** — completed files are skipped:

```bash
npm run translate:missing -- --wave 1 --kind posts --limit 20
```

Retry failures only:

```bash
npm run translate:missing -- --wave 1 --retry-failed
```

Optional env throttling (between jobs):

```bash
TRANSLATE_BATCH_SIZE=10 TRANSLATE_DELAY_MS=2000 npm run translate:missing -- --wave 1 --kind posts
```

After **3 consecutive failures**, the batch pauses **30 minutes** then continues automatically (for unattended overnight runs). Override via env:

```bash
TRANSLATE_FAILURES_BEFORE_COOLDOWN=3
TRANSLATE_FAILURE_COOLDOWN_MS=1800000
```

## Unattended overnight (posts, wave 1)

```bash
npm run translate:missing -- --kind posts --wave 1
```

No `--limit` — runs until the queue is done, skipping existing files, pausing on failure streaks. Re-run the same command after a full stop to pick up anything left:

```bash
npm run translate:missing -- --kind posts --wave 1 --retry-failed
```

## CLI reference

| Flag | Behavior |
|------|----------|
| `--status` | Progress bar + recent failures |
| `--dry-run` | List next jobs without model calls |
| `--limit N` | Max jobs (locale files) this run |
| `--wave 1\|2\|3\|4` | Preset langs from table above |
| `--kind destinations\|posts\|all` | Content filter |
| `--order publish\|alpha\|batch` | Job ordering (default: publish date) |
| `--retry-failed` | Re-attempt failed jobs only |
| `--group <slug>` | Single translation group |
| `--force` | Overwrite existing locale files |
| `--manifest-only` | Rebuild checkpoint manifest, no translation |

## After each wave

1. Spot-check ~5 random posts (extra care on `ja` / `zh` / `ar`)
2. `npm run validate:urls`
3. Commit and push translated markdown so other machines stay in sync:

```bash
git status
git add src/content/posts src/content/destinations content-review/translate-log.md
git commit -m "$(cat <<'EOF'
Add locale translations for <langs> wave.

EOF
)"
git push origin main
```

## Writer UI (optional)

```bash
npm run writer
```

Open http://localhost:5174 — **Translate & save all** uses the same Ollama provider (`TRANSLATE_PROVIDER=ollama`). Useful for single-post edits; use `translate:missing` for the backlog.

## Notes

- One job = one locale file. Each success is written and checkpointed immediately.
- Partial group failure no longer loses sibling langs (unlike the old batch-per-group behavior).
- Human-readable log: `content-review/translate-log.md`. Machine log: `.translate-state/translate.log`.
- Do not run the full backlog on an 8GB machine; use the 16GB Mini with `qwen2.5:14b`.
