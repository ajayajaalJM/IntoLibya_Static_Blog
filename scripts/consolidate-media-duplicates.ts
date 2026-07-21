#!/usr/bin/env npx tsx
/**
 * Dry-run / apply duplicate image consolidation from the CLI.
 *
 * Examples:
 *   npx tsx scripts/consolidate-media-duplicates.ts --list
 *   npx tsx scripts/consolidate-media-duplicates.ts --preview exact-1
 *   npx tsx scripts/consolidate-media-duplicates.ts --preview exact-1 --keeper /media/...
 *   npx tsx scripts/consolidate-media-duplicates.ts --confirm <previewToken> --yes
 *   npx tsx scripts/consolidate-media-duplicates.ts --confirm <previewToken> --similar-ok --yes
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  confirmConsolidateGroup,
  listConsolidationGroups,
  previewConsolidateGroup,
} from '../tools/blog-writer/lib/media-consolidate';
import { indexMediaCatalog } from '../tools/blog-writer/lib/media-catalog';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    console.log(`Usage:
  --list                         List duplicate groups
  --reindex                      Re-index media catalog first
  --preview <groupId>            Preview consolidation (dry inventory)
  --keeper <path>                Override suggested keeper (with --preview)
  --fill-empty-alts              Fill empty alts from keeper default
  --confirm <previewToken>       Apply a previous preview
  --similar-ok                   Required for perceptual (similar) merges
  --yes                          Actually write (without this, confirm is dry-run)
`);
    return;
  }

  if (hasFlag('--reindex')) {
    console.log('Indexing media…');
    const result = await indexMediaCatalog(repoRoot);
    console.log(
      `Indexed ${result.summary.masters} masters · ${result.summary.duplicateGroups} dup groups`,
    );
  }

  if (hasFlag('--list') || (!hasFlag('--preview') && !hasFlag('--confirm'))) {
    const groups = await listConsolidationGroups(repoRoot);
    console.log(
      `Found ${groups.length} groups (${groups.filter((g) => g.kind === 'exact').length} exact, ${groups.filter((g) => g.kind === 'similar').length} similar)\n`,
    );
    for (const g of groups) {
      console.log(
        `${g.id} [${g.kind}] members=${g.memberCount} usageRaw=${g.totalUsageRaw} keeper=${g.suggestedKeeper}`,
      );
      for (const m of g.members) {
        console.log(
          `  - ${m.path}  ${m.width}x${m.height}  en=${m.usageEn} raw=${m.usageRaw}`,
        );
      }
      console.log('');
    }
    if (!hasFlag('--preview') && !hasFlag('--confirm')) return;
  }

  const previewId = argValue('--preview');
  if (previewId) {
    const preview = await previewConsolidateGroup(repoRoot, {
      groupId: previewId,
      keeperPath: argValue('--keeper'),
      fillEmptyAlts: hasFlag('--fill-empty-alts'),
      explicitSimilarApproval: hasFlag('--similar-ok'),
    });
    console.log(JSON.stringify(preview, null, 2));
    console.log(
      `\nTo apply:\n  npx tsx scripts/consolidate-media-duplicates.ts --confirm ${preview.previewToken}${preview.kind === 'similar' ? ' --similar-ok' : ''} --yes`,
    );
    return;
  }

  const token = argValue('--confirm');
  if (token) {
    const result = await confirmConsolidateGroup(repoRoot, {
      previewToken: token,
      explicitSimilarApproval: hasFlag('--similar-ok'),
      dryRun: !hasFlag('--yes'),
    });
    console.log(JSON.stringify(result, null, 2));
    if ('dryRun' in result && result.dryRun) {
      console.log('\nDry-run only. Re-run with --yes to apply.');
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
