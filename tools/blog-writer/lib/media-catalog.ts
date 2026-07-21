import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import matter from 'gray-matter';
import { DESTINATION_TRANSLATION_GROUPS } from '../../../src/lib/destination-schema';
import {
  MEDIA_DERIVATIVE_WIDTHS,
  canonicalizeMediaPath,
  isDerivativeMediaPath,
  isHeroPoolPath,
  isOgDerivativePath,
  masterPathFromDerivative,
} from '../../../src/lib/media-paths';
import { listExistingDerivativeWidths } from './media-encode';

export type DuplicateKind = 'exact' | 'similar';

export interface MediaUsageRef {
  kind: 'post' | 'destination';
  translationGroup: string;
  lang: string;
  slug: string;
  title: string;
  role: 'hero' | 'gallery' | 'inline';
  path: string;
  /** Stable id for per-use alt edits: role + occurrence index within the file. */
  occurrenceId: string;
  /** Current alt text on this usage (hero/gallery/inline). */
  alt: string;
  /** Gallery id when role is gallery. */
  galleryId?: string;
  /** 0-based index within gallery images or inline img matches. */
  index?: number;
}

export interface MediaCatalogEntry {
  path: string;
  filename: string;
  folder: string;
  ext: string;
  bytes: number;
  mtime: string;
  width: number;
  height: number;
  tags: string[];
  defaultAlt: string;
  credit: string;
  notes: string;
  preferredRoles: string[];
  derivativeWidths: number[];
  missingDerivatives: boolean;
  isPool: boolean;
  isOg: boolean;
  isDerivative: boolean;
  contentHash: string;
  aHash: string;
  /** Legacy/group id shared by exact or similar members. */
  duplicateGroupId: string | null;
  /** exact = identical bytes; similar = perceptual only (needs review). */
  duplicateKind: DuplicateKind | null;
  usageEn: number;
  usageGroups: number;
  usageRaw: number;
  usedIn: MediaUsageRef[];
  manual?: {
    tags?: boolean;
    defaultAlt?: boolean;
    credit?: boolean;
    notes?: boolean;
  };
}

export interface DuplicateGroup {
  id: string;
  kind: DuplicateKind;
  members: MediaCatalogEntry[];
  suggestedKeeper: string;
}

export interface MediaCatalogFile {
  version: 1;
  updatedAt: string | null;
  items: Record<string, MediaCatalogEntry>;
}

interface MediaDuplicateDecisions {
  version: 1;
  /** Reviewed perceptual pairs that must not be grouped again. */
  ignoredSimilarPairs: Array<[string, string]>;
}

export interface MediaIndexSummary {
  total: number;
  masters: number;
  unused: number;
  missingAlt: number;
  missingDerivatives: number;
  duplicateGroups: number;
  pool: number;
}

const IMAGE_EXTS = new Set(['.webp', '.jpg', '.jpeg', '.png', '.gif', '.avif']);

function catalogPath(repoRoot: string): string {
  return path.join(repoRoot, 'data/media-catalog.json');
}

function duplicateDecisionsPath(repoRoot: string): string {
  return path.join(repoRoot, 'data/media-duplicate-decisions.json');
}

function similarPairKey(a: string, b: string): string {
  return [canonicalizeMediaPath(a), canonicalizeMediaPath(b)].sort().join('\0');
}

async function readDuplicateDecisions(
  repoRoot: string,
): Promise<MediaDuplicateDecisions> {
  const raw = await fs
    .readFile(duplicateDecisionsPath(repoRoot), 'utf8')
    .catch(() => null);
  if (!raw) return { version: 1, ignoredSimilarPairs: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<MediaDuplicateDecisions>;
    return {
      version: 1,
      ignoredSimilarPairs: Array.isArray(parsed.ignoredSimilarPairs)
        ? parsed.ignoredSimilarPairs.filter(
            (pair): pair is [string, string] =>
              Array.isArray(pair) &&
              pair.length === 2 &&
              pair.every((value) => typeof value === 'string'),
          )
        : [],
    };
  } catch {
    return { version: 1, ignoredSimilarPairs: [] };
  }
}

