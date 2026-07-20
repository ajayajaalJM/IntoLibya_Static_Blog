import { LANG_LABELS, LANGS, type Lang } from '../../../src/lib/post-schema';

export type TranslateProviderName = 'ollama' | 'openai';

export interface TranslateFields {
  title: string;
  body: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface TranslateOptions {
  /** Target languages (defaults to all non-English). */
  targets?: Lang[];
  /** Max approximate words per body chunk before splitting. */
  chunkWordLimit?: number;
}

const TARGET_LANGS = LANGS.filter((lang): lang is Exclude<Lang, 'en'> => lang !== 'en');

const DEFAULT_OLLAMA_BASE = 'http://127.0.0.1:11434/v1';
const DEFAULT_OLLAMA_MODEL = 'qwen2.5:14b';
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
const DEFAULT_CHUNK_WORDS = 1200;

function providerName(): TranslateProviderName {
  const raw = (process.env.TRANSLATE_PROVIDER || 'ollama').toLowerCase().trim();
  if (raw === 'openai') return 'openai';
  return 'ollama';
}

function ollamaConfig() {
  return {
    baseUrl: (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE).replace(/\/$/, ''),
    model: process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL,
  };
}

function openaiConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY is missing. Set TRANSLATE_PROVIDER=ollama for free local translations, or add OPENAI_API_KEY.',
    );
  }
  return {
    baseUrl: 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    apiKey,
  };
}

function systemPrompt(lang: Lang): string {
  const label = LANG_LABELS[lang];
  return [
    'You translate IntoLibya travel blog posts from English into one target language.',
    `Target language: ${lang} (${label}).`,
    'Return strict JSON only, shaped as:',
    '{ "title": "...", "body": "...", "seoTitle": "...", "seoDescription": "..." }.',
    'Preserve HTML tags, attributes, links, and structure in body. Translate only visible text.',
    'Do not add or remove headings, paragraphs, lists, or links.',
    'Keep proper nouns like IntoLibya, Tripoli, Ghadames, Leptis Magna, Sabratha, Acacus when appropriate.',
    'seoTitle and seoDescription must be natural for the target language (seoDescription ~150–160 chars when possible).',
    'If seoTitle/seoDescription are empty in the input, still produce good SEO title/description from the title and body.',
  ].join(' ');
}

function extractJsonObject(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new Error('Translation model did not return JSON');
    }
    return JSON.parse(trimmed.slice(start, end + 1)) as Record<string, unknown>;
  }
}

function countTags(html: string, tag: string): number {
  const re = new RegExp(`<${tag}\\b`, 'gi');
  return (html.match(re) || []).length;
}

/** Returns null if OK, otherwise an error message. */
export function structuralCheck(sourceBody: string, translatedBody: string): string | null {
  const tags = ['h2', 'h3', 'p', 'a', 'ul', 'ol', 'li'] as const;
  const problems: string[] = [];
  for (const tag of tags) {
    const src = countTags(sourceBody, tag);
    if (src === 0) continue;
    const out = countTags(translatedBody, tag);
    const tolerance = Math.max(1, Math.ceil(src * 0.25));
    if (Math.abs(src - out) > tolerance) {
      problems.push(`<${tag}> count ${out} vs source ${src}`);
    }
  }
  if (!translatedBody.trim()) return 'Translated body is empty';
  return problems.length ? problems.join('; ') : null;
}

function approximateWordCount(html: string): number {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length;
}

/**
 * Split HTML into chunks on block boundaries when over the word limit.
 * Prefers splitting after </p>, </h2>, </h3>, </ul>, </ol>, </li>.
 */
