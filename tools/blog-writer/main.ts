import { LANGS, LANG_LABELS, type Lang } from '@lib/post-schema';
import type { Gallery, GalleryImage, GalleryPosition } from '@lib/gallery-schema';
import {
  buildAllMarkdown,
  buildMarkdown,
  canonicalPathForLang,
  slugify,
  TARGET_LANGS,
  type ContentKind,
  type GeneratedFile,
  type PostDraft,
} from './lib/post-markdown';
import { createRichEditor, type RichEditor } from './lib/rich-editor';
import { escapePlainField } from './lib/sanitize-html';

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

type WriterView = 'dashboard' | 'write' | 'library' | 'destinations' | 'instagram';

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
  updatedAt?: string;
  featuredImage?: string;
  draft?: boolean;
  searchText?: string;
  contentKind?: ContentKind;
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
  draft?: boolean;
  seoTitle: string;
  seoDescription: string;
  body: string;
  path: string;
  galleries?: Gallery[];
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
const toggleTranslationsBtn = document.getElementById('toggle-translations') as HTMLButtonElement;
const libraryList = document.getElementById('library-list') as HTMLDivElement;
const destinationsList = document.getElementById('destinations-list') as HTMLDivElement;
const galleriesRoot = document.getElementById('galleries-root') as HTMLDivElement;
const newGalleryDropzone = document.getElementById('new-gallery-dropzone') as HTMLElement;
const newGalleryFileInput = document.getElementById('new-gallery-file') as HTMLInputElement;
const galleryUploadStatus = document.getElementById('gallery-upload-status') as HTMLParagraphElement;
const viewDashboard = document.getElementById('view-dashboard') as HTMLElement;
const viewWrite = document.getElementById('view-write') as HTMLElement;
const viewLibrary = document.getElementById('view-library') as HTMLElement;
const viewDestinations = document.getElementById('view-destinations') as HTMLElement;
const viewInstagram = document.getElementById('view-instagram') as HTMLElement;
const createChooser = document.getElementById('create-chooser') as HTMLElement;
const dashboardStats = document.getElementById('dashboard-stats') as HTMLDivElement;
const todoList = document.getElementById('todo-list') as HTMLUListElement;
const todoForm = document.getElementById('todo-form') as HTMLFormElement;
const todoStatus = document.getElementById('todo-status') as HTMLParagraphElement;
const instagramList = document.getElementById('instagram-list') as HTMLDivElement;
const instagramStatus = document.getElementById('instagram-status') as HTMLParagraphElement;
const instagramForm = document.getElementById('instagram-form') as HTMLFormElement;
const headerSubtitle = document.getElementById('header-subtitle') as HTMLParagraphElement;
const englishLegend = document.getElementById('english-legend') as HTMLElement;
const contentKindInput = form.elements.namedItem('contentKind') as HTMLInputElement;
const bodyInput = document.getElementById('body-input') as HTMLTextAreaElement;
const bodyEditorMount = document.getElementById('body-editor') as HTMLElement;
const autosaveStatus = document.getElementById('autosave-status') as HTMLSpanElement;
const undoAutosaveBtn = document.getElementById('undo-autosave') as HTMLButtonElement;
let richEditor: RichEditor;

interface EditorSnapshot {
  contentKind: ContentKind;
  title: string;
  baseSlug: string;
  publishedAt: string;
  featuredImage: string;
  draft: boolean;
  seoTitle: string;
  seoDescription: string;
  body: string;
  galleries: Gallery[];
  translationGroup: string;
  savedAt: string;
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
let autosavePaused = false;
let lastUndoSnapshot: EditorSnapshot | null = null;
let lastAutosavedJson = '';

function syncBodyFromEditor() {
  if (!richEditor) return;
  bodyInput.value = richEditor.getHtml();
}

function setBodyHtml(html: string) {
  richEditor.setHtml(html || '');
  syncBodyFromEditor();
}

function draftStorageKey(kind: ContentKind, slug: string): string {
  return `intolibya-writer-draft:${kind}:${slug || 'untitled'}`;
}

function captureSnapshot(): EditorSnapshot {
  syncBodyFromEditor();
  const baseSlug = baseSlugInput.value.trim() || slugify(titleInput.value.trim()) || 'untitled';
  return {
    contentKind: getContentKind(),
    title: titleInput.value,
    baseSlug: baseSlugInput.value,
    publishedAt: dateInput.value,
    featuredImage: featuredImageInput.value,
    draft: draftCheckbox.checked,
    seoTitle: (form.elements.namedItem('seoTitle') as HTMLInputElement).value,
    seoDescription: (form.elements.namedItem('seoDescription') as HTMLTextAreaElement).value,
    body: richEditor.getHtml(),
    galleries: structuredClone(galleries),
    translationGroup: baseSlug,
    savedAt: new Date().toISOString(),
  };
}

function restoreSnapshot(snapshot: EditorSnapshot) {
  autosavePaused = true;
  setContentKind(snapshot.contentKind);
  titleInput.value = snapshot.title;
  baseSlugInput.value = snapshot.baseSlug;
  baseSlugManual = Boolean(snapshot.baseSlug);
  dateInput.value = snapshot.publishedAt;
  featuredImageInput.value = snapshot.featuredImage;
  draftCheckbox.checked = snapshot.draft;
  (form.elements.namedItem('seoTitle') as HTMLInputElement).value = snapshot.seoTitle;
  (form.elements.namedItem('seoDescription') as HTMLTextAreaElement).value = snapshot.seoDescription;
  galleries = structuredClone(snapshot.galleries);
  renderGalleries();
  setBodyHtml(snapshot.body);
  editingGroup = snapshot.translationGroup;
  autosavePaused = false;
  regeneratePreview();
}

function setAutosaveStatus(message: string, kind: 'idle' | 'saved' | 'error' = 'idle') {
  autosaveStatus.textContent = message;
  autosaveStatus.classList.toggle('is-saved', kind === 'saved');
  autosaveStatus.classList.toggle('is-error', kind === 'error');
}

function updateUndoButton() {
  undoAutosaveBtn.disabled = !lastUndoSnapshot;
}

async function runAutosave() {
  if (autosavePaused || !richEditor) return;
  const snapshot = captureSnapshot();
  const json = JSON.stringify({
    ...snapshot,
    savedAt: undefined,
  });
  if (json === lastAutosavedJson) {
    setAutosaveStatus('Up to date');
    return;
  }

  const previousSnapshot = lastAutosavedJson
    ? (JSON.parse(lastAutosavedJson) as EditorSnapshot)
    : null;

  try {
    localStorage.setItem(
      draftStorageKey(snapshot.contentKind, snapshot.translationGroup),
      JSON.stringify(snapshot),
    );

    // Silent English file save when the entry is publishable
    const canSaveFile =
      Boolean(snapshot.title.trim()) &&
      Boolean(snapshot.body.trim()) &&
      Boolean(snapshot.featuredImage.trim()) &&
      (snapshot.galleries ?? []).every((g) => g.images.every((img) => img.alt.trim()));

    if (canSaveFile) {
      const english: PostDraft = {
        lang: 'en',
        title: escapePlainField(snapshot.title),
        body: snapshot.body.trim(),
        seoTitle: escapePlainField(snapshot.seoTitle),
        seoDescription: escapePlainField(snapshot.seoDescription),
      };
      const shared = {
        publishedAt: snapshot.publishedAt || new Date().toISOString().slice(0, 10),
        translationGroup: snapshot.translationGroup,
        featuredImage: snapshot.featuredImage.trim(),
        galleries: sanitizeGalleries(snapshot.galleries),
        contentKind: snapshot.contentKind,
        draft: snapshot.draft,
      };
      const file = buildMarkdown(english, shared.translationGroup, shared);
      const saveRes = await fetch('/api/save-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: [{ path: file.path, content: file.md }] }),
      });
      const saveData = (await saveRes.json()) as { ok: boolean; error?: string };
      if (!saveRes.ok || !saveData.ok) {
        throw new Error(saveData.error || 'Autosave to disk failed');
      }
      setAutosaveStatus(`Autosaved to disk ${new Date().toLocaleTimeString()}`, 'saved');
    } else {
      setAutosaveStatus(`Draft saved ${new Date().toLocaleTimeString()}`, 'saved');
    }

    lastAutosavedJson = json;
    lastUndoSnapshot = previousSnapshot;
    updateUndoButton();
  } catch (err) {
    setAutosaveStatus(err instanceof Error ? err.message : 'Autosave failed', 'error');
  }
}

