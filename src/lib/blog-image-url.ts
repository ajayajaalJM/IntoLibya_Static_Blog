const OPT_WIDTHS = [400, 720, 960] as const;

/**
 * URLs for in-article <img> tags.
 *
 * Files under /public/media are served as static assets. Wrapping them in
 * /_vercel/image causes INVALID_IMAGE_OPTIMIZE_REQUEST on Vercel (public/
 * paths are not accepted the same way as hashed _astro assets), so we always
 * use the direct /media path. Remote CDN URLs are left as-is.
 */
export function blogImageUrl(path: string, _width?: number, _quality?: number): string {
  return path;
}

export function blogImageSrcSet(path: string, _quality = 70): string {
  return OPT_WIDTHS.map((w) => `${path} ${w}w`).join(', ');
}

export { OPT_WIDTHS };