export function chunkHtmlBody(body: string, wordLimit = DEFAULT_CHUNK_WORDS): string[] {
  const trimmed = body.trim();
  if (!trimmed) return [''];
  if (approximateWordCount(trimmed) <= wordLimit) return [trimmed];

  const parts = trimmed.split(/(?<=<\/(?:p|h2|h3|ul|ol|li|blockquote|div)>)/i);
  const chunks: string[] = [];
  let current = '';

  for (const part of parts) {
    const candidate = current + part;
    if (current && approximateWordCount(candidate) > wordLimit) {
      chunks.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current);

  return chunks.length ? chunks : [trimmed];
}

async function chatCompletion(args: {
  baseUrl: string;
  model: string;
  apiKey?: string;
  system: string;
  user: string;
  jsonMode: boolean;
}): Promise<string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (args.apiKey) headers.Authorization = `Bearer ${args.apiKey}`;

  const body: Record<string, unknown> = {
    model: args.model,
    messages: [
      { role: 'system', content: args.system },
      { role: 'user', content: args.user },
    ],
    temperature: 0.2,
  };
  if (args.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(`${args.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Translation API failed (${response.status}): ${detail.slice(0, 400)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('Translation API returned an empty response');
  return content;
}

async function translateBodyChunks(
  body: string,
  lang: Lang,
  endpoint: { baseUrl: string; model: string; apiKey?: string; jsonMode: boolean },
  chunkWordLimit: number,
): Promise<string> {
  const chunks = chunkHtmlBody(body, chunkWordLimit);
  const translated: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const content = await chatCompletion({
      ...endpoint,
      system: [
        systemPrompt(lang),
        chunks.length > 1
          ? `This is HTML body chunk ${i + 1} of ${chunks.length}.`
          : 'Translate the HTML body only.',
        'Return strict JSON: { "body": "..." } with only the translated HTML for this chunk.',
      ].join(' '),
      user: JSON.stringify({ body: chunks[i], lang }),
    });
    const parsed = extractJsonObject(content);
    const chunkBody = typeof parsed.body === 'string' ? parsed.body : '';
    if (!chunkBody.trim()) {
      throw new Error(`Empty body chunk ${i + 1}/${chunks.length} for ${lang}`);
    }
    translated.push(chunkBody);
  }
  return translated.join('');
}

async function translateOneLanguage(
  input: TranslateFields,
  lang: Lang,
  endpoint: { baseUrl: string; model: string; apiKey?: string; jsonMode: boolean },
  chunkWordLimit: number,
): Promise<TranslateFields> {
  const needsChunking = approximateWordCount(input.body) > chunkWordLimit;

  if (!needsChunking) {
    const content = await chatCompletion({
      ...endpoint,
      system: systemPrompt(lang),
      user: JSON.stringify({
        title: input.title,
        body: input.body,
        seoTitle: input.seoTitle || '',
        seoDescription: input.seoDescription || '',
        lang,
      }),
    });
    const parsed = extractJsonObject(content);
    const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    const body = typeof parsed.body === 'string' ? parsed.body : '';
    const seoTitle =
      typeof parsed.seoTitle === 'string' && parsed.seoTitle.trim()
        ? parsed.seoTitle.trim()
        : title;
    const seoDescription =
      typeof parsed.seoDescription === 'string' ? parsed.seoDescription.trim() : '';

    if (!title || !body.trim()) {
      throw new Error(`Translation missing title/body for ${lang}`);
    }

    const structureError = structuralCheck(input.body, body);
    if (structureError) {
      throw new Error(`Structural check failed for ${lang}: ${structureError}`);
    }

    return { title, body, seoTitle, seoDescription };
  }

  // Chunked: translate meta once, body in pieces
  const metaContent = await chatCompletion({
    ...endpoint,
    system: [
      systemPrompt(lang),
      'Translate only title and SEO fields. Return JSON: { "title": "...", "seoTitle": "...", "seoDescription": "..." }.',
      'Do not include body.',
    ].join(' '),
    user: JSON.stringify({
      title: input.title,
      seoTitle: input.seoTitle || '',
      seoDescription: input.seoDescription || '',
      bodyPreview: input.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500),
      lang,
    }),
  });
  const meta = extractJsonObject(metaContent);
  const title = typeof meta.title === 'string' ? meta.title.trim() : '';
  const seoTitle =
    typeof meta.seoTitle === 'string' && meta.seoTitle.trim() ? meta.seoTitle.trim() : title;
  const seoDescription =
    typeof meta.seoDescription === 'string' ? meta.seoDescription.trim() : '';
  if (!title) throw new Error(`Translation missing title for ${lang}`);

  const body = await translateBodyChunks(input.body, lang, endpoint, chunkWordLimit);
  const structureError = structuralCheck(input.body, body);
  if (structureError) {
    throw new Error(`Structural check failed for ${lang}: ${structureError}`);
  }

  return { title, body, seoTitle, seoDescription };
}

function resolveEndpoint(): {
  baseUrl: string;
  model: string;
  apiKey?: string;
  jsonMode: boolean;
  name: TranslateProviderName;
} {
  const name = providerName();
  if (name === 'openai') {
    const cfg = openaiConfig();
    return { ...cfg, jsonMode: true, name };
  }
  const cfg = ollamaConfig();
  return { ...cfg, jsonMode: false, name };
}

/**
 * Translate English fields into one or more languages (one model call per language).
 */
export async function translateFields(
  input: TranslateFields,
  options: TranslateOptions = {},
): Promise<Partial<Record<Lang, TranslateFields>>> {
  if (!input.title?.trim() || !input.body?.trim()) {
    throw new Error('English title and body are required');
  }

  const targets = (options.targets ?? TARGET_LANGS).filter((l) => l !== 'en');
  if (!targets.length) return {};

  const endpoint = resolveEndpoint();
  const chunkWordLimit = options.chunkWordLimit ?? DEFAULT_CHUNK_WORDS;
  const result: Partial<Record<Lang, TranslateFields>> = {};

  for (const lang of targets) {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        result[lang] = await translateOneLanguage(input, lang, endpoint, chunkWordLimit);
        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt === 2) break;
      }
    }
    if (lastError) throw lastError;
  }

  return result;
}

/** Translate into all non-English langs; same shape as the writer `/api/translate` response. */
export async function translateAllLanguages(
  input: TranslateFields,
  options: TranslateOptions = {},
): Promise<Record<Lang, TranslateFields>> {
  const partial = await translateFields(input, options);
  const result = {} as Record<Lang, TranslateFields>;
  for (const lang of TARGET_LANGS) {
    const item = partial[lang];
    if (!item?.title || !item?.body) {
      throw new Error(`Translation missing for ${lang}`);
    }
    result[lang] = item;
  }
  return result;
}

export function getTranslateProviderInfo(): {
  provider: TranslateProviderName;
  model: string;
  baseUrl: string;
} {
  const endpoint = resolveEndpoint();
  return {
    provider: endpoint.name,
    model: endpoint.model,
    baseUrl: endpoint.baseUrl,
  };
}
