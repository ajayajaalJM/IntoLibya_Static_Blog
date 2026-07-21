import type { APIRoute } from 'astro';
import { getAllPosts } from '../lib/posts';
import { getAllDestinations } from '../lib/destinations';
import {
  absoluteMediaUrl,
  buildImageSitemapXml,
  collectMediaPathsFromHtml,
  isIndexableMediaPath,
  type PageImageEntry,
} from '../lib/image-sitemap';
import { canonicalizeMediaPath } from '../lib/media-paths';

export const prerender = true;

function dedupePaths(paths: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of paths) {
    const canon = canonicalizeMediaPath(p);
    if (!isIndexableMediaPath(canon) || seen.has(canon)) continue;
    seen.add(canon);
    out.push(canon);
  }
  return out;
}

export const GET: APIRoute = async ({ site }) => {
  const siteUrl = site?.href?.replace(/\/$/, '') || 'https://intolibya.com';
  const entries: PageImageEntry[] = [];

  const [posts, destinations] = await Promise.all([getAllPosts(), getAllDestinations()]);

  for (const post of posts) {
    const paths: string[] = [];
    if (post.data.featuredImage) paths.push(post.data.featuredImage);
    for (const gallery of post.data.galleries ?? []) {
      for (const image of gallery.images ?? []) {
        if (image?.src) paths.push(image.src);
      }
    }
    paths.push(...collectMediaPathsFromHtml(post.body || ''));
    const masters = dedupePaths(paths);
    if (!masters.length) continue;
    entries.push({
      pageUrl: `${siteUrl}${post.data.canonicalPath}`,
      imageUrls: masters.map((p) => absoluteMediaUrl(siteUrl, p)),
    });
  }

  for (const destination of destinations) {
    const paths: string[] = [];
    if (destination.data.featuredImage) paths.push(destination.data.featuredImage);
    for (const gallery of destination.data.galleries ?? []) {
      for (const image of gallery.images ?? []) {
        if (image?.src) paths.push(image.src);
      }
    }
    paths.push(...collectMediaPathsFromHtml(destination.body || ''));
    const masters = dedupePaths(paths);
    if (!masters.length) continue;
    entries.push({
      pageUrl: `${siteUrl}${destination.data.canonicalPath}`,
      imageUrls: masters.map((p) => absoluteMediaUrl(siteUrl, p)),
    });
  }

  const xml = buildImageSitemapXml(entries);
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
