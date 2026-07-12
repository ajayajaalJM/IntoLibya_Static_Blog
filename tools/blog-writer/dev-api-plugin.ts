import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import matter from 'gray-matter';
import type { Plugin } from 'vite';
import { LANGS, LANG_LABELS, type Lang } from '../../src/lib/post-schema';

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
  featuredImage?: string;
  seoTitle: string;
  seoDescription: string;
  excerpt?: string;
  body: string;
  path: string;
}

interface PostGroupSummary {
  translationGroup: string;
  baseTitle: string;
  baseSlug: string;
  publishedAt: string;
  featuredImage?: string;
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

async function loadAllPosts(repoRoot: string): Promise<PostRecord[]> {
  const postsDir = path.join(repoRoot, 'src/content/posts');
  const files = await walkMarkdownFiles(postsDir);
  const posts: PostRecord[] = [];

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const { data, content } = matter(raw);
    const lang = data.lang as Lang;
    if (!LANGS.includes(lang)) continue;

    posts.push({
      lang,
      slug: String(data.slug ?? ''),
      title: String(data.title ?? ''),
      translationGroup: String(data.translationGroup ?? data.slug ?? ''),
      publishedAt: String(data.publishedAt ?? '').slice(0, 10),
      featuredImage: data.featuredImage ? String(data.featuredImage) : undefined,
      seoTitle: String(data.seo?.title ?? data.title ?? ''),
      seoDescription: String(data.seo?.description ?? ''),
      excerpt: data.excerpt ? String(data.excerpt) : undefined,
      body: content.trim(),
      path: path.relative(repoRoot, file).split(path.sep).join('/'),
    });
  }

  return posts;
}

function groupPosts(posts: PostRecord[]): PostGroupSummary[] {
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

      return {
        translationGroup,
        baseTitle: english.title,
        baseSlug: english.lang === 'en' ? english.slug : translationGroup,
        publishedAt: english.publishedAt,
        featuredImage: english.featuredImage,
        translations: LANGS.map((lang) => {
          const post = byLang.get(lang);
          return {
            lang,
            slug: post?.slug ?? (lang === 'en' ? translationGroup : `${translationGroup}-${lang}`),
            title: post?.title ?? '',
            path: post?.path ?? `src/content/posts/${lang}/${lang === 'en' ? translationGroup : `${translationGroup}-${lang}`}.md`,
            exists: Boolean(post),
          };
        }),
      };
    })
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
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
            json(res, 200, { ok: true, groups: groupPosts(posts) });
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
            json(res, 200, { ok: true, posts: group });
            return;
          }

          if (req.method === 'POST' && url.pathname === '/api/translate') {
            const payload = JSON.parse(await readBody(req)) as TranslatePayload;
            if (!payload.title?.trim() || !payload.body?.trim()) {
              json(res, 400, { ok: false, error: 'English title and body are required' });
              return;
            }
            const translations = await translateWithOpenAI(payload.title.trim(), payload.body.trim());
            json(res, 200, { ok: true, translations });
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
              if (!file.path.startsWith('src/content/posts/') || !file.path.endsWith('.md')) {
                throw new Error(`Invalid path: ${file.path}`);
              }
              const parsed = matter(file.content);
              const featuredImage = String(parsed.data.featuredImage ?? '').trim();
              if (!featuredImage) {
                json(res, 400, {
                  ok: false,
                  error: 'Featured image (hero) is required on every post before publishing',
                });
                return;
              }
              const fullPath = path.join(repoRoot, file.path);
              await fs.mkdir(path.dirname(fullPath), { recursive: true });
              await fs.writeFile(fullPath, file.content, 'utf8');
              saved.push(file.path);
            }
            json(res, 200, { ok: true, saved });
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
