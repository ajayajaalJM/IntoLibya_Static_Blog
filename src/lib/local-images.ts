import type { ImageMetadata } from 'astro';

import heroAcacus from '../assets/heroes/hero_acacus.jpg';
import heroEastLibya from '../assets/heroes/hero_east_libya.jpg';
import heroMosques from '../assets/heroes/hero_mosques.jpg';
import heroSabratha from '../assets/heroes/hero_sabratha.jpg';
import heroSahara from '../assets/heroes/hero_sahara.jpg';
import heroTripoli from '../assets/heroes/hero_tripoli.jpg';
import heroTripoliOldTown from '../assets/heroes/hero_tripoli_old_town.jpg';

import tourAdventure from '../assets/tours/adventure_time.jpg';
import tourExplore from '../assets/tours/lets_explore.jpg';
import tourQuick from '../assets/tours/quick_trip.jpg';
import tourSeasoned from '../assets/tours/seasoned.jpg';

import logoIcon from '../assets/branding/logo-icon.png';
import logoIconTransparent from '../assets/branding/logo-icon-transparent.png';

/** Map public URL paths → imported assets so Astro can emit AVIF/WebP + srcset. */
const LOCAL_IMAGES: Record<string, ImageMetadata> = {
  '/assets/heroes/hero_acacus.jpg': heroAcacus,
  '/assets/heroes/hero_east_libya.jpg': heroEastLibya,
  '/assets/heroes/hero_mosques.jpg': heroMosques,
  '/assets/heroes/hero_sabratha.jpg': heroSabratha,
  '/assets/heroes/hero_sahara.jpg': heroSahara,
  '/assets/heroes/hero_tripoli.jpg': heroTripoli,
  '/assets/heroes/hero_tripoli_old_town.jpg': heroTripoliOldTown,
  '/assets/tours/adventure_time.jpg': tourAdventure,
  '/assets/tours/lets_explore.jpg': tourExplore,
  '/assets/tours/quick_trip.jpg': tourQuick,
  '/assets/tours/seasoned.jpg': tourSeasoned,
  '/assets/branding/logo-icon.png': logoIcon,
  '/assets/branding/logo-icon-transparent.png': logoIconTransparent,
  '/logo-icon.png': logoIcon,
  '/logo-icon-transparent.png': logoIconTransparent,
};

export function resolveLocalImage(src: string): ImageMetadata | undefined {
  if (!src) return undefined;
  try {
    const path = src.startsWith('http') ? new URL(src).pathname : src.split('?')[0];
    return LOCAL_IMAGES[path];
  } catch {
    return LOCAL_IMAGES[src];
  }
}

export function isRemoteImage(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

/** Prefer local /media paths over legacy WordPress upload URLs. */
export function localizeMediaUrl(src: string): string {
  if (!src) return src;
  try {
    if (src.startsWith('/')) return src;
    const url = new URL(src);
    url.hostname = url.hostname.toLowerCase();
    if (
      (url.hostname === 'intolibya.com' || url.hostname === 'www.intolibya.com') &&
      url.pathname.startsWith('/wp-content/uploads/')
    ) {
      return url.pathname.replace('/wp-content/uploads/', '/media/');
    }
    return url.toString();
  } catch {
    return src;
  }
}

export { heroTripoli, logoIcon, logoIconTransparent };
