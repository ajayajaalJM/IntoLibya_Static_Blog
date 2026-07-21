/**
 * Unified GA4 web analytics helpers for the Astro blog.
 * Event contract mirrors TourBuilder analytics/events.json (shared stream G-H6N6QW4W7T).
 */

export const SHARED_GA_MEASUREMENT_ID = 'G-H6N6QW4W7T';
export const SITE_AREA_BLOG = 'blog';
export const HANDOFF_STORAGE_KEY = 'il_tb_entry_v1';

export type ContentMeta = {
  content_type?: string;
  content_id?: string;
  content_language?: string;
};

export type ClickPayload = {
  event: string;
  [key: string]: string | number | boolean | undefined;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function pathOf(url: string, base = 'https://intolibya.com'): string {
  try {
    return new URL(url, base).pathname;
  } catch {
    return url || '';
  }
}

export function hostOf(url: string, base = 'https://intolibya.com'): string {
  try {
    return new URL(url, base).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function queryParam(url: string, name: string, base = 'https://intolibya.com'): string | null {
  try {
    return new URL(url, base).searchParams.get(name);
  } catch {
    return null;
  }
}

const LANG_RE = 'en|ar|de|es|fr|it|ja|nl|pl|pt|ru|zh';

/**
 * Classify an anchor click into a normalized GA4 event payload.
 * Item identity (selectedTour / selectedEvent) beats generic /booking CTAs.
 */
export function classifyLink(input: {
  href: string;
  text?: string;
  section?: string;
  explicitEvent?: string | null;
  explicitLabel?: string | null;
  explicitCta?: string | null;
  itemId?: string | null;
  itemType?: string | null;
  itemName?: string | null;
  itemIndex?: string | null;
  siteHost?: string;
  base?: string;
}): ClickPayload {
  const base = input.base || 'https://intolibya.com';
  const href = input.href || '';
  const section = input.section || 'page';
  const linkText = (input.explicitLabel || input.text || '').slice(0, 120);
  const path = pathOf(href, base);
  const host = hostOf(href, base);
  const siteHost = (input.siteHost || 'intolibya.com').replace(/^www\./, '');
  const outbound = Boolean(host && host !== siteHost);

  if (input.explicitEvent) {
    const payload: ClickPayload = {
      event: input.explicitEvent,
      link_url: href,
      link_text: linkText,
      section,
      outbound,
    };
    if (input.explicitEvent === 'cta_click') {
      payload.cta_name = slugify(input.explicitCta || linkText || 'cta');
    }
    if (input.itemId) payload.item_id = input.itemId;
    if (input.itemType) payload.item_category = input.itemType;
    if (input.itemName) payload.item_name = input.itemName;
    if (input.itemIndex != null && input.itemIndex !== '') {
      const idx = Number(input.itemIndex);
      if (!Number.isNaN(idx)) payload.index = idx;
    }
    return payload;
  }

  // Explicit item attrs on cards beat URL heuristics
  if (input.itemId && input.itemType) {
    const idx =
      input.itemIndex != null && input.itemIndex !== '' ? Number(input.itemIndex) : undefined;
    return {
      event: 'select_item',
      item_list_name: section || input.itemType,
      item_id: input.itemId,
      item_name: input.itemName || linkText || undefined,
      item_category: input.itemType,
      ...(typeof idx === 'number' && !Number.isNaN(idx) ? { index: idx } : {}),
      link_url: href,
      link_text: linkText,
      section,
    };
  }

  if (href.startsWith('tel:')) {
    return { event: 'contact_click', contact_method: 'phone', link_url: href, link_text: linkText, section };
  }
  if (href.startsWith('mailto:')) {
    return { event: 'contact_click', contact_method: 'email', link_url: href, link_text: linkText, section };
  }
  if (/wa\.me|whatsapp\.com/i.test(href)) {
    return { event: 'contact_click', contact_method: 'whatsapp', link_url: href, link_text: linkText, section };
  }

  if (/facebook\.com|fb\.com/i.test(host)) {
    return { event: 'social_click', social_network: 'facebook', link_url: href, link_text: linkText, section };
  }
  if (/instagram\.com/i.test(host)) {
    return { event: 'social_click', social_network: 'instagram', link_url: href, link_text: linkText, section };
  }
  if (/youtube\.com|youtu\.be/i.test(host)) {
    return { event: 'social_click', social_network: 'youtube', link_url: href, link_text: linkText, section };
  }
  if (/twitter\.com|x\.com|tiktok\.com|linkedin\.com/i.test(host)) {
    return {
      event: 'social_click',
      social_network: host.split('.')[0],
      link_url: href,
      link_text: linkText,
      section,
    };
  }

  const selectedTour = queryParam(href, 'selectedTour', base) || queryParam(href, 'tourId', base);
  const selectedEvent = queryParam(href, 'selectedEvent', base) || queryParam(href, 'eventId', base);

  // Item identity BEFORE generic booking CTA
  if (selectedTour) {
    return {
      event: 'select_item',
      item_list_name: section || 'tours',
      item_id: selectedTour,
      item_name: linkText || undefined,
      item_category: 'tour',
      link_url: href,
      link_text: linkText,
      section,
    };
  }
  if (selectedEvent) {
    return {
      event: 'select_item',
      item_list_name: section || 'events',
      item_id: selectedEvent,
      item_name: linkText || undefined,
      item_category: 'event',
      link_url: href,
      link_text: linkText,
      section,
    };
  }

  const activityMatch = path.match(/\/tourbuilder\/activity\/([^/?#]+)/i);
  if (activityMatch) {
    return {
      event: 'select_item',
      item_list_name: section || 'activities',
      item_id: decodeURIComponent(activityMatch[1]),
      item_name: linkText || undefined,
      item_category: 'activity',
      link_url: href,
      link_text: linkText,
      section,
    };
  }

  if (/\/tourbuilder\/booking\/?$/i.test(path) || (/\/tourbuilder\/booking/i.test(path) && !selectedTour && !selectedEvent)) {
    return {
      event: 'cta_click',
      cta_name: 'build_trip',
      link_url: href,
      link_text: linkText,
      section,
    };
  }
  if (/\/tourbuilder\/search\/?/i.test(path)) {
    return {
      event: 'cta_click',
      cta_name: 'browse_activities',
      link_url: href,
      link_text: linkText,
      section,
    };
  }
  if (/\/tourbuilder\/tour-packages/i.test(path)) {
    return {
      event: 'cta_click',
      cta_name: 'browse_tours',
      link_url: href,
      link_text: linkText,
      section,
    };
  }
  if (/\/tourbuilder\/festivals-and-events/i.test(path)) {
    return {
      event: 'cta_click',
      cta_name: 'browse_events',
      link_url: href,
      link_text: linkText,
      section,
    };
  }
  if (/\/tourbuilder(\/|$)/i.test(path)) {
    return {
      event: 'cta_click',
      cta_name: 'tourbuilder_hub',
      link_url: href,
      link_text: linkText,
      section,
    };
  }

  const destDetail = path.match(new RegExp(`^/(${LANG_RE})/destination/([^/?#]+)`, 'i'));
  if (destDetail) {
    return {
      event: 'content_select',
      content_type: 'destination',
      content_id: decodeURIComponent(destDetail[2]),
      content_language: destDetail[1].toLowerCase(),
      link_url: href,
      link_text: linkText,
      section,
    };
  }
  if (new RegExp(`^/(${LANG_RE})/destinations/?$`, 'i').test(path)) {
    return {
      event: 'content_select',
      content_type: 'destinations_index',
      link_url: href,
      link_text: linkText,
      section,
    };
  }
  if (new RegExp(`^/(${LANG_RE})/?$`, 'i').test(path)) {
    return {
      event: 'content_select',
      content_type: 'hub',
      content_language: path.split('/').filter(Boolean)[0]?.toLowerCase(),
      link_url: href,
      link_text: linkText,
      section,
    };
  }
  const postMatch = path.match(new RegExp(`^/(${LANG_RE})/([^/?#]+)/?$`, 'i'));
  if (postMatch && !['destination', 'destinations'].includes(postMatch[2].toLowerCase())) {
    return {
      event: 'content_select',
      content_type: 'post',
      content_id: decodeURIComponent(postMatch[2]),
      content_language: postMatch[1].toLowerCase(),
      link_url: href,
      link_text: linkText,
      section,
    };
  }

  if (section === 'header' || section === 'mobile_nav') {
    return { event: 'nav_click', link_url: href, link_text: linkText, section };
  }
  if (section === 'footer') {
    return { event: 'footer_click', link_url: href, link_text: linkText, section };
  }
  if (outbound) {
    return { event: 'outbound_click', link_url: href, link_domain: host, link_text: linkText, section };
  }
  return { event: 'link_click', link_url: href, link_text: linkText, section };
}

export function isTourBuilderHref(href: string, base = 'https://intolibya.com'): boolean {
  try {
    const path = pathOf(href, base);
    return /\/tourbuilder(\/|$)/i.test(path);
  } catch {
    return false;
  }
}

export function buildHandoffContext(input: {
  entry_page?: string;
  entry_content_id?: string;
  entry_section?: string;
  entry_item_id?: string;
}): string {
  return JSON.stringify({
    entry_page: input.entry_page || '',
    entry_content_id: input.entry_content_id || '',
    entry_section: input.entry_section || '',
    entry_item_id: input.entry_item_id || '',
    ts: Date.now(),
  });
}
