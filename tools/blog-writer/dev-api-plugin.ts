import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import matter from 'gray-matter';
import { dump as yamlDump } from 'js-yaml';
import sharp from 'sharp';
import type { Plugin } from 'vite';
import { LANGS, LANG_LABELS, type Lang } from '../../src/lib/post-schema';
import { sanitizeHtmlNode, sanitizePlainField } from './lib/sanitize-html-node';

interface SavePayload {
  files: Array<{ path: string; content: string }>;
}

interface TranslatePayload {
  title: string;
  body: string;
}

interface InstagramFeedItem {
  id: string;
  url: string;
  title: string;
  image: string;
  mediaKind: 'reel' | 'post' | 'carousel';
}

interface MultipartFile {
  name: string;
  filename: string;
  contentType: string;
  data: Buffer;
}

interface PostRecord {
  lang: Lang;
  slug: string;
  title: string;
  translationGroup: string;
  publishedAt: string;
  updatedAt: string;
  featuredImage?: string;
  draft?: boolean;
  seoTitle: string;
  seoDescription: string;
  excerpt?: string;
  body: string;
  path: string;
  galleries?: unknown[];
}

interface PostGroupSummary {
  translationGroup: string;
  baseTitle: string;
  baseSlug: string;
  publishedAt: string;
  updatedAt: string;
  featuredImage?: string;
  draft?: boolean;
  searchText: string;
  contentKind: 'post' | 'destination';
  translations: Array<{
    lang: Lang;
    slug: string;
    title: string;
    path: string;
    exists: boolean;
  }>;
}

async function readBody(req: import('http').IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

async function readBodyBuffer(req: import('http').IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

function parseMultipart(buffer: Buffer, boundary: string): { fields: Record<string, string>; files: MultipartFile[] } {
  const delim = Buffer.from(`--${boundary}`);
  const fields: Record<string, string> = {};
  const files: MultipartFile[] = [];
  let start = buffer.indexOf(delim) + delim.length;

  while (start !== -1 && start < buffer.length) {
    if (buffer[start] === 45 && buffer[start + 1] === 45) break;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;

    const next = buffer.indexOf(delim, start);
    const part = buffer.subarray(start, next === -1 ? buffer.length : next - 2);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) {
      start = next === -1 ? -1 : next + delim.length;
      continue;
    }

    const headers = part.subarray(0, headerEnd).toString('utf8');
    const body = part.subarray(headerEnd + 4);
    const nameMatch = /name="([^"]+)"/i.exec(headers);
    const filenameMatch = /filename="([^"]*)"/i.exec(headers);
    const typeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headers);
    const name = nameMatch?.[1] ?? '';

    if (filenameMatch) {
      files.push({
        name,
        filename: filenameMatch[1] || 'upload.bin',
        contentType: typeMatch?.[1]?.trim() || 'application/octet-stream',
        data: body,
      });
    } else if (name) {
      fields[name] = body.toString('utf8');
    }

    start = next === -1 ? -1 : next + delim.length;
  }

  return { fields, files };
}

function extensionForUpload(filename: string, contentType: string): string {
  const fromName = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(fromName)) {
    return fromName === '.jpeg' ? '.jpg' : fromName;
  }
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  if (contentType.includes('avif')) return '.avif';
  if (contentType.includes('gif')) return '.gif';
  return '.jpg';
}

function isInstagramUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return /(^|\.)instagram\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

