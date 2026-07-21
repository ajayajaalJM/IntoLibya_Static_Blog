import fs from 'node:fs/promises';
import path from 'node:path';
import { canonicalizeMediaPath, isDerivativeMediaPath, isOgDerivativePath } from './media-paths';

export interface PageImageEntry {
  /** Absolute page URL */
  pageUrl: string;
  /** Absolute master image URLs (deduped) */
  imageUrls: string[];
}

export interface ImageObjectInput {
  src: string;
  alt?: string;
  caption?: string;
  name?: string;
  width?: number;
  height?: number;
  credit?: string;
  license?: string;
  acquireLicensePage?: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Accept only live master /media paths suitable for discovery. */
export function isIndexableMediaPath(src: string): boolean {
  const raw = (src || '').split('?')[0] || '';
  if (isDerivativeMediaPath(raw)) return false;
  const canon = canonicalizeMediaPath(src);
  if (!canon.startsWith('/media/')) return false;
  if (isOgDerivativePath(canon)) return false;
  if (canon.includes('/media-quarantine/')) return false;
  return true;
}

export function collectMediaPathsFromHtml(html: string): string[] {
  const out: string[] = [];
  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const srcMatch = /\bsrc\s*=\s*(["'])([^"']+)\1/i.exec(match[0]);
    if (!srcMatch) continue;
    if (!isIndexableMediaPath(srcMatch[2])) continue;
    out.push(canonicalizeMediaPath(srcMatch[2]));
  }
  for (const match of html.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
    if (!isIndexableMediaPath(match[1])) continue;
    out.push(canonicalizeMediaPath(match[1]));
  }
  return out;
}

export function absoluteMediaUrl(siteUrl: string, mediaPath: string): string {
  const canon = canonicalizeMediaPath(mediaPath);
  return `${siteUrl.replace(/\/$/, '')}${canon}`;
}

export function buildImageObject(
  siteUrl: string,
  input: ImageObjectInput,
): Record<string, unknown> | null {
  if (!isIndexableMediaPath(input.src)) return null;
  const contentUrl = absoluteMediaUrl(siteUrl, input.src);
  const obj: Record<string, unknown> = {
    '@type': 'ImageObject',
    contentUrl,
    url: contentUrl,
  };
  const description = (input.alt || input.caption || '').trim();
  if (description) obj.description = description;
  if (input.caption?.trim()) obj.caption = input.caption.trim();
  if (input.name?.trim()) obj.name = input.name.trim();
  else if (description) obj.name = description;
  if (input.width && input.height) {
    obj.width = input.width;
    obj.height = input.height;
  }
  if (input.credit?.trim()) {
    obj.creditText = input.credit.trim();
    obj.creator = { '@type': 'Person', name: input.credit.trim() };
  }
  if (input.license?.trim()) obj.license = input.license.trim();
  if (input.acquireLicensePage?.trim()) {
    obj.acquireLicensePage = input.acquireLicensePage.trim();
  }
  return obj;
}

export async function readMediaCatalogDimensions(
  repoRoot: string,
): Promise<Map<string, { width: number; height: number; credit: string; defaultAlt: string }>> {
  const map = new Map<
    string,
    { width: number; height: number; credit: string; defaultAlt: string }
  >();
  try {
    const raw = await fs.readFile(path.join(repoRoot, 'data/media-catalog.json'), 'utf8');
    const parsed = JSON.parse(raw) as {
      items?: Record<
        string,
        { width?: number; height?: number; credit?: string; defaultAlt?: string }
      >;
    };
    for (const [p, item] of Object.entries(parsed.items || {})) {
      map.set(p, {
        width: item.width || 0,
        height: item.height || 0,
        credit: item.credit || '',
        defaultAlt: item.defaultAlt || '',
      });
    }
  } catch {
    /* catalog optional at build */
  }
  return map;
}

export function buildImageSitemapXml(entries: PageImageEntry[]): string {
  const urls = entries
    .filter((e) => e.imageUrls.length > 0)
    .map((entry) => {
      const images = [...new Set(entry.imageUrls)]
        .map(
          (img) => `    <image:image>\n      <image:loc>${escapeXml(img)}</image:loc>\n    </image:image>`,
        )
        .join('\n');
      return `  <url>\n    <loc>${escapeXml(entry.pageUrl)}</loc>\n${images}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
}
