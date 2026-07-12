/** TourBuilder URL helpers — keep in sync with TourBuilder/scripts/lib/slugs.js
 *  Paths must stay under `/tourbuilder` and must NOT use a trailing slash
 *  (Netlify 301s `/tourbuilder/booking/` → `/booking`, which 404s on the blog host).
 */

export const TOURBUILDER_BASE = '/tourbuilder';

export function slugify(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function dayPrefix(days: number | null | undefined): string | null {
  if (days == null || days <= 0) return null;
  return days === 1 ? '1-day' : `${days}-day`;
}

export function tourSlug(tour: { title?: string; days?: number }): string {
  const titleSlug = slugify(tour.title || 'tour');
  const dayPart = dayPrefix(tour.days);
  if (dayPart) return `${dayPart}-libya-tour-${titleSlug}`;
  return `libya-tour-${titleSlug}`;
}

export function eventSlug(event: { title?: string; days?: number }): string {
  const titleSlug = slugify(event.title || 'event');
  const dayPart = dayPrefix(event.days);
  if (dayPart) return `${titleSlug}-libya-${dayPart}-event`;
  return `${titleSlug}-libya-event`;
}

/** Strip trailing slash from TourBuilder paths (preserve query/hash). */
export function normalizeTourbuilderHref(href: string): string {
  if (!href) return href;
  try {
    const abs = href.startsWith('http') ? new URL(href) : null;
    const path = abs ? abs.pathname : href.split(/[?#]/)[0];
    const rest = abs ? `${abs.search}${abs.hash}` : href.slice(path.length);
    const isTourbuilder = /\/tourbuilder(\/|$)/i.test(path);

    if (!isTourbuilder) return href;

    let normalizedPath = path.replace(/\/+$/, '');
    if (!normalizedPath) normalizedPath = TOURBUILDER_BASE;
    if (/^\/tourbuilder$/i.test(normalizedPath)) normalizedPath = TOURBUILDER_BASE;

    if (abs) {
      abs.pathname = normalizedPath;
      return abs.toString();
    }
    return `${normalizedPath}${rest}`;
  } catch {
    return href.replace(/\/+(?=[?#]|$)/, '');
  }
}

export function tourBookingUrl(tourId: string): string {
  return normalizeTourbuilderHref(
    `${TOURBUILDER_BASE}/booking?selectedTour=${encodeURIComponent(tourId)}`,
  );
}

export function eventBookingUrl(eventId: string, occurrenceStart?: string): string {
  const qs = new URLSearchParams({ selectedEvent: eventId });
  if (occurrenceStart) qs.set('occurrenceStart', occurrenceStart);
  return normalizeTourbuilderHref(`${TOURBUILDER_BASE}/booking?${qs.toString()}`);
}

export function activityUrl(activity: { id: string; title: string }): string {
  const slug = slugify(`${activity.title}-${activity.id}`);
  return normalizeTourbuilderHref(`${TOURBUILDER_BASE}/activity/${slug}`);
}

export function tourbuilderPath(...segments: string[]): string {
  const cleaned = segments
    .map((s) => String(s || '').replace(/^\/+|\/+$/g, ''))
    .filter(Boolean);
  return normalizeTourbuilderHref(
    cleaned.length ? `${TOURBUILDER_BASE}/${cleaned.join('/')}` : TOURBUILDER_BASE,
  );
}

/** Static tour id → local image filename */
export const TOUR_IMAGES: Record<string, string> = {
  tour_4day: '/assets/tours/quick_trip.jpg',
  tour_7day: '/assets/tours/lets_explore.jpg',
  tour_15day: '/assets/tours/adventure_time.jpg',
  tour_all_libya: '/assets/tours/seasoned.jpg',
};

export function tourImageUrl(tourId: string): string {
  return TOUR_IMAGES[tourId] || '/assets/heroes/hero_sahara.jpg';
}
