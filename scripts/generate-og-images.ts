import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import matter from 'gray-matter';
import {
  DEFAULT_OG_IMAGE,
  DEFAULT_PINTEREST_IMAGE,
  OG_HEIGHT,
  OG_WIDTH,
  PIN_HEIGHT,
  PIN_WIDTH,
  ogPathForFeaturedImage,
} from '../src/lib/og';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const postsDir = path.join(root, 'src/content/posts');
const publicDir = path.join(root, 'public');
const ogDir = path.join(publicDir, 'media/og');
const ogPostsDir = path.join(ogDir, 'posts');
const socialBannerSrc = path.join(publicDir, 'assets/branding/social-banner.png');

/** Warm sand from the brand artwork — used when letterboxing to pin ratio. */
const SAND = { r: 237, g: 230, b: 217 };

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

/** Cover-crop any local public image to the OG ratio (blog post heroes). */
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
 * Place artwork on a sand canvas without stretching (used for vertical Pinterest pin).
 */
async function composeOnCanvas(
  sourcePath: string,
  width: number,
  height: number,
  maxContentRatio = 0.88,
): Promise<Buffer> {
  if (!(await fileExists(sourcePath))) {
    throw new Error(`Missing source image: ${sourcePath}`);
  }

  const maxW = Math.round(width * maxContentRatio);
  const maxH = Math.round(height * maxContentRatio);
  const artwork = await sharp(sourcePath)
    .rotate()
    .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer();

  const meta = await sharp(artwork).metadata();
  const aw = meta.width ?? maxW;
  const ah = meta.height ?? maxH;

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: SAND,
    },
  })
    .composite([
      {
        input: artwork,
        top: Math.round((height - ah) / 2),
        left: Math.round((width - aw) / 2),
      },
    ])
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();
}

/**
 * Homepage / blog-index OG from social-banner (already ~1.91:1 → exact 1200×630)
 * plus a letterboxed Pinterest pin.
 */
async function generateSocialBannerImages(): Promise<{ og: string; pin: string }> {
  await ensureDir(ogDir);
  if (!(await fileExists(socialBannerSrc))) {
    throw new Error('Missing public/assets/branding/social-banner.png');
  }

  const ogDest = path.join(publicDir, DEFAULT_OG_IMAGE.replace(/^\/+/, ''));
  const pinDest = path.join(publicDir, DEFAULT_PINTEREST_IMAGE.replace(/^\/+/, ''));

  // Source is already ~1.91:1 — cover into exact OG dimensions.
  await sharp(socialBannerSrc)
    .rotate()
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(ogDest);

  await sharp(await composeOnCanvas(socialBannerSrc, PIN_WIDTH, PIN_HEIGHT, 0.92)).toFile(pinDest);

  return { og: DEFAULT_OG_IMAGE, pin: DEFAULT_PINTEREST_IMAGE };
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
      const filePath = path.join(dir, file);
      const raw = await fs.readFile(filePath, 'utf8');
      let data: Record<string, unknown>;
      try {
        data = matter(raw).data as Record<string, unknown>;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to parse frontmatter in ${path.relative(root, filePath)}: ${reason}`);
      }
      const featured = String(data.featuredImage ?? '').trim();
      if (featured.startsWith('/')) images.add(featured);
    }
  }
  return [...images];
}

async function main() {
  console.log(`Generating social-banner OG ${OG_WIDTH}×${OG_HEIGHT} + pin ${PIN_WIDTH}×${PIN_HEIGHT}…`);
  const brand = await generateSocialBannerImages();
  console.log(`✓ ${brand.og}`);
  console.log(`✓ ${brand.pin}`);

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
