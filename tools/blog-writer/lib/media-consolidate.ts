import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  canonicalizeMediaPath,
  derivativeMediaPath,
  isDerivativeMediaPath,
  isOgDerivativePath,
  MEDIA_DERIVATIVE_WIDTHS,
} from '../../../src/lib/media-paths';
import {
  ignoreSimilarPairsAmong,
  indexMediaCatalog,
  listDuplicateGroups,
  readMediaCatalog,
  suggestCanonicalKeeper,
  type DuplicateKind,
  type MediaCatalogEntry,
  type MediaCatalogFile,
  writeMediaCatalog,
} from './media-catalog';
import { ensureDerivativesForMaster } from './media-encode';

export interface ConsolidateReference {
  filePath: string;
  relativePath: string;
  kind: 'post' | 'destination';
  lang: string;
  slug: string;
  title: string;
  translationGroup: string;
  role: 'hero' | 'gallery' | 'inline' | 'markdown' | 'srcset';
  literalSrc: string;
  canonicalSrc: string;
  alt: string;
}

export interface MetadataConflict {
  field: 'credit' | 'notes' | 'defaultAlt';
  keeperValue: string;
  otherValues: Array<{ path: string; value: string }>;
}

export interface ConsolidatePreview {
  previewToken: string;
  groupId: string;
  kind: DuplicateKind;
  keeperPath: string;
  memberPaths: string[];
  quarantinePaths: string[];
  quarantineDerivatives: string[];
  references: ConsolidateReference[];
  metadataConflicts: MetadataConflict[];
  warnings: string[];
  fillEmptyAlts: boolean;
  bestDefaultAlt: string;
  /** Keeper + unselected members to suppress from future perceptual grouping. */
  reviewedSurvivorPaths: string[];
  catalogFingerprint: string;
  createdAt: string;
}

export interface ConsolidateResult {
  ok: true;
  keeperPath: string;
  rewrittenReferences: number;
  touchedFiles: string[];
  quarantined: string[];
  quarantineDir: string;
  manifestPath: string;
  filledEmptyAlts: number;
  reviewedNonDuplicatePairs: number;
}

interface PreviewStoreEntry extends ConsolidatePreview {
  expiresAt: number;
}

const previewStore = new Map<string, PreviewStoreEntry>();
interface ExactBatchStoreEntry {
  batchToken: string;
  groupIds: string[];
  catalogFingerprint: string;
  expiresAt: number;
}

export interface ExactBatchPreview {
  batchToken: string;
  groupCount: number;
  redundantFileCount: number;
  referenceCount: number;
  keepersWithAlt: number;
  keepersMissingAlt: number;
  groups: Array<{
    groupId: string;
    keeperPath: string;
    redundantFileCount: number;
    referenceCount: number;
    bestDefaultAlt: string;
  }>;
  createdAt: string;
}

export interface ExactBatchResult {
  ok: true;
  mergedGroups: number;
  rewrittenReferences: number;
  touchedFiles: string[];
  quarantined: string[];
  quarantineDir: string;
  manifestPath: string;
  keepersWithAlt: number;
}

const exactBatchStore = new Map<string, ExactBatchStoreEntry>();
const PREVIEW_TTL_MS = 30 * 60 * 1000;

function publicPath(repoRoot: string, mediaUrl: string): string {
  return path.join(repoRoot, 'public', mediaUrl.replace(/^\/+/, ''));
}

function catalogFingerprint(catalog: MediaCatalogFile, memberPaths: string[]): string {
  const parts = memberPaths
    .slice()
    .sort()
    .map((p) => {
      const item = catalog.items[p];
      return `${p}:${item?.contentHash || ''}:${item?.mtime || ''}`;
    });
  return crypto.createHash('sha1').update(parts.join('|')).digest('hex');
}

function altScore(value: string, source: 'manual' | 'catalog' | 'usage'): number {
  const alt = value.trim();
  if (!alt) return Number.NEGATIVE_INFINITY;
  const words = alt.split(/\s+/).filter(Boolean);
  let score = Math.min(160, alt.length) + Math.min(80, words.length * 8);
  if (source === 'manual') score += 500;
  else if (source === 'catalog') score += 250;
  else score += 150;
  if (words.length >= 4) score += 80;
  if (alt.length >= 25 && alt.length <= 160) score += 60;
  if (/^(image|photo|picture|hero|untitled)$/i.test(alt)) score -= 500;
  if (/[/\\_]|\.webp|\.jpe?g|\.png/i.test(alt)) score -= 150;
  return score;
}

