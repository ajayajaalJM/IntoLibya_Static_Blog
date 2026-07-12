import { visit } from 'unist-util-visit';
import { normalizeTourbuilderHref } from './tourbuilder-links';

/**
 * Ensures blog TourBuilder links keep `/tourbuilder/...` and never end with `/`
 * (trailing slashes break Netlify → public redirects).
 */
export function rehypeNormalizeTourbuilderLinks() {
  return (tree: { type: string }) => {
    visit(tree as never, 'element', (node: {
      tagName?: string;
      properties?: Record<string, unknown>;
    }) => {
      if (node.tagName !== 'a' || !node.properties) return;
      const href = node.properties.href;
      if (typeof href !== 'string') return;
      if (!/tourbuilder/i.test(href)) return;
      node.properties.href = normalizeTourbuilderHref(href);
    });
  };
}
