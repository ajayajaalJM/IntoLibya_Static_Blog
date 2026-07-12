import { LANGS, LANG_LABELS, type Lang } from '@lib/post-schema';
import {
  buildAllMarkdown,
  buildMarkdown,
  canonicalPathForLang,
  slugify,
  TARGET_LANGS,
  type GeneratedFile,
  type PostDraft,
} from './lib/post-markdown';

type ProgressStatus =
  | 'disabled'
  | 'empty'
  | 'partial'
  | 'ready'
  | 'translating'
  | 'translated'
  | 'saving'
  | 'saved'
  | 'error';

interface LangProgress {
  lang: Lang;
  status: ProgressStatus;
  message: string;
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

interface LoadedPost {
  lang: Lang;
  slug: string;
  title: string;
  translationGroup: string;
  publishedAt: string;
  featuredImage?: string;
  seoTitle: string;
  seoDescription: string;
  body: string;
  path: string;
}

interface InstagramFeedItem {
  id: string;
  url: string;
  title: string;
  image: string;
  mediaKind: 'reel' | 'post' | 'carousel';
}

const form = document.getElementById('form') as HTMLFormElement;
const englishPreview = document.getElementById('english-preview') as HTMLPreElement;
const outputTabs = document.getElementById('output-tabs') as HTMLDivElement;
const output = document.getElementById('output') as HTMLPreElement;
const targetPath = document.getElementById('targetPath') as HTMLParagraphElement;
const progressList = document.getElementById('progress-list') as HTMLUListElement;
const translationsRoot = document.getElementById('translations') as HTMLDivElement;
const libraryList = document.getElementById('library-list') as HTMLDivElement;
const viewWrite = document.getElementById('view-write') as HTMLElement;
const viewLibrary = document.getElementById('view-library') as HTMLElement;
const viewInstagram = document.getElementById('view-instagram') as HTMLElement;
const instagramList = document.getElementById('instagram-list') as HTMLDivElement;
const instagramStatus = document.getElementById('instagram-status') as HTMLParagraphElement;
const instagramForm = document.getElementById('instagram-form') as HTMLFormElement;

const baseSlugInput = form.elements.namedItem('baseSlug') as HTMLInputElement;
const titleInput = form.elements.namedItem('title') as HTMLInputElement;
const dateInput = form.elements.namedItem('publishedAt') as HTMLInputElement;

const STATUS_LABEL: Record<ProgressStatus, string> = {
  disabled: 'Off',
  empty: 'Waiting',
  partial: 'Incomplete',
  ready: 'Ready',
  translating: 'Translating…',
  translated: 'Translated',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Error',
};

let baseSlugManual = false;
let activeOutputLang: Lang = 'en';
let editingGroup: string | null = null;
const outputs = new Map<Lang, GeneratedFile>();
const progressState = new Map<Lang, LangProgress>();
let instagramItems: InstagramFeedItem[] = [];
let instagramUpdatedAt: string | null = null;

dateInput.value = new Date().toISOString().slice(0, 10);

function sharedMeta() {
  const baseSlug = baseSlugInput.value.trim() || slugify(titleInput.value.trim());
  return {
    publishedAt: dateInput.value || new Date().toISOString().slice(0, 10),
    translationGroup: baseSlug,
    featuredImage: (form.elements.namedItem('featuredImage') as HTMLInputElement).value.trim(),
  };
}

function readEnglishDraft(): PostDraft {
  return {
    lang: 'en',
    title: titleInput.value.trim(),
    body: (form.elements.namedItem('body') as HTMLTextAreaElement).value.trim(),
    seoTitle: (form.elements.namedItem('seoTitle') as HTMLInputElement).value.trim(),
    seoDescription: (form.elements.namedItem('seoDescription') as HTMLTextAreaElement).value.trim(),
  };
}

function readTranslationDraft(lang: Lang): PostDraft {
  return {
    lang,
    title: (form.elements.namedItem(`translationTitle-${lang}`) as HTMLInputElement)?.value.trim() || '',
    body: (form.elements.namedItem(`translationBody-${lang}`) as HTMLTextAreaElement)?.value.trim() || '',
    seoTitle: (form.elements.namedItem(`translationSeoTitle-${lang}`) as HTMLInputElement)?.value.trim() || '',
    seoDescription: (form.elements.namedItem(`translationSeoDescription-${lang}`) as HTMLTextAreaElement)?.value.trim() || '',
  };
}

function setTranslationFields(lang: Lang, data: { title: string; body: string; seoTitle?: string; seoDescription?: string }) {
  (form.elements.namedItem(`translationTitle-${lang}`) as HTMLInputElement).value = data.title;
  (form.elements.namedItem(`translationBody-${lang}`) as HTMLTextAreaElement).value = data.body;
  (form.elements.namedItem(`translationSeoTitle-${lang}`) as HTMLInputElement).value = data.seoTitle ?? '';
  (form.elements.namedItem(`translationSeoDescription-${lang}`) as HTMLTextAreaElement).value = data.seoDescription ?? '';
  const panel = translationsRoot.querySelector(`details[data-lang="${lang}"]`) as HTMLDetailsElement | null;
  if (panel) panel.open = true;
}

function buildTranslationPanels() {
  translationsRoot.innerHTML = TARGET_LANGS.map((lang) => `
    <details class="translation-panel" data-lang="${lang}">
      <summary>${LANG_LABELS[lang]} <code>${lang}</code></summary>
      <div class="translation-fields">
        <label>Title
          <input type="text" name="translationTitle-${lang}" placeholder="Auto-translated title" />
        </label>
        <label>SEO title
          <input type="text" name="translationSeoTitle-${lang}" placeholder="Optional" />
        </label>
        <label>SEO description
          <textarea name="translationSeoDescription-${lang}" rows="2" placeholder="Optional"></textarea>
        </label>
        <label>HTML body
          <textarea name="translationBody-${lang}" rows="8" placeholder="Auto-translated body"></textarea>
        </label>
      </div>
    </details>
  `).join('');
}

function syncBaseSlugFromTitle() {
  if (baseSlugManual) return;
  baseSlugInput.value = slugify(titleInput.value);
}

function syncPrimarySlugPreview() {
  const preview = document.getElementById('primary-slug-preview');
  if (!preview) return;
  const base = baseSlugInput.value.trim() || slugify(titleInput.value) || 'your-post-slug';
  preview.textContent = canonicalPathForLang(base, 'en');
}

function draftStatus(draft: PostDraft): ProgressStatus {
  if (draft.lang === 'en') {
    if (draft.title && draft.body) return 'ready';
    if (draft.title || draft.body) return 'partial';
    return 'empty';
  }
  if (draft.title && draft.body) return 'translated';
  if (draft.title || draft.body) return 'partial';
  return 'empty';
}

function regeneratePreview() {
  syncPrimarySlugPreview();
  const english = readEnglishDraft();
  const shared = sharedMeta();
  const englishFile = english.title || english.body ? buildMarkdown(english, shared.translationGroup, shared) : null;

  englishPreview.textContent = englishFile?.md || 'Start typing to preview English markdown…';

  outputs.clear();
  const files: GeneratedFile[] = [];
  if (englishFile) {
    outputs.set('en', englishFile);
    files.push(englishFile);
  }

  for (const lang of TARGET_LANGS) {
    const draft = readTranslationDraft(lang);
    if (!draft.title && !draft.body) continue;
    const file = buildMarkdown(draft, shared.translationGroup, shared);
    outputs.set(lang, file);
    files.push(file);
  }

  if (!files.some((f) => f.lang === activeOutputLang)) {
    activeOutputLang = files[0]?.lang ?? 'en';
  }

  updateProgress(files);
  renderOutputTabs(files);
  showActiveOutput();
}

function updateProgress(files: GeneratedFile[]) {
  progressState.clear();
  const english = readEnglishDraft();
  const englishStatus = draftStatus(english);
  const englishFile = files.find((f) => f.lang === 'en');

  progressState.set('en', {
    lang: 'en',
    status: englishStatus,
    message: englishFile ? englishFile.path : 'English source post',
  });

  for (const lang of TARGET_LANGS) {
    const draft = readTranslationDraft(lang);
    const file = files.find((f) => f.lang === lang);
    let status = draftStatus(draft);
    if (status === 'translated' && file) status = 'ready';

    progressState.set(lang, {
      lang,
      status,
      message: file?.path ?? 'Will be translated on save',
    });
  }

  renderProgressList();
}

function renderProgressList() {
  progressList.innerHTML = LANGS.map((lang) => progressState.get(lang))
    .filter(Boolean)
    .map((item) => {
      const active = item!.lang === activeOutputLang ? ' is-active' : '';
      return `
        <li class="progress-item status-${item!.status}${active}" data-lang="${item!.lang}">
          <div class="progress-row">
            <span class="progress-lang">${LANG_LABELS[item!.lang]}</span>
            <span class="progress-badge">${STATUS_LABEL[item!.status]}</span>
          </div>
          <p class="progress-message">${item!.message}</p>
        </li>
      `;
    })
    .join('');

  progressList.querySelectorAll<HTMLLIElement>('.progress-item').forEach((item) => {
    item.addEventListener('click', () => {
      activeOutputLang = item.dataset.lang as Lang;
      renderProgressList();
      renderOutputTabs([...outputs.values()]);
      showActiveOutput();
    });
  });
}

function renderOutputTabs(files: GeneratedFile[]) {
  outputTabs.innerHTML = files
    .map((file) => {
      const active = file.lang === activeOutputLang ? ' is-active' : '';
      return `<button type="button" class="output-tab${active}" data-lang="${file.lang}">${LANG_LABELS[file.lang]}</button>`;
    })
    .join('');

  outputTabs.querySelectorAll<HTMLButtonElement>('.output-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeOutputLang = btn.dataset.lang as Lang;
      renderOutputTabs(files);
      renderProgressList();
      showActiveOutput();
    });
  });
}

