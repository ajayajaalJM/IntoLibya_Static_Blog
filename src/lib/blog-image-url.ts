/**
 * Site delivery helpers for /media masters + on-disk responsive derivatives.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MEDIA_DERIVATIVE_WIDTHS,
  canonicalizeMediaPath,
  derivativeMediaPath,
  mediaSrcSetFromDerivatives,
} from './media-paths';

const OPT_WIDTHS = [400, 720, 960] as const;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const derivativeCache = new Map<string, number[]>();

function publicFileExists(mediaUrl: string): boolean {
  const full = path.join(repoRoot, 'public', mediaUrl.replace(/^\/+/, ''));
  try {
    return fs.existsSync(full);
  } catch {
    return false;
  }
}

/** Widths that exist on disk for this master (cached per build). */
export function availableDerivativeWidths(masterSrc: string): number[] {
  const master = canonicalizeMediaPath(masterSrc);
  if (!master.startsWith('/media/')) return [];
  const cached = derivativeCache.get(master);
  if (cached) return cached;

  const widths: number[] = [];
  for (const w of MEDIA_DERIVATIVE_WIDTHS) {
    if (publicFileExists(derivativeMediaPath(master, w))) widths.push(w);
  }
  derivativeCache.set(master, widths);
  return widths;
}

/**
 * Prefer a mid-size derivative when available; otherwise the master path.
 * Files under /public/media are static — never wrap in /_vercel/image.
 */
export function blogImageUrl(pathOrUrl: string, width?: number, _quality?: number): string {
  const master = canonicalizeMediaPath(pathOrUrl);
  if (!master.startsWith('/media/')) return pathOrUrl;

  const widths = availableDerivativeWidths(master);
  if (!widths.length) return master;

  const target = width ?? 720;
  const pick =
    [...widths].reverse().find((w) => w <= target) ??
    widths.find((w) => w >= target) ??
    widths[widths.length - 1];
  return derivativeMediaPath(master, pick);
}

export function blogImageSrcSet(pathOrUrl: string, _quality = 70): string {
  const master = canonicalizeMediaPath(pathOrUrl);
  if (!master.startsWith('/media/')) return '';

  const widths = availableDerivativeWidths(master);
  if (widths.length) return mediaSrcSetFromDerivatives(master, widths);

  // Fallback: same URL at nominal widths (legacy assets without derivatives)
  return OPT_WIDTHS.map((w) => `${master} ${w}w`).join(', ');
}

export { OPT_WIDTHS, MEDIA_DERIVATIVE_WIDTHS, derivativeMediaPath };
