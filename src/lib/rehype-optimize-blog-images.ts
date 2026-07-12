import { visit } from 'unist-util-visit';

const OPT_WIDTHS = [400, 720, 960];

function vercelImageUrl(path: string, width: number, quality = 70): string {
  const url = path.startsWith('http') ? path : path;
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
}

/**
 * Rewrites WordPress upload URLs to local /media paths, routes them through
 * Vercel Image Optimization, and adds lazy-load attributes for Lighthouse.
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

        props.src = vercelImageUrl(normalized, 720);
        props.srcSet = OPT_WIDTHS.map((w) => `${vercelImageUrl(normalized, w)} ${w}w`).join(', ');
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
