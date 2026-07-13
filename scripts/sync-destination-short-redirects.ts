/**
 * Merge bare short-URL redirects into vercel.json:
 *   /{slug}  → /en/destination/{slug}
 *   /{slug}/ → /en/destination/{slug}
 *
 * Also adds common English aliases (cyrene → shahat, etc.).
 *
 * Usage: npx tsx scripts/sync-destination-short-redirects.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DESTINATION_TRANSLATION_GROUPS } from '../src/lib/destination-schema';
import { LANGS } from '../src/lib/post-schema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const vercelPath = path.join(repoRoot, 'vercel.json');

/** Alternate public names → destination translation group. */
const DESTINATION_SHORT_ALIASES: Record<string, string> = {
  cyrene: 'shahat',
  apollonia: 'susa',
  tolmeita: 'ptolemais',
  garama: 'germa',
  'tadrart-acacus': 'acacus-mountains',
  ubari: 'gaberoun',
};

/** Never emit a short redirect that would steal a real site root. */
const RESERVED_ROOT_SLUGS = new Set([
  ...LANGS,
  'blog',
  'tourbuilder',
  'TourBuilder',
  'checkout',
  'cart',
  'media',
  'assets',
  'destination',
  'destinations',
  'api',
  'favicon.ico',
  'favicon.svg',
  'robots.txt',
  'sitemap.xml',
  'sitemap-index.xml',
  'llms.txt',
  '404',
  'index',
]);

type Redirect = { source: string; destination: string; permanent: boolean };

function pair(sourceBase: string, destPath: string): Redirect[] {
  return [
    { source: `/${sourceBase}`, destination: destPath, permanent: true },
    { source: `/${sourceBase}/`, destination: destPath, permanent: true },
  ];
}

function buildShortRedirects(): Redirect[] {
  const redirects: Redirect[] = [];
  const usedSources = new Set<string>();

  const add = (sourceSlug: string, targetGroup: string) => {
    if (RESERVED_ROOT_SLUGS.has(sourceSlug)) {
      throw new Error(`Refusing short redirect for reserved root: /${sourceSlug}`);
    }
    if (!DESTINATION_TRANSLATION_GROUPS.includes(targetGroup as (typeof DESTINATION_TRANSLATION_GROUPS)[number])) {
      throw new Error(`Unknown destination group for short redirect: ${targetGroup}`);
    }
    const dest = `/en/destination/${targetGroup}`;
    for (const rule of pair(sourceSlug, dest)) {
      if (usedSources.has(rule.source)) {
        throw new Error(`Duplicate short redirect source: ${rule.source}`);
      }
      usedSources.add(rule.source);
      redirects.push(rule);
    }
  };

  for (const slug of DESTINATION_TRANSLATION_GROUPS) {
    add(slug, slug);
  }

  for (const [alias, group] of Object.entries(DESTINATION_SHORT_ALIASES)) {
    add(alias, group);
  }

  return redirects;
}

async function main() {
  const shortRedirects = buildShortRedirects();
  const raw = await fs.readFile(vercelPath, 'utf8');
  const vercel = JSON.parse(raw) as {
    redirects?: Redirect[];
    [key: string]: unknown;
  };

  const existing = vercel.redirects ?? [];
  const existingSources = new Set(existing.map((r) => r.source));

  const toAdd = shortRedirects.filter((r) => !existingSources.has(r.source));
  const skipped = shortRedirects.length - toAdd.length;

  // Insert short redirects near the top (after non-destination utility redirects is fine;
  // append after existing for stability — Vercel matches first match; unique sources only).
  vercel.redirects = [...existing, ...toAdd];

  await fs.writeFile(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`, 'utf8');

  const mapPath = path.join(repoRoot, 'scripts/destination-short-redirects.json');
  await fs.writeFile(mapPath, `${JSON.stringify(shortRedirects, null, 2)}\n`, 'utf8');

  console.log(
    `Short redirects: ${shortRedirects.length} defined, ${toAdd.length} added to vercel.json, ${skipped} already present.`,
  );
  console.log(`Wrote map: ${path.relative(repoRoot, mapPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
