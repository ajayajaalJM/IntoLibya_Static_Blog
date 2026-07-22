#!/usr/bin/env tsx
/**
 * Resumable batch translation for missing locale siblings (Ollama default / OpenAI).
 * Checkpointed in `.translate-state/` — one job = one lang file.
 *
 * Examples:
 *   npm run translate:status
 *   npm run translate:missing -- --dry-run --wave 1 --limit 5
 *   npm run translate:missing -- --wave 1 --kind destinations
 *   npm run translate:missing -- --wave 1 --kind posts --limit 20
 *   npm run translate:missing -- --retry-failed
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import dotenv from 'dotenv';
import matter from 'gray-matter';
import { LANGS, type Lang } from '../src/lib/post-schema';
import type { Gallery } from '../src/lib/gallery-schema';
import {
  buildMarkdown,
  slugForLang,
  type ContentKind,
} from '../tools/blog-writer/lib/post-markdown';
import {
  getTranslateProviderInfo,
  translateFields,
  type TranslateFields,
} from '../tools/blog-writer/lib/translate-provider';
import { sanitizeHtmlNode, sanitizePlainField } from '../tools/blog-writer/lib/sanitize-html-node';
import {
  countManifestStats,
  finishLiveProgress,
  formatProgressBar,
  jobKey,
  loadState,
  printStatus,
  reconcileWithFilesystem,
  renderLiveProgress,
  resetInFlight,
  saveState,
  stateLog,
  syncProgressFromManifest,
  type ManifestEntry,
  type TranslateState,
} from './lib/translate-state';

dotenv.config();

const ROOT = process.cwd();
const LOG_PATH = path.join(ROOT, 'content-review/translate-log.md');
const NON_EN = LANGS.filter((l): l is Exclude<Lang, 'en'> => l !== 'en');
const DEFAULT_DELAY_MS = Number(process.env.TRANSLATE_DELAY_MS || 2000);
const DEFAULT_BATCH_SIZE = Number(process.env.TRANSLATE_BATCH_SIZE || 0) || undefined;
const FAILURES_BEFORE_COOLDOWN = Number(process.env.TRANSLATE_FAILURES_BEFORE_COOLDOWN || 3);
const FAILURE_COOLDOWN_MS = Number(process.env.TRANSLATE_FAILURE_COOLDOWN_MS || 30 * 60 * 1000);

const WAVES: Record<number, Exclude<Lang, 'en'>[]> = {
  1: ['es', 'de', 'fr', 'it'],
  2: ['pt', 'nl', 'pl'],
  3: ['ru'],
  4: ['ja', 'zh', 'ar'],
};

type OrderMode = 'publish' | 'alpha' | 'batch';

interface CliOptions {
  kind: 'posts' | 'destinations' | 'all';
  langs: Lang[];
  limit: number | null;
  dryRun: boolean;
  force: boolean;
  group: string | null;
  status: boolean;
  retryFailed: boolean;
  manifestOnly: boolean;
  failFast: boolean;
  wave: number | null;
  order: OrderMode;
}

interface EnSource {
  kind: ContentKind;
  translationGroup: string;
  title: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  publishedAt: string;
  featuredImage: string;
  draft: boolean;
  galleries: Gallery[];
  path: string;
}

interface TranslateJob {
  manifest: ManifestEntry;
  source: EnSource;
}

function parseArgs(argv: string[]): CliOptions {
  const hasExplicitFilters = argv.some((a) =>
    ['--kind', '--langs', '--wave', '--group', '--force', '--order'].includes(a),
  );

  const saved = !argv.includes('--no-resume') && !hasExplicitFilters ? loadState().session : null;

  const opts: CliOptions = {
    kind: saved?.kind ?? 'all',
    langs: saved?.langs?.length ? [...saved.langs] : [...NON_EN],
    limit: null,
    dryRun: argv.includes('--dry-run'),
    force: argv.includes('--force'),
    group: saved?.group ?? null,
    status: argv.includes('--status'),
    retryFailed: argv.includes('--retry-failed'),
    manifestOnly: argv.includes('--manifest-only'),
    failFast: argv.includes('--fail-fast'),
    wave: saved?.wave ?? null,
    order: saved?.order ?? 'publish',
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') continue;
    else if (arg === '--force') opts.force = true;
    else if (arg === '--status') continue;
    else if (arg === '--retry-failed') continue;
    else if (arg === '--manifest-only') continue;
    else if (arg === '--fail-fast') continue;
    else if (arg === '--no-resume') continue;
    else if (arg === '--kind') {
      const v = argv[++i];
      if (v !== 'posts' && v !== 'destinations' && v !== 'all') {
        throw new Error(`Invalid --kind ${v}. Use posts|destinations|all`);
      }
      opts.kind = v;
    } else if (arg === '--langs') {
      const raw = argv[++i] ?? '';
      const parts = raw.split(',').map((s) => s.trim()).filter(Boolean) as Lang[];
      for (const lang of parts) {
        if (!NON_EN.includes(lang as Exclude<Lang, 'en'>)) {
          throw new Error(`Invalid lang "${lang}". Use one of: ${NON_EN.join(', ')}`);
        }
      }
      opts.langs = parts;
      opts.wave = null;
    } else if (arg === '--wave') {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || !WAVES[n]) {
        throw new Error(`Invalid --wave ${argv[i]}. Use 1|2|3|4`);
      }
      opts.wave = n;
      opts.langs = [...WAVES[n]];
    } else if (arg === '--order') {
      const v = argv[++i] as OrderMode;
      if (v !== 'publish' && v !== 'alpha' && v !== 'batch') {
        throw new Error(`Invalid --order ${v}. Use publish|alpha|batch`);
      }
      opts.order = v;
    } else if (arg === '--limit') {
      const n = Number(argv[++i]);
      if (!Number.isFinite(n) || n < 1) throw new Error('--limit must be a positive number');
      opts.limit = Math.floor(n);
    } else if (arg === '--group') {
      opts.group = argv[++i] ?? null;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!opts.langs.length) throw new Error('No target languages specified');
  return opts;
}

function printHelp() {
  console.log(`Usage: npm run translate:missing -- [options]

Options:
  --status                        Show checkpoint progress and exit
  --manifest-only                 Rebuild manifest + reconcile; no translation
  --kind posts|destinations|all   Content to scan (default: all)
  --wave 1|2|3|4                  Preset language sets from runbook
  --langs es,de,fr                Target languages (overrides --wave)
  --order publish|alpha|batch     Job ordering (default: publish — live calendar asc, then upcoming)
  --limit N                       Max jobs (locale files) this run
  --group <translationGroup>      Only this translation group
  --retry-failed                  Only re-attempt failed jobs
  --dry-run                       List next jobs without calling the model
  --force                         Re-translate even if locale file exists
  --fail-fast                     Stop on first failure
  --no-resume                     Do not reuse saved session filters
  --help                          Show this help

Env:
  TRANSLATE_BATCH_SIZE            Default job cap when --limit omitted
  TRANSLATE_DELAY_MS              Pause between jobs (default: 2000)
  TRANSLATE_FAILURES_BEFORE_COOLDOWN  Consecutive failures before a break (default: 3)
  TRANSLATE_FAILURE_COOLDOWN_MS     Break duration in ms (default: 1800000 = 30 min)
`);
}

function formatCooldownRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}m ${sec.toString().padStart(2, '0')}s`;
}

async function cooldownAfterFailures(args: {
  consecutiveFailures: number;
  lastKey: string;
  overallCompleted: number;
  overallTotal: number;
  runDone: number;
  runTotal: number;
}) {
  const minutes = Math.round(FAILURE_COOLDOWN_MS / 60000);
  const msg = `${args.consecutiveFailures} consecutive failures — pausing ${minutes} min (last: ${args.lastKey})`;
  finishLiveProgress();
  console.log(`\n${msg}`);
  stateLog(`COOLDOWN ${msg}`);
  await appendLog(`- ${new Date().toISOString()} COOLDOWN ${msg}`);

  const endsAt = Date.now() + FAILURE_COOLDOWN_MS;
  while (Date.now() < endsAt) {
    const remaining = endsAt - Date.now();
    renderLiveProgress({
      overallCompleted: args.overallCompleted,
      overallTotal: args.overallTotal,
      runDone: args.runDone,
      runTotal: args.runTotal,
      currentJob: `cooldown ${formatCooldownRemaining(remaining)}`,
      label: '⏸',
    });
    await sleep(Math.min(30_000, remaining));
  }

  finishLiveProgress();
  console.log('Cooldown complete — resuming.\n');
  stateLog('COOLDOWN complete — resuming');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function listMarkdown(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isFile() && e.name.endsWith('.md')).map((e) => path.join(dir, e.name));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
}

async function loadEnSources(kind: ContentKind): Promise<EnSource[]> {
  const dirName = kind === 'post' ? 'posts' : 'destinations';
  const enDir = path.join(ROOT, 'src/content', dirName, 'en');
  const files = await listMarkdown(enDir);
  const sources: EnSource[] = [];

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(raw);
    const translationGroup = String(data.translationGroup ?? data.slug ?? '').trim();
    const title = String(data.title ?? '').trim();
    const featuredImage = String(data.featuredImage ?? '').trim();
    if (!translationGroup || !title || !content.trim()) continue;
    if (!featuredImage) {
      console.warn(`Skipping ${filePath}: missing featuredImage`);
      continue;
    }

    const seo = (data.seo ?? {}) as { title?: string; description?: string };
    sources.push({
      kind,
      translationGroup,
      title,
      body: content.trim(),
      seoTitle: String(seo.title ?? title).trim(),
      seoDescription: String(seo.description ?? '').trim(),
      publishedAt: String(data.publishedAt ?? '').slice(0, 10) || new Date().toISOString().slice(0, 10),
      featuredImage,
      draft: Boolean(data.draft),
      galleries: Array.isArray(data.galleries) ? (data.galleries as Gallery[]) : [],
      path: path.relative(ROOT, filePath),
    });
  }

  return sources;
}

function localePath(kind: ContentKind, lang: Lang, translationGroup: string): string {
  const dirName = kind === 'post' ? 'posts' : 'destinations';
  const slug = slugForLang(translationGroup, lang);
  return path.join(ROOT, 'src/content', dirName, lang, `${slug}.md`);
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadBatchPriority(): Promise<Map<string, number>> {
  const priority = new Map<string, number>();
  const batchFiles = [
    'content-review/batch-a-posts.md',
    'content-review/batch-b-posts.md',
    'content-review/batch-c-posts.md',
    'content-review/next-200-seo-blog-posts.md',
  ];
  let rank = 0;
  for (const rel of batchFiles) {
    const filePath = path.join(ROOT, rel);
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      const matches = raw.matchAll(/src\/content\/posts\/en\/([a-z0-9-]+)\.md/g);
      for (const match of matches) {
        const slug = match[1];
        if (!priority.has(slug)) {
          priority.set(slug, rank++);
        }
      }
    } catch {
      // optional ordering source
    }
  }
  return priority;
}

function kindRank(kind: ContentKind): number {
  return kind === 'destination' ? 0 : 1;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Live posts first (calendar asc), then upcoming schedule (soonest first), then drafts. */
