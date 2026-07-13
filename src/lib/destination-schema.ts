import { z } from 'zod';
import { galleriesSchema } from './gallery-schema';
import { LANGS } from './post-schema';
import { stripTrailingSlash } from './paths';

export const destinationFrontmatterSchema = z.object({
  title: z.string(),
  slug: z.string(),
  canonicalPath: z.string().transform(stripTrailingSlash),
  lang: z.enum(LANGS),
  wpImportId: z.number().optional(),
  publishedAt: z.coerce.date(),
  translationGroup: z.string(),
  /** When true, excluded from builds, listings, and sitemap until published. */
  draft: z.boolean().default(false),
  /** Required hero image — used on the destination page and as the social OG image. */
  featuredImage: z.string().min(1, 'featuredImage (hero) is required'),
  excerpt: z.string().optional(),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    canonical: z.string().url().transform(stripTrailingSlash),
  }),
  galleries: galleriesSchema,
});

export type DestinationFrontmatter = z.infer<typeof destinationFrontmatterSchema>;

/** English translation groups that are place destinations (not blog posts). */
export const DESTINATION_TRANSLATION_GROUPS = [
  'tripoli',
  'ghadames',
  'sabratha',
  'sebha',
  'shahat',
  'susa',
  'gaberoun',
  'leptis-magna',
  'um-el-ma',
  'acacus-mountains',
  'ghat',
  'jebel-nafusa',
  'waw-an-namus',
  'germa',
  'benghazi',
  'tobruk',
  'ptolemais',
  'qasr-libya',
  'jebel-akhdar',
  'misrata',
  'wadi-mathendous',
  'waddan',
] as const;

export type DestinationGroup = (typeof DESTINATION_TRANSLATION_GROUPS)[number];

export function isDestinationGroup(group: string): group is DestinationGroup {
  return (DESTINATION_TRANSLATION_GROUPS as readonly string[]).includes(group);
}

export function destinationCanonicalPath(baseSlug: string, lang: string): string {
  const slug = lang === 'en' ? baseSlug : `${baseSlug}-${lang}`;
  return `/${lang}/destination/${slug}`;
}