/** Persist that all pairs among these surviving paths were reviewed as non-duplicates. */
export async function ignoreSimilarPairsAmong(
  repoRoot: string,
  mediaPaths: string[],
): Promise<number> {
  const decisions = await readDuplicateDecisions(repoRoot);
  const existing = new Set(
    decisions.ignoredSimilarPairs.map(([a, b]) => similarPairKey(a, b)),
  );
  const paths = [...new Set(mediaPaths.map(canonicalizeMediaPath))].sort();
  let added = 0;
  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      const key = similarPairKey(paths[i], paths[j]);
      if (existing.has(key)) continue;
      decisions.ignoredSimilarPairs.push([paths[i], paths[j]]);
      existing.add(key);
      added += 1;
    }
  }
  await fs.mkdir(path.dirname(duplicateDecisionsPath(repoRoot)), {
    recursive: true,
  });
  await fs.writeFile(
    duplicateDecisionsPath(repoRoot),
    `${JSON.stringify(decisions, null, 2)}\n`,
    'utf8',
  );
  return added;
}

export async function readMediaCatalog(repoRoot: string): Promise<MediaCatalogFile> {
  const raw = await fs.readFile(catalogPath(repoRoot), 'utf8').catch(() => null);
  if (!raw) return { version: 1, updatedAt: null, items: {} };
  try {
    const parsed = JSON.parse(raw) as MediaCatalogFile;
    return {
      version: 1,
      updatedAt: parsed.updatedAt ?? null,
      items: parsed.items && typeof parsed.items === 'object' ? parsed.items : {},
    };
  } catch {
    return { version: 1, updatedAt: null, items: {} };
  }
}

export async function writeMediaCatalog(
  repoRoot: string,
  catalog: MediaCatalogFile,
): Promise<void> {
  const full = catalogPath(repoRoot);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
}

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walkFiles(full)));
    else out.push(full);
  }
  return out;
}

function inferTagsFromPath(mediaUrl: string): string[] {
  const tags = new Set<string>();
  const canon = canonicalizeMediaPath(mediaUrl).toLowerCase();
  const parts = canon.split('/').filter(Boolean);
  for (const part of parts) {
    if (['media', 'posts', 'destinations', 'library', 'instagram', 'og'].includes(part)) continue;
    if (part.startsWith('_')) continue;
    if (/^\d{4}$/.test(part)) {
      tags.add(`year-${part}`);
      continue;
    }
    for (const dest of DESTINATION_TRANSLATION_GROUPS) {
      if (part === dest || part.includes(dest) || dest.includes(part)) {
        tags.add(dest);
      }
    }
    const tokens = part
      .replace(/\.[a-z0-9]+$/i, '')
      .split(/[-_]+/)
      .filter((t) => t.length > 2 && !/^\d+$/.test(t));
    for (const t of tokens) {
      if (['hero', 'img', 'image', 'scaled', 'jpg', 'webp', 'png'].includes(t)) continue;
      tags.add(t);
    }
  }
  return [...tags].slice(0, 24);
}

