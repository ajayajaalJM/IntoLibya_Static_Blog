import { DESTINATION_TRANSLATION_GROUPS } from '@lib/destination-schema';
import {
  copyText,
  htmlSnippet,
  markdownSnippet,
  openMediaPicker,
  type MediaPickerItem,
} from './media-picker';

export interface MediaCatalogItem extends MediaPickerItem {
  folder: string;
  notes: string;
  derivativeWidths: number[];
  isPool: boolean;
  duplicateKind?: 'exact' | 'similar' | null;
  usedIn: Array<{
    kind: 'post' | 'destination';
    translationGroup: string;
    title: string;
    role: string;
    occurrenceId?: string;
    alt?: string;
  }>;
}

interface DupMember {
  path: string;
  filename: string;
  width: number;
  height: number;
  bytes: number;
  usageEn: number;
  usageRaw: number;
  defaultAlt: string;
  credit: string;
  tags: string[];
  duplicateKind: 'exact' | 'similar' | null;
  missingDerivatives: boolean;
}

interface DupGroup {
  id: string;
  kind: 'exact' | 'similar';
  memberCount: number;
  suggestedKeeper: string;
  totalUsageRaw: number;
  members: DupMember[];
}

interface ConsolidatePreview {
  previewToken: string;
  groupId: string;
  kind: 'exact' | 'similar';
  keeperPath: string;
  quarantinePaths: string[];
  references: Array<{
    relativePath: string;
    title: string;
    role: string;
    literalSrc: string;
    lang: string;
  }>;
  metadataConflicts: Array<{
    field: string;
    keeperValue: string;
    otherValues: Array<{ path: string; value: string }>;
  }>;
  warnings: string[];
  fillEmptyAlts: boolean;
  reviewedSurvivorPaths?: string[];
}

