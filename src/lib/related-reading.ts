/**
 * Extract Related reading from post HTML bodies and resolve thumbnail cards.
 */

export type RelatedLink = {
  href: string;
  label: string;
};

export type RelatedCard = {
  href: string;
  title: string;
  featuredImage: string;
  kind: 'post' | 'destination';
};

const RELATED_BLOCK_RE =
  /(?:<hr\s*\/?>\s*)?<h2>\s*Related reading\s*<\/h2>\s*<ul>[\s\S]*?<\/ul>\s*(?:<hr\s*\/?>\s*)?/i;

/**
 * Remove the Related reading list from the body (and a flanking hr).
 * Plan your Libya trip CTA stays in the body and ends up above the card strip.
 */
export function extractRelatedReading(html: string): {
  bodyHtml: string;
  links: RelatedLink[];
} {
  const match = html.match(RELATED_BLOCK_RE);
  if (!match) {
    return { bodyHtml: html, links: [] };
  }

  const block = match[0];
  const links: RelatedLink[] = [];
  const liRe = /<li>([\s\S]*?)<\/li>/gi;
  let li: RegExpExecArray | null;
  while ((li = liRe.exec(block))) {
    const inner = li[1];
    const a = inner.match(/<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (a) {
      const href = a[1].trim();
      const label = a[2].replace(/<[^>]+>/g, '').trim();
      if (href && label) links.push({ href, label });
      continue;
    }
    // Plain-text fallback: "Tripoli destination guide"
    const plain = inner.replace(/<[^>]+>/g, '').trim();
    if (/destination guide$/i.test(plain)) {
      const name = plain.replace(/\s*destination guide$/i, '').trim();
      if (name) {
        links.push({
          href: '',
          label: plain,
        });
      }
    }
  }

  const bodyHtml = html.replace(RELATED_BLOCK_RE, '\n').replace(/\n{3,}/g, '\n\n');
  return { bodyHtml, links };
}

function normalizePath(href: string): string {
  if (!href) return '';
  try {
    if (href.startsWith('http')) {
      const u = new URL(href);
      return u.pathname.replace(/\/$/, '') || '/';
    }
  } catch {
    /* ignore */
  }
  return href.replace(/\/$/, '') || '/';
}

export type RelatedResolveEntry = {
  data: {
    lang: string;
    title: string;
    featuredImage: string;
    canonicalPath: string;
  };
};

/**
 * Map extracted links to cards with featured images.
 * Plain destination labels (no href) resolve by English title match.
 */
export function resolveRelatedCards(
  links: RelatedLink[],
  posts: RelatedResolveEntry[],
  destinations: RelatedResolveEntry[],
  lang: string,
): RelatedCard[] {
  const postsByPath = new Map<string, RelatedResolveEntry>();
  const destsByPath = new Map<string, RelatedResolveEntry>();
  const destsByTitle = new Map<string, RelatedResolveEntry>();

  for (const p of posts) {
    if (p.data.lang !== lang) continue;
    postsByPath.set(normalizePath(p.data.canonicalPath), p);
  }
  for (const d of destinations) {
    if (d.data.lang !== lang) continue;
    destsByPath.set(normalizePath(d.data.canonicalPath), d);
    destsByTitle.set(d.data.title.trim().toLowerCase(), d);
  }

  const out: RelatedCard[] = [];
  const seen = new Set<string>();

  for (const link of links) {
    if (!link.href) {
      const name = link.label.replace(/\s*destination guide$/i, '').trim().toLowerCase();
      const dest = destsByTitle.get(name);
      if (!dest) continue;
      const href = dest.data.canonicalPath;
      if (seen.has(href)) continue;
      seen.add(href);
      out.push({
        href,
        title: dest.data.title,
        featuredImage: dest.data.featuredImage,
        kind: 'destination',
      });
      continue;
    }

    const path = normalizePath(link.href);
    if (seen.has(path)) continue;

    const dest = destsByPath.get(path);
    if (dest) {
      seen.add(path);
      out.push({
        href: dest.data.canonicalPath,
        title: dest.data.title,
        featuredImage: dest.data.featuredImage,
        kind: 'destination',
      });
      continue;
    }

    const post = postsByPath.get(path);
    if (post) {
      seen.add(path);
      out.push({
        href: post.data.canonicalPath,
        title: post.data.title,
        featuredImage: post.data.featuredImage,
        kind: 'post',
      });
    }
  }

  return out;
}
