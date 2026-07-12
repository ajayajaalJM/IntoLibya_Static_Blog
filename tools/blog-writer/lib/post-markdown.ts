import { dump as yamlDump } from 'js-yaml';
import { LANGS, type Lang } from '../../../src/lib/post-schema';

export interface PostDraft {
  lang: Lang;
  title: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
}

export interface GeneratedFile {
  lang: Lang;
  md: string;
  path: string;
  slug: string;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function slugForLang(baseSlug: string, lang: Lang): string {
  return lang === 'en' ? baseSlug : `${baseSlug}-${lang}`;
}

export function canonicalPathForLang(baseSlug: string, lang: Lang): string {
  return `/${lang}/${slugForLang(baseSlug, lang)}`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildMarkdown(
  draft: PostDraft,
  baseSlug: string,
  shared: {
    publishedAt: string;
    translationGroup: string;
    featuredImage: string;
  },
): GeneratedFile {
  const slug = slugForLang(baseSlug, draft.lang);
  const canonicalPath = canonicalPathForLang(baseSlug, draft.lang);
  const canonical = `https://intolibya.com${canonicalPath}`;
  const excerpt = stripHtml(draft.body).slice(0, 160);

  const fm: Record<string, unknown> = {
    title: draft.title,
    slug,
    canonicalPath,
    lang: draft.lang,
    publishedAt: shared.publishedAt,
    translationGroup: shared.translationGroup,
    featuredImage: shared.featuredImage,
    seo: {
      title: draft.seoTitle || draft.title,
      description: draft.seoDescription || excerpt,
      canonical,
    },
  };
  if (excerpt) fm.excerpt = excerpt;

  const yamlBlock = yamlDump(fm, { lineWidth: -1 }).trimEnd();
  const body = draft.body.trim();

  return {
    lang: draft.lang,
    md: `---\n${yamlBlock}\n---\n\n${body ? `${body}\n` : ''}`,
    path: `src/content/posts/${draft.lang}/${slug}.md`,
    slug,
  };
}

export function buildAllMarkdown(
  primary: PostDraft,
  translations: PostDraft[],
  shared: {
    publishedAt: string;
    translationGroup: string;
    featuredImage: string;
  },
): GeneratedFile[] {
  if (!shared.featuredImage?.trim()) {
    throw new Error('Featured image (hero) is required before publishing');
  }
  const baseSlug = shared.translationGroup;
  const files = [buildMarkdown({ ...primary, lang: 'en' }, baseSlug, shared)];
  for (const draft of translations) {
    if (!draft.title && !draft.body) continue;
    files.push(buildMarkdown(draft, baseSlug, shared));
  }
  return files;
}

export const TARGET_LANGS = LANGS.filter((lang) => lang !== 'en');
