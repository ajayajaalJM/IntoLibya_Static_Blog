/**
 * Canonical commercial + editorial internal links for IntoLibya.
 * Used by the “Plan your Libya trip” resource bar (not BreadcrumbList).
 */

export type SeoLink = {
  href: string;
  label: string;
  /** When linking to English hubs from non-English pages. */
  hreflang?: string;
};

export type BreadcrumbItem = {
  name: string;
  href?: string;
};

export const SITE_ORIGIN = 'https://intolibya.com';

/** TourBuilder conversion surfaces. */
export const COMMERCIAL_LINKS: SeoLink[] = [
  { href: '/tourbuilder/booking', label: 'Book a Libya Tour' },
  { href: '/tourbuilder/tour-packages', label: 'Libya Tours' },
  { href: '/tourbuilder/search', label: 'Search Libya Activities' },
  { href: '/tourbuilder/festivals-and-events', label: 'Libya Events & Festivals' },
];

/** Highest-priority English editorial hubs. */
export const EDITORIAL_LINKS: SeoLink[] = [
  {
    href: '/en/how-to-visit-libya-as-a-tourist-in-2026',
    label: 'How to Visit Libya as a Tourist in 2026',
    hreflang: 'en',
  },
  {
    href: '/en/is-it-safe-to-travel-to-libya-in-2026',
    label: 'Is It Safe to Travel to Libya in 2026?',
    hreflang: 'en',
  },
  {
    href: '/en/libya-evisa-explained-step-by-step',
    label: 'Libya eVisa Explained Step by Step',
    hreflang: 'en',
  },
  {
    href: '/en/best-places-to-visit-in-libya-2026-guide',
    label: 'Best Places to Visit in Libya: 2026 Guide',
    hreflang: 'en',
  },
  {
    href: '/en/libya-tours-2026-how-to-book-a-tour-with-intolibya',
    label: 'How to Book a Libya Tour with IntoLibya',
    hreflang: 'en',
  },
];

export function absoluteUrl(pathOrUrl: string, siteOrigin = SITE_ORIGIN): string {
  if (!pathOrUrl) return siteOrigin;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = siteOrigin.replace(/\/$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

/** Build schema.org BreadcrumbList from a hierarchical trail. Last item may omit href. */
export function buildBreadcrumbListJsonLd(
  items: BreadcrumbItem[],
  siteOrigin = SITE_ORIGIN,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const entry: Record<string, unknown> = {
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
      };
      if (item.href) {
        entry.item = absoluteUrl(item.href, siteOrigin);
      }
      return entry;
    }),
  };
}

export function blogIndexCrumbs(lang: string, blogLabel: string): BreadcrumbItem[] {
  return [
    { name: 'Home', href: '/' },
    { name: blogLabel, href: `/${lang}` },
  ];
}

export function blogPostCrumbs(lang: string, blogLabel: string, title: string, postPath: string): BreadcrumbItem[] {
  return [
    { name: 'Home', href: '/' },
    { name: blogLabel, href: `/${lang}` },
    { name: title, href: postPath },
  ];
}

export function destinationsIndexCrumbs(lang: string): BreadcrumbItem[] {
  return [
    { name: 'Home', href: '/' },
    { name: 'Destinations', href: `/${lang}/destinations` },
  ];
}

export function destinationDetailCrumbs(
  lang: string,
  title: string,
  destinationPath: string,
): BreadcrumbItem[] {
  return [
    { name: 'Home', href: '/' },
    { name: 'Destinations', href: `/${lang}/destinations` },
    { name: title, href: destinationPath },
  ];
}