/** Choose the strongest existing descriptive alt without inventing new copy. */
export function selectBestExistingAlt(members: MediaCatalogEntry[]): string {
  const candidates: Array<{
    value: string;
    source: 'manual' | 'catalog' | 'usage';
  }> = [];
  for (const member of members) {
    if (member.defaultAlt.trim()) {
      candidates.push({
        value: member.defaultAlt.trim(),
        source: member.manual?.defaultAlt ? 'manual' : 'catalog',
      });
    }
    for (const usage of member.usedIn) {
      if (usage.alt?.trim()) candidates.push({ value: usage.alt.trim(), source: 'usage' });
    }
  }
  candidates.sort((a, b) => {
    const scoreDiff = altScore(b.value, b.source) - altScore(a.value, a.source);
    if (scoreDiff !== 0) return scoreDiff;
    return b.value.length - a.value.length || a.value.localeCompare(b.value);
  });
  return candidates[0]?.value || '';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function collectLiteralMediaTokens(text: string): string[] {
  const tokens = new Set<string>();
  const patterns = [
    /(?:src|href)=(["'])([^"']+)\1/gi,
    /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    /url\((["']?)([^)"']+)\1\)/gi,
  ];
  for (const re of patterns) {
    for (const match of text.matchAll(re)) {
      const raw = match[2] || match[1] || '';
      if (raw.includes('/media/') || raw.startsWith('/media/')) tokens.add(raw);
    }
  }
  // Also catch bare YAML-ish /media paths
  for (const match of text.matchAll(/(^|[\s:"'])(\/media\/[^\s"'<>)]+)/gm)) {
    tokens.add(match[2]);
  }
  return [...tokens];
}

function pathsMatchForRewrite(literal: string, duplicatePaths: Set<string>): string | null {
  const literalPath = (literal.split('?')[0] || literal).trim();
  if (duplicatePaths.has(literalPath)) return literalPath;
  const canon = canonicalizeMediaPath(literal);
  if (duplicatePaths.has(canon)) return canon;
  // Match WP-sized or derivative literals that canonicalize to a duplicate master
  if (isDerivativeMediaPath(literal)) {
    const master = canonicalizeMediaPath(literal);
    if (duplicatePaths.has(master)) return master;
  }
  return null;
}

async function inventoryReferences(
  repoRoot: string,
  duplicatePaths: Set<string>,
): Promise<ConsolidateReference[]> {
  const refs: ConsolidateReference[] = [];
  for (const kind of ['posts', 'destinations'] as const) {
    const root = path.join(repoRoot, 'src/content', kind);
    const files = await walkFiles(root);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const raw = await fs.readFile(file, 'utf8');
      // Split frontmatter / body roughly for role tagging
      const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
      const frontmatter = fmMatch ? fmMatch[1] : '';
      const body = fmMatch ? fmMatch[2] : raw;

      const titleMatch = /^title:\s*(.+)$/m.exec(frontmatter);
      const slugMatch = /^slug:\s*(.+)$/m.exec(frontmatter);
      const langMatch = /^lang:\s*(.+)$/m.exec(frontmatter);
      const groupMatch = /^translationGroup:\s*(.+)$/m.exec(frontmatter);
      const title = (titleMatch?.[1] || '').replace(/^["']|["']$/g, '').trim();
      const slug = (slugMatch?.[1] || '').replace(/^["']|["']$/g, '').trim();
      const lang = (langMatch?.[1] || '').replace(/^["']|["']$/g, '').trim();
      const translationGroup = (groupMatch?.[1] || slug).replace(/^["']|["']$/g, '').trim();
      const contentKind = kind === 'destinations' ? 'destination' : 'post';
      const relativePath = path.relative(repoRoot, file).split(path.sep).join('/');

      // Hero
      const heroMatch = /^featuredImage:\s*(.+)$/m.exec(frontmatter);
      if (heroMatch) {
        const literal = heroMatch[1].replace(/^["']|["']$/g, '').trim();
        const matched = pathsMatchForRewrite(literal, duplicatePaths);
        if (matched) {
          const altMatch = /^featuredImageAlt:\s*(.+)$/m.exec(frontmatter);
          refs.push({
            filePath: file,
            relativePath,
            kind: contentKind,
            lang,
            slug,
            title,
            translationGroup,
            role: 'hero',
            literalSrc: literal,
            canonicalSrc: matched,
            alt: (altMatch?.[1] || '').replace(/^["']|["']$/g, '').trim(),
          });
        }
      }

      // Gallery src lines
      for (const match of frontmatter.matchAll(/^\s*-\s*src:\s*(.+)$/gm)) {
        const literal = match[1].replace(/^["']|["']$/g, '').trim();
        const matched = pathsMatchForRewrite(literal, duplicatePaths);
        if (!matched) continue;
        refs.push({
          filePath: file,
          relativePath,
          kind: contentKind,
          lang,
          slug,
          title,
          translationGroup,
          role: 'gallery',
          literalSrc: literal,
          canonicalSrc: matched,
          alt: '',
        });
      }

      // Body HTML img src
      for (const match of body.matchAll(/<img\b[^>]*>/gi)) {
        const tag = match[0];
        const srcMatch = /\bsrc\s*=\s*(["'])([^"']+)\1/i.exec(tag);
        if (!srcMatch) continue;
        const literal = srcMatch[2];
        const matched = pathsMatchForRewrite(literal, duplicatePaths);
        if (!matched) continue;
        const altMatch = /\balt\s*=\s*(["'])(.*?)\1/i.exec(tag);
        refs.push({
          filePath: file,
          relativePath,
          kind: contentKind,
          lang,
          slug,
          title,
          translationGroup,
          role: 'inline',
          literalSrc: literal,
          canonicalSrc: matched,
          alt: altMatch?.[2] || '',
        });
      }

      // Markdown images
      for (const match of body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
        const literal = match[2];
        const matched = pathsMatchForRewrite(literal, duplicatePaths);
        if (!matched) continue;
        refs.push({
          filePath: file,
          relativePath,
          kind: contentKind,
          lang,
          slug,
          title,
          translationGroup,
          role: 'markdown',
          literalSrc: literal,
          canonicalSrc: matched,
          alt: match[1] || '',
        });
      }

      // srcset tokens
      for (const match of body.matchAll(/\bsrcset\s*=\s*(["'])([^"']+)\1/gi)) {
        const value = match[2];
        for (const part of value.split(',')) {
          const literal = part.trim().split(/\s+/)[0] || '';
          const matched = pathsMatchForRewrite(literal, duplicatePaths);
          if (!matched) continue;
          refs.push({
            filePath: file,
            relativePath,
            kind: contentKind,
            lang,
            slug,
            title,
            translationGroup,
            role: 'srcset',
            literalSrc: literal,
            canonicalSrc: matched,
            alt: '',
          });
        }
      }
    }
  }
  return refs;
}

function findMetadataConflicts(
  keeper: MediaCatalogEntry,
  others: MediaCatalogEntry[],
): MetadataConflict[] {
  const conflicts: MetadataConflict[] = [];
  for (const field of ['credit', 'notes', 'defaultAlt'] as const) {
    const keeperValue = (keeper[field] || '').trim();
    const otherValues = others
      .map((o) => ({ path: o.path, value: (o[field] || '').trim() }))
      .filter((o) => o.value && o.value !== keeperValue);
    if (otherValues.length) {
      conflicts.push({ field, keeperValue, otherValues });
    }
  }
  return conflicts;
}

async function listDerivativesOnDisk(
  repoRoot: string,
  masterPath: string,
): Promise<string[]> {
  const dir = path.dirname(publicPath(repoRoot, masterPath));
  const base = path.basename(masterPath);
  const stem = base.replace(/\.[^.]+$/, '');
  const ext = path.extname(base);
  const names = await fs.readdir(dir).catch(() => [] as string[]);
  const out: string[] = [];
  for (const name of names) {
    const m = new RegExp(`^${escapeRegExp(stem)}\\.w(\\d+)${escapeRegExp(ext)}$`, 'i').exec(name);
    if (m) {
      const rel = path.posix.join(path.posix.dirname(masterPath), name);
      out.push(rel.startsWith('/') ? rel : `/${rel}`.replace(/^\/\/+/, '/'));
      // normalize to /media/...
      const fixed = `/media/${path.relative(path.join(repoRoot, 'public/media'), path.join(dir, name)).split(path.sep).join('/')}`;
      out[out.length - 1] = fixed;
    }
  }
  // Also check known widths even if naming differs
  for (const w of MEDIA_DERIVATIVE_WIDTHS) {
    const deriv = derivativeMediaPath(masterPath, w);
    try {
      await fs.access(publicPath(repoRoot, deriv));
      if (!out.includes(deriv)) out.push(deriv);
    } catch {
      /* missing */
    }
  }
  return [...new Set(out)];
}

function rewriteFileContent(
  raw: string,
  replacements: Map<string, string>,
  fillEmptyAlts: boolean,
  defaultAlt: string,
): { content: string; replacementsMade: number; filledAlts: number } {
  let content = raw;
  let replacementsMade = 0;
  let filledAlts = 0;

  // Sort longer literals first to avoid partial replacements
  const literals = [...replacements.keys()].sort((a, b) => b.length - a.length);

  for (const literal of literals) {
    const keeper = replacements.get(literal)!;
    if (literal === keeper) continue;
    const re = new RegExp(escapeRegExp(literal), 'g');
    const before = content;
    content = content.replace(re, keeper);
    if (content !== before) {
      const matches = before.match(re);
      replacementsMade += matches?.length ?? 0;
    }
  }

  if (fillEmptyAlts && defaultAlt) {
    const safeAlt = defaultAlt.replace(/"/g, '&quot;');
    content = content.replace(/<img\b[^>]*>/gi, (tag) => {
      const srcMatch = /\bsrc\s*=\s*(["'])([^"']+)\1/i.exec(tag);
      if (!srcMatch) return tag;
      const src = canonicalizeMediaPath(srcMatch[2]);
      if (![...replacements.values()].includes(src) && !replacements.has(srcMatch[2])) {
        // only fill when this img was one of the rewritten targets (now keeper)
        if (![...replacements.values()].includes(src)) return tag;
      }
      const isKeeperImg = [...replacements.values()].includes(src);
      if (!isKeeperImg) return tag;
      const altMatch = /\balt\s*=\s*(["'])(.*?)\1/i.exec(tag);
      if (altMatch && altMatch[2].trim()) return tag;
      filledAlts += 1;
      if (altMatch) {
        return tag.replace(/\balt\s*=\s*(["']).*?\1/i, `alt="${safeAlt}"`);
      }
      return tag.replace(/<img\b/i, `<img alt="${safeAlt}"`);
    });

    // featuredImageAlt empty
    if (/^featuredImage:\s*.+$/m.test(content) && !/^featuredImageAlt:\s*\S/m.test(content)) {
      if (/^featuredImageAlt:\s*$/m.test(content) || /^featuredImageAlt:\s*["']\s*["']\s*$/m.test(content)) {
        content = content.replace(
          /^featuredImageAlt:\s*(?:["']\s*["'])?\s*$/m,
          `featuredImageAlt: ${JSON.stringify(defaultAlt)}`,
        );
        filledAlts += 1;
      } else if (!/^featuredImageAlt:/m.test(content)) {
        content = content.replace(
          /^(featuredImage:\s*.+)$/m,
          `$1\nfeaturedImageAlt: ${JSON.stringify(defaultAlt)}`,
        );
        filledAlts += 1;
      }
    }
  }

  return { content, replacementsMade, filledAlts };
}

function pruneExpiredPreviews() {
  const now = Date.now();
  for (const [token, entry] of previewStore) {
    if (entry.expiresAt <= now) previewStore.delete(token);
  }
  for (const [token, entry] of exactBatchStore) {
    if (entry.expiresAt <= now) exactBatchStore.delete(token);
  }
}

export async function previewConsolidateGroup(
  repoRoot: string,
  options: {
    groupId: string;
    keeperPath?: string;
    memberPaths?: string[];
    fillEmptyAlts?: boolean;
    explicitSimilarApproval?: boolean;
  },
): Promise<ConsolidatePreview> {
  pruneExpiredPreviews();
  const catalog = await readMediaCatalog(repoRoot);
  const groups = listDuplicateGroups(catalog);
  const group = groups.find((g) => g.id === options.groupId);
  if (!group) throw new Error(`Unknown duplicate group: ${options.groupId}`);

  const requestedPaths = options.memberPaths?.map(canonicalizeMediaPath);
  if (
    requestedPaths?.some(
      (requested) => !group.members.some((member) => member.path === requested),
    )
  ) {
    throw new Error('Every selected path must belong to the duplicate group.');
  }
  const selectedMembers = requestedPaths?.length
    ? group.members.filter((member) => requestedPaths.includes(member.path))
    : group.members;
  if (selectedMembers.length < 2) {
    throw new Error('Select at least two images to merge.');
  }

  const warnings: string[] = [];
  if (group.kind === 'similar') {
    warnings.push(
      'This group is perceptual-similarity only (not byte-identical). Confirm carefully before merging.',
    );
    if (!options.explicitSimilarApproval) {
      warnings.push('Confirming a similar merge requires explicitSimilarApproval: true.');
    }
  }

  const keeperPath = canonicalizeMediaPath(
    options.keeperPath || suggestCanonicalKeeper(selectedMembers),
  );
  if (!selectedMembers.some((m) => m.path === keeperPath)) {
    throw new Error(`Keeper ${keeperPath} must be one of the selected images.`);
  }
  if (isOgDerivativePath(keeperPath)) {
    throw new Error('OG derivatives cannot be consolidation keepers.');
  }

  const memberPaths = selectedMembers.map((m) => m.path);
  const duplicateSet = new Set(memberPaths);
  const quarantinePaths = memberPaths.filter((p) => p !== keeperPath);
  const unselectedPaths = group.members
    .map((member) => member.path)
    .filter((memberPath) => !memberPaths.includes(memberPath));
  const reviewedSurvivorPaths =
    group.kind === 'similar' ? [keeperPath, ...unselectedPaths] : [];
  const quarantineDerivatives: string[] = [];
  for (const p of quarantinePaths) {
    quarantineDerivatives.push(...(await listDerivativesOnDisk(repoRoot, p)));
  }

  const references = (await inventoryReferences(repoRoot, duplicateSet)).filter(
    (r) => r.canonicalSrc !== keeperPath || r.literalSrc !== keeperPath,
  );
  // Keep refs that still point at non-keepers (or literal non-canonical forms of keeper)
  const actionable = references.filter((r) => r.canonicalSrc !== keeperPath);

  const keeper = catalog.items[keeperPath]!;
  const others = selectedMembers.filter((m) => m.path !== keeperPath);
  const metadataConflicts = findMetadataConflicts(keeper, others);
  const bestDefaultAlt = selectBestExistingAlt(selectedMembers);

  if (!actionable.length && quarantinePaths.every((p) => (catalog.items[p]?.usageRaw ?? 0) === 0)) {
    warnings.push('No content references need rewriting; only unused duplicate files will move to quarantine.');
  }

  const previewToken = crypto.randomBytes(16).toString('hex');
  const preview: ConsolidatePreview = {
    previewToken,
    groupId: group.id,
    kind: group.kind,
    keeperPath,
    memberPaths,
    quarantinePaths,
    quarantineDerivatives,
    references: actionable,
    metadataConflicts,
    warnings,
    fillEmptyAlts: Boolean(options.fillEmptyAlts),
    bestDefaultAlt,
    reviewedSurvivorPaths,
    catalogFingerprint: catalogFingerprint(catalog, memberPaths),
    createdAt: new Date().toISOString(),
  };
  previewStore.set(previewToken, {
    ...preview,
    expiresAt: Date.now() + PREVIEW_TTL_MS,
  });
  return preview;
}

export async function confirmConsolidateGroup(
  repoRoot: string,
  options: {
    previewToken: string;
    explicitSimilarApproval?: boolean;
    dryRun?: boolean;
  },
): Promise<ConsolidateResult | { ok: false; dryRun: true; preview: ConsolidatePreview }> {
  pruneExpiredPreviews();
  const stored = previewStore.get(options.previewToken);
  if (!stored) {
    throw new Error('Preview expired or unknown. Generate a fresh preview.');
  }

  const catalog = await readMediaCatalog(repoRoot);
  const fingerprint = catalogFingerprint(catalog, stored.memberPaths);
  if (fingerprint !== stored.catalogFingerprint) {
    previewStore.delete(options.previewToken);
    throw new Error('Catalog changed since preview. Re-run preview and try again.');
  }

  if (stored.kind === 'similar' && !options.explicitSimilarApproval) {
    throw new Error('Similar (perceptual) merges require explicitSimilarApproval: true.');
  }

  if (options.dryRun) {
    return { ok: false, dryRun: true, preview: stored };
  }

  const keeperPath = stored.keeperPath;
  const keeper = catalog.items[keeperPath];
  if (!keeper) throw new Error(`Keeper missing from catalog: ${keeperPath}`);
  const groupMembers = stored.memberPaths
    .map((p) => catalog.items[p])
    .filter(Boolean) as MediaCatalogEntry[];
  const bestDefaultAlt = selectBestExistingAlt(groupMembers);
  if (bestDefaultAlt) {
    keeper.defaultAlt = bestDefaultAlt;
    keeper.manual = { ...keeper.manual, defaultAlt: true };
  }

  // Build literal → keeper map from inventory + common variants
  const replacements = new Map<string, string>();
  for (const ref of stored.references) {
    replacements.set(ref.literalSrc, keeperPath);
  }
  for (const p of stored.quarantinePaths) {
    replacements.set(p, keeperPath);
  }

  // Scan all content files once more and rewrite
  let rewrittenReferences = 0;
  let filledEmptyAlts = 0;
  const touchedFiles: string[] = [];
  const contentRoots = [
    path.join(repoRoot, 'src/content/posts'),
    path.join(repoRoot, 'src/content/destinations'),
  ];

  for (const root of contentRoots) {
    const files = await walkFiles(root);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const raw = await fs.readFile(file, 'utf8');
      // Discover any literal tokens that map to quarantine paths
      const tokens = collectLiteralMediaTokens(raw);
      const localMap = new Map(replacements);
      for (const token of tokens) {
        const matched = pathsMatchForRewrite(token, new Set(stored.quarantinePaths));
        if (matched) localMap.set(token, keeperPath);
      }
      if (![...localMap.keys()].some((k) => raw.includes(k))) continue;

      const result = rewriteFileContent(
        raw,
        localMap,
        stored.fillEmptyAlts,
        bestDefaultAlt,
      );
      if (result.content === raw) continue;
      await fs.writeFile(file, result.content, 'utf8');
      rewrittenReferences += result.replacementsMade;
      filledEmptyAlts += result.filledAlts;
      touchedFiles.push(path.relative(repoRoot, file).split(path.sep).join('/'));
    }
  }

  // Ensure keeper derivatives
  await ensureDerivativesForMaster(repoRoot, keeperPath);

  // Merge safe catalog metadata onto keeper (in-memory then re-index will preserve manual)
  const others = stored.memberPaths
    .filter((p) => p !== keeperPath)
    .map((p) => catalog.items[p])
    .filter(Boolean) as MediaCatalogEntry[];
  const unionTags = [...new Set([keeper.tags, ...others.map((o) => o.tags)].flat())];
  const unionRoles = [
    ...new Set([keeper.preferredRoles, ...others.map((o) => o.preferredRoles)].flat()),
  ];
  keeper.tags = unionTags.slice(0, 48);
  keeper.preferredRoles = unionRoles;
  keeper.manual = {
    ...(keeper.manual || {}),
    tags: true,
  };
  // Preserve the strongest existing alt; never replace it with filename-derived copy.
  if (bestDefaultAlt) keeper.defaultAlt = bestDefaultAlt;
  if (!keeper.credit.trim()) {
    const donor = others.find((o) => o.credit.trim());
    if (donor) {
      keeper.credit = donor.credit;
      keeper.manual = { ...keeper.manual, credit: true };
    }
  }
  catalog.items[keeperPath] = keeper;
  // Write catalog so re-index preserves merged manual fields on keeper
  await writeMediaCatalog(repoRoot, catalog);

  // Quarantine redundant masters + derivatives
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const quarantineRoot = path.join(repoRoot, 'media-quarantine', stamp);
  await fs.mkdir(quarantineRoot, { recursive: true });
  const quarantined: string[] = [];

  async function moveToQuarantine(mediaUrl: string) {
    const src = publicPath(repoRoot, mediaUrl);
    try {
      await fs.access(src);
    } catch {
      return;
    }
    const dest = path.join(quarantineRoot, mediaUrl.replace(/^\/media\//, ''));
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.rename(src, dest);
    quarantined.push(mediaUrl);
  }

  for (const p of stored.quarantinePaths) {
    await moveToQuarantine(p);
  }
  for (const p of stored.quarantineDerivatives) {
    await moveToQuarantine(p);
  }

  const reviewedNonDuplicatePairs =
    stored.kind === 'similar'
      ? await ignoreSimilarPairsAmong(repoRoot, stored.reviewedSurvivorPaths)
      : 0;

  const manifest = {
    createdAt: new Date().toISOString(),
    groupId: stored.groupId,
    kind: stored.kind,
    keeperPath,
    sourceToKeeper: Object.fromEntries(stored.quarantinePaths.map((p) => [p, keeperPath])),
    quarantined,
    touchedFiles,
    rewrittenReferences,
    filledEmptyAlts,
    reviewedSurvivorPaths: stored.reviewedSurvivorPaths,
    reviewedNonDuplicatePairs,
    previewToken: stored.previewToken,
  };
  const manifestPath = path.join(quarantineRoot, 'manifest.json');
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  previewStore.delete(options.previewToken);
  await indexMediaCatalog(repoRoot);

  return {
    ok: true,
    keeperPath,
    rewrittenReferences,
    touchedFiles,
    quarantined,
    quarantineDir: path.relative(repoRoot, quarantineRoot).split(path.sep).join('/'),
    manifestPath: path.relative(repoRoot, manifestPath).split(path.sep).join('/'),
    filledEmptyAlts,
    reviewedNonDuplicatePairs,
  };
}

/** Preview the one-click operation for every byte-identical group. */
export async function previewAllExactDuplicates(
  repoRoot: string,
): Promise<ExactBatchPreview> {
  pruneExpiredPreviews();
  const catalog = await readMediaCatalog(repoRoot);
  const groups = listDuplicateGroups(catalog).filter((group) => group.kind === 'exact');
  const allMemberPaths = groups.flatMap((group) => group.members.map((member) => member.path));
  const batchToken = crypto.randomBytes(16).toString('hex');
  const createdAt = new Date().toISOString();
  const summaries = groups.map((group) => {
    const keeperPath =
      group.suggestedKeeper || suggestCanonicalKeeper(group.members);
    const sources = group.members.filter((member) => member.path !== keeperPath);
    return {
      groupId: group.id,
      keeperPath,
      redundantFileCount: sources.length,
      referenceCount: sources.reduce((sum, member) => sum + member.usageRaw, 0),
      bestDefaultAlt: selectBestExistingAlt(group.members),
    };
  });

  exactBatchStore.set(batchToken, {
    batchToken,
    groupIds: groups.map((group) => group.id),
    catalogFingerprint: catalogFingerprint(catalog, allMemberPaths),
    expiresAt: Date.now() + PREVIEW_TTL_MS,
  });

  return {
    batchToken,
    groupCount: groups.length,
    redundantFileCount: summaries.reduce(
      (sum, group) => sum + group.redundantFileCount,
      0,
    ),
    referenceCount: summaries.reduce((sum, group) => sum + group.referenceCount, 0),
    keepersWithAlt: summaries.filter((group) => group.bestDefaultAlt).length,
    keepersMissingAlt: summaries.filter((group) => !group.bestDefaultAlt).length,
    groups: summaries,
    createdAt,
  };
}

/**
 * Consolidate every exact group in one content pass and one final re-index.
 * Similar/perceptual groups are intentionally excluded.
 */
export async function confirmAllExactDuplicates(
  repoRoot: string,
  batchToken: string,
): Promise<ExactBatchResult> {
  pruneExpiredPreviews();
  const stored = exactBatchStore.get(batchToken);
  if (!stored) throw new Error('Batch preview expired or unknown. Generate a fresh preview.');

  const catalog = await readMediaCatalog(repoRoot);
  const allGroups = listDuplicateGroups(catalog);
  const groups = stored.groupIds
    .map((id) => allGroups.find((group) => group.id === id))
    .filter((group): group is (typeof allGroups)[number] => Boolean(group));
  if (
    groups.length !== stored.groupIds.length ||
    groups.some((group) => group.kind !== 'exact')
  ) {
    exactBatchStore.delete(batchToken);
    throw new Error('Exact duplicate groups changed since preview. Re-index and preview again.');
  }

  const allMemberPaths = groups.flatMap((group) =>
    group.members.map((member) => member.path),
  );
  if (catalogFingerprint(catalog, allMemberPaths) !== stored.catalogFingerprint) {
    exactBatchStore.delete(batchToken);
    throw new Error('Catalog changed since batch preview. Generate a fresh preview.');
  }

  const sourceToKeeper = new Map<string, string>();
  const bestAltByKeeper = new Map<string, string>();
  const keeperEntries: MediaCatalogEntry[] = [];
  for (const group of groups) {
    const keeperPath =
      group.suggestedKeeper || suggestCanonicalKeeper(group.members);
    const keeper = catalog.items[keeperPath];
    if (!keeper) throw new Error(`Keeper missing from catalog: ${keeperPath}`);
    keeperEntries.push(keeper);
    const bestAlt = selectBestExistingAlt(group.members);
    bestAltByKeeper.set(keeperPath, bestAlt);
    if (bestAlt) {
      keeper.defaultAlt = bestAlt;
      keeper.manual = { ...keeper.manual, defaultAlt: true };
    }
    for (const member of group.members) {
      if (member.path !== keeperPath) sourceToKeeper.set(member.path, keeperPath);
    }
  }

  let rewrittenReferences = 0;
  const touchedFiles: string[] = [];
  const contentRoots = [
    path.join(repoRoot, 'src/content/posts'),
    path.join(repoRoot, 'src/content/destinations'),
  ];
  const sourcePaths = new Set(sourceToKeeper.keys());

  for (const root of contentRoots) {
    const files = await walkFiles(root);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const raw = await fs.readFile(file, 'utf8');
      const replacements = new Map<string, string>();
      for (const token of collectLiteralMediaTokens(raw)) {
        const source = pathsMatchForRewrite(token, sourcePaths);
        if (source) replacements.set(token, sourceToKeeper.get(source)!);
      }
      if (!replacements.size) continue;
      const result = rewriteFileContent(raw, replacements, false, '');
      if (result.content === raw) continue;
      await fs.writeFile(file, result.content, 'utf8');
      rewrittenReferences += result.replacementsMade;
      touchedFiles.push(path.relative(repoRoot, file).split(path.sep).join('/'));
    }
  }

  // Merge metadata and prepare each keeper before moving redundant files.
  for (const group of groups) {
    const keeperPath =
      group.suggestedKeeper || suggestCanonicalKeeper(group.members);
    const keeper = catalog.items[keeperPath]!;
    const others = group.members.filter((member) => member.path !== keeperPath);
    keeper.tags = [
      ...new Set([keeper.tags, ...others.map((other) => other.tags)].flat()),
    ].slice(0, 48);
    keeper.preferredRoles = [
      ...new Set(
        [keeper.preferredRoles, ...others.map((other) => other.preferredRoles)].flat(),
      ),
    ];
    keeper.manual = { ...keeper.manual, tags: true };
    if (!keeper.credit.trim()) {
      const donor = others.find((other) => other.credit.trim());
      if (donor) {
        keeper.credit = donor.credit;
        keeper.manual = { ...keeper.manual, credit: true };
      }
    }
    const bestAlt = bestAltByKeeper.get(keeperPath) || '';
    if (bestAlt) {
      keeper.defaultAlt = bestAlt;
      keeper.manual = { ...keeper.manual, defaultAlt: true };
    }
    catalog.items[keeperPath] = keeper;
    await ensureDerivativesForMaster(repoRoot, keeperPath);
  }
  await writeMediaCatalog(repoRoot, catalog);

  const stamp = `exact-batch-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  const quarantineRoot = path.join(repoRoot, 'media-quarantine', stamp);
  await fs.mkdir(quarantineRoot, { recursive: true });
  const quarantined: string[] = [];

  async function moveToBatchQuarantine(mediaUrl: string) {
    const src = publicPath(repoRoot, mediaUrl);
    try {
      await fs.access(src);
    } catch {
      return;
    }
    const dest = path.join(quarantineRoot, mediaUrl.replace(/^\/media\//, ''));
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.rename(src, dest);
    quarantined.push(mediaUrl);
  }

  for (const sourcePath of sourceToKeeper.keys()) {
    const derivatives = await listDerivativesOnDisk(repoRoot, sourcePath);
    await moveToBatchQuarantine(sourcePath);
    for (const derivative of derivatives) {
      await moveToBatchQuarantine(derivative);
    }
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    operation: 'all-exact-duplicates',
    mergedGroups: groups.length,
    sourceToKeeper: Object.fromEntries(sourceToKeeper),
    bestAltByKeeper: Object.fromEntries(bestAltByKeeper),
    rewrittenReferences,
    touchedFiles,
    quarantined,
    batchToken,
  };
  const manifestPath = path.join(quarantineRoot, 'manifest.json');
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  exactBatchStore.delete(batchToken);
  await indexMediaCatalog(repoRoot);

  return {
    ok: true,
    mergedGroups: groups.length,
    rewrittenReferences,
    touchedFiles,
    quarantined,
    quarantineDir: path.relative(repoRoot, quarantineRoot).split(path.sep).join('/'),
    manifestPath: path.relative(repoRoot, manifestPath).split(path.sep).join('/'),
    keepersWithAlt: keeperEntries.filter((keeper) => keeper.defaultAlt.trim()).length,
  };
}

/** Mark every pair in a perceptual group as reviewed non-duplicates. */
export async function dismissSimilarGroup(
  repoRoot: string,
  groupId: string,
): Promise<{ groupId: string; memberCount: number; ignoredPairs: number }> {
  const catalog = await readMediaCatalog(repoRoot);
  const group = listDuplicateGroups(catalog).find((candidate) => candidate.id === groupId);
  if (!group) throw new Error(`Unknown duplicate group: ${groupId}`);
  if (group.kind !== 'similar') {
    throw new Error('Only perceptual similar groups can be marked not similar.');
  }
  const ignoredPairs = await ignoreSimilarPairsAmong(
    repoRoot,
    group.members.map((member) => member.path),
  );
  await indexMediaCatalog(repoRoot);
  return {
    groupId,
    memberCount: group.members.length,
    ignoredPairs,
  };
}

export async function listConsolidationGroups(repoRoot: string) {
  const catalog = await readMediaCatalog(repoRoot);
  return listDuplicateGroups(catalog).map((g) => ({
    id: g.id,
    kind: g.kind,
    memberCount: g.members.length,
    suggestedKeeper: g.suggestedKeeper,
    totalUsageRaw: g.members.reduce((sum, m) => sum + m.usageRaw, 0),
    members: g.members.map((m) => ({
      path: m.path,
      filename: m.filename,
      width: m.width,
      height: m.height,
      bytes: m.bytes,
      usageEn: m.usageEn,
      usageRaw: m.usageRaw,
      defaultAlt: m.defaultAlt,
      credit: m.credit,
      tags: m.tags,
      duplicateKind: m.duplicateKind,
      missingDerivatives: m.missingDerivatives,
    })),
  }));
}