function mediaKindFromUrl(value: string): InstagramFeedItem['mediaKind'] {
  if (/\/reel\//i.test(value) || /\/reels\//i.test(value)) return 'reel';
  if (/\/p\//i.test(value)) return 'post';
  return 'post';
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
}

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return null;
}

async function fetchInstagramPreview(instagramUrl: string): Promise<{
  title: string;
  imageUrl: string;
  mediaKind: InstagramFeedItem['mediaKind'];
}> {
  const mediaKind = mediaKindFromUrl(instagramUrl);
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/json',
  };

  // Prefer public oEmbed when available (no Graph token).
  try {
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(instagramUrl)}`;
    const oembedRes = await fetch(oembedUrl, { headers: { ...headers, Accept: 'application/json' } });
    if (oembedRes.ok) {
      const oembed = (await oembedRes.json()) as { title?: string; thumbnail_url?: string };
      if (oembed.thumbnail_url) {
        return {
          title: (oembed.title || 'Instagram post').trim(),
          imageUrl: oembed.thumbnail_url,
          mediaKind,
        };
      }
    }
  } catch {
    // Fall through to HTML OG tags.
  }

  const pageRes = await fetch(instagramUrl, { headers, redirect: 'follow' });
  if (!pageRes.ok) {
    throw new Error(`Could not fetch Instagram URL (${pageRes.status})`);
  }
  const html = await pageRes.text();
  const imageUrl =
    extractMetaContent(html, 'og:image') ||
    extractMetaContent(html, 'og:image:secure_url') ||
    extractMetaContent(html, 'twitter:image');
  if (!imageUrl) {
    throw new Error('No OG image found for that Instagram URL. Upload a poster manually.');
  }
  const title =
    extractMetaContent(html, 'og:title') ||
    extractMetaContent(html, 'twitter:title') ||
    'Instagram post';

  return { title: title.trim(), imageUrl, mediaKind };
}

async function downloadOgImage(repoRoot: string, id: string, imageUrl: string): Promise<string> {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 64) || `ig-${Date.now()}`;
  const imageRes = await fetch(imageUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      Referer: 'https://www.instagram.com/',
    },
  });
  if (!imageRes.ok) {
    throw new Error(`Could not download OG image (${imageRes.status})`);
  }

  const contentType = imageRes.headers.get('content-type') || 'image/jpeg';
  const ext = extensionForUpload(new URL(imageUrl).pathname, contentType);
  const relative = `/media/instagram/${safeId}${ext}`;
  const fullPath = path.join(repoRoot, 'public', relative.replace(/^\//, ''));
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  await fs.writeFile(fullPath, buffer);
  return relative;
}

function json(res: import('http').ServerResponse, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function walkMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walkMarkdownFiles(fullPath)));
    else if (entry.name.endsWith('.md')) files.push(fullPath);
  }
  return files;
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadContentRecords(
  repoRoot: string,
  kind: 'post' | 'destination',
): Promise<PostRecord[]> {
  const dirName = kind === 'destination' ? 'destinations' : 'posts';
  const contentDir = path.join(repoRoot, `src/content/${dirName}`);
  const files = await walkMarkdownFiles(contentDir);
  const posts: PostRecord[] = [];

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const stat = await fs.stat(file);
    const { data, content } = matter(raw);
    const lang = data.lang as Lang;
    if (!LANGS.includes(lang)) continue;

    posts.push({
      lang,
      slug: String(data.slug ?? ''),
      title: String(data.title ?? ''),
      translationGroup: String(data.translationGroup ?? data.slug ?? ''),
      publishedAt: String(data.publishedAt ?? '').slice(0, 10),
      updatedAt: stat.mtime.toISOString(),
      featuredImage: data.featuredImage ? String(data.featuredImage) : undefined,
      draft: data.draft === true,
      seoTitle: String(data.seo?.title ?? data.title ?? ''),
      seoDescription: String(data.seo?.description ?? ''),
      excerpt: data.excerpt ? String(data.excerpt) : undefined,
      body: content.trim(),
      path: path.relative(repoRoot, file).split(path.sep).join('/'),
      galleries: Array.isArray(data.galleries) ? data.galleries : [],
    });
  }

  return posts;
}

async function loadAllPosts(repoRoot: string): Promise<PostRecord[]> {
  return loadContentRecords(repoRoot, 'post');
}

async function loadAllDestinations(repoRoot: string): Promise<PostRecord[]> {
  return loadContentRecords(repoRoot, 'destination');
}

function groupPosts(
  posts: PostRecord[],
  kind: 'post' | 'destination' = 'post',
): PostGroupSummary[] {
  const dirName = kind === 'destination' ? 'destinations' : 'posts';
  const groups = new Map<string, PostRecord[]>();
  for (const post of posts) {
    const key = post.translationGroup || post.slug;
    const list = groups.get(key) ?? [];
    list.push(post);
    groups.set(key, list);
  }

  return [...groups.entries()]
    .map(([translationGroup, items]) => {
      const english = items.find((p) => p.lang === 'en') ?? items[0];
      const byLang = new Map(items.map((p) => [p.lang, p]));
      const updatedAt = items.reduce(
        (latest, item) => (item.updatedAt > latest ? item.updatedAt : latest),
        english.updatedAt,
      );
      const bodyText = stripHtmlToText(english.body).slice(0, 12000);
      const searchText = [
        english.title,
        english.seoTitle,
        english.seoDescription,
        english.excerpt ?? '',
        translationGroup,
        english.slug,
        bodyText,
      ]
        .join(' ')
        .toLowerCase();

      return {
        translationGroup,
        baseTitle: english.title,
        baseSlug: english.lang === 'en' ? english.slug : translationGroup,
        publishedAt: english.publishedAt,
        updatedAt,
        featuredImage: english.featuredImage,
        draft: english.draft === true,
        contentKind: kind,
        searchText,
        translations: LANGS.map((lang) => {
          const post = byLang.get(lang);
          return {
            lang,
            slug: post?.slug ?? (lang === 'en' ? translationGroup : `${translationGroup}-${lang}`),
            title: post?.title ?? '',
            path:
              post?.path ??
              `src/content/${dirName}/${lang}/${lang === 'en' ? translationGroup : `${translationGroup}-${lang}`}.md`,
            exists: Boolean(post),
          };
        }),
      };
    })
    .sort((a, b) => {
      const byUpdated = b.updatedAt.localeCompare(a.updatedAt);
      if (byUpdated !== 0) return byUpdated;
      return b.publishedAt.localeCompare(a.publishedAt);
    });
}

async function translateWithOpenAI(title: string, body: string): Promise<Record<Lang, { title: string; body: string }>> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing. Add it to .env to enable automatic translations.');
  }

  const targets = LANGS.filter((lang) => lang !== 'en');
  const targetList = targets.map((lang) => `${lang} (${LANG_LABELS[lang]})`).join(', ');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You translate IntoLibya travel blog posts from English into other languages.',
            'Return strict JSON shaped as { "translations": { "<langCode>": { "title": "...", "body": "..." } } }.',
            `Include every target language: ${targets.join(', ')}.`,
            'Preserve HTML tags, attributes, links, and structure in body. Translate only visible text.',
            'Keep proper nouns like IntoLibya, Tripoli, Ghadames, Leptis Magna, Sabratha when appropriate.',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify({ title, body, targetLanguages: targets, labels: targetList }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Translation API failed (${response.status}): ${detail.slice(0, 240)}`);
  }

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('Translation API returned an empty response');

  const parsed = JSON.parse(content) as {
    translations?: Record<string, { title?: string; body?: string }>;
  };

  const result = {} as Record<Lang, { title: string; body: string }>;
  for (const lang of targets) {
    const item = parsed.translations?.[lang];
    if (!item?.title || !item?.body) {
      throw new Error(`Translation missing for ${lang}`);
    }
    result[lang] = { title: item.title, body: item.body };
  }
  return result;
}

