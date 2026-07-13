/**
 * Download freely licensed Wikimedia Commons images for new destination heroes.
 * Usage: node scripts/fetch-destination-heroes.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_ROOT = path.join(ROOT, 'public/media/destinations');
const UA = 'IntoLibyaBlogBot/1.0 (destination hero fetch; contact: intolibya.com)';

/** Prefer known good Commons filenames when search is noisy. */
const DESTINATIONS = [
  {
    slug: 'ghat',
    search: 'Ghat Libya',
    preferred: ['Ghat Libya.JPG', 'Ghat_Libya.JPG', 'Ghat oasis.jpg'],
  },
  {
    slug: 'jebel-nafusa',
    search: 'Nafusa Mountains Libya',
    preferred: ['Nafusa Mountains.jpg', 'Jebel Nafusa.jpg', 'Kabaw Libya.jpg'],
  },
  {
    slug: 'waw-an-namus',
    search: 'Waw an Namus',
    preferred: ['Waw an Namus.jpg', 'Waw_an_Namus.jpg', 'Uau an Namus.jpg'],
  },
  {
    slug: 'germa',
    search: 'Germa Libya Garama',
    preferred: ['Germa Libya.jpg', 'Garama.jpg', 'Germa ruins.jpg'],
  },
  {
    slug: 'benghazi',
    search: 'Benghazi Libya',
    preferred: ['Benghazi.jpg', 'Benghazi Libya.jpg', 'Benghazi Corniche.jpg'],
  },
  {
    slug: 'tobruk',
    search: 'Tobruk Libya',
    preferred: ['Tobruk.jpg', 'Tobruk Libya.jpg', 'Tobruk harbour.jpg'],
  },
  {
    slug: 'ptolemais',
    search: 'Ptolemais Libya Tolmeita',
    preferred: ['Ptolemais Libya.jpg', 'Tolmeita.jpg', 'Ptolemais.jpg'],
  },
  {
    slug: 'qasr-libya',
    search: 'Qasr Libya mosaic',
    preferred: ['Qasr Libya.jpg', 'Qasr Libya mosaic.jpg', 'Kasr Libya.jpg'],
  },
  {
    slug: 'jebel-akhdar',
    search: 'Jebel Akhdar Libya',
    preferred: ['Jebel Akhdar Libya.jpg', 'Green Mountains Libya.jpg', 'Cyrenaica landscape.jpg'],
  },
  {
    slug: 'misrata',
    search: 'Misrata Libya',
    preferred: ['Misrata.jpg', 'Misurata.jpg', 'Misrata Libya.jpg'],
  },
  {
    slug: 'wadi-mathendous',
    search: 'Wadi Mathendous rock art',
    preferred: ['Wadi Mathendous.jpg', 'Mathendous.jpg', 'Messak Settafet.jpg'],
  },
];

const ALLOWED_LICENSE_RE =
  /public domain|cc0|cc-by|cc by|creative commons attribution|pd-self|pd-old|pd-us|gfdl/i;