function scheduleAutosave() {
  if (autosavePaused) return;
  setAutosaveStatus('Saving…');
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    void runAutosave();
  }, 1600);
}

function undoAutosave() {
  if (!lastUndoSnapshot) return;
  const toRestore = lastUndoSnapshot;
  lastUndoSnapshot = null;
  updateUndoButton();
  restoreSnapshot(toRestore);
  lastAutosavedJson = '';
  setAutosaveStatus('Restored previous autosave — edit to save again');
  scheduleAutosave();
}
const heroDropzone = document.getElementById('hero-dropzone') as HTMLElement;
const heroFileInput = document.getElementById('hero-file') as HTMLInputElement;
const heroUploadStatus = document.getElementById('hero-upload-status') as HTMLParagraphElement;

const baseSlugInput = form.elements.namedItem('baseSlug') as HTMLInputElement;
const titleInput = form.elements.namedItem('title') as HTMLInputElement;
const dateInput = form.elements.namedItem('publishedAt') as HTMLInputElement;
const featuredImageInput = form.elements.namedItem('featuredImage') as HTMLInputElement;
const draftCheckbox = document.getElementById('draft-checkbox') as HTMLInputElement;
const draftLabel = document.getElementById('draft-label') as HTMLLabelElement;
const draftHint = document.getElementById('draft-hint') as HTMLParagraphElement;

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
let contentKind: ContentKind = 'post';
let galleries: Gallery[] = [];
let translationsVisible = false;
const translationDrafts = new Map<Lang, PostDraft>();
const outputs = new Map<Lang, GeneratedFile>();
const progressState = new Map<Lang, LangProgress>();
let instagramItems: InstagramFeedItem[] = [];
let instagramUpdatedAt: string | null = null;
let dragImageFrom: { g: number; i: number } | null = null;

interface WriterTodoItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

let writerTodos: WriterTodoItem[] = [];
let writerTodosDirty = false;

dateInput.value = new Date().toISOString().slice(0, 10);

function getContentKind(): ContentKind {
  return (contentKindInput.value as ContentKind) || contentKind;
}

function setContentKind(kind: ContentKind) {
  contentKind = kind;
  contentKindInput.value = kind;
  englishLegend.textContent = kind === 'destination' ? 'English destination' : 'English post';
  headerSubtitle.textContent =
    kind === 'destination'
      ? 'Write destinations in English. Translate & save fills every language.'
      : 'Write posts in English. Translate & save fills every language.';
  draftLabel.classList.remove('hidden');
  draftHint.classList.remove('hidden');
  draftHint.textContent =
    kind === 'destination'
      ? 'Drafts stay out of builds, destination listings, and the sitemap. New destinations default to draft.'
      : 'Drafts stay out of builds, the blog index, and the sitemap. Toggle off when ready to publish.';
  syncPrimarySlugPreview();
}

function sharedMeta() {
  const baseSlug = baseSlugInput.value.trim() || slugify(titleInput.value.trim());
  return {
    publishedAt: dateInput.value || new Date().toISOString().slice(0, 10),
    translationGroup: baseSlug,
    featuredImage: featuredImageInput.value.trim(),
    galleries: sanitizeGalleries(galleries),
    contentKind: getContentKind(),
    draft: draftCheckbox.checked,
  };
}

function sanitizeGalleries(list: Gallery[]): Gallery[] {
  return list
    .map((g) => ({
      ...g,
      id: slugify(g.id || g.title || 'gallery') || `gallery-${Date.now()}`,
      images: g.images.filter((img) => img.src && img.alt.trim()),
    }))
    .filter((g) => g.images.length > 0);
}

function readEnglishDraft(): PostDraft {
  syncBodyFromEditor();
  return {
    lang: 'en',
    title: escapePlainField(titleInput.value),
    body: richEditor.getHtml().trim(),
    seoTitle: escapePlainField((form.elements.namedItem('seoTitle') as HTMLInputElement).value),
    seoDescription: escapePlainField(
      (form.elements.namedItem('seoDescription') as HTMLTextAreaElement).value,
    ),
  };
}

function readTranslationDraft(lang: Lang): PostDraft {
  if (translationsVisible) {
    const fromDom: PostDraft = {
      lang,
      title: (form.elements.namedItem(`translationTitle-${lang}`) as HTMLInputElement)?.value.trim() || '',
      body: (form.elements.namedItem(`translationBody-${lang}`) as HTMLTextAreaElement)?.value.trim() || '',
      seoTitle: (form.elements.namedItem(`translationSeoTitle-${lang}`) as HTMLInputElement)?.value.trim() || '',
      seoDescription:
        (form.elements.namedItem(`translationSeoDescription-${lang}`) as HTMLTextAreaElement)?.value.trim() ||
        '',
    };
    translationDrafts.set(lang, fromDom);
    return fromDom;
  }
  return (
    translationDrafts.get(lang) ?? {
      lang,
      title: '',
      body: '',
      seoTitle: '',
      seoDescription: '',
    }
  );
}