function summarizeGroups(groups: PostGroupSummary[]) {
  const incomplete = groups.filter((g) => g.translations.some((t) => !t.exists));
  const missingTranslations = groups.reduce(
    (sum, g) => sum + g.translations.filter((t) => !t.exists).length,
    0,
  );
  const latest = groups[0] ?? null;
  return {
    groupCount: groups.length,
    latestTitle: latest?.baseTitle ?? null,
    latestSlug: latest?.translationGroup ?? null,
    latestPublishedAt: latest?.updatedAt?.slice(0, 10) ?? latest?.publishedAt ?? null,
    incompleteGroups: incomplete.length,
    missingTranslations,
    incompleteTitles: incomplete.slice(0, 8).map((g) => g.baseTitle || g.translationGroup),
  };
}

const SITE_URL = 'https://intolibya.com';

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toLastmod(isoOrDate: string | undefined): string {
  if (!isoOrDate) return new Date().toISOString().slice(0, 10);
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return String(isoOrDate).slice(0, 10);
  return d.toISOString().slice(0, 10);
}

interface SitemapUrl {
  loc: string;
  lastmod: string;
}

async function collectSitemapUrls(repoRoot: string): Promise<SitemapUrl[]> {
  const urls = new Map<string, SitemapUrl>();
  const today = new Date().toISOString().slice(0, 10);

  const add = (pathname: string, lastmod: string) => {
    const pathOnly = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const loc =
      pathOnly === '/'
        ? SITE_URL
        : `${SITE_URL}${pathOnly.replace(/\/$/, '')}`;
    const existing = urls.get(loc);
    if (!existing || lastmod > existing.lastmod) {
      urls.set(loc, { loc, lastmod });
    }
  };

  add('/', today);
  for (const lang of LANGS) {
    add(`/${lang}`, today);
    add(`/${lang}/destinations`, today);
  }

  for (const post of await loadAllPosts(repoRoot)) {
    if (post.draft) continue;
    add(`/${post.lang}/${post.slug}`, toLastmod(post.updatedAt || post.publishedAt));
  }

  for (const dest of await loadAllDestinations(repoRoot)) {
    if (dest.draft) continue;
    add(
      `/${dest.lang}/destination/${dest.slug}`,
      toLastmod(dest.updatedAt || dest.publishedAt),
    );
  }

  return [...urls.values()].sort((a, b) => a.loc.localeCompare(b.loc));
}

