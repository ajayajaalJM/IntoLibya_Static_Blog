/**
 * Fetch freely licensed Libya-related heroes and assign them across Wave 2 posts.
 * Sources: Wikimedia Commons + existing destination/pool assets.
 * Usage: node scripts/fetch-wave2-post-heroes.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const POSTS_EN = path.join(ROOT, 'src/content/posts/en');
const MEDIA_POSTS = path.join(ROOT, 'public/media/posts');
const POOL_DIR = path.join(MEDIA_POSTS, '_hero-pool');
const CREDITS = path.join(MEDIA_POSTS, 'IMAGE_CREDITS.md');
const CATALOG = path.join(ROOT, 'content-review/next-200-seo-blog-posts.md');
const DEST_HEROES = path.join(ROOT, 'public/media/destinations');
const TMP_POOL = '/tmp/il-heroes';
const UA = 'IntoLibyaBlogBot/1.0 (post hero refresh; contact: intolibya.com)';

const THEMES = [
  {
    id: 'leptis',
    search: 'Leptis Magna Libya',
    preferred: ['Leptis Magna theatre.jpg', 'Leptis Magna.jpg', 'Leptis Magna Arch of Septimius Severus.jpg'],
    match: /leptis|roman|sabratha|villa-seline|horse-racing|unesco|luxor|carthage/,
  },
  {
    id: 'sabratha',
    search: 'Sabratha Libya theatre',
    preferred: ['Sabratha.jpg', 'Sabratha theatre.jpg', 'Sabratha Libya.jpg'],
    match: /sabratha|coastal|beach|mediterranean/,
  },
  {
    id: 'tripoli',
    search: 'Tripoli Libya medina',
    preferred: ['Tripoli Libya.jpg', 'Tripoli medina.jpg', 'Red Castle Tripoli.jpg', 'Martyrs Square Tripoli.jpg'],
    match: /tripoli|mitiga|museum|fish-market|football|sfenz|airport|pickup/,
  },
  {
    id: 'ghadames',
    search: 'Ghadames Libya old town',
    preferred: ['Ghadames.jpg', 'Ghadames Libya.jpg', 'Ghadames old town.jpg'],
    match: /ghadames|shafra|qaser|nafusa|nalut|damos/,
  },
  {
    id: 'sahara',
    search: 'Libya Sahara dunes Ubari',
    preferred: ['Ubari dunes.jpg', 'Libyan desert.jpg', 'Sahara Libya.jpg', 'Idehan Ubari.jpg'],
    match: /sahara|desert|dune|sandboard|camping|oasis|gaberoun|ubari|fezzan|germa|sebha|namus|mathendous|hattia|acacus|ghat/,
  },
  {
    id: 'cyrene',
    search: 'Cyrene Libya Shahat',
    preferred: ['Cyrene Libya.jpg', 'Shahat.jpg', 'Cyrene temple.jpg', 'Apollonia Libya.jpg'],
    match: /cyrene|shahat|susa|apollonia|benghazi|akhdar|bayda|ptolemais|tolmeita|olive|qasr-libya|east-libya|cyrenaica|eclipse|totality|tobruk|mukhtar/,
  },
  {
    id: 'nafusa',
    search: 'Nafusa Mountains Libya',
    preferred: ['Nafusa Mountains.jpg', 'Kabaw Libya.jpg', 'Nalut Libya.jpg'],
    match: /nafusa|nalut|tarmisa|paragliding|highland/,
  },
  {
    id: 'rally',
    search: 'Waddan Libya desert',
    preferred: ['Waddan Libya.jpg', 'Libyan desert road.jpg'],
    match: /rally|waddan/,
  },
  {
    id: 'general',
    search: 'Libya landscape Mediterranean',
    preferred: ['Libya coast.jpg', 'Libyan landscape.jpg'],
    match: /.*/,
  },
];

const ALLOWED_LICENSE_RE =
  /public domain|cc0|cc-by|cc by|creative commons attribution|pd-self|pd-old|pd-us|gfdl/i;

async function commonsApi(params) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
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

async function searchFiles(query, limit = 20) {
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
    meta?.LicenseShortName?.value || meta?.License?.value || meta?.UsageTerms?.value || '';
  const restrictions = meta?.Restrictions?.value || '';
  if (/non.?commercial|no.?deriv|all rights reserved/i.test(`${license} ${restrictions}`)) {
    return false;
  }
  return ALLOWED_LICENSE_RE.test(license) || /public domain/i.test(meta?.Copyright?.value || '');
}

