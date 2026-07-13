import { visit } from 'unist-util-visit';
import { DESTINATION_TRANSLATION_GROUPS } from './destination-schema';
import { stripTrailingSlash } from './paths';
import { normalizeTourbuilderHref } from './tourbuilder-links';

const BLOG_LANG = /\/(en|es|pl|ja|zh|nl|de|fr|it|pt|ru|ar)(\/|$)/i;
const LANGS = 'en|es|pl|ja|zh|nl|de|fr|it|pt|ru|ar';
const GROUP_PATTERN = DESTINATION_TRANSLATION_GROUPS.join('|');
const OLD_DESTINATION_PATH = new RegExp(
  `^/(${LANGS})/(${GROUP_PATTERN})(?:-(${LANGS}))?/?$`,
  'i',
);

function rewriteLegacyDestinationHref(href: string): string {
  const stripQueryHash = (value: string) => {
    const q = value.indexOf('?');
    const h = value.indexOf('#');
    let cut = value.length;
    if (q !== -1) cut = Math.min(cut, q);
    if (h !== -1) cut = Math.min(cut, h);
    return {
      path: value.slice(0, cut),
      suffix: value.slice(cut),
    };
  };

  const rewritePath = (pathname: string): string | null => {
    const cleaned = stripTrailingSlash(pathname);
    // Already a destination URL
    if (/\/destination\//i.test(cleaned)) return null;
    const match = OLD_DESTINATION_PATH.exec(cleaned);
    if (!match) return null;
    const lang = match[1].toLowerCase();
    const group = match[2].toLowerCase();
    const suffixLang = match[3]?.toLowerCase();
    const slug = lang === 'en' ? group : `${group}-${suffixLang || lang}`;
    return `/${lang}/destination/${slug}`;
  };

  if (href.startsWith('/')) {
    const { path, suffix } = stripQueryHash(href);
    const next = rewritePath(path);
    return next ? `${next}${suffix}` : href;
  }

  try {
    const url = new URL(href);
    if (!/^(www\.)?intolibya\.com$/i.test(url.hostname)) return href;
    const next = rewritePath(url.pathname);
    if (!next) return href;
    url.pathname = next;
    return url.toString();
  } catch {
    return href;
  }
}

function isInternalBlogHref(href: string): boolean {
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }
  if (/tourbuilder/i.test(href)) return false;
  if (href.startsWith('/')) return BLOG_LANG.test(href) || href === '/';
  try {
    const url = new URL(href);
    if (!/^(www\.)?intolibya\.com$/i.test(url.hostname)) return false;
    return BLOG_LANG.test(url.pathname) || url.pathname === '/';
  } catch {
    return false;
  }
}

/**
 * Internal blog links must not use a trailing slash.
 * Legacy place URLs are rewritten to /{lang}/destination/{slug}.
 * TourBuilder links are normalized separately (also no trailing slash).
 */
export function rehypeNormalizeInternalLinks() {
  return (tree: { type: string }) => {
    visit(tree as never, 'element', (node: {
      tagName?: string;
      properties?: Record<string, unknown>;
    }) => {
      if (node.tagName !== 'a' || !node.properties) return;
      const href = node.properties.href;
      if (typeof href !== 'string') return;

      if (/tourbuilder/i.test(href)) {
        node.properties.href = normalizeTourbuilderHref(href);
        return;
      }

      let next = rewriteLegacyDestinationHref(href);
      if (isInternalBlogHref(next)) {
        next = stripTrailingSlash(next);
      }
      node.properties.href = next;
    });
  };
}
