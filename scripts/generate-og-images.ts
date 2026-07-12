import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import matter from 'gray-matter';
import {
  DEFAULT_OG_IMAGE,
  OG_HEIGHT,
  OG_WIDTH,
  ogPathForFeaturedImage,
} from '../src/lib/og';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const postsDir = path.join(root, 'src/content/posts');
const publicDir = path.join(root, 'public');
const ogDir = path.join(publicDir, 'media/og');
const ogPostsDir = path.join(ogDir, 'posts');

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Cover-crop any local public image to the OG ratio. */
async function writeCoverOg(sourcePublicPath: string, destPublicPath: string): Promise<void> {
  const src = path.join(publicDir, sourcePublicPath.replace(/^\/+/, ''));
  const dest = path.join(publicDir, destPublicPath.replace(/^\/+/, ''));
  if (!(await fileExists(src))) {
    throw new Error(`OG source missing: ${sourcePublicPath}`);
  }
  await ensureDir(path.dirname(dest));
  await sharp(src)
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(dest);
}

/**
 * Homepage / default share card: Libya photo background + centered logo.
 * Never stretch the square logo into 1.91:1 — compose it on a proper canvas.
 */
async function generateHomeOg(): Promise<string> {
  const destRel = DEFAULT_OG_IMAGE;
  const dest = path.join(publicDir, destRel.replace(/^\/+/, ''));
  await ensureDir(ogDir);

  const bg = sharp(path.join(publicDir, 'assets/heroes/hero_tripoli.jpg'))
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' });

  const dimmed = await bg
    .modulate({ brightness: 0.72, saturation: 0.92 })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${OG_WIDTH}" height="${OG_HEIGHT}">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#2d2a26" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#2d2a26" stop-opacity="0.55"/>
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#g)"/>
          </svg>`,
        ),
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();

  const logoSize = 280;
  const logo = await sharp(path.join(publicDir, 'assets/branding/logo-icon-transparent.png'))
    .resize(logoSize, logoSize, { fit: 'inside' })
    .png()
    .toBuffer();

  const logoMeta = await sharp(logo).metadata();
  const lw = logoMeta.width ?? logoSize;
  const lh = logoMeta.height ?? logoSize;

  await sharp(dimmed)
    .composite([
      {
        input: logo,
        top: Math.round((OG_HEIGHT - lh) / 2),
        left: Math.round((OG_WIDTH - lw) / 2),
      },
    ])
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(dest);

  return destRel;
}

async function collectFeaturedImages(): Promise<string[]> {
  const images = new Set<string>();
  const langs = await fs.readdir(postsDir);
  for (const lang of langs) {
    const dir = path.join(postsDir, lang);
    const stat = await fs.stat(dir).catch(() => null);
    if (!stat?.isDirectory()) continue;
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const raw = await fs.readFile(path.join(dir, file), 'utf8');
      const { data } = matter(raw);
      const featured = String(data.featuredImage ?? '').trim();
      if (featured.startsWith('/')) images.add(featured);
    }
  }
  return [...images];
}

async function main() {
  console.log(`Generating OG images at ${OG_WIDTH}×${OG_HEIGHT}…`);
  const home = await generateHomeOg();
  console.log(`✓ ${home}`);

  await ensureDir(ogPostsDir);
  const featured = await collectFeaturedImages();
  let written = 0;
  let skipped = 0;

  for (const src of featured) {
    const destRel = ogPathForFeaturedImage(src);
    const destAbs = path.join(publicDir, destRel.replace(/^\/+/, ''));
    const srcAbs = path.join(publicDir, src.replace(/^\/+/, ''));
    if (!(await fileExists(srcAbs))) {
      console.warn(`⚠ skip missing source ${src}`);
      continue;
    }
    let needsWrite = !(await fileExists(destAbs));
    if (!needsWrite) {
      const [s, d] = await Promise.all([fs.stat(srcAbs), fs.stat(destAbs)]);
      needsWrite = s.mtimeMs > d.mtimeMs;
    }
    if (!needsWrite) {
      skipped += 1;
      continue;
    }
    await writeCoverOg(src, destRel);
    written += 1;
  }

  console.log(`✓ post OG crops: ${written} written, ${skipped} up-to-date (${featured.length} sources)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
