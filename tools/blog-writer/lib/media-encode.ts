import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  MEDIA_DERIVATIVE_WIDTHS,
  derivativeMediaPath,
  isDerivativeMediaPath,
  masterPathFromDerivative,
} from '../../../src/lib/media-paths';

export const DERIVATIVE_QUALITY = 84;

export interface EncodedMediaResult {
  masterPath: string;
  derivativePaths: string[];
  width: number;
  height: number;
}

function publicPathFromUrl(repoRoot: string, mediaUrl: string): string {
  const rel = mediaUrl.replace(/^\/+/, '');
  return path.join(repoRoot, 'public', rel);
}

/** Write lossless master + lossy responsive derivatives. Returns canonical master URL path. */
export async function writeLosslessMasterAndDerivatives(
  repoRoot: string,
  masterUrlPath: string,
  input: Buffer,
): Promise<EncodedMediaResult> {
  if (!masterUrlPath.startsWith('/media/') || isDerivativeMediaPath(masterUrlPath)) {
    throw new Error('Master path must be a /media/… file (not a .wN derivative)');
  }
  if (!/\.webp$/i.test(masterUrlPath)) {
    throw new Error('Master path must end in .webp');
  }

  const rotated = sharp(input).rotate();
  const meta = await rotated.metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;

  const masterFull = publicPathFromUrl(repoRoot, masterUrlPath);
  await fs.mkdir(path.dirname(masterFull), { recursive: true });

  const masterBuf = await rotated.clone().webp({ lossless: true }).toBuffer();
  await fs.writeFile(masterFull, masterBuf);

  const derivativePaths: string[] = [];
  for (const w of MEDIA_DERIVATIVE_WIDTHS) {
    if (width && w >= width) continue; // never upscale; skip widths >= source
    const derivUrl = derivativeMediaPath(masterUrlPath, w);
    const derivFull = publicPathFromUrl(repoRoot, derivUrl);
    const buf = await sharp(masterBuf)
      .resize({
        width: w,
        height: w,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: DERIVATIVE_QUALITY })
      .toBuffer();
    await fs.writeFile(derivFull, buf);
    derivativePaths.push(derivUrl);
  }

  // If image is smaller than smallest derivative width, still emit one delivery file at native size
  if (!derivativePaths.length && width > 0) {
    const w = Math.min(width, MEDIA_DERIVATIVE_WIDTHS[0]);
    const derivUrl = derivativeMediaPath(masterUrlPath, w);
    const derivFull = publicPathFromUrl(repoRoot, derivUrl);
    const buf = await sharp(masterBuf).webp({ quality: DERIVATIVE_QUALITY }).toBuffer();
    await fs.writeFile(derivFull, buf);
    derivativePaths.push(derivUrl);
  }

  return { masterPath: masterUrlPath, derivativePaths, width, height };
}

/** Generate missing `.wN.webp` files for an existing master without touching the master. */
export async function ensureDerivativesForMaster(
  repoRoot: string,
  masterUrlPath: string,
): Promise<{ masterPath: string; created: string[]; existing: string[] }> {
  const master = isDerivativeMediaPath(masterUrlPath)
    ? masterPathFromDerivative(masterUrlPath)
    : masterUrlPath;
  if (!master.startsWith('/media/')) {
    throw new Error('Path must be under /media/');
  }

  const masterFull = publicPathFromUrl(repoRoot, master);
  const masterBuf = await fs.readFile(masterFull);
  const meta = await sharp(masterBuf).metadata();
  const width = meta.width || 0;

  const created: string[] = [];
  const existing: string[] = [];

  for (const w of MEDIA_DERIVATIVE_WIDTHS) {
    if (width && w > width) continue;
    const derivUrl = derivativeMediaPath(master, w);
    const derivFull = publicPathFromUrl(repoRoot, derivUrl);
    try {
      await fs.access(derivFull);
      existing.push(derivUrl);
      continue;
    } catch {
      /* create */
    }
    const buf = await sharp(masterBuf)
      .resize({
        width: w,
        height: w,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: DERIVATIVE_QUALITY })
      .toBuffer();
    await fs.mkdir(path.dirname(derivFull), { recursive: true });
    await fs.writeFile(derivFull, buf);
    created.push(derivUrl);
  }

  if (!created.length && !existing.length && width > 0) {
    const w = Math.min(width, MEDIA_DERIVATIVE_WIDTHS[0]);
    const derivUrl = derivativeMediaPath(master, w);
    const derivFull = publicPathFromUrl(repoRoot, derivUrl);
    const buf = await sharp(masterBuf).webp({ quality: DERIVATIVE_QUALITY }).toBuffer();
    await fs.mkdir(path.dirname(derivFull), { recursive: true });
    await fs.writeFile(derivFull, buf);
    created.push(derivUrl);
  }

  return { masterPath: master, created, existing };
}

export function listExistingDerivativeWidths(
  masterUrlPath: string,
  siblingBasenames: string[],
): number[] {
  const masterBase = path.basename(masterUrlPath);
  const stem = masterBase.replace(/\.[^.]+$/, '');
  const ext = path.extname(masterBase);
  const widths: number[] = [];
  for (const name of siblingBasenames) {
    const m = new RegExp(`^${escapeRegExp(stem)}\\.w(\\d+)${escapeRegExp(ext)}$`, 'i').exec(name);
    if (m) widths.push(Number(m[1]));
  }
  return widths.sort((a, b) => a - b);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function slugifyUploadBasename(filename: string): string {
  return (
    path
      .basename(filename, path.extname(filename))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || `img-${Date.now()}`
  );
}
