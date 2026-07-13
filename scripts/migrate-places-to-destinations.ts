/**
 * Move place guides from posts → destinations and rewrite canonical URLs.
 * Run: npx tsx scripts/migrate-places-to-destinations.ts
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { dump as yamlDump } from 'js-yaml';
import {
  DESTINATION_TRANSLATION_GROUPS,
  destinationCanonicalPath,
} from '../src/lib/destination-schema';
import { LANGS } from '../src/lib/post-schema';
import { stripTrailingSlash } from '../src/lib/paths';

const repoRoot = path.resolve(import.meta.dirname, '..');
const postsRoot = path.join(repoRoot, 'src/content/posts');
const destinationsRoot = path.join(repoRoot, 'src/content/destinations');

async function walkMarkdown(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walkMarkdown(full)));
    else if (entry.name.endsWith('.md')) files.push(full);
  }
  return files;
}

function oldPathForGroup(group: string, lang: string): string {
  const slug = lang === 'en' ? group : `${group}-${lang}`;
  return `/${lang}/${slug}`;
}

async function main() {
  const redirects: Array<{ source: string; destination: string; permanent: boolean }> = [];
  let moved = 0;

  for (const group of DESTINATION_TRANSLATION_GROUPS) {
    for (const lang of LANGS) {
      const slug = lang === 'en' ? group : `${group}-${lang}`;
      const srcFile = path.join(postsRoot, lang, `${slug}.md`);
      try {
        await fs.access(srcFile);
      } catch {
        console.warn(`Missing: ${path.relative(repoRoot, srcFile)}`);
        continue;
      }

      const raw = await fs.readFile(srcFile, 'utf8');
      const { data, content } = matter(raw);
      const canonicalPath = stripTrailingSlash(destinationCanonicalPath(group, lang));
      const seoCanonical = `https://intolibya.com${canonicalPath}`;

      const nextData: Record<string, unknown> = {
        ...data,
        slug,
        canonicalPath,
        translationGroup: group,
        galleries: Array.isArray(data.galleries) ? data.galleries : [],
        seo: {
          ...(typeof data.seo === 'object' && data.seo ? data.seo : {}),
          title: data.seo?.title ?? data.title,
          description: data.seo?.description ?? data.excerpt ?? '',
          canonical: seoCanonical,
        },
      };

      const yamlBlock = yamlDump(nextData, { lineWidth: -1 }).trimEnd();
      const md = `---\n${yamlBlock}\n---\n\n${content.trim() ? `${content.trim()}\n` : ''}`;

      const destFile = path.join(destinationsRoot, lang, `${slug}.md`);
      await fs.mkdir(path.dirname(destFile), { recursive: true });
      await fs.writeFile(destFile, md, 'utf8');
      await fs.unlink(srcFile);
      moved += 1;

      const oldPath = stripTrailingSlash(oldPathForGroup(group, lang));
      redirects.push({
        source: oldPath,
        destination: canonicalPath,
        permanent: true,
      });
      redirects.push({
        source: `${oldPath}/`,
        destination: canonicalPath,
        permanent: true,
      });

      console.log(`Moved ${path.relative(repoRoot, srcFile)} → ${path.relative(repoRoot, destFile)}`);
    }
  }

  const redirectsPath = path.join(repoRoot, 'scripts/destination-redirects.json');
  await fs.writeFile(redirectsPath, `${JSON.stringify(redirects, null, 2)}\n`, 'utf8');
  console.log(`\nMoved ${moved} files.`);
  console.log(`Wrote redirect map: ${path.relative(repoRoot, redirectsPath)} (${redirects.length} rules)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
