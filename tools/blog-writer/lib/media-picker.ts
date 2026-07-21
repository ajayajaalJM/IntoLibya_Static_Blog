export interface MediaPickerItem {
  path: string;
  filename: string;
  tags: string[];
  defaultAlt: string;
  credit: string;
  usageEn: number;
  usageGroups: number;
  width: number;
  height: number;
  missingDerivatives: boolean;
  duplicateGroupId: string | null;
  bytes: number;
}

export interface MediaPickerOptions {
  title?: string;
  initialQuery?: string;
  preferredTags?: string[];
  onSelect: (item: MediaPickerItem) => void;
  onCancel?: () => void;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function openMediaPicker(options: MediaPickerOptions): void {
  const existing = document.getElementById('media-picker-overlay');
  existing?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'media-picker-overlay';
  overlay.className = 'media-picker-overlay';
  overlay.innerHTML = `
    <div class="media-picker-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(options.title || 'Choose image')}">
      <header class="media-picker-header">
        <div>
          <h3>${escapeHtml(options.title || 'Choose image')}</h3>
          <p class="hint">Search by path, tags, or alt. Usage counts are English editorial uses.</p>
        </div>
        <button type="button" class="btn-secondary media-picker-close">Close</button>
      </header>
      <div class="media-picker-toolbar">
        <input type="search" class="library-search media-picker-search" placeholder="Search images…" value="${escapeHtml(options.initialQuery || '')}" />
        <div class="media-picker-tag-row" id="media-picker-tags"></div>
        <p class="hint media-picker-meta" id="media-picker-meta">Loading…</p>
      </div>
      <div class="media-picker-grid" id="media-picker-grid"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const searchInput = overlay.querySelector<HTMLInputElement>('.media-picker-search')!;
  const grid = overlay.querySelector<HTMLElement>('#media-picker-grid')!;
  const meta = overlay.querySelector<HTMLElement>('#media-picker-meta')!;
  const tagsRow = overlay.querySelector<HTMLElement>('#media-picker-tags')!;
  let activeTag = '';
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const close = () => {
    overlay.remove();
    options.onCancel?.();
  };

  overlay.querySelector('.media-picker-close')?.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener(
    'keydown',
    function onKey(ev) {
      if (ev.key === 'Escape') {
        document.removeEventListener('keydown', onKey);
        close();
      }
    },
  );

  const preferred = options.preferredTags || [];
  tagsRow.innerHTML = preferred
    .slice(0, 12)
    .map(
      (tag) =>
        `<button type="button" class="media-tag-chip" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`,
    )
    .join('');
  tagsRow.querySelectorAll<HTMLButtonElement>('.media-tag-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTag = activeTag === btn.dataset.tag ? '' : btn.dataset.tag || '';
      tagsRow.querySelectorAll('.media-tag-chip').forEach((b) => {
        b.classList.toggle('is-active', (b as HTMLElement).dataset.tag === activeTag);
      });
      void load();
    });
  });

  async function load() {
    meta.textContent = 'Loading…';
    const params = new URLSearchParams();
    const q = searchInput.value.trim();
    if (q) params.set('q', q);
    if (activeTag) params.set('tag', activeTag);
    params.set('limit', '80');
    try {
      const res = await fetch(`/api/media?${params}`);
      const data = (await res.json()) as {
        ok: boolean;
        items?: MediaPickerItem[];
        total?: number;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.items) {
        meta.textContent = data.error || 'Could not load images.';
        grid.innerHTML = '';
        return;
      }
      meta.textContent = `Showing ${data.items.length} of ${data.total ?? data.items.length}`;
      if (!data.items.length) {
        grid.innerHTML = '<p class="hint">No matches. Try Re-index on the Images tab or clear filters.</p>';
        return;
      }
      grid.innerHTML = data.items
        .map((item) => {
          const dup = item.duplicateGroupId ? '<span class="media-badge">dup</span>' : '';
          const miss = item.missingDerivatives ? '<span class="media-badge warn">no deriv</span>' : '';
          return `
            <button type="button" class="media-picker-card" data-path="${escapeHtml(item.path)}">
              <img src="${escapeHtml(item.path)}" alt="" loading="lazy" />
              <div class="media-picker-card-body">
                <strong title="${escapeHtml(item.path)}">${escapeHtml(item.filename)}</strong>
                <span>${item.usageEn} uses · ${formatBytes(item.bytes)} · ${item.width}×${item.height}</span>
                <span class="media-picker-tags">${escapeHtml(item.tags.slice(0, 4).join(', '))}</span>
                ${dup}${miss}
              </div>
            </button>
          `;
        })
        .join('');

      grid.querySelectorAll<HTMLButtonElement>('.media-picker-card').forEach((card) => {
        card.addEventListener('click', () => {
          const path = card.dataset.path || '';
          const item = data.items!.find((i) => i.path === path);
          if (!item) return;
          options.onSelect(item);
          overlay.remove();
        });
      });
    } catch (err) {
      meta.textContent = err instanceof Error ? err.message : 'Load failed';
    }
  }

  searchInput.addEventListener('input', () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => void load(), 200);
  });

  void load();
  requestAnimationFrame(() => searchInput.focus());
}

export function copyText(value: string): Promise<void> {
  return navigator.clipboard.writeText(value);
}

export function markdownSnippet(path: string, alt: string): string {
  return `![${alt || ''}](${path})`;
}

export function htmlSnippet(path: string, alt: string, width?: number, height?: number): string {
  const w = width ? ` width="${width}"` : '';
  const h = height ? ` height="${height}"` : '';
  return `<img src="${path}" alt="${alt || ''}"${w}${h} loading="lazy" decoding="async" />`;
}