interface ExactBatchPreview {
  batchToken: string;
  groupCount: number;
  redundantFileCount: number;
  referenceCount: number;
  keepersWithAlt: number;
  keepersMissingAlt: number;
  groups: Array<{
    groupId: string;
    keeperPath: string;
    redundantFileCount: number;
    referenceCount: number;
    bestDefaultAlt: string;
  }>;
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

export function populateDestinationTagButtons(
  root: HTMLElement,
  onToggle: (tag: string) => void,
  selected?: Set<string>,
) {
  root.innerHTML = [...DESTINATION_TRANSLATION_GROUPS]
    .map((tag) => {
      const active = selected?.has(tag) ? ' is-active' : '';
      return `<button type="button" class="destination-tag-btn${active}" data-tag="${tag}">${tag}</button>`;
    })
    .join('');
  root.querySelectorAll<HTMLButtonElement>('.destination-tag-btn').forEach((btn) => {
    btn.addEventListener('click', () => onToggle(btn.dataset.tag || ''));
  });
}

export function renderTagChips(root: HTMLElement, tags: string[], onRemove: (tag: string) => void) {
  root.innerHTML = tags.length
    ? tags
        .map(
          (tag) =>
            `<span class="tag-chip">${escapeHtml(tag)} <button type="button" data-tag="${escapeHtml(tag)}" aria-label="Remove ${escapeHtml(tag)}">×</button></span>`,
        )
        .join('')
    : '<span class="hint">No tags yet — click a destination below.</span>';
  root.querySelectorAll<HTMLButtonElement>('button[data-tag]').forEach((btn) => {
    btn.addEventListener('click', () => onRemove(btn.dataset.tag || ''));
  });
}

export function initImagesTab(options: {
  onOpenEditor: (group: string, kind: 'post' | 'destination') => void;
}): {
  load: (force?: boolean) => Promise<void>;
  selectedPaths: () => string[];
} {
  const grid = document.getElementById('images-grid') as HTMLElement;
  const detail = document.getElementById('images-detail') as HTMLElement;
  const meta = document.getElementById('images-meta') as HTMLElement;
  const search = document.getElementById('images-search') as HTMLInputElement;
  const unused = document.getElementById('images-unused') as HTMLInputElement;
  const includePool = document.getElementById('images-include-pool') as HTMLInputElement;
  const missingAlt = document.getElementById('images-missing-alt') as HTMLInputElement;
  const missingDeriv = document.getElementById('images-missing-deriv') as HTMLInputElement;
  const hasDupes = document.getElementById('images-has-dupes') as HTMLInputElement;
  const dupKind = document.getElementById('images-dup-kind') as HTMLSelectElement | null;
  const tagFilter = document.getElementById('images-tag-filter') as HTMLSelectElement;
  const destButtons = document.getElementById('images-destination-buttons') as HTMLElement;
  const dupesPanel = document.getElementById('images-dupes-panel') as HTMLElement;
  const selected = new Set<string>();
  let items: MediaCatalogItem[] = [];
  let debounce: ReturnType<typeof setTimeout> | null = null;
  let altSaveTimer: ReturnType<typeof setTimeout> | null = null;
  let keeperByGroup = new Map<string, string>();
  let activePreview: ConsolidatePreview | null = null;

  function fillTagFilter(destinations: string[]) {
    const current = tagFilter.value;
    tagFilter.innerHTML =
      `<option value="">All destination tags</option>` +
      destinations.map((d) => `<option value="${d}">${d}</option>`).join('');
    tagFilter.value = current;
  }

  populateDestinationTagButtons(destButtons, (tag) => {
    tagFilter.value = tagFilter.value === tag ? '' : tag;
    void load();
  });

  async function saveDefaultAlt(item: MediaCatalogItem, alt: string, statusEl: HTMLElement) {
    statusEl.textContent = 'Saving default alt…';
    const res = await fetch('/api/media', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: item.path, defaultAlt: alt }),
    });
    const data = (await res.json()) as { ok: boolean; error?: string };
    statusEl.textContent = data.ok ? 'Default alt saved' : data.error || 'Save failed';
    if (data.ok) item.defaultAlt = alt;
  }

  async function load() {
    meta.textContent = 'Loading…';
    const params = new URLSearchParams();
    if (search.value.trim()) params.set('q', search.value.trim());
    if (tagFilter.value) params.set('tag', tagFilter.value);
    if (unused.checked) params.set('unused', '1');
    if (includePool.checked) params.set('includePool', '1');
    if (missingAlt.checked) params.set('missingAlt', '1');
    if (missingDeriv.checked) params.set('missingDerivatives', '1');
    if (hasDupes.checked) params.set('hasDuplicates', '1');
    if (dupKind?.value) {
      params.set('hasDuplicates', '1');
      params.set('duplicateKind', dupKind.value);
    }
    params.set('limit', '200');

    const res = await fetch(`/api/media?${params}`);
    const data = (await res.json()) as {
      ok: boolean;
      items?: MediaCatalogItem[];
      total?: number;
      summary?: {
        total: number;
        unused: number;
        missingAlt: number;
        missingDerivatives: number;
        duplicateGroups: number;
      };
      destinations?: string[];
      error?: string;
    };
    if (!res.ok || !data.ok || !data.items) {
      meta.textContent = data.error || 'Could not load media catalog. Click Re-index.';
      grid.innerHTML = '';
      return;
    }
    if (data.destinations) fillTagFilter(data.destinations);
    items = data.items;
    const s = data.summary;
    meta.textContent = s
      ? `${data.total} shown · ${s.total} indexed · ${s.unused} unused · ${s.missingAlt} missing alt · ${s.missingDerivatives} missing deriv · ${s.duplicateGroups} dup groups`
      : `${data.total} images`;

    grid.innerHTML = items
      .map((item) => {
        const checked = selected.has(item.path) ? 'checked' : '';
        const kindBadge =
          item.duplicateKind === 'exact'
            ? '<span class="media-badge ok">exact</span>'
            : item.duplicateKind === 'similar'
              ? '<span class="media-badge warn">similar</span>'
              : item.duplicateGroupId
                ? '<span class="media-badge">dup</span>'
                : '';
        return `
        <article class="images-card" data-path="${escapeHtml(item.path)}">
          <label class="images-card-check"><input type="checkbox" data-select="${escapeHtml(item.path)}" ${checked} /></label>
          <img src="${escapeHtml(item.path)}" alt="${escapeHtml(item.defaultAlt)}" loading="lazy" />
          <div class="images-card-body">
            <strong title="${escapeHtml(item.path)}">${escapeHtml(item.filename)}</strong>
            <span>${item.usageEn} EN uses · ${formatBytes(item.bytes)}</span>
            <span class="images-card-tags">${escapeHtml(item.tags.slice(0, 5).join(', '))}</span>
            <div class="images-card-badges">
              ${item.missingDerivatives ? '<span class="media-badge warn">no deriv</span>' : '<span class="media-badge ok">deriv</span>'}
              ${kindBadge}
              ${!item.defaultAlt.trim() ? '<span class="media-badge warn">no alt</span>' : ''}
              ${item.isPool ? '<span class="media-badge">pool</span>' : ''}
            </div>
          </div>
        </article>
      `;
      })
      .join('');

    grid.querySelectorAll<HTMLElement>('.images-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).closest('input')) return;
        const path = card.dataset.path || '';
        const item = items.find((i) => i.path === path);
        if (item) showDetail(item);
      });
    });
    grid.querySelectorAll<HTMLInputElement>('input[data-select]').forEach((box) => {
      box.addEventListener('change', () => {
        const p = box.dataset.select || '';
        if (box.checked) selected.add(p);
        else selected.delete(p);
      });
    });
  }

  function showDetail(item: MediaCatalogItem) {
    detail.classList.remove('hidden');
    detail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const used = item.usedIn.length
      ? item.usedIn
          .map((u, idx) => {
            const occ = u.occurrenceId || `${u.role}-${idx}`;
            return `
            <div class="images-usage-row" data-idx="${idx}">
              <div class="images-usage-head">
                <button type="button" class="images-used-btn" data-kind="${u.kind}" data-group="${escapeHtml(u.translationGroup)}">${escapeHtml(u.title)} <em>(${escapeHtml(u.role)})</em></button>
                <span class="hint">${escapeHtml(occ)}</span>
              </div>
              <label class="images-usage-alt">Per-use alt
                <input type="text" data-occ-alt="${idx}" value="${escapeHtml(u.alt || '')}" placeholder="Describe this use on the page" />
              </label>
              <div class="images-usage-actions">
                <button type="button" class="btn-secondary" data-save-occ="${idx}">Save alt</button>
                <button type="button" class="btn-secondary" data-use-default="${idx}">Use library default</button>
              </div>
            </div>`;
          })
          .join('')
      : '<p class="hint">Not used in English content.</p>';

    detail.innerHTML = `
      <div class="images-detail-grid">
        <img src="${escapeHtml(item.path)}" alt="${escapeHtml(item.defaultAlt)}" />
        <div class="images-detail-fields">
          <p><code>${escapeHtml(item.path)}</code></p>
          <div class="actions">
            <button type="button" class="btn-secondary" data-copy="url">Copy URL</button>
            <button type="button" class="btn-secondary" data-copy="md">Copy Markdown</button>
            <button type="button" class="btn-secondary" data-copy="html">Copy HTML</button>
            <button type="button" class="btn-secondary" data-ensure="1">Generate derivatives</button>
          </div>
          <label class="images-alt-primary">Default alt (library)
            <input id="detail-alt" type="text" value="${escapeHtml(item.defaultAlt)}" placeholder="Reusable alt for new inserts" />
          </label>
          <div class="actions">
            <button type="button" class="btn-secondary" id="detail-fill-empty">Fill missing per-use alts</button>
          </div>
          <label>Credit
            <input id="detail-credit" type="text" value="${escapeHtml(item.credit)}" />
          </label>
          <label>Notes
            <textarea id="detail-notes" rows="2">${escapeHtml(item.notes)}</textarea>
          </label>
          <label>Tags (comma-separated)
            <input id="detail-tags" type="text" value="${escapeHtml(item.tags.join(', '))}" />
          </label>
          <div id="detail-dest-tags" class="destination-tag-buttons"></div>
          <button type="button" class="btn-generate" id="detail-save">Save metadata</button>
          <p class="hint" id="detail-status">${item.width}×${item.height} · deriv [${item.derivativeWidths.join(', ') || 'none'}]${item.duplicateGroupId ? ` · ${item.duplicateGroupId}${item.duplicateKind ? ` (${item.duplicateKind})` : ''}` : ''}</p>
          <h4>Used in (edit per-use alt)</h4>
          <div class="images-used-list">${used}</div>
        </div>
      </div>
    `;

    const statusEl = detail.querySelector('#detail-status') as HTMLElement;
    const altInput = detail.querySelector('#detail-alt') as HTMLInputElement;

    const tagSet = new Set(item.tags);
    const refreshDestButtons = () => {
      populateDestinationTagButtons(
        detail.querySelector('#detail-dest-tags') as HTMLElement,
        (tag) => {
          if (tagSet.has(tag)) tagSet.delete(tag);
          else tagSet.add(tag);
          (detail.querySelector('#detail-tags') as HTMLInputElement).value = [...tagSet].join(', ');
          refreshDestButtons();
        },
        tagSet,
      );
    };
    refreshDestButtons();

    altInput.addEventListener('input', () => {
      if (altSaveTimer) clearTimeout(altSaveTimer);
      altSaveTimer = setTimeout(() => {
        void saveDefaultAlt(item, altInput.value, statusEl);
      }, 600);
    });

    detail.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const kind = btn.dataset.copy;
        const alt = altInput.value.trim();
        const text =
          kind === 'md'
            ? markdownSnippet(item.path, alt)
            : kind === 'html'
              ? htmlSnippet(item.path, alt, item.width, item.height)
              : item.path;
        await copyText(text);
        statusEl.textContent = `Copied ${kind}`;
      });
    });

    detail.querySelector('[data-ensure]')?.addEventListener('click', async () => {
      statusEl.textContent = 'Generating derivatives…';
      const res = await fetch('/api/media/ensure-derivatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: [item.path] }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      statusEl.textContent = data.ok ? 'Derivatives updated' : data.error || 'Failed';
      void load();
    });

    detail.querySelector('#detail-fill-empty')?.addEventListener('click', async () => {
      statusEl.textContent = 'Filling empty per-use alts…';
      // Persist default first
      await saveDefaultAlt(item, altInput.value, statusEl);
      const res = await fetch('/api/media/fill-empty-alts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.path }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        updated?: number;
        skipped?: number;
        error?: string;
      };
      statusEl.textContent = data.ok
        ? `Filled ${data.updated ?? 0} empty alts (${data.skipped ?? 0} already set)`
        : data.error || 'Fill failed';
      void load().then(() => {
        const refreshed = items.find((i) => i.path === item.path);
        if (refreshed) showDetail(refreshed);
      });
    });

    detail.querySelector('#detail-save')?.addEventListener('click', async () => {
      statusEl.textContent = 'Saving…';
      const tags = (detail.querySelector('#detail-tags') as HTMLInputElement).value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch('/api/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: item.path,
          tags,
          defaultAlt: altInput.value,
          credit: (detail.querySelector('#detail-credit') as HTMLInputElement).value,
          notes: (detail.querySelector('#detail-notes') as HTMLTextAreaElement).value,
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      statusEl.textContent = data.ok ? 'Saved' : data.error || 'Save failed';
      void load();
    });

    detail.querySelectorAll<HTMLButtonElement>('.images-used-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        options.onOpenEditor(
          btn.dataset.group!,
          (btn.dataset.kind as 'post' | 'destination') || 'post',
        );
      });
    });

    detail.querySelectorAll<HTMLButtonElement>('[data-save-occ]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.saveOcc);
        const usage = item.usedIn[idx];
        if (!usage?.occurrenceId) {
          statusEl.textContent = 'Missing occurrence id — re-index media first.';
          return;
        }
        const input = detail.querySelector(
          `input[data-occ-alt="${idx}"]`,
        ) as HTMLInputElement;
        statusEl.textContent = 'Saving per-use alt…';
        const res = await fetch('/api/media/occurrence-alt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: item.path,
            kind: usage.kind,
            translationGroup: usage.translationGroup,
            occurrenceId: usage.occurrenceId,
            alt: input.value,
          }),
        });
        const data = (await res.json()) as { ok: boolean; error?: string };
        statusEl.textContent = data.ok ? 'Per-use alt saved' : data.error || 'Save failed';
        if (data.ok) usage.alt = input.value.trim();
      });
    });

    detail.querySelectorAll<HTMLButtonElement>('[data-use-default]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.useDefault);
        const input = detail.querySelector(
          `input[data-occ-alt="${idx}"]`,
        ) as HTMLInputElement;
        input.value = altInput.value;
        input.dispatchEvent(new Event('input'));
      });
    });
  }

  async function previewExactBatch() {
    dupesPanel.classList.remove('hidden');
    dupesPanel.innerHTML =
      '<p class="hint">Preparing an exact-duplicate batch preview…</p>';
    dupesPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const res = await fetch('/api/media/consolidate/exact/preview', {
      method: 'POST',
    });
    const data = (await res.json()) as {
      ok: boolean;
      preview?: ExactBatchPreview;
      error?: string;
    };
    if (!res.ok || !data.ok || !data.preview) {
      dupesPanel.innerHTML = `<p class="hint">${escapeHtml(data.error || 'Could not preview exact duplicates.')}</p>`;
      return;
    }

    const preview = data.preview;
    if (!preview.groupCount) {
      dupesPanel.innerHTML = `
        <div class="images-dupes-header">
          <div>
            <h3>Exact duplicate auto-merge</h3>
            <p class="hint">No exact duplicate groups remain.</p>
          </div>
          <button type="button" class="btn-secondary" id="exact-batch-close">Close</button>
        </div>`;
      dupesPanel.querySelector('#exact-batch-close')?.addEventListener('click', () => {
        dupesPanel.classList.add('hidden');
      });
      return;
    }

    dupesPanel.innerHTML = `
      <div class="images-dupes-header">
        <div>
          <h3>Auto-merge all exact duplicates</h3>
          <p class="hint">Only byte-identical files are included. Similar-image groups are never auto-merged.</p>
        </div>
        <button type="button" class="btn-secondary" id="exact-batch-close">Cancel</button>
      </div>
      <div class="images-dupes-preview">
        <p><strong>${preview.groupCount}</strong> exact groups · <strong>${preview.redundantFileCount}</strong> redundant masters · about <strong>${preview.referenceCount}</strong> references</p>
        <p><strong>${preview.keepersWithAlt}</strong> keepers will retain the best existing alt · <strong>${preview.keepersMissingAlt}</strong> have no existing alt to preserve.</p>
        <p class="hint">The strongest manual, catalog, or contextual alt becomes each keeper’s library default. Existing per-use alts remain unchanged. Redundant files and derivatives move to quarantine.</p>
        <details>
          <summary>Review keeper choices and selected alts</summary>
          <ul class="images-dupes-refs">
            ${preview.groups
              .map(
                (group) => `
                <li>
                  <code>${escapeHtml(group.keeperPath)}</code>
                  · removes ${group.redundantFileCount}
                  · ${group.referenceCount} refs
                  · alt: ${escapeHtml(group.bestDefaultAlt || '(none found)')}
                </li>`,
              )
              .join('')}
          </ul>
        </details>
        <div class="actions">
          <button type="button" class="btn-generate" id="exact-batch-confirm">Merge all exact duplicates</button>
          <button type="button" class="btn-secondary" id="exact-batch-review">Review individually instead</button>
        </div>
        <p class="hint" id="exact-batch-status"></p>
      </div>
    `;

    const close = () => {
      dupesPanel.classList.add('hidden');
      dupesPanel.innerHTML = '';
    };
    dupesPanel.querySelector('#exact-batch-close')?.addEventListener('click', close);
    dupesPanel.querySelector('#exact-batch-review')?.addEventListener('click', () => {
      void loadDuplicateReview();
    });
    dupesPanel.querySelector('#exact-batch-confirm')?.addEventListener('click', async () => {
      const button = dupesPanel.querySelector(
        '#exact-batch-confirm',
      ) as HTMLButtonElement;
      const status = dupesPanel.querySelector('#exact-batch-status') as HTMLElement;
      button.disabled = true;
      status.textContent =
        'Merging exact groups, rewriting references, quarantining copies, and re-indexing…';

      const confirmRes = await fetch('/api/media/consolidate/exact/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchToken: preview.batchToken }),
      });
      const result = (await confirmRes.json()) as {
        ok?: boolean;
        error?: string;
        mergedGroups?: number;
        rewrittenReferences?: number;
        quarantined?: string[];
        quarantineDir?: string;
        manifestPath?: string;
        keepersWithAlt?: number;
      };
      if (!confirmRes.ok || !result.ok) {
        button.disabled = false;
        status.textContent = result.error || 'Exact duplicate auto-merge failed.';
        return;
      }

      status.innerHTML = `
        Done: merged <strong>${result.mergedGroups ?? 0}</strong> exact groups,
        rewrote <strong>${result.rewrittenReferences ?? 0}</strong> references,
        and quarantined <strong>${result.quarantined?.length ?? 0}</strong> files.
        <br />Best alt retained for <strong>${result.keepersWithAlt ?? 0}</strong> keepers.
        <br />Manifest: <code>${escapeHtml(result.manifestPath || '')}</code>`;
      button.remove();
      void load();
    });
  }

  async function loadDuplicateReview(reindex = true) {
    dupesPanel.classList.remove('hidden');
    dupesPanel.innerHTML = `<p class="hint">${reindex ? 'Re-indexing the media library and checking for duplicates again…' : 'Loading duplicate groups…'}</p>`;
    if (reindex) {
      const indexRes = await fetch('/api/media/index', { method: 'POST' });
      const indexData = (await indexRes.json()) as {
        ok: boolean;
        error?: string;
      };
      if (!indexRes.ok || !indexData.ok) {
        dupesPanel.innerHTML = `<p class="hint">${escapeHtml(indexData.error || 'Could not re-index media.')}</p>`;
        return;
      }
    }
    const res = await fetch('/api/media/duplicates');
    const data = (await res.json()) as {
      ok: boolean;
      groups?: DupGroup[];
      exact?: number;
      similar?: number;
      error?: string;
    };
    if (!res.ok || !data.ok || !data.groups) {
      dupesPanel.innerHTML = `<p class="hint">${escapeHtml(data.error || 'Could not load duplicates. Re-index first.')}</p>`;
      return;
    }

    keeperByGroup = new Map(data.groups.map((g) => [g.id, g.suggestedKeeper]));
    activePreview = null;

    dupesPanel.innerHTML = `
      <div class="images-dupes-header">
        <div>
          <h3>Duplicate review</h3>
          <p class="hint">${data.exact ?? 0} exact groups · ${data.similar ?? 0} similar (review-only) · redundant files move to <code>media-quarantine/</code></p>
        </div>
        <button type="button" class="btn-secondary" id="dupes-close">Close</button>
      </div>
      <div id="dupes-preview-slot" class="images-dupes-preview hidden"></div>
      <div class="images-dupes-groups">
        ${data.groups
          .map((g) => {
            const keeper = keeperByGroup.get(g.id) || g.suggestedKeeper;
            return `
            <section class="images-dupe-group" data-group="${escapeHtml(g.id)}" data-kind="${g.kind}">
              <div class="images-dupe-group-head">
                <strong>${escapeHtml(g.id)}</strong>
                <span class="media-badge ${g.kind === 'exact' ? 'ok' : 'warn'}">${g.kind}</span>
                <span class="hint">${g.memberCount} files · ${g.totalUsageRaw} raw uses</span>
              </div>
              <div class="images-dupe-members">
                ${g.members
                  .map(
                    (m) => `
                  <label class="images-dupe-member ${g.kind === 'similar' ? 'is-similar' : ''} ${g.kind === 'exact' && m.path === keeper ? 'is-keeper' : ''}">
                    ${
                      g.kind === 'similar'
                        ? `<input type="checkbox" class="images-dupe-select" data-merge-member="${escapeHtml(g.id)}" value="${escapeHtml(m.path)}" aria-label="Include ${escapeHtml(m.filename)} in merge" />`
                        : ''
                    }
                    <input type="radio" name="keeper-${escapeHtml(g.id)}" value="${escapeHtml(m.path)}" ${g.kind === 'similar' ? 'disabled' : m.path === keeper ? 'checked' : ''} />
                    <img src="${escapeHtml(m.path)}" alt="" loading="lazy" />
                    <div>
                      <code title="${escapeHtml(m.path)}">${escapeHtml(m.filename)}</code>
                      <span>${m.width}×${m.height} · ${formatBytes(m.bytes)} · EN ${m.usageEn}</span>
                      <span class="hint">${escapeHtml(m.defaultAlt || '(no default alt)')}</span>
                      <button type="button" class="btn-secondary images-dupe-keep" data-group="${escapeHtml(g.id)}" data-path="${escapeHtml(m.path)}">Keep this image</button>
                    </div>
                  </label>`,
                  )
                  .join('')}
              </div>
              <div class="images-dupe-actions">
                ${
                  g.kind === 'similar'
                    ? '<span class="hint">Select at least two matching images. Unselected images will be remembered as not duplicates.</span>'
                    : ''
                }
                <label class="images-filter-check"><input type="checkbox" data-fill-alts="${escapeHtml(g.id)}" /> Fill empty alts from keeper</label>
                ${
                  g.kind === 'similar'
                    ? '<label class="images-filter-check"><input type="checkbox" data-similar-ok="' +
                      escapeHtml(g.id) +
                      '" /> I reviewed these similar images</label>'
                    : ''
                }
                <button type="button" class="btn-generate" data-preview-group="${escapeHtml(g.id)}">Preview merge</button>
                ${
                  g.kind === 'similar'
                    ? `<button type="button" class="btn-secondary" data-dismiss-similar="${escapeHtml(g.id)}">Mark entire group not similar</button>`
                    : ''
                }
              </div>
            </section>`;
          })
          .join('')}
      </div>
    `;

    dupesPanel.querySelector('#dupes-close')?.addEventListener('click', () => {
      dupesPanel.classList.add('hidden');
      dupesPanel.innerHTML = '';
      activePreview = null;
    });

    dupesPanel.querySelectorAll<HTMLButtonElement>('.images-dupe-keep').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const groupId = btn.dataset.group || '';
        const path = btn.dataset.path || '';
        keeperByGroup.set(groupId, path);
        const section = dupesPanel.querySelector(
          `.images-dupe-group[data-group="${CSS.escape(groupId)}"]`,
        );
        section?.querySelectorAll('.images-dupe-member').forEach((el) => {
          const input = el.querySelector('input[type="radio"]') as HTMLInputElement | null;
          const include = el.querySelector(
            'input[data-merge-member]',
          ) as HTMLInputElement | null;
          if (include && input?.value === path) include.checked = true;
          if (input) input.disabled = Boolean(include && !include.checked);
          el.classList.toggle('is-keeper', input?.value === path);
          if (input) input.checked = input.value === path;
        });
      });
    });

    dupesPanel
      .querySelectorAll<HTMLInputElement>('input[data-merge-member]')
      .forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          const card = checkbox.closest('.images-dupe-member') as HTMLElement;
          const radio = card.querySelector(
            'input[type="radio"]',
          ) as HTMLInputElement;
          radio.disabled = !checkbox.checked;
          if (checkbox.checked) {
            const groupId = checkbox.dataset.mergeMember || '';
            const section = card.closest('.images-dupe-group') as HTMLElement;
            const selectedKeeper = section.querySelector(
              'input[type="radio"]:checked:not(:disabled)',
            ) as HTMLInputElement | null;
            if (!selectedKeeper) {
              radio.checked = true;
              keeperByGroup.set(groupId, radio.value);
              card.classList.add('is-keeper');
            }
          } else if (radio.checked) {
            radio.checked = false;
            card.classList.remove('is-keeper');
            const section = card.closest('.images-dupe-group') as HTMLElement;
            const replacement = section.querySelector(
              'input[type="radio"]:not(:disabled)',
            ) as HTMLInputElement | null;
            if (replacement) {
              replacement.checked = true;
              keeperByGroup.set(
                checkbox.dataset.mergeMember || '',
                replacement.value,
              );
              replacement.closest('.images-dupe-member')?.classList.add('is-keeper');
            }
          }
        });
      });

    dupesPanel.querySelectorAll<HTMLInputElement>('input[type="radio"][name^="keeper-"]').forEach(
      (radio) => {
        radio.addEventListener('change', () => {
          const groupId = radio.name.replace(/^keeper-/, '');
          keeperByGroup.set(groupId, radio.value);
          const section = radio.closest('.images-dupe-group');
          section?.querySelectorAll('.images-dupe-member').forEach((el) => {
            const input = el.querySelector('input[type="radio"]') as HTMLInputElement | null;
            el.classList.toggle('is-keeper', Boolean(input?.checked));
          });
        });
      },
    );

    dupesPanel.querySelectorAll<HTMLButtonElement>('[data-preview-group]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const groupId = btn.dataset.previewGroup || '';
        const section = btn.closest('.images-dupe-group') as HTMLElement;
        const fillEmptyAlts = Boolean(
          (section.querySelector(`input[data-fill-alts="${CSS.escape(groupId)}"]`) as HTMLInputElement)
            ?.checked,
        );
        const similarOk = Boolean(
          (section.querySelector(`input[data-similar-ok="${CSS.escape(groupId)}"]`) as HTMLInputElement)
            ?.checked,
        );
        const kind = section.dataset.kind;
        const memberPaths =
          kind === 'similar'
            ? [
                ...section.querySelectorAll<HTMLInputElement>(
                  'input[data-merge-member]:checked',
                ),
              ].map((input) => input.value)
            : undefined;
        if (kind === 'similar' && (memberPaths?.length ?? 0) < 2) {
          renderPreviewSlot(
            '<p class="hint">Select at least two images that are true duplicates.</p>',
          );
          return;
        }
        if (kind === 'similar' && !similarOk) {
          renderPreviewSlot(
            `<p class="hint">Check “I reviewed these similar images” before previewing a perceptual merge.</p>`,
          );
          return;
        }
        renderPreviewSlot('<p class="hint">Building preview…</p>');
        const res = await fetch('/api/media/consolidate/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId,
            keeperPath: keeperByGroup.get(groupId),
            memberPaths,
            fillEmptyAlts,
            explicitSimilarApproval: similarOk,
          }),
        });
        const data = (await res.json()) as {
          ok: boolean;
          preview?: ConsolidatePreview;
          error?: string;
        };
        if (!res.ok || !data.ok || !data.preview) {
          renderPreviewSlot(`<p class="hint">${escapeHtml(data.error || 'Preview failed')}</p>`);
          return;
        }
        activePreview = data.preview;
        renderPreview(data.preview, similarOk);
      });
    });

    dupesPanel
      .querySelectorAll<HTMLButtonElement>('[data-dismiss-similar]')
      .forEach((btn) => {
        btn.addEventListener('click', async () => {
          const groupId = btn.dataset.dismissSimilar || '';
          const section = btn.closest('.images-dupe-group') as HTMLElement;
          const memberCount = section.querySelectorAll('.images-dupe-member').length;
          const confirmed = window.confirm(
            `Mark all ${memberCount} images in ${groupId} as not similar? They will not be grouped together on future duplicate scans.`,
          );
          if (!confirmed) return;
          btn.disabled = true;
          btn.textContent = 'Saving review decision…';
          const res = await fetch('/api/media/duplicates/not-similar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId }),
          });
          const data = (await res.json()) as {
            ok: boolean;
            ignoredPairs?: number;
            error?: string;
          };
          if (!res.ok || !data.ok) {
            btn.disabled = false;
            btn.textContent = 'Mark entire group not similar';
            renderPreviewSlot(
              `<p class="hint">${escapeHtml(data.error || 'Could not save review decision.')}</p>`,
            );
            return;
          }
          meta.textContent = `Marked ${memberCount} images (${data.ignoredPairs ?? 0} pairs) as not similar.`;
          await loadDuplicateReview(false);
          void load();
        });
      });
  }

  function renderPreviewSlot(html: string) {
    const slot = dupesPanel.querySelector('#dupes-preview-slot') as HTMLElement | null;
    if (!slot) return;
    slot.classList.remove('hidden');
    slot.innerHTML = html;
    slot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderPreview(preview: ConsolidatePreview, similarOk: boolean) {
    renderPreviewSlot(`
      <h4>Merge preview · ${escapeHtml(preview.groupId)}</h4>
      <p><strong>Keep:</strong> <code>${escapeHtml(preview.keeperPath)}</code></p>
      <p class="hint">Redundant masters/derivatives will move to quarantine (not deleted).</p>
      ${
        preview.kind === 'similar'
          ? `<p class="hint">${preview.reviewedSurvivorPaths?.length ?? 0} surviving images will be remembered as reviewed non-duplicates and will not be regrouped.</p>`
          : ''
      }
      ${
        preview.warnings.length
          ? `<ul class="images-dupes-warnings">${preview.warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul>`
          : ''
      }
      ${
        preview.metadataConflicts.length
          ? `<details open><summary>Metadata conflicts (${preview.metadataConflicts.length})</summary>
            <ul>${preview.metadataConflicts
              .map(
                (c) =>
                  `<li><strong>${escapeHtml(c.field)}</strong> keeper="${escapeHtml(c.keeperValue)}" others: ${c.otherValues
                    .map((o) => `${escapeHtml(o.path)}="${escapeHtml(o.value)}"`)
                    .join('; ')}</li>`,
              )
              .join('')}</ul></details>`
          : ''
      }
      <details open>
        <summary>${preview.references.length} references to rewrite</summary>
        <ul class="images-dupes-refs">
          ${
            preview.references.length
              ? preview.references
                  .slice(0, 80)
                  .map(
                    (r) =>
                      `<li><code>${escapeHtml(r.relativePath)}</code> · ${escapeHtml(r.role)} · ${escapeHtml(r.lang)} · ${escapeHtml(r.title)}</li>`,
                  )
                  .join('')
              : '<li class="hint">No content references need rewriting.</li>'
          }
        </ul>
      </details>
      <p class="hint">Quarantine ${preview.quarantinePaths.length} masters (+ derivatives).</p>
      <div class="actions">
        <button type="button" class="btn-generate" id="dupes-confirm">Confirm merge → quarantine</button>
        <button type="button" class="btn-secondary" id="dupes-cancel-preview">Cancel</button>
      </div>
      <p class="hint" id="dupes-confirm-status"></p>
    `);

    dupesPanel.querySelector('#dupes-cancel-preview')?.addEventListener('click', () => {
      activePreview = null;
      const slot = dupesPanel.querySelector('#dupes-preview-slot');
      slot?.classList.add('hidden');
    });

    dupesPanel.querySelector('#dupes-confirm')?.addEventListener('click', async () => {
      if (!activePreview) return;
      const status = dupesPanel.querySelector('#dupes-confirm-status') as HTMLElement;
      status.textContent = 'Merging…';
      const res = await fetch('/api/media/consolidate/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewToken: activePreview.previewToken,
          explicitSimilarApproval: similarOk || activePreview.kind === 'exact',
          dryRun: false,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        keeperPath?: string;
        rewrittenReferences?: number;
        quarantineDir?: string;
        manifestPath?: string;
        filledEmptyAlts?: number;
        reviewedNonDuplicatePairs?: number;
      };
      if (!res.ok || !data.ok) {
        status.textContent = data.error || 'Merge failed';
        return;
      }
      status.textContent = `Done. Kept ${data.keeperPath}. Rewrote ${data.rewrittenReferences ?? 0} refs. Remembered ${data.reviewedNonDuplicatePairs ?? 0} reviewed non-duplicate pairs. Quarantine: ${data.quarantineDir}. Manifest: ${data.manifestPath}.`;
      activePreview = null;
      void load();
      void loadDuplicateReview(false);
    });
  }

  const filterEls = [
    search,
    unused,
    includePool,
    missingAlt,
    missingDeriv,
    hasDupes,
    tagFilter,
    ...(dupKind ? [dupKind] : []),
  ];
  for (const el of filterEls) {
    el.addEventListener('change', () => void load());
    if (el === search) {
      el.addEventListener('input', () => {
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(() => void load(), 200);
      });
    }
  }

  document.getElementById('refresh-images')?.addEventListener('click', () => void load());
  document.getElementById('media-review-dupes')?.addEventListener('click', () => {
    void loadDuplicateReview();
  });
  document.getElementById('media-auto-merge-exact')?.addEventListener('click', () => {
    void previewExactBatch();
  });
  document.getElementById('media-reindex')?.addEventListener('click', async () => {
    meta.textContent = 'Indexing media (may take a minute)…';
    const res = await fetch('/api/media/index', { method: 'POST' });
    const data = (await res.json()) as { ok: boolean; error?: string; summary?: { total: number } };
    meta.textContent = data.ok
      ? `Indexed ${data.summary?.total ?? 0} masters`
      : data.error || 'Index failed';
    void load();
  });
  document.getElementById('media-ensure-selected')?.addEventListener('click', async () => {
    const paths = [...selected];
    if (!paths.length) {
      meta.textContent = 'Select images with the checkboxes first.';
      return;
    }
    meta.textContent = `Generating derivatives for ${paths.length}…`;
    await fetch('/api/media/ensure-derivatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths }),
    });
    void load();
  });

  return {
    load,
    selectedPaths: () => [...selected],
  };
}

export { openMediaPicker, copyText, markdownSnippet, htmlSnippet };
