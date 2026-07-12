/** Strip a trailing slash from a path or absolute URL (preserve query/hash). Root `/` stays `/`. */
export function stripTrailingSlash(href: string): string {
  if (!href || href === '/') return href;
  try {
    if (/^https?:\/\//i.test(href)) {
      const url = new URL(href);
      if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
        url.pathname = url.pathname.replace(/\/+$/, '');
      }
      return url.toString();
    }
    const [path, ...restParts] = href.split(/([?#].*)/);
    const rest = restParts.join('');
    if (path.length > 1 && path.endsWith('/')) {
      return `${path.replace(/\/+$/, '')}${rest}`;
    }
    return href;
  } catch {
    return href.replace(/\/+$/, '') || '/';
  }
}