function renderSitemapXml(entries: SitemapUrl[]): string {
  const body = entries
    .map(
      (entry) => `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>
    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}


interface WriterTodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

async function readWriterTodos(repoRoot: string): Promise<{
  updatedAt: string | null;
  items: WriterTodoItem[];
}> {
  const todosPath = path.join(repoRoot, 'data/writer-todos.json');
  const raw = await fs.readFile(todosPath, 'utf8').catch(() => null);
  if (!raw) return { updatedAt: null, items: [] };
  try {
    const parsed = JSON.parse(raw) as { updatedAt?: string | null; items?: WriterTodoItem[] };
    return {
      updatedAt: parsed.updatedAt ?? null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return { updatedAt: null, items: [] };
  }
}

export function blogWriterDevApiPlugin(repoRoot: string): Plugin {
  dotenv.config({ path: path.join(repoRoot, '.env') });

  return {
    name: 'blog-writer-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        try {
          const url = new URL(req.url, 'http://localhost');

          if (req.method === 'GET' && url.pathname === '/api/post-groups') {
            const posts = await loadAllPosts(repoRoot);
            json(res, 200, { ok: true, groups: groupPosts(posts, 'post') });
            return;
          }

          if (req.method === 'GET' && url.pathname.startsWith('/api/post-groups/')) {
            const translationGroup = decodeURIComponent(url.pathname.replace('/api/post-groups/', ''));
            const posts = await loadAllPosts(repoRoot);
            const group = posts.filter((p) => p.translationGroup === translationGroup);
            if (!group.length) {
              json(res, 404, { ok: false, error: 'Post group not found' });
              return;
            }
            json(res, 200, { ok: true, posts: group, contentKind: 'post' });
            return;
          }

          if (req.method === 'GET' && url.pathname === '/api/destination-groups') {
            const destinations = await loadAllDestinations(repoRoot);
            json(res, 200, { ok: true, groups: groupPosts(destinations, 'destination') });
            return;
          }

          if (req.method === 'GET' && url.pathname.startsWith('/api/destination-groups/')) {
            const translationGroup = decodeURIComponent(
              url.pathname.replace('/api/destination-groups/', ''),
            );
            const destinations = await loadAllDestinations(repoRoot);
            const group = destinations.filter((p) => p.translationGroup === translationGroup);
            if (!group.length) {
              json(res, 404, { ok: false, error: 'Destination group not found' });
              return;
            }
            json(res, 200, { ok: true, posts: group, contentKind: 'destination' });
            return;
          }

          if (req.method === 'POST' && url.pathname === '/api/translate') {
            const payload = JSON.parse(await readBody(req)) as TranslatePayload;
            const title = sanitizePlainField(payload.title ?? '');
            const body = sanitizeHtmlNode(payload.body ?? '');
            if (!title || !body) {
              json(res, 400, { ok: false, error: 'English title and body are required' });
              return;
            }
            const translations = await translateWithOpenAI(title, body);
            // Sanitize model output before returning to the client
            const cleaned = {} as Record<Lang, { title: string; body: string }>;
            for (const [lang, item] of Object.entries(translations) as Array<
              [Lang, { title: string; body: string }]
            >) {
              cleaned[lang] = {
                title: sanitizePlainField(item.title),
                body: sanitizeHtmlNode(item.body),
              };
            }
            json(res, 200, { ok: true, translations: cleaned });
            return;
          }

          if (req.method === 'POST' && url.pathname === '/api/save-posts') {
            const payload = JSON.parse(await readBody(req)) as SavePayload;
            if (!payload.files?.length) {
              json(res, 400, { ok: false, error: 'No files provided' });
              return;
            }

            const saved: string[] = [];
            for (const file of payload.files) {
              const isPost = file.path.startsWith('src/content/posts/') && file.path.endsWith('.md');
              const isDestination =
                file.path.startsWith('src/content/destinations/') && file.path.endsWith('.md');
              if (!isPost && !isDestination) {
                throw new Error(`Invalid path: ${file.path}`);
              }
              const parsed = matter(file.content);
              const featuredImage = String(parsed.data.featuredImage ?? '').trim();
              if (!featuredImage) {
                json(res, 400, {
                  ok: false,
                  error: 'Featured image (hero) is required on every entry before publishing',
                });
                return;
              }
              if (!featuredImage.startsWith('/media/')) {
                json(res, 400, {
                  ok: false,
                  error: 'Featured image must be a local /media/ path',
                });
                return;
              }
              const galleries = parsed.data.galleries;
              if (Array.isArray(galleries)) {
                for (const gallery of galleries) {
                  const images = Array.isArray(gallery?.images) ? gallery.images : [];
                  for (const image of images) {
                    if (!String(image?.alt ?? '').trim()) {
                      json(res, 400, {
                        ok: false,
                        error: 'Every gallery image needs alt text for SEO',
                      });
                      return;
                    }
                    const src = String(image?.src ?? '');
                    if (!src.startsWith('/media/')) {
                      json(res, 400, {
                        ok: false,
                        error: 'Gallery images must use local /media/ paths',
                      });
                      return;
                    }
                    image.alt = sanitizePlainField(String(image.alt));
                    if (image.caption) image.caption = sanitizePlainField(String(image.caption));
                  }
                  if (gallery.title) gallery.title = sanitizePlainField(String(gallery.title));
                }
              }

              parsed.data.title = sanitizePlainField(String(parsed.data.title ?? ''));
              if (parsed.data.excerpt) {
                parsed.data.excerpt = sanitizePlainField(String(parsed.data.excerpt));
              }
              if (parsed.data.seo && typeof parsed.data.seo === 'object') {
                parsed.data.seo.title = sanitizePlainField(String(parsed.data.seo.title ?? ''));
                parsed.data.seo.description = sanitizePlainField(
                  String(parsed.data.seo.description ?? ''),
                );
              }
              if (parsed.data.publishedAt instanceof Date) {
                parsed.data.publishedAt = parsed.data.publishedAt.toISOString().slice(0, 10);
              }

              const safeBody = sanitizeHtmlNode(parsed.content);
              const yamlBlock = yamlDump(parsed.data, { lineWidth: -1 }).trimEnd();
              const safeContent = `---\n${yamlBlock}\n---\n\n${safeBody ? `${safeBody}\n` : ''}`;

              const fullPath = path.join(repoRoot, file.path);
              await fs.mkdir(path.dirname(fullPath), { recursive: true });
              await fs.writeFile(fullPath, safeContent, 'utf8');
              saved.push(file.path);
            }
            json(res, 200, { ok: true, saved });
            return;
          }

          if (req.method === 'POST' && url.pathname === '/api/upload-images') {
            const contentType = req.headers['content-type'] || '';
            if (!contentType.includes('multipart/form-data')) {
              json(res, 400, { ok: false, error: 'Expected multipart/form-data' });
              return;
            }

            const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
            const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
            if (!boundary) {
              json(res, 400, { ok: false, error: 'Missing multipart boundary' });
              return;
            }

            const body = await readBodyBuffer(req);
            const parsed = parseMultipart(body, boundary);
            const kind = (parsed.fields.kind?.trim() || 'post') as 'post' | 'destination';
            const slug =
              parsed.fields.slug?.trim().replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'untitled';
            if (!['post', 'destination'].includes(kind)) {
              json(res, 400, { ok: false, error: 'kind must be post or destination' });
              return;
            }

            const imageFiles = parsed.files.filter(
              (f) => f.name === 'images' || f.name === 'image' || f.name === 'file',
            );
            if (!imageFiles.length) {
              json(res, 400, { ok: false, error: 'At least one image file is required' });
              return;
            }

            const folder = kind === 'destination' ? 'destinations' : 'posts';
            const uploaded: string[] = [];

            for (const file of imageFiles) {
              const baseName = path
                .basename(file.filename, path.extname(file.filename))
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .slice(0, 48) || `img-${Date.now()}`;
              const relative = `/media/${folder}/${slug}/${baseName}.webp`;
              const fullPath = path.join(repoRoot, 'public', relative.replace(/^\//, ''));
              await fs.mkdir(path.dirname(fullPath), { recursive: true });

              const compressed = await sharp(file.data)
                .rotate()
                .resize({
                  width: 1920,
                  height: 1920,
                  fit: 'inside',
                  withoutEnlargement: true,
                })
                .webp({ quality: 80 })
                .toBuffer();

              await fs.writeFile(fullPath, compressed);
              uploaded.push(relative);
            }

            json(res, 200, { ok: true, paths: uploaded });
            return;
          }

          if (req.method === 'GET' && url.pathname === '/api/dashboard-stats') {
            const postGroups = groupPosts(await loadAllPosts(repoRoot), 'post');
            const destinationGroups = groupPosts(await loadAllDestinations(repoRoot), 'destination');
            const feedPath = path.join(repoRoot, 'data/instagram-feed.json');
            const feedRaw = await fs.readFile(feedPath, 'utf8').catch(() => null);
            let instagram = { count: 0, updatedAt: null as string | null, homepageSlotsFilled: 0 };
            if (feedRaw) {
              try {
                const feed = JSON.parse(feedRaw) as {
                  updatedAt?: string | null;
                  items?: unknown[];
                };
                const count = Array.isArray(feed.items) ? feed.items.length : 0;
                instagram = {
                  count,
                  updatedAt: feed.updatedAt ?? null,
                  homepageSlotsFilled: Math.min(count, 9),
                };
              } catch {
                /* keep defaults */
              }
            }
            const todos = await readWriterTodos(repoRoot);
            const openTodos = todos.items.filter((t) => !t.done).length;

            json(res, 200, {
              ok: true,
              stats: {
                posts: summarizeGroups(postGroups),
                destinations: summarizeGroups(destinationGroups),
                instagram,
                todos: {
                  total: todos.items.length,
                  open: openTodos,
                  updatedAt: todos.updatedAt,
                },
                generatedAt: new Date().toISOString(),
              },
            });
            return;
          }

          if (req.method === 'GET' && url.pathname === '/api/sitemap-meta') {
            const entries = await collectSitemapUrls(repoRoot);
            json(res, 200, {
              ok: true,
              urlCount: entries.length,
              generatedAt: new Date().toISOString(),
              liveSitemapUrl: `${SITE_URL}/sitemap-index.xml`,
              downloadPath: '/api/sitemap.xml',
              note: 'Download the XML to upload in Google Search Console or Bing Webmaster Tools. After deploy, you can also submit the live sitemap URL.',
            });
            return;
          }

          if (req.method === 'GET' && url.pathname === '/api/sitemap.xml') {
            const entries = await collectSitemapUrls(repoRoot);
            const xml = renderSitemapXml(entries);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/xml; charset=utf-8');
            res.setHeader(
              'Content-Disposition',
              'attachment; filename="intolibya-sitemap.xml"',
            );
            res.end(xml);
            return;
          }

          if (req.method === 'GET' && url.pathname === '/api/writer-todos') {
            json(res, 200, { ok: true, todos: await readWriterTodos(repoRoot) });
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/writer-todos') {
            const payload = JSON.parse(await readBody(req)) as { items?: WriterTodoItem[] };
            if (!Array.isArray(payload.items)) {
              json(res, 400, { ok: false, error: 'items array is required' });
              return;
            }
            const items: WriterTodoItem[] = [];
            for (const item of payload.items) {
              const id = sanitizePlainField(String(item.id ?? '')).slice(0, 64);
              const text = sanitizePlainField(String(item.text ?? '')).slice(0, 240);
              if (!id || !text) {
                json(res, 400, { ok: false, error: 'Each todo needs id and text' });
                return;
              }
              items.push({
                id,
                text,
                done: Boolean(item.done),
                createdAt: sanitizePlainField(String(item.createdAt ?? '')) || new Date().toISOString(),
              });
            }
            const todos = {
              updatedAt: new Date().toISOString(),
              items,
            };
            const todosPath = path.join(repoRoot, 'data/writer-todos.json');
            await fs.mkdir(path.dirname(todosPath), { recursive: true });
            await fs.writeFile(todosPath, `${JSON.stringify(todos, null, 2)}\n`, 'utf8');
            json(res, 200, { ok: true, todos });
            return;
          }

          if (req.method === 'GET' && url.pathname === '/api/instagram-feed') {
            const feedPath = path.join(repoRoot, 'data/instagram-feed.json');
            const raw = await fs.readFile(feedPath, 'utf8').catch(() => null);
            if (!raw) {
              json(res, 200, { ok: true, feed: { updatedAt: null, items: [] } });
              return;
            }
            json(res, 200, { ok: true, feed: JSON.parse(raw) });
            return;
          }

          if (req.method === 'PUT' && url.pathname === '/api/instagram-feed') {
            const payload = JSON.parse(await readBody(req)) as { items?: InstagramFeedItem[] };
            if (!Array.isArray(payload.items)) {
              json(res, 400, { ok: false, error: 'items array is required' });
              return;
            }

            const items: InstagramFeedItem[] = [];
            for (const item of payload.items) {
              const id = String(item.id ?? '').trim();
              const itemUrl = String(item.url ?? '').trim();
              const title = String(item.title ?? '').trim();
              const image = String(item.image ?? '').trim();
              const mediaKind = String(item.mediaKind ?? 'post').trim() as InstagramFeedItem['mediaKind'];

              if (!id || !itemUrl || !title || !image) {
                json(res, 400, { ok: false, error: 'Each item needs id, url, title, and image' });
                return;
              }
              if (!['reel', 'post', 'carousel'].includes(mediaKind)) {
                json(res, 400, { ok: false, error: `Invalid mediaKind: ${mediaKind}` });
                return;
              }
              if (!/^https?:\/\/(www\.)?instagram\.com\//i.test(itemUrl)) {
                json(res, 400, { ok: false, error: 'URL must be an instagram.com link' });
                return;
              }
              if (!image.startsWith('/media/instagram/')) {
                json(res, 400, { ok: false, error: 'Image must be under /media/instagram/' });
                return;
              }

              items.push({ id, url: itemUrl, title, image, mediaKind });
            }

            const feed = {
              updatedAt: new Date().toISOString(),
              items,
            };
            const feedPath = path.join(repoRoot, 'data/instagram-feed.json');
            await fs.mkdir(path.dirname(feedPath), { recursive: true });
            await fs.writeFile(feedPath, `${JSON.stringify(feed, null, 2)}\n`, 'utf8');
            json(res, 200, { ok: true, feed });
            return;
          }

          if (req.method === 'POST' && url.pathname === '/api/instagram-image') {
            const contentType = req.headers['content-type'] || '';
            if (!contentType.includes('multipart/form-data')) {
              json(res, 400, { ok: false, error: 'Expected multipart/form-data' });
              return;
            }

            const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
            const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
            if (!boundary) {
              json(res, 400, { ok: false, error: 'Missing multipart boundary' });
              return;
            }

            const body = await readBodyBuffer(req);
            const parsed = parseMultipart(body, boundary);
            const file = parsed.files.find((f) => f.name === 'image' || f.name === 'file');
            const idField = parsed.fields.id?.trim() || `ig-${Date.now()}`;
            const safeId = idField.replace(/[^a-zA-Z0-9_-]/g, '-').replace(/-+/g, '-').slice(0, 64);
            if (!file?.data.length) {
              json(res, 400, { ok: false, error: 'Image file is required' });
              return;
            }

            const ext = extensionForUpload(file.filename, file.contentType);
            const relative = `/media/instagram/${safeId}${ext}`;
            const fullPath = path.join(repoRoot, 'public', relative.replace(/^\//, ''));
            await fs.mkdir(path.dirname(fullPath), { recursive: true });
            await fs.writeFile(fullPath, file.data);
            json(res, 200, { ok: true, path: relative, id: safeId });
            return;
          }

          if (req.method === 'POST' && url.pathname === '/api/instagram-og') {
            const payload = JSON.parse(await readBody(req)) as { url?: string; id?: string };
            const instagramUrl = String(payload.url ?? '').trim();
            if (!instagramUrl || !isInstagramUrl(instagramUrl)) {
              json(res, 400, { ok: false, error: 'A valid Instagram URL is required' });
              return;
            }

            const idHint = String(payload.id ?? '').trim() || `ig-${Date.now()}`;
            const preview = await fetchInstagramPreview(instagramUrl);
            const imagePath = await downloadOgImage(repoRoot, idHint, preview.imageUrl);
            json(res, 200, {
              ok: true,
              url: instagramUrl,
              title: preview.title,
              mediaKind: preview.mediaKind,
              image: imagePath,
            });
            return;
          }

          json(res, 404, { ok: false, error: 'Not found' });
        } catch (err) {
          json(res, 500, {
            ok: false,
            error: err instanceof Error ? err.message : 'Request failed',
          });
        }
      });
    },
  };
}