function publishBucket(source: EnSource, today: string): 0 | 1 | 2 {
  if (source.draft) return 2;
  if (source.publishedAt <= today) return 0;
  return 1;
}

function sortSources(sources: EnSource[], order: OrderMode, batchPriority: Map<string, number>): EnSource[] {
  const today = todayIso();
  return [...sources].sort((a, b) => {
    const kindDiff = kindRank(a.kind) - kindRank(b.kind);
    if (kindDiff !== 0) return kindDiff;

    if (order === 'publish') {
      const bucketDiff = publishBucket(a, today) - publishBucket(b, today);
      if (bucketDiff !== 0) return bucketDiff;
      const dateDiff = a.publishedAt.localeCompare(b.publishedAt);
      if (dateDiff !== 0) return dateDiff;
    } else if (order === 'batch') {
      const aRank = batchPriority.get(a.translationGroup) ?? Number.MAX_SAFE_INTEGER;
      const bRank = batchPriority.get(b.translationGroup) ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
    }

    return a.translationGroup.localeCompare(b.translationGroup);
  });
}

async function buildManifest(
  opts: CliOptions,
): Promise<{ manifest: ManifestEntry[]; sources: Map<string, EnSource>; skippedExisting: number }> {
  const kinds: ContentKind[] =
    opts.kind === 'all' ? ['destination', 'post'] : opts.kind === 'posts' ? ['post'] : ['destination'];

  const allSources: EnSource[] = [];
  for (const kind of kinds) {
    allSources.push(...(await loadEnSources(kind)));
  }

  const batchPriority = opts.order === 'batch' ? await loadBatchPriority() : new Map<string, number>();
  const filtered = allSources.filter((s) => !opts.group || s.translationGroup === opts.group);
  const sorted = sortSources(filtered, opts.order, batchPriority);

  const sources = new Map<string, EnSource>();
  const manifest: ManifestEntry[] = [];
  let skippedExisting = 0;

  for (const source of sorted) {
    sources.set(`${source.kind}:${source.translationGroup}`, source);
    for (const lang of opts.langs) {
      if (lang === 'en') continue;
      const outPath = localePath(source.kind, lang, source.translationGroup);
      const exists = await fileExists(outPath);
      if (exists && !opts.force) {
        skippedExisting += 1;
        continue;
      }

      manifest.push({
        key: jobKey(source.kind, source.translationGroup, lang),
        kind: source.kind,
        translationGroup: source.translationGroup,
        lang,
        publishedAt: source.publishedAt,
        outPath,
        enPath: path.join(ROOT, source.path),
      });
    }
  }

  return { manifest, sources, skippedExisting };
}

