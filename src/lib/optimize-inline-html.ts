/**
 * Lightweight HTML string transform mirroring rehypeOptimizeBlogImages for
 * set:html body segments (when in-body gallery markers force a split path).
 */
import { DESTINATION_TRANSLATION_GROUPS } from './destination-schema';
import { ensureHrBeforeH2 } from './ensure-hr-before-h2';
import { stripTrailingSlash } from './paths';

const OPT_WIDTHS = [400, 720, 960];
const LANGS = 'en|es|pl|ja|zh|nl|de|fr|it|pt|ru|ar';
const GROUP_PATTERN = DESTINATION_TRANSLATION_GROUPS.join('|');
const OLD_DESTINATION_PATH = new RegExp(
  `^/(${LANGS})/(${GROUP_PATTERN})(?:-(${LANGS}))?/?$`,
  'i',
);

function vercelImageUrl(path: string, width: number, quality = 70): string {
  return `/_vercel/image?url=${encodeURIComponent(path)}&w=${width}&q=${quality}`;
}

function normalizeSrc(src: string): string | null {
  let next = src;
  if (next.includes('intolibya.com/wp-content/uploads/')) {
    try {
      const url = new URL(next);
      next = url.pathname.replace('/wp-content/uploads/', '/media/');
    } catch {
      /* keep */
    }
  }

  const isLocalMedia = next.startsWith('/media/');
  const isRemote =
    /^https?:\/\//i.test(next) && /cdn\.intolibya\.com|cdn\.intoLibya\.com/i.test(next);

  if (!isLocalMedia && !isRemote) return null;

  if (isRemote) {
    try {
      const u = new URL(next);
      u.hostname = u.hostname.toLowerCase();
      return u.toString();
    } catch {
      return next;
    }
  }
  return next;
}

function rewriteLegacyDestinationHref(href: string): string {
  const pathOnly = stripTrailingSlash(href.split(/[?#]/)[0] ?? href);
  if (/\/destination\//i.test(pathOnly)) return stripTrailingSlash(href);
  const match = OLD_DESTINATION_PATH.exec(pathOnly);
  if (!match) return stripTrailingSlash(href);
  const lang = match[1].toLowerCase();
  const group = match[2].toLowerCase();
  const suffixLang = match[3]?.toLowerCase();
  const slug = lang === 'en' ? group : `${group}-${suffixLang || lang}`;
  return `/${lang}/destination/${slug}`;
}

export function optimizeInlineHtmlImages(html: string): string {
  let next = html.replace(/<img\b([^>]*)>/gi, (full, attrs: string) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!srcMatch) return full;
    const rawSrc = srcMatch[2] ?? srcMatch[3] ?? srcMatch[4] ?? '';
    const normalized = normalizeSrc(rawSrc);
    if (!normalized) return full;

    let nextAttrs = attrs
      .replace(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i, `src="${vercelImageUrl(normalized, 720)}"`)
      .replace(/\bsrcset\s*=\s*("([^"]*)"|'([^']*)')/gi, '')
      .replace(/\bsizes\s*=\s*("([^"]*)"|'([^']*)')/gi, '');

    const srcSet = OPT_WIDTHS.map((w) => `${vercelImageUrl(normalized, w)} ${w}w`).join(', ');
    nextAttrs += ` srcset="${srcSet}" sizes="(max-width: 768px) 100vw, 720px"`;

    if (!/\bloading\s*=/i.test(nextAttrs)) nextAttrs += ' loading="lazy"';
    if (!/\bdecoding\s*=/i.test(nextAttrs)) nextAttrs += ' decoding="async"';

    return `<img${nextAttrs}>`;
  });

  next = next.replace(/<a\b([^>]*)>/gi, (full, attrs: string) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!hrefMatch) return full;
    const rawHref = hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? '';
    if (!rawHref || rawHref.startsWith('#') || /tourbuilder/i.test(rawHref)) return full;
    if (!rawHref.startsWith('/') && !/intolibya\.com/i.test(rawHref)) return full;
    const rewritten = rewriteLegacyDestinationHref(rawHref);
    if (rewritten === rawHref) return full;
    return full.replace(rawHref, rewritten);
  });

  return ensureHrBeforeH2(next);
}
