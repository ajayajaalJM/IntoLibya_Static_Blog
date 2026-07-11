/** TourBuilder URL helpers — keep in sync with TourBuilder/scripts/lib/slugs.js */

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

export function tourBookingUrl(tourId: string): string {
  return `/tourbuilder/booking/?selectedTour=${encodeURIComponent(tourId)}`;
}

export function eventBookingUrl(eventId: string, occurrenceStart?: string): string {
  const qs = new URLSearchParams({ selectedEvent: eventId });
  if (occurrenceStart) qs.set('occurrenceStart', occurrenceStart);
  return `/tourbuilder/booking/?${qs.toString()}`;
}

export function activityUrl(activity: { id: string; title: string }): string {
  const slug = slugify(`${activity.title}-${activity.id}`);
  return `/tourbuilder/activity/${slug}/`;
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