async function commonsApi(params) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status}: ${url}`);
  return res.json();
}

async function imageInfo(titles) {
  const data = await commonsApi({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    titles: titles.map((t) => (t.startsWith('File:') ? t : `File:${t}`)).join('|'),
    iiprop: 'url|extmetadata|size|mime',
    iiurlwidth: 1920,
  });
  return Object.values(data.query?.pages ?? {});
}

async function searchFiles(query, limit = 12) {
  const data = await commonsApi({
    action: 'query',
    format: 'json',
    list: 'search',
    srsearch: `filetype:bitmap ${query}`,
    srnamespace: 6,
    srlimit: limit,
  });
  return (data.query?.search ?? []).map((s) => s.title.replace(/^File:/, ''));
}

function licenseOk(meta) {
  const license =
    meta?.LicenseShortName?.value ||
    meta?.License?.value ||
    meta?.UsageTerms?.value ||
    '';
  const restrictions = meta?.Restrictions?.value || '';
  if (/non.?commercial|no.?deriv|all rights reserved/i.test(`${license} ${restrictions}`)) {
    return false;
  }
  return ALLOWED_LICENSE_RE.test(license) || /public domain/i.test(meta?.Copyright?.value || '');
}

function pickBest(pages) {
  const candidates = pages
    .filter((p) => p.imageinfo?.[0])
    .map((p) => {
      const info = p.imageinfo[0];
      const meta = info.extmetadata || {};
      return {
        title: p.title,
        url: info.thumburl || info.url,
        fullUrl: info.url,
        mime: info.mime,
        width: info.width,
        license: meta.LicenseShortName?.value || meta.License?.value || 'unknown',
        artist: (meta.Artist?.value || meta.Credit?.value || 'Unknown')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
        description: (meta.ImageDescription?.value || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 200),
        commonsUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
        ok: licenseOk(meta) && /^image\//.test(info.mime || ''),
      };
    })
    .filter((c) => c.ok);

  candidates.sort((a, b) => (b.width || 0) - (a.width || 0));
  return candidates[0] || null;
}

async function resolveImage(dest) {
  const tried = new Set();
  const titles = [];

  for (const name of dest.preferred) {
    if (tried.has(name)) continue;
    tried.add(name);
    titles.push(name);
  }

  const searchHits = await searchFiles(dest.search);
  for (const name of searchHits) {
    if (tried.has(name)) continue;
    tried.add(name);
    titles.push(name);
  }

  // Batch in groups of 10
  for (let i = 0; i < titles.length; i += 10) {
    const batch = titles.slice(i, i + 10);
    const pages = await imageInfo(batch);
    const best = pickBest(pages);
    if (best) return best;
  }
  return null;
}

async function downloadToWebp(url, outPath, attempt = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.status === 429 && attempt < 5) {
    const wait = attempt * 3000;
    console.log(`rate-limited, retry in ${wait}ms…`);
    await new Promise((r) => setTimeout(r, wait));
    return downloadToWebp(url, outPath, attempt + 1);
  }
  if (!res.ok) throw new Error(`Download failed ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await sharp(buf)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outPath);
}

async function main() {
  const credits = [
    '# Destination hero image credits',
    '',
    'All heroes sourced from Wikimedia Commons under free licenses.',
    '',
  ];
  const results = [];

  for (const dest of DESTINATIONS) {
    const outPath = path.join(OUT_ROOT, dest.slug, 'hero.webp');
    try {
      await fs.access(outPath);
      console.log(`Skipping ${dest.slug} (already exists)`);
      credits.push(
        `## ${dest.slug}`,
        '',
        `- **File:** \`/media/destinations/${dest.slug}/hero.webp\``,
        `- **Note:** Existing file retained (re-run after delete to refresh credits).`,
        '',
      );
      results.push({ slug: dest.slug, ok: true, skipped: true });
      continue;
    } catch {
      // missing — fetch
    }

    process.stdout.write(`Resolving ${dest.slug}… `);
    await new Promise((r) => setTimeout(r, 2000));
    const image = await resolveImage(dest);
    if (!image) {
      console.log('FAILED — no licensed image found');
      results.push({ slug: dest.slug, ok: false });
      credits.push(`## ${dest.slug}`, '', '_No image found — needs manual source._', '');
      continue;
    }

    await downloadToWebp(image.url, outPath);
    console.log(`OK → ${path.relative(ROOT, outPath)} (${image.license})`);

    credits.push(
      `## ${dest.slug}`,
      '',
      `- **File:** \`/media/destinations/${dest.slug}/hero.webp\``,
      `- **Source:** [${image.title}](${image.commonsUrl})`,
      `- **Author:** ${image.artist}`,
      `- **License:** ${image.license}`,
      `- **Description:** ${image.description || '—'}`,
      '',
    );
    results.push({ slug: dest.slug, ok: true, title: image.title });
  }

  await fs.writeFile(path.join(OUT_ROOT, 'IMAGE_CREDITS.md'), `${credits.join('\n')}\n`, 'utf8');
  const failed = results.filter((r) => !r.ok);
  console.log(`\nDone. ${results.length - failed.length}/${results.length} heroes saved.`);
  if (failed.length) {
    console.log('Failed:', failed.map((f) => f.slug).join(', '));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
