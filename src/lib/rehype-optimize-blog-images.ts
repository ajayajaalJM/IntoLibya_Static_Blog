import { visit } from 'unist-util-visit';
import { blogImageSrcSet, blogImageUrl } from './blog-image-url';

/**
 * Rewrites WordPress upload URLs to local /media paths, routes them through
 * Vercel Image Optimization when available, and adds lazy-load attributes.
 */
export function rehypeOptimizeBlogImages() {
  return (tree: { type: string }) => {
    visit(tree as never, 'element', (node: {
      tagName?: string;
      properties?: Record<string, unknown>;
    }) => {
      if (node.tagName !== 'img' || !node.properties) return;

      const props = node.properties;
      let src = typeof props.src === 'string' ? props.src : '';
      if (!src) return;

      if (src.includes('intolibya.com/wp-content/uploads/')) {
        try {
          const url = new URL(src);
          src = url.pathname.replace('/wp-content/uploads/', '/media/');
        } catch {
          /* keep original */
        }
      }

      // Skip already-optimized or non-media assets (logos handled elsewhere).
      const isLocalMedia = src.startsWith('/media/');
      const isRemote =
        /^https?:\/\//i.test(src) &&
        /cdn\.intolibya\.com|cdn\.intoLibya\.com/i.test(src);

      if (isLocalMedia || isRemote) {
        const normalized = isRemote
          ? (() => {
              try {
                const u = new URL(src);
                u.hostname = u.hostname.toLowerCase();
                return u.toString();
              } catch {
                return src;
              }
            })()
          : src;

        props.src = blogImageUrl(normalized, 720);
        props.srcSet = blogImageSrcSet(normalized);
        props.sizes = '(max-width: 768px) 100vw, 720px';
      } else {
        props.src = src;
        delete props.srcSet;
        delete props.srcset;
      }

      delete props.srcset;

      if (!props.loading && props.fetchpriority !== 'high' && props.fetchPriority !== 'high') {
        props.loading = 'lazy';
      }
      if (!props.decoding) {
        props.decoding = 'async';
      }
    });
  };
}