function setTranslationFields(
  lang: Lang,
  data: { title: string; body: string; seoTitle?: string; seoDescription?: string },
) {
  translationDrafts.set(lang, {
    lang,
    title: data.title,
    body: data.body,
    seoTitle: data.seoTitle ?? '',
    seoDescription: data.seoDescription ?? '',
  });

  if (!translationsVisible) return;

  const titleEl = form.elements.namedItem(`translationTitle-${lang}`) as HTMLInputElement | null;
  const bodyEl = form.elements.namedItem(`translationBody-${lang}`) as HTMLTextAreaElement | null;
  const seoTitleEl = form.elements.namedItem(`translationSeoTitle-${lang}`) as HTMLInputElement | null;
  const seoDescEl = form.elements.namedItem(
    `translationSeoDescription-${lang}`,
  ) as HTMLTextAreaElement | null;
  if (titleEl) titleEl.value = data.title;
  if (bodyEl) bodyEl.value = data.body;
  if (seoTitleEl) seoTitleEl.value = data.seoTitle ?? '';
  if (seoDescEl) seoDescEl.value = data.seoDescription ?? '';
}

function setTranslationsVisible(visible: boolean) {
  translationsVisible = visible;
  translationsRoot.classList.toggle('hidden', !visible);
  toggleTranslationsBtn.textContent = visible ? 'Hide translation editors' : 'Show translation editors';
  if (visible) {
    buildTranslationPanels();
    for (const lang of TARGET_LANGS) {
      const draft = translationDrafts.get(lang);
      if (draft) {
        const titleEl = form.elements.namedItem(`translationTitle-${lang}`) as HTMLInputElement;
        const bodyEl = form.elements.namedItem(`translationBody-${lang}`) as HTMLTextAreaElement;
        const seoTitleEl = form.elements.namedItem(`translationSeoTitle-${lang}`) as HTMLInputElement;
        const seoDescEl = form.elements.namedItem(
          `translationSeoDescription-${lang}`,
        ) as HTMLTextAreaElement;
        titleEl.value = draft.title;
        bodyEl.value = draft.body;
        seoTitleEl.value = draft.seoTitle;
        seoDescEl.value = draft.seoDescription;
      }
    }
  }
}

function buildTranslationPanels() {
  translationsRoot.innerHTML = TARGET_LANGS.map(
    (lang) => `
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
  `,
  ).join('');
}

function syncBaseSlugFromTitle() {
  if (baseSlugManual) return;
  baseSlugInput.value = slugify(titleInput.value);
}