function applySession(state: TranslateState, opts: CliOptions) {
  state.session = {
    kind: opts.kind,
    langs: opts.langs,
    wave: opts.wave,
    order: opts.order,
    group: opts.group,
    force: opts.force,
    updatedAt: new Date().toISOString(),
  };
}

async function appendLog(line: string) {
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  try {
    await fs.access(LOG_PATH);
  } catch {
    await fs.writeFile(
      LOG_PATH,
      '# Translation log\n\nAppended by `npm run translate:missing`.\n\n',
      'utf8',
    );
  }
  await fs.appendFile(LOG_PATH, `${line}\n`, 'utf8');
}

async function selectJobs(
  state: TranslateState,
  opts: CliOptions,
  sources: Map<string, EnSource>,
): Promise<TranslateJob[]> {
  const jobs: TranslateJob[] = [];

  for (const entry of state.manifest) {
    const progress = state.progress[entry.key];
    if (!progress) continue;

    if (!opts.force && (await fileExists(entry.outPath))) {
      if (progress.status !== 'completed') {
        progress.status = 'completed';
        progress.outPath = entry.outPath;
        progress.completedAt = progress.completedAt ?? new Date().toISOString();
        progress.error = undefined;
      }
      continue;
    }

    if (opts.retryFailed) {
      if (progress.status !== 'failed') continue;
    } else if (progress.status === 'completed' || progress.status === 'skipped') {
      continue;
    } else if (progress.status === 'failed' && !opts.force) {
      continue;
    }

    const source = sources.get(`${entry.kind}:${entry.translationGroup}`);
    if (!source) continue;
    jobs.push({ manifest: entry, source });
  }

  return jobs;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const { manifest, sources, skippedExisting } = await buildManifest(opts);

  let state = loadState();
  state.manifest = manifest;
  syncProgressFromManifest(state);
  reconcileWithFilesystem(state);
  resetInFlight(state);
  applySession(state, opts);
  saveState(state);

  if (opts.status || opts.manifestOnly) {
    printStatus(state);
    if (opts.manifestOnly) {
      console.log(`Manifest rebuilt: ${manifest.length} jobs`);
    }
    return;
  }

  let providerInfo: {
    provider: string;
    model: string;
    fallbackModel?: string;
    baseUrl: string;
  } | null = null;
  if (!opts.dryRun) {
    try {
      providerInfo = getTranslateProviderInfo();
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  let jobs = await selectJobs(state, opts, sources);
  saveState(state);
  const runLimit = opts.limit ?? DEFAULT_BATCH_SIZE;
  if (runLimit != null && runLimit > 0) {
    jobs = jobs.slice(0, runLimit);
  }

  const stats = countManifestStats(state);
  const providerLabel = providerInfo
    ? providerInfo.fallbackModel
      ? `${providerInfo.provider} / ${providerInfo.model} → ${providerInfo.fallbackModel}`
      : `${providerInfo.provider} / ${providerInfo.model}`
    : '';
  console.log(`Provider: ${opts.dryRun ? '(dry-run, no model call)' : providerLabel}`);
  if (skippedExisting > 0) {
    console.log(`Existing locale files skipped: ${skippedExisting} (will not overwrite)`);
  } else if (!opts.force) {
    console.log('Only missing locale files will be created (use --force to overwrite)');
  }
  console.log(`Missing jobs in queue: ${manifest.length}`);
  console.log(`Progress: ${formatProgressBar(stats.completed, stats.total)}`);
  console.log(`Jobs this run: ${jobs.length}`);
  if (opts.retryFailed) console.log('Mode: retry-failed only');

  if (opts.dryRun) {
    for (const job of jobs) {
      console.log(`  - ${job.manifest.key} (${job.manifest.publishedAt})`);
    }
    console.log('Dry run complete. No files written.');
    return;
  }

  if (!jobs.length) {
    printStatus(state);
    console.log('Nothing to do.');
    return;
  }

  let ok = 0;
  let failed = 0;
  let skipped = 0;
  let consecutiveFailures = 0;
  const stamp = new Date().toISOString();

  renderLiveProgress({
    overallCompleted: stats.completed,
    overallTotal: stats.total,
    runDone: 0,
    runTotal: jobs.length,
    currentJob: 'starting…',
  });

  for (const [index, job] of jobs.entries()) {
    const { manifest: entry, source } = job;
    const progress = state.progress[entry.key];
    if (!progress) continue;

    if (!opts.force && (await fileExists(entry.outPath))) {
      progress.status = 'completed';
      progress.outPath = entry.outPath;
      progress.completedAt = progress.completedAt ?? new Date().toISOString();
      progress.error = undefined;
      saveState(state);
      skipped += 1;
      const liveStats = countManifestStats(state);
      renderLiveProgress({
        overallCompleted: liveStats.completed,
        overallTotal: liveStats.total,
        runDone: index + 1,
        runTotal: jobs.length,
        currentJob: `skipped (exists) ${entry.key}`,
      });
      continue;
    }

    progress.status = 'in_progress';
    progress.attempts = (progress.attempts ?? 0) + 1;
    progress.lastAttemptAt = stamp;
    saveState(state);

    renderLiveProgress({
      overallCompleted: countManifestStats(state).completed,
      overallTotal: stats.total,
      runDone: index,
      runTotal: jobs.length,
      currentJob: entry.key,
    });

    const input: TranslateFields = {
      title: source.title,
      body: source.body,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
    };

    try {
      const translations = await translateFields(input, { targets: [entry.lang] });
      const item = translations[entry.lang];
      if (!item?.title || !item?.body) {
        throw new Error(`Missing translation payload for ${entry.lang}`);
      }

      const draft = {
        lang: entry.lang,
        title: sanitizePlainField(item.title),
        body: sanitizeHtmlNode(item.body),
        seoTitle: sanitizePlainField(item.seoTitle || item.title),
        seoDescription: sanitizePlainField(item.seoDescription || ''),
      };

      const generated = buildMarkdown(draft, source.translationGroup, {
        publishedAt: source.publishedAt,
        translationGroup: source.translationGroup,
        featuredImage: source.featuredImage,
        galleries: source.galleries,
        contentKind: source.kind,
        draft: source.draft || undefined,
      });

      const abs = path.join(ROOT, generated.path);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, generated.md, 'utf8');

      progress.status = 'completed';
      progress.completedAt = new Date().toISOString();
      progress.outPath = abs;
      progress.error = undefined;
      saveState(state);

      ok += 1;
      consecutiveFailures = 0;
      stateLog(`OK ${entry.key} → ${generated.path}`);
      await appendLog(
        `- ${stamp} OK ${generated.path} (${providerInfo?.provider}/${providerInfo?.model})`,
      );
    } catch (err) {
      failed += 1;
      consecutiveFailures += 1;
      const message = err instanceof Error ? err.message : String(err);
      progress.status = 'failed';
      progress.error = message;
      saveState(state);

      stateLog(`FAIL ${entry.key}: ${message}`);
      await appendLog(`- ${stamp} FAIL ${entry.key}: ${message}`);

      if (opts.failFast) {
        finishLiveProgress();
        console.log('Stopping (--fail-fast).');
        break;
      }

      const liveStatsAfterFail = countManifestStats(state);
      if (
        consecutiveFailures >= FAILURES_BEFORE_COOLDOWN &&
        FAILURE_COOLDOWN_MS > 0
      ) {
        await cooldownAfterFailures({
          consecutiveFailures,
          lastKey: entry.key,
          overallCompleted: liveStatsAfterFail.completed,
          overallTotal: stats.total,
          runDone: index + 1,
          runTotal: jobs.length,
        });
        consecutiveFailures = 0;
      }
    }

    const liveStats = countManifestStats(state);
    renderLiveProgress({
      overallCompleted: liveStats.completed,
      overallTotal: liveStats.total,
      runDone: index + 1,
      runTotal: jobs.length,
      currentJob: entry.key,
    });

    if (index < jobs.length - 1 && DEFAULT_DELAY_MS > 0) {
      await sleep(DEFAULT_DELAY_MS);
    }
  }

  finishLiveProgress();
  state = loadState();
  printStatus(state);
  console.log(`Done. Wrote ${ok} files. Skipped (already exist): ${skipped}. Failures: ${failed}.`);
  console.log(`Log: ${path.relative(ROOT, LOG_PATH)}`);
  if (failed > 0) process.exit(1);
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1]!)).href;

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
