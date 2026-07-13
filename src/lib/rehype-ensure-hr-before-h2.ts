import { visit } from 'unist-util-visit';

/**
 * Insert <hr class="wp-block-separator …"> immediately before every H2
 * that is not already preceded by an HR (skips a leading first H2).
 */
export function rehypeEnsureHrBeforeH2() {
  return (tree: { type: string; children?: unknown[] }) => {
    visit(tree as never, 'element', (node: {
      tagName?: string;
      children?: Array<{
        type: string;
        tagName?: string;
        properties?: Record<string, unknown>;
      }>;
    }) => {
      if (!node.children?.length) return;

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        if (child.type !== 'element' || child.tagName !== 'h2') continue;

        // Find previous element sibling
        let prevEl: (typeof child) | null = null;
        for (let j = i - 1; j >= 0; j--) {
          const prev = node.children[j];
          if (prev.type === 'element') {
            prevEl = prev;
            break;
          }
        }

        if (!prevEl) continue; // leading H2
        if (prevEl.tagName === 'hr') continue;

        node.children.splice(i, 0, {
          type: 'element',
          tagName: 'hr',
          properties: {
            className: ['wp-block-separator', 'has-alpha-channel-opacity'],
          },
          children: [],
        });
        i += 1;
      }
    });
  };
}