function showActiveOutput() {
  const file = outputs.get(activeOutputLang);
  output.textContent = file?.md || 'No markdown for this language yet.';
}

function setProgress(lang: Lang, status: ProgressStatus, message: string) {
  progressState.set(lang, { lang, status, message });
  renderProgressList();
}

async function translateAndSaveAll() {
  const english = readEnglishDraft();
  if (!english.title || !english.body) {
    targetPath.textContent = 'Add an English title and HTML body first.';
    return;
  }

  const shared = sharedMeta();
  if (!shared.featuredImage) {
    targetPath.textContent = 'Add a featured image path (hero) before publishing. Example: /media/2026/03/hero.jpg';
    (form.elements.namedItem('featuredImage') as HTMLInputElement).focus();
    return;
  }

  const saveBtn = document.getElementById('save-all') as HTMLButtonElement;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Translating…';

  try {
    setProgress('en', 'ready', 'English source ready');
    for (const lang of TARGET_LANGS) {
      setProgress(lang, 'translating', 'Translating from English…');
    }

    const translateRes = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: english.title, body: english.body }),
    });
    const translateData = await translateRes.json() as {
      ok: boolean;
      translations?: Record<Lang, { title: string; body: string }>;
      error?: string;
    };
    if (!translateRes.ok || !translateData.ok || !translateData.translations) {
      throw new Error(translateData.error || 'Translation failed');
    }

    for (const lang of TARGET_LANGS) {
      const translated = translateData.translations[lang];
      setTranslationFields(lang, translated);
      setProgress(lang, 'translated', 'Translation ready');
    }

    regeneratePreview();
    saveBtn.textContent = 'Saving…';

    const translationDrafts = TARGET_LANGS.map((lang) => readTranslationDraft(lang));
    const files = buildAllMarkdown(english, translationDrafts, shared);

    for (const file of files) {
      setProgress(file.lang, 'saving', `Saving ${file.path}…`);
    }

    const saveRes = await fetch('/api/save-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files: files.map((file) => ({ path: file.path, content: file.md })),
      }),
    });
    const saveData = await saveRes.json() as { ok: boolean; saved?: string[]; error?: string };
    if (!saveRes.ok || !saveData.ok) throw new Error(saveData.error || 'Save failed');

    for (const path of saveData.saved ?? []) {
      const lang = LANGS.find((code) => path.includes(`/posts/${code}/`));
      if (lang) setProgress(lang, 'saved', `Saved · ${path}`);
    }

    editingGroup = shared.translationGroup;
    targetPath.textContent = `Saved ${saveData.saved?.length ?? files.length} files to the blog content folder:\n${(saveData.saved ?? files.map((f) => f.path)).join('\n')}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Translate & save failed';
    targetPath.textContent = message;
    for (const lang of TARGET_LANGS) {
      const current = progressState.get(lang);
      if (current?.status === 'translating') {
        setProgress(lang, 'error', message);
      }
    }
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Translate & save all';
    regeneratePreview();
  }
}

function resetWriter() {
  editingGroup = null;
  form.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  baseSlugManual = false;
  for (const lang of TARGET_LANGS) {
    setTranslationFields(lang, { title: '', body: '', seoTitle: '', seoDescription: '' });
  }
  targetPath.textContent = 'Saved files will appear here.';
  regeneratePreview();
}

async function loadGroupIntoEditor(translationGroup: string) {
  const res = await fetch(`/api/post-groups/${encodeURIComponent(translationGroup)}`);
  const data = await res.json() as { ok: boolean; posts?: LoadedPost[]; error?: string };
  if (!res.ok || !data.ok || !data.posts?.length) {
    throw new Error(data.error || 'Could not load post group');
  }

  editingGroup = translationGroup;
  const english = data.posts.find((p) => p.lang === 'en') ?? data.posts[0];

  titleInput.value = english.title;
  baseSlugInput.value = english.translationGroup;
  baseSlugManual = true;
  dateInput.value = english.publishedAt || new Date().toISOString().slice(0, 10);
  (form.elements.namedItem('featuredImage') as HTMLInputElement).value = english.featuredImage ?? '';
  (form.elements.namedItem('seoTitle') as HTMLInputElement).value = english.seoTitle ?? '';
  (form.elements.namedItem('seoDescription') as HTMLTextAreaElement).value = english.seoDescription ?? '';
  (form.elements.namedItem('body') as HTMLTextAreaElement).value = english.body;

  for (const lang of TARGET_LANGS) {
    const post = data.posts.find((p) => p.lang === lang);
    setTranslationFields(lang, {
      title: post?.title ?? '',
      body: post?.body ?? '',
      seoTitle: post?.seoTitle ?? '',
      seoDescription: post?.seoDescription ?? '',
    });
  }

  showView('write');
  regeneratePreview();
  targetPath.textContent = `Editing group: ${translationGroup}`;
}

async function loadLibrary() {
  libraryList.innerHTML = '<p class="hint">Loading posts…</p>';
  const res = await fetch('/api/post-groups');
  const data = await res.json() as { ok: boolean; groups?: PostGroupSummary[]; error?: string };
  if (!res.ok || !data.ok || !data.groups) {
    libraryList.innerHTML = `<p class="hint">${data.error || 'Could not load library.'}</p>`;
    return;
  }

  if (!data.groups.length) {
    libraryList.innerHTML = '<p class="hint">No posts found in src/content/posts yet.</p>';
    return;
  }

  libraryList.innerHTML = data.groups
    .map((group) => {
      const chips = group.translations
        .map((t) => {
          const state = t.exists ? 'exists' : 'missing';
          const label = t.exists ? LANG_LABELS[t.lang] : `${LANG_LABELS[t.lang]} · missing`;
          return `<span class="lang-chip ${state}" title="${t.path}">${label}</span>`;
        })
        .join('');

      return `
        <article class="library-card">
          <div class="library-card-head">
            <div>
              <h3>${group.baseTitle || group.translationGroup}</h3>
              <p class="library-meta">${group.publishedAt} · <code>${group.translationGroup}</code></p>
            </div>
            <button type="button" class="btn-secondary edit-group" data-group="${group.translationGroup}">Edit group</button>
          </div>
          <div class="lang-chip-row">${chips}</div>
        </article>
      `;
    })
    .join('');

  libraryList.querySelectorAll<HTMLButtonElement>('.edit-group').forEach((btn) => {
    btn.addEventListener('click', () => {
      void loadGroupIntoEditor(btn.dataset.group!);
    });
  });
}

function showView(view: 'write' | 'library' | 'instagram') {
  viewWrite.classList.toggle('hidden', view !== 'write');
  viewLibrary.classList.toggle('hidden', view !== 'library');
  viewInstagram.classList.toggle('hidden', view !== 'instagram');
  document.querySelectorAll<HTMLButtonElement>('.nav-link').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === view);
  });
  if (view === 'library') void loadLibrary();
  if (view === 'instagram') void loadInstagramFeed();
}

function slugifyId(value: string): string {
  return slugify(value).slice(0, 64) || `ig-${Date.now()}`;
}

function renderInstagramList() {
  if (!instagramItems.length) {
    instagramList.innerHTML = '<p class="hint">No items yet. Add a Reel, post, or carousel below.</p>';
    return;
  }

  instagramList.innerHTML = instagramItems
    .map((item, index) => `
      <article class="instagram-card" data-index="${index}">
        <img src="${item.image}?t=${Date.now()}" alt="" loading="lazy" />
        <div class="instagram-card-body">
          <label class="instagram-inline-label">Title
            <input class="ig-title" type="text" value="${escapeAttr(item.title)}" />
          </label>
          <label class="instagram-inline-label">Instagram URL
            <div class="instagram-url-row">
              <input class="ig-url" type="url" value="${escapeAttr(item.url)}" placeholder="https://www.instagram.com/reel/XXXX/" />
              <button type="button" class="ig-fetch-og">Fetch OG</button>
            </div>
          </label>
          <div class="instagram-inline-meta">
            <label class="instagram-inline-label">Kind
              <select class="ig-kind">
                <option value="reel"${item.mediaKind === 'reel' ? ' selected' : ''}>Reel</option>
                <option value="post"${item.mediaKind === 'post' ? ' selected' : ''}>Post</option>
                <option value="carousel"${item.mediaKind === 'carousel' ? ' selected' : ''}>Carousel</option>
              </select>
            </label>
            <p class="library-meta"><code>${escapeHtml(item.image)}</code></p>
          </div>
        </div>
        <div class="instagram-card-actions">
          <button type="button" class="ig-up" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="ig-down" ${index === instagramItems.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" class="danger ig-remove">Remove</button>
        </div>
      </article>
    `)
    .join('');

  instagramList.querySelectorAll<HTMLElement>('.instagram-card').forEach((card) => {
    const index = Number(card.dataset.index);
    const titleInput = card.querySelector<HTMLInputElement>('.ig-title');
    const urlInput = card.querySelector<HTMLInputElement>('.ig-url');
    const kindSelect = card.querySelector<HTMLSelectElement>('.ig-kind');

    titleInput?.addEventListener('change', () => {
      instagramItems[index].title = titleInput.value.trim() || instagramItems[index].title;
      updateInstagramStatus('Unsaved changes — click Save feed.');
    });

    urlInput?.addEventListener('change', () => {
      const nextUrl = urlInput.value.trim();
      instagramItems[index].url = nextUrl;
      updateInstagramStatus('Unsaved changes — click Save feed.');
      if (isValidInstagramUrl(nextUrl)) {
        void fetchOgForItem(index, nextUrl);
      }
    });

    kindSelect?.addEventListener('change', () => {
      instagramItems[index].mediaKind = kindSelect.value as InstagramFeedItem['mediaKind'];
      updateInstagramStatus('Unsaved changes — click Save feed.');
    });

    card.querySelector('.ig-fetch-og')?.addEventListener('click', () => {
      const nextUrl = urlInput?.value.trim() || instagramItems[index].url;
      void fetchOgForItem(index, nextUrl);
    });

    card.querySelector('.ig-up')?.addEventListener('click', () => {
      if (index <= 0) return;
      const [item] = instagramItems.splice(index, 1);
      instagramItems.splice(index - 1, 0, item);
      renderInstagramList();
    });
    card.querySelector('.ig-down')?.addEventListener('click', () => {
      if (index >= instagramItems.length - 1) return;
      const [item] = instagramItems.splice(index, 1);
      instagramItems.splice(index + 1, 0, item);
      renderInstagramList();
    });
    card.querySelector('.ig-remove')?.addEventListener('click', () => {
      instagramItems.splice(index, 1);
      renderInstagramList();
      updateInstagramStatus('Unsaved changes — click Save feed.');
    });
  });
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(value: string): string {
  return escapeAttr(value).replace(/'/g, '&#39;');
}

function isValidInstagramUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return /(^|\.)instagram\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

function updateInstagramStatus(message?: string) {
  const when = instagramUpdatedAt
    ? new Date(instagramUpdatedAt).toLocaleString()
    : 'never';
  const base = `${instagramItems.length} item(s) · last saved ${when} · homepage shows first 9 (3×3)`;
  instagramStatus.textContent = message ? `${message} ${base}` : base;
}

async function loadInstagramFeed() {
  instagramStatus.textContent = 'Loading feed…';
  const res = await fetch('/api/instagram-feed');
  const data = await res.json() as {
    ok: boolean;
    feed?: { updatedAt: string | null; items: InstagramFeedItem[] };
    error?: string;
  };
  if (!res.ok || !data.ok || !data.feed) {
    instagramStatus.textContent = data.error || 'Could not load Instagram feed.';
    return;
  }
  instagramItems = Array.isArray(data.feed.items) ? [...data.feed.items] : [];
  instagramUpdatedAt = data.feed.updatedAt;
  renderInstagramList();
  updateInstagramStatus();
}

async function uploadInstagramImage(id: string, file: File): Promise<string> {
  const body = new FormData();
  body.append('id', id);
  body.append('image', file);
  const res = await fetch('/api/instagram-image', { method: 'POST', body });
  const data = await res.json() as { ok: boolean; path?: string; error?: string };
  if (!res.ok || !data.ok || !data.path) {
    throw new Error(data.error || 'Image upload failed');
  }
  return data.path;
}

async function fetchOgPreview(url: string, id?: string): Promise<{
  title: string;
  image: string;
  mediaKind: InstagramFeedItem['mediaKind'];
}> {
  const res = await fetch('/api/instagram-og', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, id }),
  });
  const data = await res.json() as {
    ok: boolean;
    title?: string;
    image?: string;
    mediaKind?: InstagramFeedItem['mediaKind'];
    error?: string;
  };
  if (!res.ok || !data.ok || !data.image) {
    throw new Error(data.error || 'OG fetch failed');
  }
  return {
    title: data.title || 'Instagram post',
    image: data.image,
    mediaKind: data.mediaKind || 'post',
  };
}

async function fetchOgForItem(index: string | number, url: string) {
  const i = Number(index);
  if (!isValidInstagramUrl(url)) {
    updateInstagramStatus('Enter a valid Instagram URL first.');
    return;
  }
  updateInstagramStatus('Fetching OG image…');
  try {
    const preview = await fetchOgPreview(url, instagramItems[i].id);
    instagramItems[i].url = url;
    instagramItems[i].image = preview.image;
    if (!instagramItems[i].title || instagramItems[i].title.startsWith('http')) {
      instagramItems[i].title = preview.title;
    } else if (preview.title && preview.title !== 'Instagram post') {
      instagramItems[i].title = preview.title;
    }
    instagramItems[i].mediaKind = preview.mediaKind;
    renderInstagramList();
    updateInstagramStatus('OG image updated — click Save feed.');
  } catch (err) {
    updateInstagramStatus(err instanceof Error ? err.message : 'OG fetch failed.');
  }
}

async function saveInstagramFeed() {
  const saveBtn = document.getElementById('save-instagram') as HTMLButtonElement;
  saveBtn.disabled = true;
  updateInstagramStatus('Saving…');
  try {
    const res = await fetch('/api/instagram-feed', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: instagramItems }),
    });
    const data = await res.json() as {
      ok: boolean;
      feed?: { updatedAt: string; items: InstagramFeedItem[] };
      error?: string;
    };
    if (!res.ok || !data.ok || !data.feed) {
      throw new Error(data.error || 'Save failed');
    }
    instagramItems = data.feed.items;
    instagramUpdatedAt = data.feed.updatedAt;
    renderInstagramList();
    updateInstagramStatus('Saved. Deploy to publish on the live site.');
  } catch (err) {
    updateInstagramStatus(err instanceof Error ? err.message : 'Save failed.');
  } finally {
    saveBtn.disabled = false;
  }
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

buildTranslationPanels();
regeneratePreview();

titleInput.addEventListener('input', () => {
  syncBaseSlugFromTitle();
  regeneratePreview();
});

baseSlugInput.addEventListener('focus', () => {
  baseSlugManual = true;
});

baseSlugInput.addEventListener('input', () => {
  if (!baseSlugInput.value.trim()) baseSlugManual = false;
  regeneratePreview();
});

form.addEventListener('input', regeneratePreview);
form.addEventListener('change', regeneratePreview);
form.addEventListener('submit', (e) => e.preventDefault());

document.querySelectorAll<HTMLButtonElement>('.nav-link').forEach((btn) => {
  btn.addEventListener('click', () => showView(btn.dataset.view as 'write' | 'library' | 'instagram'));
});

document.getElementById('save-all')?.addEventListener('click', () => {
  void translateAndSaveAll();
});

document.getElementById('new-post')?.addEventListener('click', resetWriter);
document.getElementById('refresh-library')?.addEventListener('click', () => {
  void loadLibrary();
});
document.getElementById('refresh-instagram')?.addEventListener('click', () => {
  void loadInstagramFeed();
});
document.getElementById('save-instagram')?.addEventListener('click', () => {
  void saveInstagramFeed();
});

instagramForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(instagramForm);
  const titleInput = String(fd.get('title') ?? '').trim();
  const url = String(fd.get('url') ?? '').trim();
  let mediaKind = String(fd.get('mediaKind') ?? 'reel') as InstagramFeedItem['mediaKind'];
  const idInput = String(fd.get('id') ?? '').trim();
  const imagePath = String(fd.get('imagePath') ?? '').trim();
  const fileInput = instagramForm.elements.namedItem('image') as HTMLInputElement;
  const file = fileInput.files?.[0];
  const id = slugifyId(idInput || titleInput || url);

  if (!url) {
    updateInstagramStatus('Instagram URL is required.');
    return;
  }
  if (!isValidInstagramUrl(url)) {
    updateInstagramStatus('URL must be an instagram.com link.');
    return;
  }
  if (instagramItems.some((item) => item.id === id)) {
    updateInstagramStatus(`ID "${id}" already exists — choose another.`);
    return;
  }

  try {
    let image = imagePath;
    let title = titleInput;

    if (file) {
      updateInstagramStatus('Uploading poster…');
      image = await uploadInstagramImage(id, file);
    } else if (!image) {
      updateInstagramStatus('Fetching OG image…');
      const preview = await fetchOgPreview(url, id);
      image = preview.image;
      title = title || preview.title;
      mediaKind = preview.mediaKind;
    }

    if (!image) {
      updateInstagramStatus('Could not resolve a poster — upload one or use Fetch OG.');
      return;
    }

    instagramItems.push({
      id,
      url,
      title: title || 'Instagram post',
      image,
      mediaKind,
    });
    instagramForm.reset();
    (instagramForm.elements.namedItem('mediaKind') as HTMLSelectElement).value = 'reel';
    renderInstagramList();
    updateInstagramStatus('Added to list — click Save feed to write files.');
  } catch (err) {
    updateInstagramStatus(err instanceof Error ? err.message : 'Could not add item.');
  }
});

document.getElementById('copy')?.addEventListener('click', async () => {
  const file = outputs.get(activeOutputLang);
  if (!file) return;
  await navigator.clipboard.writeText(file.md);
});

document.getElementById('download')?.addEventListener('click', () => {
  const file = outputs.get(activeOutputLang);
  if (!file) return;
  downloadFile(`${file.slug}.md`, file.md);
});

document.getElementById('download-all')?.addEventListener('click', () => {
  for (const file of outputs.values()) downloadFile(`${file.slug}.md`, file.md);
});

if (location.hash === '#library') showView('library');
if (location.hash === '#instagram') showView('instagram');
