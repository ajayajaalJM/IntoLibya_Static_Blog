# Mac Mini translation runbook

Run **overnight translation batches only on the 16GB Mac Mini**. The Cursor/dev machine ships tooling to `main`; this machine pulls and executes.

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

## Dry-run (no model calls)

```bash
npm run translate:missing -- --dry-run --langs es --limit 5
npm run translate:missing -- --dry-run --kind destinations --langs de
```

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

Run one language (or a small set) at a time so you can QA between waves.

| Wave | Command |
|------|---------|
| 1 — EU high traffic | `npm run translate:missing -- --langs es,de,fr,it` |
| 2 — Other European | `npm run translate:missing -- --langs pt,nl,pl` |
| 3 — Russian | `npm run translate:missing -- --langs ru` |
| 4 — Harder pairs | `npm run translate:missing -- --langs ja,zh,ar` |

Optional: start a wave with `--limit 5`, then re-run without `--limit` (existing files are skipped unless `--force`).

Destinations after posts wave 1 (or anytime):

```bash
npm run translate:missing -- --kind destinations --langs es,de,fr,it
```

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

- Resume-safe: locale files that already exist are skipped (use `--force` to overwrite).
- Progress / failures append to `content-review/translate-log.md`.
- Do not run the full backlog on an 8GB machine; use the 16GB Mini with `qwen2.5:14b`.
