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
              const fullPath = path.join(repoRoot, file.path);
              await fs.mkdir(path.dirname(fullPath), { recursive: true });
              await fs.writeFile(fullPath, file.content, 'utf8');
              saved.push(file.path);
            }
            json(res, 200, { ok: true, saved });
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
