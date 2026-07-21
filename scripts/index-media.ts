/**
 * Index public/media into data/media-catalog.json with usage, tags, duplicates, credits.
 *
 * Usage:
 *   npx tsx scripts/index-media.ts
 *   npx tsx scripts/index-media.ts --orphans-only
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { indexMediaCatalog } from '../tools/blog-writer/lib/media-catalog';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const orphansOnly = process.argv.includes('--orphans-only');

const result = await indexMediaCatalog(repoRoot, { orphansOnly });

console.log(JSON.stringify(result.summary, null, 2));
if (orphansOnly) {
  console.log(`\nOrphans (unused, excl. pool): ${result.orphans.length}`);
  for (const p of result.orphans.slice(0, 50)) console.log(`  ${p}`);
  if (result.orphans.length > 50) console.log(`  … +${result.orphans.length - 50} more`);
} else {
  console.log(`\nWrote data/media-catalog.json (${result.summary.total} masters)`);
}
