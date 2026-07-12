#!/usr/bin/env tsx
/**
 * Resumable WordPress → Markdown import.
 * Slow by design: small batches + delays to avoid overloading WP.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import {
  langFromCategories,
  postFrontmatterSchema,
  translationGroupFromSlug,
} from '../src/lib/post-schema';
import { formatPostMarkdown, sanitizeWpHtml } from './lib/md-formatter';
import {
  cachePath,
  ensureStateDirs,
  loadState,
  log,
  printStatus,
  progressKey,
  resetInFlight,
  saveState,
  type ImportState,
  type ManifestEntry,
  type ProgressEntry,
} from './lib/import-state';

const WP_URL = (process.env.WP_URL || 'https://intolibya.com').replace(/\/$/, '');
const WP_USER = process.env.WP_USER || '';
const WP_APP_PASSWORD = (process.env.WP_APP_PASSWORD || '').replace(/"/g, '');

/** Slow extraction defaults — override via env */
const BATCH_SIZE = Number(process.env.IMPORT_BATCH_SIZE || 3);
const DELAY_MS = Number(process.env.IMPORT_DELAY_MS || 3000);
const PAGE_DELAY_MS = Number(process.env.IMPORT_PAGE_DELAY_MS || 5000);
const MAX_ATTEMPTS = 5;
const POSTS_DIR = path.resolve('src/content/posts');
const MEDIA_DIR = path.resolve('public/media');

const args = new Set(process.argv.slice(2));
const flags = {
  status: args.has('--status'),
  resume: args.has('--resume') || args.size === 0,
  retryFailed: args.has('--retry-failed'),
  manifestOnly: args.has('--manifest-only'),
  fromCache: args.has('--from-cache'),
  dryRun: args.has('--dry-run'),
  force: args.has('--force'),
  only: getArgValue('--only'),
  limit: Number(getArgValue('--limit') || 0) || undefined,
};

function getArgValue(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function authHeader(): Record<string, string> {
  if (!WP_USER || !WP_APP_PASSWORD) return {};
  const token = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64');
  return { Authorization: `Basic ${token}` };
}

async function wpFetch(url: string, attempt = 1): Promise<Response> {
  try {
    const res = await fetch(url, { headers: { ...authHeader(), Accept: 'application/json' } });
    if (!res.ok && attempt < MAX_ATTEMPTS && (res.status >= 500 || res.status === 429)) {
      const wait = Math.min(32000, 2000 * 2 ** (attempt - 1));
      log(`Retry ${attempt}/${MAX_ATTEMPTS} for ${url} (${res.status}) in ${wait}ms`);
      await sleep(wait);
      return wpFetch(url, attempt + 1);
    }
    return res;
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      const wait = Math.min(32000, 2000 * 2 ** (attempt - 1));
      log(`Network error, retry ${attempt}/${MAX_ATTEMPTS} in ${wait}ms: ${err}`);
      await sleep(wait);
      return wpFetch(url, attempt + 1);
    }
    throw err;
  }
}

function parseCanonicalPath(link: string): string {
  const u = new URL(link);
  let p = u.pathname;
  if (p.length > 1 && p.endsWith('/')) p = p.replace(/\/+$/, '');
  return p;
}

function mdOutputPath(lang: string, slug: string) {
  return path.join(POSTS_DIR, lang, `${slug}.md`);
}

function decodeHtml(s: string) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

interface WpPost {
  id: number;
  slug: string;
  link: string;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  categories: number[];
  yoast_head_json?: {
    title?: string;
    description?: string;
    canonical?: string;
    og_image?: Array<{ url: string }>;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url?: string; alt_text?: string }>;
  };
}

async function fetchManifestPage(page: number) {
  const url = `${WP_URL}/wp-json/wp/v2/posts?per_page=100&page=${page}&status=publish&_fields=id,slug,link,categories`;
  const res = await wpFetch(url);
  if (!res.ok) throw new Error(`Manifest page ${page} failed: ${res.status}`);
  const total = Number(res.headers.get('x-wp-total') || 0);
  const totalPages = Number(res.headers.get('x-wp-totalpages') || 0);
  const posts = (await res.json()) as WpPost[];
  return { posts, total, totalPages };
}

async function fetchFullPost(id: number): Promise<WpPost> {
  const cached = cachePath(id);
  if (flags.fromCache && fs.existsSync(cached)) {
    return JSON.parse(fs.readFileSync(cached, 'utf8')) as WpPost;
  }
  const url = `${WP_URL}/wp-json/wp/v2/posts/${id}?_embed&context=view`;
  const res = await wpFetch(url);
  if (!res.ok) throw new Error(`Post ${id} fetch failed: ${res.status}`);
  const post = (await res.json()) as WpPost;
  ensureStateDirs();
  fs.writeFileSync(cached, JSON.stringify(post, null, 2));
  return post;
}

async function downloadMedia(url: string, hashes: Set<string>): Promise<string | undefined> {
  if (!url || !url.includes('intolibya.com')) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);
    if (hashes.has(hash)) {
      const existing = findMediaByHash(hash);
      if (existing) return existing;
    }
    hashes.add(hash);
    const rel = new URL(url).pathname.replace(/^\/wp-content\/uploads\//, '');
    const dest = path.join(MEDIA_DIR, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!fs.existsSync(dest)) fs.writeFileSync(dest, buf);
    return `/media/${rel}`;
  } catch {
    return url;
  }
}

const mediaHashIndex = new Map<string, string>();

function findMediaByHash(hash: string) {
  return mediaHashIndex.get(hash);
}

