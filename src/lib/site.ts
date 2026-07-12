import siteData from '../../data/site.json';

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
  heroHeadline: string;
  heroSubheadline: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  heroSlides?: HeroSlide[];
  testimonial: { quote: string; author: string; role: string };
  social: { facebook: string; instagram: string };
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
  return siteData as SiteConfig;
}
