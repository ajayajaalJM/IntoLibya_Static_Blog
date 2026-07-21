/** Responsive widths written beside lossless WebP masters under public/media. */
export const MEDIA_DERIVATIVE_WIDTHS = [400, 720, 960, 1280, 1920] as const;

export type MediaDerivativeWidth = (typeof MEDIA_DERIVATIVE_WIDTHS)[number];

const DERIVATIVE_RE = /\.w(\d+)\.(webp|jpe?g|png|avif|gif)$/i;
const WP_SIZE_RE = /-\d+x\d+(?=\.[a-z0-9]+$)/i;

/** True when path is a generated width derivative (e.g. hero.w720.webp). */
export function isDerivativeMediaPath(src: string): boolean {
  return DERIVATIVE_RE.test(src.split('?')[0] || '');
}

/** Strip `.w{width}` suffix → canonical master path. */
export function masterPathFromDerivative(src: string): string {
  const pathOnly = src.split('?')[0] || src;
  return pathOnly.replace(DERIVATIVE_RE, '.$2');
}

/** Build derivative path for a master: `/media/…/hero.webp` → `/media/…/hero.w720.webp`. */
export function derivativeMediaPath(masterSrc: string, width: number): string {
  const pathOnly = masterSrc.split('?')[0] || masterSrc;
  return pathOnly.replace(/\.(webp|jpe?g|png|avif|gif)$/i, `.w${width}.$1`);
}

/** Collapse WordPress `-768x1024` style suffixes for logical matching. */
export function stripWpSizeSuffix(src: string): string {
  const pathOnly = src.split('?')[0] || src;
  return pathOnly.replace(WP_SIZE_RE, '');
}

/** Map legacy WP upload URLs to local /media paths. */
export function localizeMediaPath(src: string): string {
  if (!src) return src;
  try {
    if (src.startsWith('/')) return src.split('?')[0];
    const url = new URL(src);
    const host = url.hostname.toLowerCase();
    if (
      (host === 'intolibya.com' || host === 'www.intolibya.com') &&
      url.pathname.startsWith('/wp-content/uploads/')
    ) {
      return url.pathname.replace('/wp-content/uploads/', '/media/');
    }
    return url.pathname.startsWith('/media/') ? url.pathname : url.toString();
  } catch {
    return src.split('?')[0] || src;
  }
}

/** Canonical key for usage matching (localized, no query, no WP size, masters not derivatives). */
export function canonicalizeMediaPath(src: string): string {
  let path = localizeMediaPath(src);
  path = path.split('?')[0] || path;
  path = stripWpSizeSuffix(path);
  if (isDerivativeMediaPath(path)) path = masterPathFromDerivative(path);
  return path;
}

export function isOgDerivativePath(src: string): boolean {
  return canonicalizeMediaPath(src).startsWith('/media/og/');
}

export function isHeroPoolPath(src: string): boolean {
  return canonicalizeMediaPath(src).startsWith('/media/posts/_hero-pool/');
}

/**
 * Build a srcset string from existing derivative files.
 * `availableWidths` should list widths that exist on disk; if empty, returns ''.
 */
export function mediaSrcSetFromDerivatives(
  masterSrc: string,
  availableWidths: number[],
): string {
  const widths = [...new Set(availableWidths)]
    .filter((w) => Number.isFinite(w) && w > 0)
    .sort((a, b) => a - b);
  if (!widths.length) return '';
  return widths.map((w) => `${derivativeMediaPath(masterSrc, w)} ${w}w`).join(', ');
}
