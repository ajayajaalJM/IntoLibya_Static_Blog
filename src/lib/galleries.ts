import type { Gallery } from './gallery-schema';
import { galleryMarkerRegex } from './gallery-schema';
import { buildImageObject } from './image-sitemap';

export type BodySegment =
  | { type: 'html'; html: string }
  | { type: 'gallery'; gallery: Gallery };

/**
 * Split raw HTML/markdown body on `<!--gallery:id-->` markers and interleave
 * matching galleries. Unknown markers are left as plain HTML comments.
 */
export function splitBodyWithGalleries(body: string, galleries: Gallery[]): BodySegment[] {
  const byId = new Map(galleries.map((g) => [g.id, g]));
  const re = galleryMarkerRegex();
  const segments: BodySegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(body)) !== null) {
    const before = body.slice(lastIndex, match.index);
    if (before) segments.push({ type: 'html', html: before });

    const id = match[1];
    const gallery = byId.get(id);
    if (gallery) {
      segments.push({ type: 'gallery', gallery });
    } else {
      segments.push({ type: 'html', html: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  const rest = body.slice(lastIndex);
  if (rest) segments.push({ type: 'html', html: rest });

  if (segments.length === 0 && body) {
    segments.push({ type: 'html', html: body });
  }

  return segments;
}

export function galleriesAt(
  galleries: Gallery[] | undefined,
  position: Gallery['position'],
): Gallery[] {
  return (galleries ?? []).filter((g) => g.position === position);
}

export function galleryImageObjects(
  galleries: Gallery[] | undefined,
  siteUrl: string,
  metaByPath?: Map<string, { width: number; height: number; credit: string; defaultAlt: string }>,
): Array<Record<string, unknown>> {
  const objects: Array<Record<string, unknown>> = [];
  for (const gallery of galleries ?? []) {
    for (const image of gallery.images) {
      const meta = metaByPath?.get(image.src);
      const obj = buildImageObject(siteUrl, {
        src: image.src,
        alt: image.alt || meta?.defaultAlt,
        caption: image.caption || image.alt,
        name: gallery.title || image.alt,
        width: meta?.width,
        height: meta?.height,
        credit: meta?.credit,
      });
      if (obj) objects.push(obj);
    }
  }
  return objects;
}
