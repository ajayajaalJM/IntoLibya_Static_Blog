#!/usr/bin/env tsx
/**
 * Translate missing locale siblings for EN posts/destinations via Ollama (default)
 * or OpenAI. Designed to run on the Mac Mini after pulling latest main.
 *
 * Examples:
 *   npm run translate:missing -- --dry-run
 *   npm run translate:missing -- --langs es --limit 5
 *   npm run translate:missing -- --kind destinations --langs de,fr
 *   npm run translate:missing -- --group can-tourists-go-to-libya --langs es,ar
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

dotenv.config();

const ROOT = process.cwd();
const LOG_PATH = path.join(ROOT, 'content-review/translate-log.md');
const NON_EN = LANGS.filter((l): l is Exclude<Lang, 'en'> => l !== 'en');

interface CliOptions {
  kind: 'posts' | 'destinations' | 'all';
  langs: Lang[];
  limit: number | null;
  dryRun: boolean;
  force: boolean;
  group: string | null;
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

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    kind: 'all',
    langs: [...NON_EN],
    limit: null,
    dryRun: false,
    force: false,
    group: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--force') opts.force = true;
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
  --kind posts|destinations|all   Content to scan (default: all)
  --langs es,de,fr                Target languages (default: all non-en)
  --limit N                       Max EN sources to process
  --group <translationGroup>      Only this translation group
  --dry-run                       List work without calling the model
  --force                         Re-translate even if locale file exists
  --help                          Show this help
`);
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

  return sources.sort((a, b) => a.translationGroup.localeCompare(b.translationGroup));
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

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  let providerInfo: { provider: string; model: string; baseUrl: string } | null = null;
  if (!opts.dryRun) {
    try {
      providerInfo = getTranslateProviderInfo();
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }

  const kinds: ContentKind[] =
    opts.kind === 'all' ? ['post', 'destination'] : opts.kind === 'posts' ? ['post'] : ['destination'];

  const sources: EnSource[] = [];
  for (const kind of kinds) {
    sources.push(...(await loadEnSources(kind)));
  }

  const filtered = sources.filter((s) => {
    if (opts.group && s.translationGroup !== opts.group) return false;
    return true;
  });

  type Job = { source: EnSource; lang: Lang; outPath: string };
  const jobs: Job[] = [];

  for (const source of filtered) {
    for (const lang of opts.langs) {
      const outPath = localePath(source.kind, lang, source.translationGroup);
      const exists = await fileExists(outPath);
      if (exists && !opts.force) continue;
      jobs.push({ source, lang, outPath });
    }
  }

  // Apply --limit to unique EN sources that have at least one job
  const byGroup = new Map<string, Job[]>();
  for (const job of jobs) {
    const key = `${job.source.kind}:${job.source.translationGroup}`;
    const list = byGroup.get(key) ?? [];
    list.push(job);
    byGroup.set(key, list);
  }

  let selectedGroups = [...byGroup.entries()];
  if (opts.limit != null) {
    selectedGroups = selectedGroups.slice(0, opts.limit);
  }
  const selectedJobs = selectedGroups.flatMap(([, list]) => list);

  console.log(`Provider: ${opts.dryRun ? '(dry-run, no model call)' : `${providerInfo?.provider} / ${providerInfo?.model}`}`);
  console.log(`EN sources scanned: ${filtered.length}`);
  console.log(`Missing (or forced) locale files: ${jobs.length}`);
  console.log(`Jobs this run: ${selectedJobs.length} across ${selectedGroups.length} groups`);
  if (opts.dryRun) {
    for (const [key, list] of selectedGroups) {
      const langs = list.map((j) => j.lang).join(',');
      console.log(`  - ${key} → ${langs}`);
    }
    console.log('Dry run complete. No files written.');
    return;
  }

  let ok = 0;
  let failed = 0;
  const stamp = new Date().toISOString();

  for (const [groupIndex, [key, list]] of selectedGroups.entries()) {
    const source = list[0].source;
    console.log(`\n[${groupIndex + 1}/${selectedGroups.length}] ${key}`);

    const input: TranslateFields = {
      title: source.title,
      body: source.body,
      seoTitle: source.seoTitle,
      seoDescription: source.seoDescription,
    };

    const targetLangs = list.map((j) => j.lang);

    try {
      const translations = await translateFields(input, { targets: targetLangs });

      for (const job of list) {
        const item = translations[job.lang];
        if (!item?.title || !item?.body) {
          throw new Error(`Missing translation payload for ${job.lang}`);
        }

        const draft = {
          lang: job.lang,
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
        ok += 1;
        console.log(`  ✓ ${generated.path}`);
        await appendLog(
          `- ${stamp} OK ${generated.path} (${providerInfo?.provider}/${providerInfo?.model})`,
        );
      }
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${key}: ${message}`);
      await appendLog(`- ${stamp} FAIL ${key} langs=${targetLangs.join(',')}: ${message}`);
    }
  }

  console.log(`\nDone. Wrote ${ok} files. Failures: ${failed}.`);
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