function shouldProcess(entry: ProgressEntry): boolean {
  if (flags.only && String(entry.wpId) !== flags.only) return false;
  if (flags.force) return true;
  if (entry.status === 'completed') return false;
  if (flags.retryFailed) return entry.status === 'failed';
  if (flags.fromCache) return entry.status === 'fetched' || entry.status === 'failed';
  return entry.status === 'pending' || entry.status === 'failed' || entry.status === 'fetched';
}

async function buildManifest(state: ImportState) {
  let page = state.fetchCheckpoint.page || 1;
  let totalPages: number | null = state.fetchCheckpoint.totalPages;

  while (true) {
    log(`Fetching manifest page ${page}...`);
    const { posts, totalPages: tp } = await fetchManifestPage(page);
    totalPages = tp;
    state.fetchCheckpoint = { page, totalPages: tp };

    for (const p of posts) {
      const lang = langFromCategories(p.categories || []);
      const canonicalPath = parseCanonicalPath(p.link);
      const manifestEntry: ManifestEntry = { wpId: p.id, slug: p.slug, canonicalPath, lang };
      if (!state.manifest.find((m) => m.wpId === p.id)) state.manifest.push(manifestEntry);

      const key = progressKey(p.id);
      if (!state.progress[key]) {
        state.progress[key] = {
          wpId: p.id,
          slug: p.slug,
          canonicalPath,
          lang,
          status: 'pending',
          attempts: 0,
        };
      }
    }
    saveState(state);

    if (page >= tp || posts.length === 0) break;
    page += 1;
    state.fetchCheckpoint.page = page;
    saveState(state);
    await sleep(PAGE_DELAY_MS);
  }

  log(`Manifest complete: ${state.manifest.length} posts discovered (${totalPages} pages).`);
}

async function processPost(state: ImportState, entry: ProgressEntry, mediaHashes: Set<string>) {
  const key = progressKey(entry.wpId);

  try {
    if (!flags.fromCache) {
      entry.status = 'fetching';
      saveState(state);
    }

    const post = await fetchFullPost(entry.wpId);
    entry.status = 'fetched';
    saveState(state);

    const lang = langFromCategories(post.categories || []);
    const slug = post.slug;
    const canonicalPath = parseCanonicalPath(post.link);
    const yoast = post.yoast_head_json || {};
    const siteBase = 'https://intolibya.com';

    let featuredImage: string | undefined;
    const featuredUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    if (featuredUrl) {
      featuredImage = await downloadMedia(featuredUrl, mediaHashes);
      await sleep(500);
    }

    const htmlBody = sanitizeWpHtml(post.content?.rendered || '');
    const excerpt = decodeHtml((post.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim());

    const frontmatter = postFrontmatterSchema.parse({
      title: decodeHtml(post.title?.rendered || slug),
      slug,
      canonicalPath,
      lang,
      wpImportId: post.id,
      publishedAt: new Date(post.date),
      translationGroup: translationGroupFromSlug(slug, lang),
      featuredImage,
      excerpt: excerpt.slice(0, 500) || undefined,
      seo: {
        title: yoast.title || decodeHtml(post.title?.rendered || slug),
        description: yoast.description || excerpt.slice(0, 160),
        canonical: yoast.canonical || `${siteBase}${canonicalPath}`,
      },
    });

    const outPath = mdOutputPath(lang, slug);
    entry.status = 'writing';
    entry.mdPath = outPath;
    saveState(state);

    if (!flags.dryRun) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, formatPostMarkdown(frontmatter, htmlBody), 'utf8');
    }

    entry.status = 'completed';
    entry.error = undefined;
    log(`✓ WP#${entry.wpId} → ${path.relative(process.cwd(), outPath)}`);
  } catch (err) {
    entry.attempts = (entry.attempts || 0) + 1;
    entry.error = err instanceof Error ? err.message : String(err);
    entry.status = 'failed';
    entry.lastAttemptAt = new Date().toISOString();
    log(`✗ WP#${entry.wpId} failed: ${entry.error}`);
  }

  state.progress[key] = entry;
  saveState(state);
}

async function main() {
  ensureStateDirs();
  fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.mkdirSync(MEDIA_DIR, { recursive: true });

  const state = loadState();
  resetInFlight(state);
  saveState(state);

  if (flags.status) {
    printStatus(state);
    return;
  }

  if (!flags.fromCache && !flags.manifestOnly) {
    const manifestComplete = state.manifest.length >= 552 && state.fetchCheckpoint.totalPages;
    if (!manifestComplete || flags.retryFailed) {
      await buildManifest(state);
    } else {
      log(`Manifest already has ${state.manifest.length} posts — skipping fetch.`);
    }
  } else if (!flags.fromCache) {
    await buildManifest(state);
  }

  if (flags.manifestOnly) {
    printStatus(state);
    return;
  }

  let queue = Object.values(state.progress).filter(shouldProcess);
  // Process higher WP IDs first (generally newer posts) for useful partial builds
  queue.sort((a, b) => b.wpId - a.wpId);
  if (flags.limit) queue = queue.slice(0, flags.limit);

  log(`Processing ${queue.length} posts (batch ${BATCH_SIZE}, delay ${DELAY_MS}ms)...`);

  const mediaHashes = new Set<string>();
  let processed = 0;

  for (let i = 0; i < queue.length; i += BATCH_SIZE) {
    const batch = queue.slice(i, i + BATCH_SIZE);
    for (const entry of batch) {
      await processPost(state, entry, mediaHashes);
      processed += 1;
      if (i + batch.indexOf(entry) < queue.length - 1) await sleep(DELAY_MS);
    }
    printStatus(loadState());
    if (i + BATCH_SIZE < queue.length) {
      log(`Batch pause ${PAGE_DELAY_MS}ms before next batch...`);
      await sleep(PAGE_DELAY_MS);
    }
  }

  log(`Done. Processed ${processed} posts this run.`);
  printStatus(loadState());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
