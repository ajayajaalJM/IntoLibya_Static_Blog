#!/usr/bin/env npx tsx
/**
 * Lightweight fixture checks for media consolidation + image sitemap helpers.
 */
import assert from 'node:assert/strict';
import {
  buildImageSitemapXml,
  collectMediaPathsFromHtml,
  isIndexableMediaPath,
} from '../src/lib/image-sitemap';
import { canonicalizeMediaPath } from '../src/lib/media-paths';
import { suggestCanonicalKeeper, type MediaCatalogEntry } from '../tools/blog-writer/lib/media-catalog';
import { selectBestExistingAlt } from '../tools/blog-writer/lib/media-consolidate';

function fakeEntry(partial: Partial<MediaCatalogEntry> & { path: string }): MediaCatalogEntry {
  const ext = partial.ext ?? (partial.path.match(/\.[^.]+$/)?.[0]?.toLowerCase() || '.webp');
  return {
    path: partial.path,
    filename: partial.path.split('/').pop() || 'x.webp',
    folder: '/media',
    ext,
    bytes: partial.bytes ?? 1000,
    mtime: new Date().toISOString(),
    width: partial.width ?? 1200,
    height: partial.height ?? 800,
    tags: partial.tags ?? [],
    defaultAlt: partial.defaultAlt ?? '',
    credit: partial.credit ?? '',
    notes: '',
    preferredRoles: [],
    derivativeWidths: [],
    missingDerivatives: false,
    isPool: false,
    isOg: false,
    isDerivative: false,
    contentHash: partial.contentHash ?? 'a',
    aHash: '',
    duplicateGroupId: 'exact-1',
    duplicateKind: 'exact',
    usageEn: partial.usageEn ?? 0,
    usageGroups: partial.usageGroups ?? 0,
    usageRaw: partial.usageRaw ?? 0,
    usedIn: [],
    manual: partial.manual,
  };
}

// Canonicalization + indexable filter
assert.equal(
  canonicalizeMediaPath('/media/posts/foo-1024x768.jpg'),
  '/media/posts/foo.jpg',
);
assert.equal(isIndexableMediaPath('/media/posts/hero.webp'), true);
assert.equal(isIndexableMediaPath('/media/posts/hero.w720.webp'), false);
assert.equal(isIndexableMediaPath('/media/og/posts/abc.jpg'), false);

// HTML collection
const paths = collectMediaPathsFromHtml(
  `<img src="/media/posts/a.webp" alt="A"><img src="/media/og/posts/x.jpg"><img src="/media/posts/a.w400.webp">`,
);
assert.deepEqual(paths, ['/media/posts/a.webp']);

// Keeper preference: higher usage + webp + manual alt
const keeper = suggestCanonicalKeeper([
  fakeEntry({
    path: '/media/library/copy.jpg',
    usageRaw: 1,
    usageEn: 1,
    ext: '.jpg',
    bytes: 500,
  }),
  fakeEntry({
    path: '/media/posts/main.webp',
    usageRaw: 5,
    usageEn: 3,
    defaultAlt: 'Desert dunes near Ghadames',
    manual: { defaultAlt: true },
    width: 2000,
    height: 1200,
    bytes: 800000,
  }),
]);
assert.equal(keeper, '/media/posts/main.webp');

const poolKeeper = suggestCanonicalKeeper([
  fakeEntry({
    path: '/media/posts/specific-post/hero.webp',
    usageRaw: 20,
    usageEn: 2,
  }),
  {
    ...fakeEntry({ path: '/media/posts/_hero-pool/ghadames.webp' }),
    isPool: true,
  },
]);
assert.equal(poolKeeper, '/media/posts/_hero-pool/ghadames.webp');

// Best-alt selection prefers an explicit manual description over generic usage text.
const bestAlt = selectBestExistingAlt([
  fakeEntry({
    path: '/media/posts/a.webp',
    defaultAlt: 'Photo',
    usedIn: [
      {
        kind: 'post',
        translationGroup: 'a',
        lang: 'en',
        slug: 'a',
        title: 'A',
        role: 'hero',
        path: 'src/content/posts/en/a.md',
        occurrenceId: 'hero',
        alt: 'A view of the old city of Ghadames at sunset',
      },
    ],
  }),
  fakeEntry({
    path: '/media/posts/b.webp',
    defaultAlt: 'Historic mud-brick lanes in Ghadames old town',
    manual: { defaultAlt: true },
  }),
]);
assert.equal(bestAlt, 'Historic mud-brick lanes in Ghadames old town');

// Sitemap XML shape
const xml = buildImageSitemapXml([
  {
    pageUrl: 'https://intolibya.com/en/sample',
    imageUrls: [
      'https://intolibya.com/media/posts/a.webp',
      'https://intolibya.com/media/posts/a.webp',
    ],
  },
]);
assert.match(xml, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
assert.match(xml, /<image:loc>https:\/\/intolibya\.com\/media\/posts\/a\.webp<\/image:loc>/);
assert.equal((xml.match(/<image:image>/g) || []).length, 1);
assert.doesNotMatch(xml, /image:caption|image:title/);

console.log('media-consolidate fixture checks passed');