function candidatesFromPages(pages) {
  return pages
    .filter((p) => p.imageinfo?.[0])
    .map((p) => {
      const info = p.imageinfo[0];
      const meta = info.extmetadata || {};
      return {
        title: p.title,
        url: info.thumburl || info.url,
        mime: info.mime,
        width: info.width || 0,
        license: meta.LicenseShortName?.value || meta.License?.value || 'unknown',
        artist: (meta.Artist?.value || meta.Credit?.value || 'Unknown')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
        commonsUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
        ok: licenseOk(meta) && /^image\//.test(info.mime || '') && (info.width || 0) >= 800,
      };
    })
    .filter((c) => c.ok)
    .sort((a, b) => b.width - a.width);
}

async function downloadToWebp(url, outPath, attempt = 1) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (res.status === 429 && attempt < 6) {
    await new Promise((r) => setTimeout(r, attempt * 2500));
    return downloadToWebp(url, outPath, attempt + 1);
  }
  if (!res.ok) throw new Error(`Download ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await sharp(buf)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outPath);
}

async function fileHash(filePath) {
  const buf = await fs.readFile(filePath);
  return createHash('sha256').update(buf).digest('hex');
}

async function ingestLocal(src, themeId, label, credits) {
  try {
    await fs.access(src);
  } catch {
    return null;
  }
  const out = path.join(POOL_DIR, `${themeId}-${label}.webp`);
  await fs.mkdir(POOL_DIR, { recursive: true });
  try {
    await sharp(src)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(out);
  } catch (e) {
    console.warn(`  skip local ${src}: ${e.message}`);
    return null;
  }
  const hash = await fileHash(out);
  credits.push({
    file: path.basename(out),
    theme: themeId,
    source: src,
    license: 'local-pool-or-destination',
    artist: 'see prior credits / IntoLibya media pool',
    hash,
  });
  return out;
}

async function fetchThemeImages(theme, credits, want = 8) {
  const saved = [];
  const tried = new Set();
  const titles = [...theme.preferred];
  const hits = await searchFiles(theme.search, 24);
  for (const h of hits) titles.push(h);

  for (let i = 0; i < titles.length && saved.length < want; i += 8) {
    const batch = titles.slice(i, i + 8).filter((t) => {
      if (tried.has(t)) return false;
      tried.add(t);
      return true;
    });
    if (!batch.length) continue;
    const pages = await imageInfo(batch);
    const cands = candidatesFromPages(pages);
    for (const c of cands) {
      if (saved.length >= want) break;
      const safe = c.title.replace(/^File:/, '').replace(/[^\w.-]+/g, '_').slice(0, 80);
      const out = path.join(POOL_DIR, `${theme.id}-${safe}.webp`);
      try {
        await downloadToWebp(c.url, out);
        const hash = await fileHash(out);
        if (credits.some((x) => x.hash === hash)) {
          await fs.unlink(out).catch(() => {});
          continue;
        }
        credits.push({
          file: path.basename(out),
          theme: theme.id,
          source: c.commonsUrl,
          license: c.license,
          artist: c.artist,
          hash,
        });
        saved.push(out);
        console.log(`  + ${theme.id}: ${c.title} (${c.license})`);
        await new Promise((r) => setTimeout(r, 400));
      } catch (e) {
        console.warn(`  skip ${c.title}: ${e.message}`);
      }
    }
  }
  return saved;
}

function themeForSlug(slug) {
  for (const t of THEMES) {
    if (t.id === 'general') continue;
    if (t.match.test(slug)) return t.id;
  }
  return 'general';
}

async function loadWave2Slugs() {
  const text = await fs.readFile(CATALOG, 'utf8');
  const slugs = [];
  for (const line of text.split('\n')) {
    if (!/^\| \d+ \|/.test(line)) continue;
    const parts = line.split('|').map((p) => p.trim());
    const id = Number(parts[1]);
    if (id < 201) continue;
    slugs.push(parts[3].replace(/`/g, ''));
  }
  return slugs;
}