function syncPrimarySlugPreview() {
  const preview = document.getElementById('primary-slug-preview');
  if (!preview) return;
  const base = baseSlugInput.value.trim() || slugify(titleInput.value) || 'your-post-slug';
  preview.textContent = canonicalPathForLang(base, 'en', getContentKind());
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
  const englishFile =
    english.title || english.body ? buildMarkdown(english, shared.translationGroup, shared) : null;

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
    message: englishFile ? englishFile.path : 'English source',
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

function renderGalleries() {
  if (!galleries.length) {
    galleriesRoot.innerHTML =
      '<p class="hint">No galleries yet. Drop images above to create one, or add an empty gallery.</p>';
    return;
  }

  galleriesRoot.innerHTML = galleries
    .map((gallery, gIndex) => {
      const imagesHtml = gallery.images
        .map(
          (image, iIndex) => `
        <div
          class="gallery-image-row"
          data-g="${gIndex}"
          data-i="${iIndex}"
        >
          <div class="gallery-drag-handle" draggable="true" title="Drag to reorder">⋮⋮</div>
          <img src="${escapeAttr(image.src)}" alt="" />
          <div class="gallery-image-fields">
            <label>Alt text (required)
              <input class="g-alt" type="text" value="${escapeAttr(image.alt)}" placeholder="Describe the image for SEO" />
            </label>
            <label>Caption
              <input class="g-caption" type="text" value="${escapeAttr(image.caption ?? '')}" placeholder="Optional" />
            </label>
            <p class="hint"><code>${escapeHtml(image.src)}</code></p>
          </div>
          <div class="gallery-image-actions">
            <button type="button" class="g-img-up" ${iIndex === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="g-img-down" ${iIndex === gallery.images.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" class="danger g-img-remove">Remove</button>
          </div>
        </div>
      `,
        )
        .join('');

      return `
        <article class="gallery-editor" data-index="${gIndex}">
          <div class="gallery-editor-head">
            <span class="gallery-drag-handle" draggable="true" title="Drag gallery to reorder">⋮⋮</span>
            <label>Gallery id
              <input class="g-id" type="text" value="${escapeAttr(gallery.id)}" />
            </label>
            <label>Title
              <input class="g-title" type="text" value="${escapeAttr(gallery.title ?? '')}" />
            </label>
            <label>Position
              <select class="g-position">
                <option value="after-hero"${gallery.position === 'after-hero' ? ' selected' : ''}>After hero</option>
                <option value="in-body"${gallery.position === 'in-body' ? ' selected' : ''}>In body (marker)</option>
                <option value="after-body"${gallery.position === 'after-body' ? ' selected' : ''}>After body</option>
              </select>
            </label>
            <button type="button" class="btn-secondary g-insert-marker">Insert marker</button>
            <button type="button" class="gallery-remove danger">Delete gallery</button>
          </div>
          <div
            class="dropzone gallery-dropzone"
            data-gallery-index="${gIndex}"
            tabindex="0"
            role="button"
            aria-label="Drop gallery images"
          >
            <p><strong>Drop images</strong> or click to upload into this gallery</p>
            <p class="hint">Compressed to WebP (max 1920px) into the media folder for this ${getContentKind()}.</p>
            <input type="file" accept="image/*" multiple hidden class="gallery-file" />
          </div>
          <div class="gallery-images">${imagesHtml || '<p class="hint">No images yet — drop files above.</p>'}</div>
        </article>
      `;
    })
    .join('');

  wireGalleryEditors();
}

function wireGalleryEditors() {
  galleriesRoot.querySelectorAll<HTMLElement>('.gallery-editor').forEach((editor) => {
    const gIndex = Number(editor.dataset.index);
    const gallery = galleries[gIndex];
    if (!gallery) return;

    const handle = editor.querySelector<HTMLElement>('.gallery-editor-head .gallery-drag-handle');
    handle?.addEventListener('dragstart', (e) => {
      e.dataTransfer?.setData('text/plain', `gallery:${gIndex}`);
      e.dataTransfer!.effectAllowed = 'move';
      editor.classList.add('is-dragging');
    });
    handle?.addEventListener('dragend', () => editor.classList.remove('is-dragging'));
    editor.addEventListener('dragover', (e) => {
      const types = [...(e.dataTransfer?.types ?? [])];
      if (!types.includes('text/plain') && !types.includes('Text')) return;
      e.preventDefault();
      editor.classList.add('is-drop-target');
    });
    editor.addEventListener('dragleave', () => editor.classList.remove('is-drop-target'));
    editor.addEventListener('drop', (e) => {
      editor.classList.remove('is-drop-target');
      const raw = e.dataTransfer?.getData('text/plain') || '';
      if (!raw.startsWith('gallery:')) return;
      e.preventDefault();
      e.stopPropagation();
      const from = Number(raw.slice('gallery:'.length));
      if (Number.isNaN(from) || from === gIndex) return;
      const [item] = galleries.splice(from, 1);
      galleries.splice(gIndex, 0, item);
      renderGalleries();
      regeneratePreview();
      scheduleAutosave();
    });

    editor.querySelector<HTMLInputElement>('.g-id')?.addEventListener('change', (e) => {
      gallery.id = slugify((e.target as HTMLInputElement).value) || gallery.id;
      regeneratePreview();
      scheduleAutosave();
    });
    editor.querySelector<HTMLInputElement>('.g-title')?.addEventListener('change', (e) => {
      gallery.title = (e.target as HTMLInputElement).value.trim() || undefined;
      regeneratePreview();
      scheduleAutosave();
    });
    editor.querySelector<HTMLSelectElement>('.g-position')?.addEventListener('change', (e) => {
      gallery.position = (e.target as HTMLSelectElement).value as GalleryPosition;
      regeneratePreview();
      scheduleAutosave();
    });
    editor.querySelector('.g-insert-marker')?.addEventListener('click', () => {
      insertGalleryMarker(gallery.id);
      gallery.position = 'in-body';
      renderGalleries();
      regeneratePreview();
      scheduleAutosave();
    });
    editor.querySelector('.gallery-remove')?.addEventListener('click', () => {
      galleries.splice(gIndex, 1);
      renderGalleries();
      regeneratePreview();
      scheduleAutosave();
    });

    const dropzone = editor.querySelector<HTMLElement>('.gallery-dropzone');
    const fileInput = editor.querySelector<HTMLInputElement>('.gallery-file');
    if (dropzone && fileInput) {
      setupDropzone(dropzone, fileInput, async (files) => {
        galleryUploadStatus.textContent = `Uploading ${files.length} image(s)…`;
        const paths = await uploadImages(files);
        for (const src of paths) {
          gallery.images.push({ src, alt: '', caption: '' });
        }
        galleryUploadStatus.textContent = `Added ${paths.length} image(s) to ${gallery.id}`;
        renderGalleries();
        regeneratePreview();
        scheduleAutosave();
      });
    }

    editor.querySelectorAll<HTMLElement>('.gallery-image-row').forEach((row) => {
      const iIndex = Number(row.dataset.i);
      const image = gallery.images[iIndex];
      if (!image) return;

      const imgHandle = row.querySelector<HTMLElement>('.gallery-drag-handle');
      imgHandle?.addEventListener('dragstart', (e) => {
        dragImageFrom = { g: gIndex, i: iIndex };
        e.dataTransfer?.setData('text/plain', `image:${gIndex}:${iIndex}`);
        e.dataTransfer!.effectAllowed = 'move';
        row.classList.add('is-dragging');
        e.stopPropagation();
      });
      imgHandle?.addEventListener('dragend', () => {
        row.classList.remove('is-dragging');
        dragImageFrom = null;
      });
      row.addEventListener('dragover', (e) => {
        const types = [...(e.dataTransfer?.types ?? [])];
        if (!types.includes('text/plain') && !types.includes('Text')) return;
        const rawPeek = e.dataTransfer?.getData('text/plain');
        // getData may be empty during dragover in some browsers — still allow
        e.preventDefault();
        e.stopPropagation();
        row.classList.add('is-drop-target');
        void rawPeek;
      });
      row.addEventListener('dragleave', () => row.classList.remove('is-drop-target'));
      row.addEventListener('drop', (e) => {
        row.classList.remove('is-drop-target');
        const raw = e.dataTransfer?.getData('text/plain') || '';
        if (!raw.startsWith('image:')) return;
        e.preventDefault();
        e.stopPropagation();
        const [, fromGRaw, fromIRaw] = raw.split(':');
        const fromG = Number(fromGRaw);
        const fromI = Number(fromIRaw);
        if (fromG !== gIndex || fromI === iIndex) return;
        const [item] = gallery.images.splice(fromI, 1);
        gallery.images.splice(iIndex, 0, item);
        renderGalleries();
        regeneratePreview();
        scheduleAutosave();
      });

      row.querySelector<HTMLInputElement>('.g-alt')?.addEventListener('change', (e) => {
        image.alt = (e.target as HTMLInputElement).value.trim();
        regeneratePreview();
        scheduleAutosave();
      });
      row.querySelector<HTMLInputElement>('.g-caption')?.addEventListener('change', (e) => {
        image.caption = (e.target as HTMLInputElement).value.trim() || undefined;
        regeneratePreview();
        scheduleAutosave();
      });
      row.querySelector('.g-img-up')?.addEventListener('click', () => {
        if (iIndex <= 0) return;
        const [item] = gallery.images.splice(iIndex, 1);
        gallery.images.splice(iIndex - 1, 0, item);
        renderGalleries();
        regeneratePreview();
        scheduleAutosave();
      });
      row.querySelector('.g-img-down')?.addEventListener('click', () => {
        if (iIndex >= gallery.images.length - 1) return;
        const [item] = gallery.images.splice(iIndex, 1);
        gallery.images.splice(iIndex + 1, 0, item);
        renderGalleries();
        regeneratePreview();
        scheduleAutosave();
      });
      row.querySelector('.g-img-remove')?.addEventListener('click', () => {
        gallery.images.splice(iIndex, 1);
        renderGalleries();
        regeneratePreview();
        scheduleAutosave();
      });
    });
  });
}

async function createGalleryFromFiles(files: File[]) {
  galleryUploadStatus.textContent = `Uploading & compressing ${files.length} image(s)…`;
  const paths = await uploadImages(files);
  const id = `gallery-${galleries.length + 1}`;
  galleries.push({
    id,
    title: '',
    position: 'after-hero',
    images: paths.map((src) => ({ src, alt: '', caption: '' })),
  });
  galleryUploadStatus.textContent = `Created ${id} with ${paths.length} image(s). Add alt text for SEO, then Translate & save.`;
  renderGalleries();
  regeneratePreview();
  scheduleAutosave();
}

function insertGalleryMarker(id: string) {
  richEditor.insertGalleryMarker(id);
  syncBodyFromEditor();
  regeneratePreview();
}

function addGallery() {
  const id = `gallery-${galleries.length + 1}`;
  galleries.push({
    id,
    title: '',
    position: 'after-hero',
    images: [] as GalleryImage[],
  });
  renderGalleries();
  regeneratePreview();
}

async function uploadImages(files: File[]): Promise<string[]> {
  const slug = baseSlugInput.value.trim() || slugify(titleInput.value.trim()) || 'untitled';
  const body = new FormData();
  body.append('kind', getContentKind());
  body.append('slug', slug);
  for (const file of files) body.append('images', file);

  const res = await fetch('/api/upload-images', { method: 'POST', body });
  const data = (await res.json()) as { ok: boolean; paths?: string[]; error?: string };
  if (!res.ok || !data.ok || !data.paths?.length) {
    throw new Error(data.error || 'Image upload failed');
  }
  return data.paths;
}

function setupDropzone(
  dropzone: HTMLElement,
  fileInput: HTMLInputElement,
  onFiles: (files: File[]) => Promise<void>,
) {
  const handleFiles = async (fileList: FileList | null) => {
    const files = [...(fileList ?? [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    try {
      await onFiles(files);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      targetPath.textContent = message;
      galleryUploadStatus.textContent = message;
    }
  };

  dropzone.addEventListener('click', (e) => {
    // Don't open file picker when clicking nested controls
    if ((e.target as HTMLElement).closest('button, input:not([type="file"])')) return;
    fileInput.click();
  });
  fileInput.addEventListener('change', () => {
    void handleFiles(fileInput.files);
    fileInput.value = '';
  });
  dropzone.addEventListener('dragover', (e) => {
    if (![...(e.dataTransfer?.types ?? [])].includes('Files')) return;
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('is-dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
  dropzone.addEventListener('drop', (e) => {
    if (![...(e.dataTransfer?.types ?? [])].includes('Files')) return;
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('is-dragover');
    void handleFiles(e.dataTransfer?.files ?? null);
  });
}

async function validateBeforeSave(): Promise<{
  english: PostDraft;
  shared: ReturnType<typeof sharedMeta>;
} | null> {
  const english = readEnglishDraft();
  if (!english.title || !english.body) {
    targetPath.textContent = 'Add an English title and HTML body first.';
    return null;
  }

  const shared = sharedMeta();
  if (!shared.featuredImage) {
    targetPath.textContent = 'Add a featured image (hero) before publishing.';
    featuredImageInput.focus();
    return null;
  }

  for (const gallery of shared.galleries ?? []) {
    for (const image of gallery.images) {
      if (!image.alt.trim()) {
        targetPath.textContent = `Gallery "${gallery.id}" has an image missing alt text (required for SEO).`;
        return null;
      }
    }
  }

  return { english, shared };
}

async function persistFiles(
  files: GeneratedFile[],
  statusNote: string,
  translationGroup: string,
): Promise<void> {
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
  const saveData = (await saveRes.json()) as { ok: boolean; saved?: string[]; error?: string };
  if (!saveRes.ok || !saveData.ok) throw new Error(saveData.error || 'Save failed');

  for (const path of saveData.saved ?? []) {
    const lang = LANGS.find(
      (code) => path.includes(`/posts/${code}/`) || path.includes(`/destinations/${code}/`),
    );
    if (lang) setProgress(lang, 'saved', `Saved · ${path}`);
  }

  editingGroup = translationGroup;
  targetPath.textContent = `${statusNote}\n${(saveData.saved ?? files.map((f) => f.path)).join('\n')}`;
}

async function saveEnglishOnly() {
  const validated = await validateBeforeSave();
  if (!validated) return;
  const { english, shared } = validated;

  const saveBtn = document.getElementById('save-english') as HTMLButtonElement;
  const translateBtn = document.getElementById('save-all') as HTMLButtonElement;
  saveBtn.disabled = true;
  translateBtn.disabled = true;
  saveBtn.textContent = 'Saving…';

  try {
    setProgress('en', 'ready', 'English source ready');
    for (const lang of TARGET_LANGS) {
      setProgress(lang, 'disabled', 'Skipped — English only save');
    }
    const file = buildMarkdown(english, shared.translationGroup, shared);
    await persistFiles([file], 'Saved English only (other languages unchanged):', shared.translationGroup);
  } catch (err) {
    targetPath.textContent = err instanceof Error ? err.message : 'Save failed';
    setProgress('en', 'error', targetPath.textContent);
  } finally {
    saveBtn.disabled = false;
    translateBtn.disabled = false;
    saveBtn.textContent = 'Save English only';
    regeneratePreview();
  }
}

async function translateAndSaveAll() {
  const validated = await validateBeforeSave();
  if (!validated) return;
  const { english, shared } = validated;

  const saveBtn = document.getElementById('save-all') as HTMLButtonElement;
  const englishBtn = document.getElementById('save-english') as HTMLButtonElement;
  saveBtn.disabled = true;
  englishBtn.disabled = true;
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
    const translateData = (await translateRes.json()) as {
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

    const drafts = TARGET_LANGS.map((lang) => readTranslationDraft(lang));
    const files = buildAllMarkdown(english, drafts, shared);
    await persistFiles(files, `Saved ${files.length} language files:`, shared.translationGroup);
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
    englishBtn.disabled = false;
    saveBtn.textContent = 'Translate & save all';
    regeneratePreview();
  }
}

function resetWriter(kind: ContentKind = getContentKind()) {
  autosavePaused = true;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  editingGroup = null;
  form.reset();
  setContentKind(kind);
  dateInput.value = new Date().toISOString().slice(0, 10);
  draftCheckbox.checked = true; // New posts and destinations start as drafts
  baseSlugManual = false;
  bodyInput.value = '';
  setBodyHtml('');
  galleries = [];
  translationDrafts.clear();
  setTranslationsVisible(false);
  renderGalleries();
  targetPath.textContent = 'Saved files will appear here.';
  heroUploadStatus.textContent = '';
  galleryUploadStatus.textContent = '';
  lastUndoSnapshot = null;
  lastAutosavedJson = '';
  updateUndoButton();
  setAutosaveStatus('Autosave on');
  regeneratePreview();
  autosavePaused = false;
}

async function loadGroupIntoEditor(translationGroup: string, kind: ContentKind) {
  autosavePaused = true;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  const endpoint =
    kind === 'destination'
      ? `/api/destination-groups/${encodeURIComponent(translationGroup)}`
      : `/api/post-groups/${encodeURIComponent(translationGroup)}`;
  const res = await fetch(endpoint);
  const data = (await res.json()) as {
    ok: boolean;
    posts?: LoadedPost[];
    error?: string;
  };
  if (!res.ok || !data.ok || !data.posts?.length) {
    autosavePaused = false;
    throw new Error(data.error || 'Could not load group');
  }

  editingGroup = translationGroup;
  setContentKind(kind);
  const english = data.posts.find((p) => p.lang === 'en') ?? data.posts[0];

  titleInput.value = english.title;
  baseSlugInput.value = english.translationGroup;
  baseSlugManual = true;
  dateInput.value = english.publishedAt || new Date().toISOString().slice(0, 10);
  featuredImageInput.value = english.featuredImage ?? '';
  draftCheckbox.checked = english.draft === true;
  (form.elements.namedItem('seoTitle') as HTMLInputElement).value = english.seoTitle ?? '';
  (form.elements.namedItem('seoDescription') as HTMLTextAreaElement).value = english.seoDescription ?? '';
  setBodyHtml(english.body);
  galleries = Array.isArray(english.galleries) ? structuredClone(english.galleries) : [];
  translationDrafts.clear();
  for (const lang of TARGET_LANGS) {
    const post = data.posts.find((p) => p.lang === lang);
    setTranslationFields(lang, {
      title: post?.title ?? '',
      body: post?.body ?? '',
      seoTitle: post?.seoTitle ?? '',
      seoDescription: post?.seoDescription ?? '',
    });
  }
  // Keep translation editors hidden — write English, use Translate & save for the rest.
  setTranslationsVisible(false);
  renderGalleries();

  showView('write');
  regeneratePreview();
  const baseline = captureSnapshot();
  lastAutosavedJson = JSON.stringify({ ...baseline, savedAt: undefined });
  lastUndoSnapshot = null;
  updateUndoButton();
  setAutosaveStatus('Loaded — autosave armed');
  targetPath.textContent = `Editing ${kind}: ${translationGroup}`;
  autosavePaused = false;
}

const libraryCache = new Map<ContentKind, PostGroupSummary[]>();
const librarySearchInput = document.getElementById('library-search') as HTMLInputElement | null;
const librarySearchMeta = document.getElementById('library-search-meta');
const destinationsSearchInput = document.getElementById('destinations-search') as HTMLInputElement | null;
const destinationsSearchMeta = document.getElementById('destinations-search-meta');

async function loadLibraryList(
  listEl: HTMLElement,
  apiPath: string,
  kind: ContentKind,
  emptyMessage: string,
  searchInput: HTMLInputElement | null = kind === 'destination' ? destinationsSearchInput : librarySearchInput,
  searchMeta: HTMLElement | null = kind === 'destination' ? destinationsSearchMeta : librarySearchMeta,
) {
  listEl.innerHTML = '<p class="hint">Loading…</p>';
  if (searchMeta) searchMeta.textContent = '';
  const res = await fetch(apiPath);
  const data = (await res.json()) as { ok: boolean; groups?: PostGroupSummary[]; error?: string };
  if (!res.ok || !data.ok || !data.groups) {
    listEl.innerHTML = `<p class="hint">${data.error || 'Could not load library.'}</p>`;
    return;
  }

  const groups = data.groups;
  libraryCache.set(kind, groups);

  const renderFiltered = () => {
    const query = (searchInput?.value ?? '').trim().toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    const filtered = tokens.length
      ? groups.filter((group) => {
          const haystack =
            group.searchText ||
            `${group.baseTitle} ${group.translationGroup}`.toLowerCase();
          return tokens.every((token) => haystack.includes(token));
        })
      : groups;

    if (searchMeta) {
      if (!groups.length) {
        searchMeta.textContent = '';
      } else if (tokens.length) {
        searchMeta.textContent = `Showing ${filtered.length} of ${groups.length}`;
      } else {
        searchMeta.textContent = `${groups.length} total · newest updates first`;
      }
    }

    if (!groups.length) {
      listEl.innerHTML = `<p class="hint">${emptyMessage}</p>`;
      return;
    }

    if (!filtered.length) {
      listEl.innerHTML = `<p class="hint">No matches for “${escapeHtml(searchInput?.value.trim() || '')}”.</p>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((group) => {
        const chips = group.translations
          .map((t) => {
            const state = t.exists ? 'exists' : 'missing';
            const label = t.exists ? LANG_LABELS[t.lang] : `${LANG_LABELS[t.lang]} · missing`;
            return `<span class="lang-chip ${state}" title="${t.path}">${label}</span>`;
          })
          .join('');
        const updatedLabel = group.updatedAt ? `Updated ${formatWhen(group.updatedAt)}` : 'Updated —';
        const publishedLabel = group.publishedAt ? `Published ${escapeHtml(group.publishedAt)}` : '';

        return `
        <article class="library-card${group.draft ? ' is-draft' : ''}">
          <div class="library-card-head">
            <div>
              <h3>${escapeHtml(group.baseTitle || group.translationGroup)}${
                group.draft ? ' <span class="draft-badge">Draft</span>' : ''
              }</h3>
              <p class="library-meta">${updatedLabel} · ${publishedLabel} · <code>${escapeHtml(group.translationGroup)}</code></p>
            </div>
            <button type="button" class="btn-secondary edit-group" data-group="${escapeAttr(group.translationGroup)}" data-kind="${kind}">Edit group</button>
          </div>
          <div class="lang-chip-row">${chips}</div>
        </article>
      `;
      })
      .join('');

    listEl.querySelectorAll<HTMLButtonElement>('.edit-group').forEach((btn) => {
      btn.addEventListener('click', () => {
        void loadGroupIntoEditor(btn.dataset.group!, btn.dataset.kind as ContentKind);
      });
    });
  };

  if (searchInput) {
    searchInput.oninput = () => renderFiltered();
  }
  renderFiltered();
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return 'never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function renderDashboardStats(stats: {
  posts: {
    groupCount: number;
    latestTitle: string | null;
    latestPublishedAt: string | null;
    incompleteGroups: number;
    missingTranslations: number;
    incompleteTitles: string[];
  };
  destinations: {
    groupCount: number;
    latestTitle: string | null;
    latestPublishedAt: string | null;
    incompleteGroups: number;
    missingTranslations: number;
    incompleteTitles: string[];
  };
  instagram: { count: number; updatedAt: string | null; homepageSlotsFilled: number };
  todos: { total: number; open: number; updatedAt: string | null };
  generatedAt: string;
}) {
  const postIncomplete =
    stats.posts.incompleteGroups > 0
      ? `<p class="stat-alert">${stats.posts.incompleteGroups} groups missing languages (${stats.posts.missingTranslations} files)</p>`
      : `<p class="stat-ok">All post groups have every language</p>`;
  const destIncomplete =
    stats.destinations.incompleteGroups > 0
      ? `<p class="stat-alert">${stats.destinations.incompleteGroups} destinations missing languages (${stats.destinations.missingTranslations} files)</p>`
      : `<p class="stat-ok">All destinations have every language</p>`;

  dashboardStats.innerHTML = `
    <article class="stat-card">
      <h3>Blog posts</h3>
      <p class="stat-number">${stats.posts.groupCount}</p>
      <p class="stat-detail">Last: <strong>${escapeHtml(stats.posts.latestTitle || '—')}</strong></p>
      <p class="stat-detail">Published ${escapeHtml(stats.posts.latestPublishedAt || '—')}</p>
      ${postIncomplete}
    </article>
    <article class="stat-card">
      <h3>Destinations</h3>
      <p class="stat-number">${stats.destinations.groupCount}</p>
      <p class="stat-detail">Last: <strong>${escapeHtml(stats.destinations.latestTitle || '—')}</strong></p>
      <p class="stat-detail">Published ${escapeHtml(stats.destinations.latestPublishedAt || '—')}</p>
      ${destIncomplete}
    </article>
    <article class="stat-card">
      <h3>Instagram</h3>
      <p class="stat-number">${stats.instagram.count}</p>
      <p class="stat-detail">Homepage shows ${stats.instagram.homepageSlotsFilled}/9</p>
      <p class="stat-detail">Feed updated ${escapeHtml(formatWhen(stats.instagram.updatedAt))}</p>
      ${
        stats.instagram.count < 9
          ? `<p class="stat-alert">Add ${9 - stats.instagram.count} more for a full homepage grid</p>`
          : `<p class="stat-ok">Homepage grid is full</p>`
      }
    </article>
    <article class="stat-card">
      <h3>Checklist</h3>
      <p class="stat-number">${stats.todos.open}</p>
      <p class="stat-detail">${stats.todos.open} open · ${stats.todos.total} total</p>
      <p class="stat-detail">Saved ${escapeHtml(formatWhen(stats.todos.updatedAt))}</p>
      <p class="stat-detail muted">Stats refreshed ${escapeHtml(formatWhen(stats.generatedAt))}</p>
    </article>
  `;
}

async function loadDashboardStats() {
  dashboardStats.innerHTML = '<p class="hint">Loading stats…</p>';
  const res = await fetch('/api/dashboard-stats');
  const data = (await res.json()) as {
    ok: boolean;
    stats?: Parameters<typeof renderDashboardStats>[0];
    error?: string;
  };
  if (!res.ok || !data.ok || !data.stats) {
    dashboardStats.innerHTML = `<p class="hint">${escapeHtml(data.error || 'Could not load stats.')}</p>`;
    return;
  }
  renderDashboardStats(data.stats);
}

async function loadSitemapMeta() {
  const statusEl = document.getElementById('sitemap-status');
  if (!statusEl) return;
  statusEl.textContent = 'Loading sitemap info…';
  try {
    const res = await fetch('/api/sitemap-meta');
    const data = (await res.json()) as {
      ok: boolean;
      urlCount?: number;
      generatedAt?: string;
      liveSitemapUrl?: string;
      error?: string;
    };
    if (!res.ok || !data.ok) {
      statusEl.textContent = data.error || 'Could not load sitemap info.';
      return;
    }
    statusEl.textContent = `${data.urlCount ?? 0} public URLs · generated ${formatWhen(data.generatedAt)} · drafts excluded`;
  } catch (err) {
    statusEl.textContent = err instanceof Error ? err.message : 'Could not load sitemap info.';
  }
}

async function downloadSitemap() {
  const statusEl = document.getElementById('sitemap-status');
  const btn = document.getElementById('download-sitemap') as HTMLButtonElement | null;
  if (btn) btn.disabled = true;
  try {
    const res = await fetch('/api/sitemap.xml');
    if (!res.ok) throw new Error(`Sitemap download failed (${res.status})`);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'intolibya-sitemap.xml';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
    if (statusEl) {
      statusEl.textContent = `Downloaded intolibya-sitemap.xml · ${formatWhen(new Date().toISOString())}`;
    }
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = err instanceof Error ? err.message : 'Download failed.';
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function renderTodos() {
  if (!writerTodos.length) {
    todoList.innerHTML = '<li class="hint">No tasks yet. Add one below.</li>';
    return;
  }
  todoList.innerHTML = writerTodos
    .map(
      (item, index) => `
      <li class="todo-item${item.done ? ' is-done' : ''}" data-index="${index}">
        <label>
          <input type="checkbox" class="todo-check" ${item.done ? 'checked' : ''} />
          <span>${escapeHtml(item.text)}</span>
        </label>
        <button type="button" class="danger todo-remove">Remove</button>
      </li>
    `,
    )
    .join('');

  todoList.querySelectorAll<HTMLLIElement>('.todo-item').forEach((row) => {
    const index = Number(row.dataset.index);
    row.querySelector<HTMLInputElement>('.todo-check')?.addEventListener('change', (e) => {
      writerTodos[index].done = (e.target as HTMLInputElement).checked;
      writerTodosDirty = true;
      renderTodos();
      todoStatus.textContent = 'Unsaved changes — click Save checklist.';
    });
    row.querySelector('.todo-remove')?.addEventListener('click', () => {
      writerTodos.splice(index, 1);
      writerTodosDirty = true;
      renderTodos();
      todoStatus.textContent = 'Unsaved changes — click Save checklist.';
    });
  });
}

async function loadTodos() {
  todoStatus.textContent = 'Loading checklist…';
  const res = await fetch('/api/writer-todos');
  const data = (await res.json()) as {
    ok: boolean;
    todos?: { updatedAt: string | null; items: WriterTodoItem[] };
    error?: string;
  };
  if (!res.ok || !data.ok || !data.todos) {
    todoStatus.textContent = data.error || 'Could not load checklist.';
    return;
  }
  writerTodos = [...data.todos.items];
  writerTodosDirty = false;
  renderTodos();
  todoStatus.textContent = data.todos.updatedAt
    ? `Last saved ${formatWhen(data.todos.updatedAt)}`
    : 'Checklist not saved yet.';
}

async function saveTodos() {
  const saveBtn = document.getElementById('save-todos') as HTMLButtonElement;
  saveBtn.disabled = true;
  todoStatus.textContent = 'Saving…';
  try {
    const res = await fetch('/api/writer-todos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: writerTodos }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      todos?: { updatedAt: string; items: WriterTodoItem[] };
      error?: string;
    };
    if (!res.ok || !data.ok || !data.todos) throw new Error(data.error || 'Save failed');
    writerTodos = [...data.todos.items];
    writerTodosDirty = false;
    renderTodos();
    todoStatus.textContent = `Saved ${formatWhen(data.todos.updatedAt)}`;
    void loadDashboardStats();
  } catch (err) {
    todoStatus.textContent = err instanceof Error ? err.message : 'Save failed';
  } finally {
    saveBtn.disabled = false;
  }
}

function showView(view: WriterView) {
  viewDashboard.classList.toggle('hidden', view !== 'dashboard');
  viewWrite.classList.toggle('hidden', view !== 'write');
  viewLibrary.classList.toggle('hidden', view !== 'library');
  viewDestinations.classList.toggle('hidden', view !== 'destinations');
  viewInstagram.classList.toggle('hidden', view !== 'instagram');
  document.querySelectorAll<HTMLButtonElement>('.nav-link').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.view === view);
  });
  if (view === 'library') {
    void loadLibraryList(
      libraryList,
      '/api/post-groups',
      'post',
      'No posts found in src/content/posts yet.',
    );
  }
  if (view === 'destinations') {
    void loadLibraryList(
      destinationsList,
      '/api/destination-groups',
      'destination',
      'No destinations yet. Create one or run the migration script.',
    );
  }
  if (view === 'instagram') void loadInstagramFeed();
  if (view === 'dashboard') {
    createChooser.classList.add('hidden');
    void loadDashboardStats();
    void loadTodos();
    void loadSitemapMeta();
  }
  location.hash = view === 'dashboard' ? '' : `#${view}`;
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
    .map(
      (item, index) => `
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
    `,
    )
    .join('');

  instagramList.querySelectorAll<HTMLElement>('.instagram-card').forEach((card) => {
    const index = Number(card.dataset.index);
    const titleEl = card.querySelector<HTMLInputElement>('.ig-title');
    const urlInput = card.querySelector<HTMLInputElement>('.ig-url');
    const kindSelect = card.querySelector<HTMLSelectElement>('.ig-kind');

    titleEl?.addEventListener('change', () => {
      instagramItems[index].title = titleEl.value.trim() || instagramItems[index].title;
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
  const when = instagramUpdatedAt ? new Date(instagramUpdatedAt).toLocaleString() : 'never';
  const base = `${instagramItems.length} item(s) · last saved ${when} · homepage shows first 9 (3×3)`;
  instagramStatus.textContent = message ? `${message} ${base}` : base;
}

async function loadInstagramFeed() {
  instagramStatus.textContent = 'Loading feed…';
  const res = await fetch('/api/instagram-feed');
  const data = (await res.json()) as {
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
  const data = (await res.json()) as { ok: boolean; path?: string; error?: string };
  if (!res.ok || !data.ok || !data.path) {
    throw new Error(data.error || 'Image upload failed');
  }
  return data.path;
}

async function fetchOgPreview(
  url: string,
  id?: string,
): Promise<{
  title: string;
  image: string;
  mediaKind: InstagramFeedItem['mediaKind'];
}> {
  const res = await fetch('/api/instagram-og', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, id }),
  });
  const data = (await res.json()) as {
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
    const data = (await res.json()) as {
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
setTranslationsVisible(false);
richEditor = createRichEditor(bodyEditorMount, {
  placeholder: 'Write your post or destination guide…',
  onChange: (html) => {
    bodyInput.value = html;
    regeneratePreview();
    scheduleAutosave();
  },
});
renderGalleries();
regeneratePreview();
updateUndoButton();
setupDropzone(heroDropzone, heroFileInput, async (files) => {
  heroUploadStatus.textContent = 'Uploading & compressing…';
  const paths = await uploadImages(files.slice(0, 1));
  featuredImageInput.value = paths[0];
  heroUploadStatus.textContent = `Hero saved: ${paths[0]}`;
  regeneratePreview();
  scheduleAutosave();
});
setupDropzone(newGalleryDropzone, newGalleryFileInput, async (files) => {
  await createGalleryFromFiles(files);
  scheduleAutosave();
});

toggleTranslationsBtn.addEventListener('click', () => {
  setTranslationsVisible(!translationsVisible);
});

titleInput.addEventListener('input', () => {
  syncBaseSlugFromTitle();
  regeneratePreview();
  scheduleAutosave();
});

baseSlugInput.addEventListener('focus', () => {
  baseSlugManual = true;
});

baseSlugInput.addEventListener('input', () => {
  if (!baseSlugInput.value.trim()) baseSlugManual = false;
  regeneratePreview();
  scheduleAutosave();
});

form.addEventListener('input', () => {
  regeneratePreview();
  scheduleAutosave();
});
form.addEventListener('change', () => {
  regeneratePreview();
  scheduleAutosave();
});
form.addEventListener('submit', (e) => e.preventDefault());

undoAutosaveBtn.addEventListener('click', () => {
  undoAutosave();
});

document.querySelectorAll<HTMLButtonElement>('.nav-link').forEach((btn) => {
  btn.addEventListener('click', () => showView(btn.dataset.view as WriterView));
});

document.querySelectorAll<HTMLButtonElement>('[data-dashboard]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.dashboard;
    if (action === 'create') {
      createChooser.classList.remove('hidden');
      return;
    }
    if (action === 'library' || action === 'destinations' || action === 'instagram') {
      showView(action);
    }
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-create-kind]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const kind = btn.dataset.createKind as ContentKind;
    resetWriter(kind);
    showView('write');
  });
});

document.getElementById('save-all')?.addEventListener('click', () => {
  void translateAndSaveAll();
});
document.getElementById('save-english')?.addEventListener('click', () => {
  void saveEnglishOnly();
});
document.getElementById('refresh-dashboard')?.addEventListener('click', () => {
  void loadDashboardStats();
  void loadTodos();
  void loadSitemapMeta();
});
document.getElementById('download-sitemap')?.addEventListener('click', () => {
  void downloadSitemap();
});
document.getElementById('save-todos')?.addEventListener('click', () => {
  void saveTodos();
});
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = todoForm.elements.namedItem('todoText') as HTMLInputElement;
  const text = input.value.trim();
  if (!text) return;
  writerTodos.unshift({
    id: `todo-${Date.now()}`,
    text: text.slice(0, 240),
    done: false,
    createdAt: new Date().toISOString(),
  });
  writerTodosDirty = true;
  input.value = '';
  renderTodos();
  todoStatus.textContent = 'Unsaved changes — click Save checklist.';
});

document.getElementById('new-post')?.addEventListener('click', () => {
  createChooser.classList.remove('hidden');
  showView('dashboard');
});
document.getElementById('add-gallery')?.addEventListener('click', addGallery);
document.getElementById('refresh-library')?.addEventListener('click', () => {
  void loadLibraryList(libraryList, '/api/post-groups', 'post', 'No posts found.');
});
document.getElementById('refresh-destinations')?.addEventListener('click', () => {
  void loadLibraryList(
    destinationsList,
    '/api/destination-groups',
    'destination',
    'No destinations yet.',
  );
});
document.getElementById('create-post-from-library')?.addEventListener('click', () => {
  resetWriter('post');
  showView('write');
});
document.getElementById('create-destination-from-library')?.addEventListener('click', () => {
  resetWriter('destination');
  showView('write');
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
  const titleValue = String(fd.get('title') ?? '').trim();
  const url = String(fd.get('url') ?? '').trim();
  let mediaKind = String(fd.get('mediaKind') ?? 'reel') as InstagramFeedItem['mediaKind'];
  const idInput = String(fd.get('id') ?? '').trim();
  const imagePath = String(fd.get('imagePath') ?? '').trim();
  const fileInput = instagramForm.elements.namedItem('image') as HTMLInputElement;
  const file = fileInput.files?.[0];
  const id = slugifyId(idInput || titleValue || url);

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
    let title = titleValue;

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

const hash = location.hash.replace('#', '') as WriterView;
if (['write', 'library', 'destinations', 'instagram'].includes(hash)) {
  showView(hash);
} else {
  showView('dashboard');
}