async function parseCreditsFile(filePath: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const raw = await fs.readFile(filePath, 'utf8').catch(() => null);
  if (!raw) return map;
  const lines = raw.split('\n');
  let currentFile: string | null = null;
  let buffer: string[] = [];
  const flush = () => {
    if (!currentFile) return;
    const credit = buffer.join(' ').replace(/\s+/g, ' ').trim();
    if (credit) map.set(currentFile.toLowerCase(), credit);
    currentFile = null;
    buffer = [];
  };
  for (const line of lines) {
    const bullet = /^\s*[-*]\s*`?([^`\s]+)`?\s*(?:[—–:-]\s*(.+))?$/.exec(line);
    if (bullet) {
      flush();
      currentFile = path.basename(bullet[1]);
      if (bullet[2]) buffer.push(bullet[2].trim());
      continue;
    }
    if (currentFile && line.trim() && !line.startsWith('#')) {
      buffer.push(line.trim());
    }
  }
  flush();
  // Also map bare filenames listed as bullets without credit text → generic note
  for (const [name, credit] of [...map.entries()]) {
    if (!credit) map.set(name, 'See IMAGE_CREDITS.md');
  }
  return map;
}

async function loadAllCredits(repoRoot: string): Promise<Map<string, string>> {
  const merged = new Map<string, string>();
  for (const rel of [
    'public/media/posts/IMAGE_CREDITS.md',
    'public/media/destinations/IMAGE_CREDITS.md',
  ]) {
    const partial = await parseCreditsFile(path.join(repoRoot, rel));
    for (const [k, v] of partial) merged.set(k, v);
  }
  return merged;
}

async function averageHash(buffer: Buffer): Promise<string> {
  try {
    const raw = await sharp(buffer)
      .greyscale()
      .resize(8, 8, { fit: 'fill' })
      .raw()
      .toBuffer();
    let sum = 0;
    for (const v of raw) sum += v;
    const avg = sum / raw.length;
    let bits = '';
    for (const v of raw) bits += v >= avg ? '1' : '0';
    // pack to hex
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex;
  } catch {
    return '';
  }
}

function hammingHex(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return 64;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    dist += x.toString(2).replace(/0/g, '').length;
  }
  return dist;
}

interface ContentScanHit {
  mediaPath: string;
  kind: 'post' | 'destination';
  translationGroup: string;
  lang: string;
  slug: string;
  title: string;
  role: 'hero' | 'gallery' | 'inline';
  filePath: string;
  occurrenceId: string;
  alt: string;
  galleryId?: string;
  index?: number;
}

function extractImgAlt(tag: string): string {
  const m = /\balt\s*=\s*(["'])(.*?)\1/i.exec(tag);
  return m ? m[2] : '';
}

async function scanContentUsage(repoRoot: string): Promise<ContentScanHit[]> {
  const hits: ContentScanHit[] = [];
  for (const kind of ['posts', 'destinations'] as const) {
    const root = path.join(repoRoot, 'src/content', kind);
    const files = await walkFiles(root);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const raw = await fs.readFile(file, 'utf8');
      const { data, content } = matter(raw);
      const lang = String(data.lang ?? '');
      const slug = String(data.slug ?? '');
      const title = String(data.title ?? '');
      const translationGroup = String(data.translationGroup ?? slug);
      const contentKind = kind === 'destinations' ? 'destination' : 'post';

      const featured = data.featuredImage ? canonicalizeMediaPath(String(data.featuredImage)) : '';
      if (featured.startsWith('/media/')) {
        hits.push({
          mediaPath: featured,
          kind: contentKind,
          translationGroup,
          lang,
          slug,
          title,
          role: 'hero',
          filePath: file,
          occurrenceId: 'hero',
          alt: String(data.featuredImageAlt ?? '').trim(),
        });
      }

      if (Array.isArray(data.galleries)) {
        for (const gallery of data.galleries) {
          const galleryId = String(gallery?.id ?? '');
          const images = Array.isArray(gallery?.images) ? gallery.images : [];
          images.forEach((image: { src?: string; alt?: string }, index: number) => {
            const src = canonicalizeMediaPath(String(image?.src ?? ''));
            if (!src.startsWith('/media/')) return;
            hits.push({
              mediaPath: src,
              kind: contentKind,
              translationGroup,
              lang,
              slug,
              title,
              role: 'gallery',
              filePath: file,
              occurrenceId: `gallery:${galleryId}:${index}`,
              alt: String(image?.alt ?? '').trim(),
              galleryId,
              index,
            });
          });
        }
      }

      let inlineIndex = 0;
      for (const match of content.matchAll(/<img\b[^>]*>/gi)) {
        const tag = match[0];
        const srcMatch = /\bsrc\s*=\s*(["'])([^"']+)\1/i.exec(tag);
        if (!srcMatch) continue;
        const src = canonicalizeMediaPath(srcMatch[2] || '');
        if (!src.startsWith('/media/')) continue;
        const index = inlineIndex++;
        hits.push({
          mediaPath: src,
          kind: contentKind,
          translationGroup,
          lang,
          slug,
          title,
          role: 'inline',
          filePath: file,
          occurrenceId: `inline:${index}`,
          alt: extractImgAlt(tag),
          index,
        });
      }
    }
  }
  return hits;
}

function buildUsageMaps(hits: ContentScanHit[]) {
  const byPath = new Map<
    string,
    {
      raw: number;
      en: number;
      groups: Set<string>;
      usedIn: MediaUsageRef[];
    }
  >();

  for (const hit of hits) {
    const key = hit.mediaPath;
    let bucket = byPath.get(key);
    if (!bucket) {
      bucket = { raw: 0, en: 0, groups: new Set(), usedIn: [] };
      byPath.set(key, bucket);
    }
    bucket.raw += 1;
    if (hit.lang === 'en') {
      bucket.en += 1;
      bucket.groups.add(`${hit.kind}:${hit.translationGroup}`);
      if (
        !bucket.usedIn.some(
          (u) =>
            u.kind === hit.kind &&
            u.translationGroup === hit.translationGroup &&
            u.occurrenceId === hit.occurrenceId,
        )
      ) {
        bucket.usedIn.push({
          kind: hit.kind,
          translationGroup: hit.translationGroup,
          lang: hit.lang,
          slug: hit.slug,
          title: hit.title,
          role: hit.role,
          path: path.relative(process.cwd(), hit.filePath).split(path.sep).join('/'),
          occurrenceId: hit.occurrenceId,
          alt: hit.alt,
          galleryId: hit.galleryId,
          index: hit.index,
        });
      }
    }
  }
  return byPath;
}

/** Suggest which member of a duplicate group should be the keeper. */
export function suggestCanonicalKeeper(members: MediaCatalogEntry[]): string {
  // Shared pool URLs are stable canonical homes. Never replace one with a
  // post-specific copy merely because that copy currently has a usage count.
  const hasPoolMember = members.some((member) => member.isPool);
  const candidates = hasPoolMember
    ? members.filter((member) => member.isPool)
    : members;
  const scored = [...candidates].sort((a, b) => {
    const score = (m: MediaCatalogEntry) => {
      let s = 0;
      s += m.usageRaw * 1000;
      s += m.usageEn * 500;
      if (m.manual?.defaultAlt && m.defaultAlt.trim()) s += 200;
      if (m.manual?.credit && m.credit.trim()) s += 100;
      if (m.manual?.tags && m.tags.length) s += 50;
      if (m.ext === '.webp') s += 40;
      if (m.isPool) s += 100;
      if (m.path.includes('/posts/') || m.path.includes('/destinations/')) s += 15;
      s += Math.min(30, Math.floor((m.width * m.height) / 500_000));
      s += Math.min(10, Math.floor(m.bytes / 200_000));
      return s;
    };
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return a.path.localeCompare(b.path);
  });
  return scored[0]?.path || members[0]?.path || '';
}

export function listDuplicateGroups(
  catalog: MediaCatalogFile,
  options: { includeOg?: boolean } = {},
): DuplicateGroup[] {
  const byId = new Map<string, MediaCatalogEntry[]>();
  for (const item of Object.values(catalog.items)) {
    if (!item.duplicateGroupId || !item.duplicateKind) continue;
    if (!options.includeOg && item.isOg) continue;
    const list = byId.get(item.duplicateGroupId) ?? [];
    list.push(item);
    byId.set(item.duplicateGroupId, list);
  }
  const groups: DuplicateGroup[] = [];
  for (const [id, members] of byId) {
    if (members.length < 2) continue;
    const kind = members[0].duplicateKind!;
    groups.push({
      id,
      kind,
      members: members.sort((a, b) => a.path.localeCompare(b.path)),
      suggestedKeeper: suggestCanonicalKeeper(members),
    });
  }
  return groups.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'exact' ? -1 : 1;
    return b.members.length - a.members.length;
  });
}

export async function indexMediaCatalog(
  repoRoot: string,
  options: { orphansOnly?: boolean } = {},
): Promise<{ catalog: MediaCatalogFile; summary: MediaIndexSummary; orphans: string[] }> {
  const previous = await readMediaCatalog(repoRoot);
  const duplicateDecisions = await readDuplicateDecisions(repoRoot);
  const ignoredSimilarPairs = new Set(
    duplicateDecisions.ignoredSimilarPairs.map(([a, b]) => similarPairKey(a, b)),
  );
  const credits = await loadAllCredits(repoRoot);
  const mediaRoot = path.join(repoRoot, 'public/media');
  const diskFiles = (await walkFiles(mediaRoot)).filter((f) =>
    IMAGE_EXTS.has(path.extname(f).toLowerCase()),
  );

  const usageHits = await scanContentUsage(repoRoot);
  const usageByPath = buildUsageMaps(usageHits);

  // Group files by directory for derivative discovery
  const byDir = new Map<string, string[]>();
  for (const full of diskFiles) {
    const dir = path.dirname(full);
    const list = byDir.get(dir) ?? [];
    list.push(path.basename(full));
    byDir.set(dir, list);
  }

  const items: Record<string, MediaCatalogEntry> = {};
  const aHashEntries: Array<{ path: string; aHash: string; contentHash: string }> = [];

  for (const full of diskFiles) {
    const rel = `/media/${path.relative(mediaRoot, full).split(path.sep).join('/')}`;
    const isDeriv = isDerivativeMediaPath(rel);
    // Index derivatives lightly? Plan stores masters primarily; still list them but skip heavy dup work for pure derivatives in UI filters.
    const masterRel = isDeriv ? masterPathFromDerivative(rel) : rel;
    if (isDeriv) continue; // catalog masters only; derivatives tracked via derivativeWidths

    const prev = previous.items[rel];
    const stat = await fs.stat(full);
    const buf = await fs.readFile(full);
    const contentHash = crypto.createHash('sha1').update(buf).digest('hex');
    let width = 0;
    let height = 0;
    try {
      const meta = await sharp(buf).metadata();
      width = meta.width || 0;
      height = meta.height || 0;
    } catch {
      /* ignore */
    }
    const aHash = await averageHash(buf);
    const siblings = byDir.get(path.dirname(full)) ?? [];
    const derivativeWidths = listExistingDerivativeWidths(rel, siblings);
    const expected = MEDIA_DERIVATIVE_WIDTHS.filter((w) => !width || w <= width);
    const missingDerivatives =
      expected.length > 0
        ? expected.some((w) => !derivativeWidths.includes(w))
        : derivativeWidths.length === 0;

    const inferredTags = inferTagsFromPath(rel);
    const filename = path.basename(rel);
    const creditFromFile = credits.get(filename.toLowerCase()) || '';

    const usage = usageByPath.get(rel) ?? usageByPath.get(masterRel);

    const tags =
      prev?.manual?.tags && Array.isArray(prev.tags) && prev.tags.length
        ? prev.tags
        : [...new Set([...(prev?.tags ?? []), ...inferredTags])].slice(0, 32);

    const entry: MediaCatalogEntry = {
      path: rel,
      filename,
      folder: path.posix.dirname(rel),
      ext: path.extname(rel).toLowerCase(),
      bytes: stat.size,
      mtime: stat.mtime.toISOString(),
      width,
      height,
      tags,
      defaultAlt: prev?.manual?.defaultAlt ? prev.defaultAlt : prev?.defaultAlt || '',
      credit: prev?.manual?.credit ? prev.credit : prev?.credit || creditFromFile,
      notes: prev?.manual?.notes ? prev.notes : prev?.notes || '',
      preferredRoles: prev?.preferredRoles ?? [],
      derivativeWidths,
      missingDerivatives,
      isPool: isHeroPoolPath(rel),
      isOg: isOgDerivativePath(rel),
      isDerivative: false,
      contentHash,
      aHash,
      duplicateGroupId: null,
      duplicateKind: null,
      usageEn: usage?.en ?? 0,
      usageGroups: usage?.groups.size ?? 0,
      usageRaw: usage?.raw ?? 0,
      usedIn: usage?.usedIn ?? [],
      manual: prev?.manual,
    };
    items[rel] = entry;
    if (!isOgDerivativePath(rel) && (aHash || contentHash)) {
      aHashEntries.push({ path: rel, aHash, contentHash });
    }
  }

  // Exact duplicates first (identical contentHash), then perceptual-only similar groups.
  const assigned = new Set<string>();
  let groupCounter = 0;

  const byHash = new Map<string, string[]>();
  for (const entry of aHashEntries) {
    if (!entry.contentHash) continue;
    const list = byHash.get(entry.contentHash) ?? [];
    list.push(entry.path);
    byHash.set(entry.contentHash, list);
  }
  for (const members of byHash.values()) {
    if (members.length < 2) continue;
    const id = `exact-${(++groupCounter).toString(36)}`;
    for (const p of members) {
      assigned.add(p);
      if (items[p]) {
        items[p].duplicateGroupId = id;
        items[p].duplicateKind = 'exact';
      }
    }
  }

  const remaining = aHashEntries.filter((e) => e.aHash && !assigned.has(e.path));
  for (let i = 0; i < remaining.length; i++) {
    const a = remaining[i];
    if (assigned.has(a.path)) continue;
    const members = [a.path];
    for (let j = i + 1; j < remaining.length; j++) {
      const b = remaining[j];
      if (assigned.has(b.path)) continue;
      if (ignoredSimilarPairs.has(similarPairKey(a.path, b.path))) continue;
      if (hammingHex(a.aHash, b.aHash) <= 5) members.push(b.path);
    }
    if (members.length < 2) continue;
    const id = `similar-${(++groupCounter).toString(36)}`;
    for (const p of members) {
      assigned.add(p);
      if (items[p]) {
        items[p].duplicateGroupId = id;
        items[p].duplicateKind = 'similar';
      }
    }
  }

  const catalog: MediaCatalogFile = {
    version: 1,
    updatedAt: new Date().toISOString(),
    items,
  };

  const masters = Object.values(items).filter((i) => !i.isOg);
  const unused = masters.filter((i) => i.usageEn === 0 && !i.isOg);
  const missingAlt = masters.filter((i) => !i.defaultAlt.trim());
  const missingDerivatives = masters.filter((i) => i.missingDerivatives && !i.isOg);
  const dupIds = new Set(
    masters.map((i) => i.duplicateGroupId).filter((id): id is string => Boolean(id)),
  );

  const summary: MediaIndexSummary = {
    total: masters.length,
    masters: masters.length,
    unused: unused.length,
    missingAlt: missingAlt.length,
    missingDerivatives: missingDerivatives.length,
    duplicateGroups: dupIds.size,
    pool: masters.filter((i) => i.isPool).length,
  };

  const orphans = unused.filter((i) => !i.isPool).map((i) => i.path);

  if (!options.orphansOnly) {
    await writeMediaCatalog(repoRoot, catalog);
  }

  return { catalog, summary, orphans };
}

export function summarizeCatalog(catalog: MediaCatalogFile): MediaIndexSummary {
  const masters = Object.values(catalog.items).filter((i) => !i.isOg && !i.isDerivative);
  const dupIds = new Set(
    masters.map((i) => i.duplicateGroupId).filter((id): id is string => Boolean(id)),
  );
  return {
    total: masters.length,
    masters: masters.length,
    unused: masters.filter((i) => i.usageEn === 0).length,
    missingAlt: masters.filter((i) => !i.defaultAlt.trim()).length,
    missingDerivatives: masters.filter((i) => i.missingDerivatives).length,
    duplicateGroups: dupIds.size,
    pool: masters.filter((i) => i.isPool).length,
  };
}

export function filterCatalogItems(
  items: MediaCatalogEntry[],
  query: {
    q?: string;
    tag?: string;
    unused?: boolean;
    includePool?: boolean;
    missingAlt?: boolean;
    missingDerivatives?: boolean;
    hasDuplicates?: boolean;
    duplicateKind?: DuplicateKind;
    excludeOg?: boolean;
  },
): MediaCatalogEntry[] {
  const q = (query.q || '').trim().toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    if (query.excludeOg !== false && item.isOg) return false;
    if (item.isDerivative) return false;
    if (query.unused && item.usageEn > 0) return false;
    if (query.unused && !query.includePool && item.isPool) return false;
    if (query.missingAlt && item.defaultAlt.trim()) return false;
    if (query.missingDerivatives && !item.missingDerivatives) return false;
    if (query.hasDuplicates && !item.duplicateGroupId) return false;
    if (query.duplicateKind && item.duplicateKind !== query.duplicateKind) return false;
    if (query.tag) {
      const tag = query.tag.toLowerCase();
      if (!item.tags.some((t) => t.toLowerCase() === tag)) return false;
    }
    if (tokens.length) {
      const hay = `${item.path} ${item.filename} ${item.tags.join(' ')} ${item.defaultAlt} ${item.credit} ${item.notes}`.toLowerCase();
      if (!tokens.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

export async function patchMediaCatalogEntry(
  repoRoot: string,
  mediaPath: string,
  patch: Partial<
    Pick<MediaCatalogEntry, 'tags' | 'defaultAlt' | 'credit' | 'notes' | 'preferredRoles'>
  >,
): Promise<MediaCatalogEntry> {
  const catalog = await readMediaCatalog(repoRoot);
  const key = canonicalizeMediaPath(mediaPath);
  const existing = catalog.items[key];
  if (!existing) {
    throw new Error(`Unknown media path: ${key}. Run media:index first.`);
  }
  const manual = { ...(existing.manual || {}) };
  if (patch.tags) {
    existing.tags = [...new Set(patch.tags.map((t) => t.trim()).filter(Boolean))];
    manual.tags = true;
  }
  if (typeof patch.defaultAlt === 'string') {
    existing.defaultAlt = patch.defaultAlt.trim();
    manual.defaultAlt = true;
  }
  if (typeof patch.credit === 'string') {
    existing.credit = patch.credit.trim();
    manual.credit = true;
  }
  if (typeof patch.notes === 'string') {
    existing.notes = patch.notes.trim();
    manual.notes = true;
  }
  if (patch.preferredRoles) {
    existing.preferredRoles = patch.preferredRoles;
  }
  existing.manual = manual;
  catalog.items[key] = existing;
  catalog.updatedAt = new Date().toISOString();
  await writeMediaCatalog(repoRoot, catalog);
  return existing;
}

function setImgAltAttribute(tag: string, alt: string): string {
  const safe = alt.replace(/"/g, '&quot;');
  if (/\balt\s*=\s*(["']).*?\1/i.test(tag)) {
    return tag.replace(/\balt\s*=\s*(["']).*?\1/i, `alt="${safe}"`);
  }
  return tag.replace(/<img\b/i, `<img alt="${safe}"`);
}

function dumpMarkdown(data: Record<string, unknown>, content: string): string {
  return matter.stringify(content.replace(/^\n+/, ''), data);
}

/**
 * Update alt text for one concrete usage of a media path in a content file.
 * Validates kind/group/occurrence before writing.
 */
export async function updateMediaOccurrenceAlt(
  repoRoot: string,
  options: {
    mediaPath: string;
    kind: 'post' | 'destination';
    translationGroup: string;
    occurrenceId: string;
    alt: string;
    /** When true, also update matching occurrences in sibling language files. */
    allLanguages?: boolean;
  },
): Promise<{ updatedFiles: string[]; alt: string }> {
  const mediaPath = canonicalizeMediaPath(options.mediaPath);
  const alt = options.alt.trim();
  const hits = await scanContentUsage(repoRoot);
  const targets = hits.filter(
    (h) =>
      h.mediaPath === mediaPath &&
      h.kind === options.kind &&
      h.translationGroup === options.translationGroup &&
      h.occurrenceId === options.occurrenceId &&
      (options.allLanguages || h.lang === 'en'),
  );
  if (!targets.length) {
    throw new Error(
      `No matching usage for ${mediaPath} (${options.kind}/${options.translationGroup}/${options.occurrenceId})`,
    );
  }

  const updatedFiles: string[] = [];
  const byFile = new Map<string, ContentScanHit[]>();
  for (const hit of targets) {
    const list = byFile.get(hit.filePath) ?? [];
    list.push(hit);
    byFile.set(hit.filePath, list);
  }

  for (const [filePath, fileHits] of byFile) {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = matter(raw);
    const data = { ...parsed.data } as Record<string, unknown>;
    let content = parsed.content;
    let changed = false;

    for (const hit of fileHits) {
      if (hit.role === 'hero') {
        data.featuredImageAlt = alt;
        changed = true;
        continue;
      }
      if (hit.role === 'gallery' && hit.galleryId != null && typeof hit.index === 'number') {
        const galleries = Array.isArray(data.galleries)
          ? (data.galleries as Array<Record<string, unknown>>).map((g) => ({ ...g }))
          : [];
        const gi = galleries.findIndex((g) => String(g?.id) === hit.galleryId);
        if (gi < 0) continue;
        const images = Array.isArray(galleries[gi].images)
          ? [...(galleries[gi].images as Array<Record<string, unknown>>)]
          : [];
        if (!images[hit.index]) continue;
        images[hit.index] = { ...images[hit.index], alt };
        galleries[gi] = { ...galleries[gi], images };
        data.galleries = galleries;
        changed = true;
        continue;
      }
      if (hit.role === 'inline' && typeof hit.index === 'number') {
        let inlineIndex = 0;
        content = content.replace(/<img\b[^>]*>/gi, (tag) => {
          const srcMatch = /\bsrc\s*=\s*(["'])([^"']+)\1/i.exec(tag);
          if (!srcMatch) return tag;
          const src = canonicalizeMediaPath(srcMatch[2] || '');
          if (!src.startsWith('/media/')) return tag;
          const idx = inlineIndex++;
          if (idx !== hit.index || src !== mediaPath) return tag;
          changed = true;
          return setImgAltAttribute(tag, alt);
        });
      }
    }

    if (!changed) continue;
    await fs.writeFile(filePath, dumpMarkdown(data, content), 'utf8');
    updatedFiles.push(path.relative(repoRoot, filePath).split(path.sep).join('/'));
  }

  return { updatedFiles, alt };
}

/**
 * Fill empty alts for all EN uses of a media path with the catalog defaultAlt.
 * Never overwrites non-empty alts.
 */
export async function fillEmptyAltsFromDefault(
  repoRoot: string,
  mediaPath: string,
): Promise<{ updated: number; skipped: number }> {
  const catalog = await readMediaCatalog(repoRoot);
  const key = canonicalizeMediaPath(mediaPath);
  const item = catalog.items[key];
  if (!item?.defaultAlt.trim()) {
    throw new Error('Catalog defaultAlt is empty — set it first.');
  }
  const hits = await scanContentUsage(repoRoot);
  const enHits = hits.filter((h) => h.mediaPath === key && h.lang === 'en');
  const targets = enHits.filter((h) => !h.alt.trim());
  let updated = 0;
  const skipped = enHits.length - targets.length;
  for (const hit of targets) {
    await updateMediaOccurrenceAlt(repoRoot, {
      mediaPath: key,
      kind: hit.kind,
      translationGroup: hit.translationGroup,
      occurrenceId: hit.occurrenceId,
      alt: item.defaultAlt,
      allLanguages: false,
    });
    updated += 1;
  }
  return { updated, skipped };
}

export { scanContentUsage };
