import { dump as yamlDump } from 'js-yaml';
import type { PostFrontmatter } from '../src/lib/post-schema';

export function formatPostMarkdown(frontmatter: PostFrontmatter, htmlBody: string): string {
  const fm = {
    ...frontmatter,
    publishedAt: frontmatter.publishedAt.toISOString().slice(0, 10),
  };
  const yamlBlock = yamlDump(fm, {
    lineWidth: -1,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  }).trimEnd();
  const body = htmlBody.trim();
  return `---\n${yamlBlock}\n---\n\n${body}\n`;
}

export function stripTourBuilderCta(html: string): string {
  return html
    .replace(/<h2>\s*<a[^>]*href="[^"]*tourbuilder[^"]*"[^>]*>[\s\S]*?<\/h2>\s*<p>[\s\S]*?<\/p>/gi, '')
    .trim();
}

export function sanitizeWpHtml(html: string): string {
  return stripTourBuilderCta(html)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[\/?\w+[^\]]*\]/g, '')
    .trim();
}
