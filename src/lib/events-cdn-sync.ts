import { eventBookingUrl, eventSlug } from './tourbuilder-links';
import {
  EVENTS_CDN_URL,
  HOMEPAGE_EVENT_LIMIT,
  selectNewestEvents,
  type EventItem,
} from './events';

export type { EventItem };

const STORAGE_KEY = 'intolibya:events-cdn';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

interface CachedEvents {
  checkedAt: number;
  events: EventItem[];
}

function eventImage(e: EventItem): string {
  if (e.image) return e.image;
  if (e.images?.[0]) return e.images[0];
  return '/assets/heroes/hero_sahara.jpg';
}

function eventDescription(e: EventItem): string {
  return (e.overview || e.description || '').slice(0, 220);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readCache(): CachedEvents | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEvents;
    if (!parsed || !Array.isArray(parsed.events) || typeof parsed.checkedAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(events: EventItem[]): void {
  const payload: CachedEvents = { checkedAt: Date.now(), events };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

async function getEventsForToday(): Promise<EventItem[] | null> {
  const cached = readCache();
  if (cached && Date.now() - cached.checkedAt < CHECK_INTERVAL_MS) {
    return cached.events;
  }

  try {
    const res = await fetch(EVENTS_CDN_URL, { credentials: 'omit' });
    if (!res.ok) return cached?.events ?? null;
    const events = (await res.json()) as EventItem[];
    if (!Array.isArray(events)) return cached?.events ?? null;
    writeCache(events);
    return events;
  } catch {
    return cached?.events ?? null;
  }
}

function ensureGrid(section: HTMLElement): HTMLElement {
  let grid = section.querySelector<HTMLElement>('[data-events-grid]');
  if (grid) return grid;

  const host = section.querySelector('.mx-auto') ?? section;
  host.querySelector('[data-events-empty]')?.remove();

  grid = document.createElement('div');
  grid.className = 'grid gap-6 md:grid-cols-2';
  grid.setAttribute('data-events-grid', '');
  host.appendChild(grid);
  return grid;
}

function renderEventCard(e: EventItem): HTMLElement {
  const scheduleLabel = e.scheduleType === 'fixed' ? 'Fixed dates' : 'Scheduled';
  const desc = eventDescription(e);
  const article = document.createElement('article');
  article.className = 'card group flex flex-col overflow-hidden border-l-8 border-mint';
  article.setAttribute('data-event-id', e.id);
  article.setAttribute('data-event-source', 'cdn');

  article.innerHTML = `
    <div class="tile-media mx-4 mt-4 h-52 sm:h-56">
      <img
        src="${escapeHtml(eventImage(e))}"
        alt=""
        width="800"
        height="500"
        loading="lazy"
        decoding="async"
        class="transition group-hover:scale-105"
      />
    </div>
    <div class="flex flex-1 flex-col p-5 sm:p-6">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-bold uppercase tracking-wide text-brass">
          ${escapeHtml(String(e.days))} days · ${scheduleLabel}
        </span>
        ${
          e.isLibyanOnly
            ? `<span class="rounded-full bg-charcoal px-3 py-1 text-xs font-bold text-white">Libyans Only</span>`
            : ''
        }
      </div>
      <h3 class="mt-3 text-xl font-bold leading-snug text-charcoal sm:text-2xl">${escapeHtml(e.title)}</h3>
      ${
        desc
          ? `<p class="mt-3 flex-1 text-base leading-relaxed text-muted">${escapeHtml(desc)}</p>`
          : ''
      }
      ${
        e.price != null
          ? `<p class="mt-4 text-base font-bold text-charcoal">From ${escapeHtml(String(e.price))} USD</p>`
          : ''
      }
      <div class="mt-5 flex flex-col gap-3 sm:flex-row">
        <a
          href="${escapeHtml(eventBookingUrl(e.id))}"
          data-ga-event="cta_click"
          data-ga-label="Book Event"
          class="btn-primary flex-1 justify-center py-3 text-sm"
        >Book Now →</a>
        <a
          href="/tourbuilder/festivals-and-events/${escapeHtml(eventSlug(e))}"
          class="btn-secondary flex-1 justify-center py-3 text-sm"
        >Details</a>
      </div>
    </div>
  `;

  return article;
}

/** Keep homepage grid to the 2 newest CDN events (reuse existing cards when possible). */
function syncHomepageEvents(section: HTMLElement, events: EventItem[]): void {
  const top = selectNewestEvents(events, HOMEPAGE_EVENT_LIMIT);
  if (!top.length) return;

  const grid = ensureGrid(section);
  const existing = new Map(
    [...grid.querySelectorAll<HTMLElement>('[data-event-id]')].map((el) => [
      el.dataset.eventId || '',
      el,
    ]),
  );

  const nextIds = top.map((e) => e.id);
  const currentIds = [...grid.querySelectorAll<HTMLElement>('[data-event-id]')].map(
    (el) => el.dataset.eventId || '',
  );
  if (
    currentIds.length === nextIds.length &&
    currentIds.every((id, i) => id === nextIds[i])
  ) {
    return;
  }

  const frag = document.createDocumentFragment();
  for (const event of top) {
    frag.appendChild(existing.get(event.id) ?? renderEventCard(event));
  }
  grid.replaceChildren(frag);
}

async function syncEventsFromCdn(section: HTMLElement): Promise<void> {
  const events = await getEventsForToday();
  if (!events?.length) return;
  syncHomepageEvents(section, events);
}

/** Lazy once-per-day CDN check; keeps homepage grid on the 2 newest events. */
export function initEventsCdnSync(section: HTMLElement): void {
  if (section.dataset.eventsSyncBound === '1') return;
  section.dataset.eventsSyncBound = '1';

  const run = () => {
    void syncEventsFromCdn(section);
  };

  if (!('IntersectionObserver' in window)) {
    run();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      run();
    },
    { rootMargin: '200px 0px' },
  );

  observer.observe(section);
}
