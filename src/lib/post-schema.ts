import { z } from 'zod';
import { galleriesSchema } from './gallery-schema';
import { stripTrailingSlash } from './paths';

export const LANGS = [
  'en', 'es', 'pl', 'ja', 'zh', 'nl', 'de', 'fr', 'it', 'pt', 'ru', 'ar',
] as const;

export type Lang = (typeof LANGS)[number];

export const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  es: 'Español',
  pl: 'Polski',
  ja: '日本語',
  zh: '中文',
  nl: 'Nederlands',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  ar: 'العربية',
};

/** WordPress category ID → language code */
export const WP_CATEGORY_TO_LANG: Record<number, Lang> = {
  147: 'en',
  146: 'es',
  145: 'pl',
  143: 'ja',
  144: 'zh',
  142: 'nl',
  141: 'de',
  139: 'fr',
  140: 'it',
  138: 'pt',
  137: 'ru',
  136: 'ar',
};

export const postFrontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  canonicalPath: z.string().transform(stripTrailingSlash),
  lang: z.enum(LANGS),
  wpImportId: z.number().optional(),
  publishedAt: z.coerce.date(),
  translationGroup: z.string(),
  /**
   * When true, excluded from builds, listings, and sitemap.
   * When false, the post is still hidden until publishedAt <= build time
   * (see isPubliclyVisible in src/lib/publish.ts).
   */
  draft: z.boolean().default(false),
  /** Required hero image — used on the post page and as the social OG image. */
  featuredImage: z.string().min(1, 'featuredImage (hero) is required'),
  /** Optional descriptive alt for the hero (SEO / a11y). Falls back to title when empty in some UIs. */
  featuredImageAlt: z.string().optional(),
  /**
   * Writer-only topic/place tags for search and image recommendations.
   * Not used for public tag pages in this phase.
   */
  tags: z.array(z.string()).default([]),
  excerpt: z.string().optional(),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    canonical: z.string().url().transform(stripTrailingSlash),
  }),
  galleries: galleriesSchema,
});

export type PostFrontmatter = z.infer<typeof postFrontmatterSchema>;

export function langFromCategories(categories: number[]): Lang {
  for (const id of categories) {
    const lang = WP_CATEGORY_TO_LANG[id];
    if (lang) return lang;
  }
  return 'en';
}

export function translationGroupFromSlug(slug: string, lang: Lang): string {
  if (lang === 'en') return slug;
  const suffix = `-${lang}`;
  if (slug.endsWith(suffix)) return slug.slice(0, -suffix.length);
  return slug.replace(/-[a-z]{2}$/, '');
}
