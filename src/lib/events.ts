/** Shared event helpers for homepage grid + client CDN sync. */

export const HOMEPAGE_EVENT_LIMIT = 2;
export const EVENTS_CDN_URL = 'https://cdn.intolibya.com/json/events.json';

export interface EventItem {
  id: string;
  title: string;
  days: number;
  price?: number;
  description?: string;
  overview?: string;
  image?: string;
  images?: string[];
  scheduleType?: string;
  isLibyanOnly?: boolean;
  /** Occurrence day strings, e.g. `['2026-12-28', '2026-12-29']`. */
  dates?: string[];
}

function startOfTodayMs(now = Date.now()): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Earliest occurrence start time (ms), or 0 if unknown. */
export function eventStartMs(event: EventItem): number {
  const dates = event.dates;
  if (!Array.isArray(dates) || dates.length === 0) return 0;

  let earliest = Number.POSITIVE_INFINITY;
  for (const day of dates) {
    const raw = String(day || '').slice(0, 10);
    const t = Date.parse(raw);
    if (!Number.isNaN(t) && t < earliest) earliest = t;
  }
  return earliest === Number.POSITIVE_INFINITY ? 0 : earliest;
}

/** Events starting more than a year from now stay off the homepage section. */
export const HOMEPAGE_EVENT_MAX_AHEAD_MS = 365 * 24 * 60 * 60 * 1000;

function isWithinHomepageWindow(event: EventItem, now = Date.now()): boolean {
  const start = eventStartMs(event);
  if (start <= 0) return false;
  const today = startOfTodayMs(now);
  const maxStart = today + HOMEPAGE_EVENT_MAX_AHEAD_MS;
  // Upcoming within a year, or recently started (for fill-in).
  return start < today || start <= maxStart;
}

/**
 * Homepage spotlight: the next events by start date (soonest upcoming first).
 * Events further than one year out are never shown here.
 */
export function selectNewestEvents<T extends EventItem>(
  events: T[],
  limit = HOMEPAGE_EVENT_LIMIT,
  now = Date.now(),
): T[] {
  const today = startOfTodayMs(now);
  const maxStart = today + HOMEPAGE_EVENT_MAX_AHEAD_MS;
  const withIds = [...events].filter((e) => Boolean(e?.id) && isWithinHomepageWindow(e, now));

  const upcoming = withIds
    .filter((e) => {
      const start = eventStartMs(e);
      return start >= today && start <= maxStart;
    })
    .sort((a, b) => {
      const byDate = eventStartMs(a) - eventStartMs(b);
      if (byDate !== 0) return byDate;
      return String(a.id).localeCompare(String(b.id));
    });

  if (upcoming.length >= limit) return upcoming.slice(0, limit);

  // If fewer than `limit` upcoming, fill with the most recently started past events.
  const past = withIds
    .filter((e) => {
      const start = eventStartMs(e);
      return start > 0 && start < today;
    })
    .sort((a, b) => {
      const byDate = eventStartMs(b) - eventStartMs(a);
      if (byDate !== 0) return byDate;
      return String(b.id).localeCompare(String(a.id));
    });

  return [...upcoming, ...past].slice(0, limit);
}
