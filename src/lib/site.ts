import siteData from '../../data/site.json';
import { normalizeTourbuilderHref } from './tourbuilder-links';

export interface HeroSlide {
  image: string;
  title: string;
  subtitle?: string;
  href: string;
}

export interface SiteConfig {
  logo: string;
  logoDark: string;
  favicon: string;
  /** Default Open Graph / Twitter share image (absolute path on this site). */
  ogImage: string;
  heroHeadline: string;
  heroSubheadline: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  heroSlides?: HeroSlide[];
  testimonial: { quote: string; author: string; role: string };
  social: { facebook: string; instagram: string; youtube: string };
  contact: {
    email: string;
    phone: string;
    phoneTel: string;
    whatsapp: string;
    whatsappMessage: string;
    instagramHandle: string;
  };
  quote: { text: string; author: string };
}

export function getSiteConfig(): SiteConfig {
  const site = structuredClone(siteData) as SiteConfig;
  site.primaryCtaUrl = normalizeTourbuilderHref(site.primaryCtaUrl);
  site.secondaryCtaUrl = normalizeTourbuilderHref(site.secondaryCtaUrl);
  site.heroSlides = site.heroSlides?.map((slide) => ({
    ...slide,
    href: normalizeTourbuilderHref(slide.href),
  }));
  return site;
}