async function main() {
  await fs.mkdir(POOL_DIR, { recursive: true });
  const credits = [];

  console.log('Ingesting destination + local pool images…');
  const destDirs = await fs.readdir(DEST_HEROES).catch(() => []);
  for (const d of destDirs) {
    const hero = path.join(DEST_HEROES, d, 'hero.webp');
    const theme =
      /benghazi|shahat|susa|akhdar|ptolemais|qasr|tobruk/.test(d)
        ? 'cyrene'
        : /ghat|germa|wadi|waw|waddan/.test(d)
          ? 'sahara'
          : /nafusa/.test(d)
            ? 'nafusa'
            : /misrata/.test(d)
              ? 'tripoli'
              : 'general';
    await ingestLocal(hero, theme, `dest-${d}`, credits);
  }

  const tmpFiles = await fs.readdir(TMP_POOL).catch(() => []);
  for (const f of tmpFiles) {
    if (!/\.(jpe?g|webp|png)$/i.test(f)) continue;
    const theme =
      /leptis|sabratha|roman/.test(f)
        ? 'leptis'
        : /ghadames|nafusa|shafra/.test(f)
          ? 'ghadames'
          : /sahara|acacus|ghat|desert|cdn-a3[68]|cdn-a4[45]/.test(f)
            ? 'sahara'
            : /east|cyrene|benghazi/.test(f)
              ? 'cyrene'
              : /tripoli|tour|cairo|tunis|abstract/.test(f)
                ? 'tripoli'
                : /rally|waddan/.test(f)
                  ? 'rally'
                  : 'general';
    await ingestLocal(path.join(TMP_POOL, f), theme, f.replace(/\W+/g, '_'), credits);
  }

  console.log('Fetching Wikimedia Commons images…');
  for (const theme of THEMES) {
    console.log(`Theme ${theme.id}`);
    await fetchThemeImages(theme, credits, theme.id === 'general' ? 6 : 10);
  }

  // Deduplicate pool by hash keep first
  const byTheme = new Map();
  for (const c of credits) {
    const p = path.join(POOL_DIR, c.file);
    try {
      await fs.access(p);
    } catch {
      continue;
    }
    if (!byTheme.has(c.theme)) byTheme.set(c.theme, []);
    const list = byTheme.get(c.theme);
    if (list.some((x) => x.hash === c.hash)) continue;
    list.push({ ...c, path: p });
  }

  const slugs = await loadWave2Slugs();
  const counters = new Map();
  let assigned = 0;
  const assignmentLog = [];

  for (const slug of slugs) {
    let theme = themeForSlug(slug);
    let pool = byTheme.get(theme) || [];
    if (!pool.length) {
      theme = 'general';
      pool = byTheme.get('general') || [];
    }
    // fallback any
    if (!pool.length) {
      pool = [...byTheme.values()].flat();
    }
    if (!pool.length) {
      console.warn(`No pool image for ${slug}`);
      continue;
    }
    const i = counters.get(theme) || 0;
    const pick = pool[i % pool.length];
    counters.set(theme, i + 1);

    const outDir = path.join(MEDIA_POSTS, slug);
    const outHero = path.join(outDir, 'hero.webp');
    await fs.mkdir(outDir, { recursive: true });
    await fs.copyFile(pick.path, outHero);
    assignmentLog.push(`- \`${slug}\` ← ${pick.file} (${theme})`);
    assigned++;
  }

  const md = [
    '# Post hero image credits',
    '',
    'Wave 2 heroes refreshed from Wikimedia Commons (freely licensed) and existing IntoLibya destination/media pool assets.',
    '',
    '## Pool sources',
    '',
    ...credits.map(
      (c) =>
        `- **${c.file}** — theme \`${c.theme}\` — ${c.license} — ${c.artist} — ${c.source}`,
    ),
    '',
    '## Assignments (Wave 2)',
    '',
    ...assignmentLog,
    '',
  ].join('\n');
  await fs.writeFile(CREDITS, md);

  const uniqueAssigned = new Set(
    (await Promise.all(
      slugs.map(async (s) => {
        try {
          return await fileHash(path.join(MEDIA_POSTS, s, 'hero.webp'));
        } catch {
          return null;
        }
      }),
    )).filter(Boolean),
  );

  console.log(`Assigned heroes to ${assigned} Wave 2 posts`);
  console.log(`Unique hero hashes among Wave 2: ${uniqueAssigned.size}`);
  console.log(`Credits: ${CREDITS}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
