import { visit } from 'unist-util-visit';
import { stripTrailingSlash } from './paths';
import { normalizeTourbuilderHref } from './tourbuilder-links';

const BLOG_LANG = /\/(en|es|pl|ja|zh|nl|de|fr|it|pt|ru|ar)(\/|$)/i;

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

      if (isInternalBlogHref(href)) {
        node.properties.href = stripTrailingSlash(href);
      }
    });
  };
}
