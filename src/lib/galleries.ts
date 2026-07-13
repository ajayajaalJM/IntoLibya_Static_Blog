import type { Gallery } from './gallery-schema';
import { galleryMarkerRegex } from './gallery-schema';

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
): Array<Record<string, unknown>> {
  const objects: Array<Record<string, unknown>> = [];
  for (const gallery of galleries ?? []) {
    for (const image of gallery.images) {
      objects.push({
        '@type': 'ImageObject',
        contentUrl: `${siteUrl}${image.src}`,
        description: image.alt,
        caption: image.caption || image.alt,
        name: gallery.title || image.alt,
      });
    }
  }
  return objects;
}
