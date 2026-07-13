/**
 * Ensure every H2 (except a leading first heading with no prior content)
 * is immediately preceded by an HR, matching IntoLibya post style.
 */
export const H2_SEPARATOR_HTML =
  '<hr class="wp-block-separator has-alpha-channel-opacity" />';

export function ensureHrBeforeH2(html: string): string {
  if (!html || !/<h2\b/i.test(html)) return html;

  return html.replace(/(<h2\b[^>]*>)/gi, (match, _h2, offset, full: string) => {
    const before = full.slice(0, offset);
    const trimmedRight = before.replace(/\s+$/u, '');
    if (/<hr\b[^>]*>$/i.test(trimmedRight)) return match;

    // No prior element content → first heading at top; keep without HR (legacy style).
    const meaningful = trimmedRight
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/&nbsp;/gi, ' ')
      .trim();
    if (!meaningful) return match;

    return `${H2_SEPARATOR_HTML}\n\n${match}`;
  });
}
