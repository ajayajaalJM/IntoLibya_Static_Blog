/**
 * Generate missing responsive WebP derivatives for existing /media masters.
 * Does not re-encode lossless masters.
 *
 *   npx tsx scripts/backfill-media-derivatives.ts
 *   npx tsx scripts/backfill-media-derivatives.ts --limit=50
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ensureDerivativesForMaster } from '../tools/blog-writer/lib/media-encode';
import { indexMediaCatalog, readMediaCatalog } from '../tools/blog-writer/lib/media-catalog';
import { isDerivativeMediaPath, isOgDerivativePath } from '../src/lib/media-paths';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

let catalog = await readMediaCatalog(repoRoot);
if (!Object.keys(catalog.items).length) {
  console.log('Catalog empty — indexing first…');
  await indexMediaCatalog(repoRoot);
  catalog = await readMediaCatalog(repoRoot);
}

const targets = Object.values(catalog.items)
  .filter((i) => !i.isOg && !i.isDerivative && i.missingDerivatives)
  .slice(0, Number.isFinite(limit) ? limit : undefined);

console.log(`Ensuring derivatives for ${targets.length} master(s)…`);
let createdTotal = 0;
for (const item of targets) {
  if (isDerivativeMediaPath(item.path) || isOgDerivativePath(item.path)) continue;
  try {
    const out = await ensureDerivativesForMaster(repoRoot, item.path);
    createdTotal += out.created.length;
    if (out.created.length) {
      console.log(`  ${item.path} +${out.created.length}`);
    }
  } catch (err) {
    console.warn(`  skip ${item.path}:`, err instanceof Error ? err.message : err);
  }
}

await indexMediaCatalog(repoRoot);
console.log(`Done. Created ${createdTotal} derivative file(s).`);
