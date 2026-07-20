/**
 * QA helpers for unpublished EN posts (writer dashboard only).
 */
import fs from 'node:fs';
import path from 'node:path';

export type QaSeverity = 'error' | 'warn';

export type QaError = {
  id: string;
  severity: QaSeverity;
  label: string;
  snippet?: string;
};

export type QaScanResult = {
  errors: QaError[];
  htmlHighlighted: string;
  wordCount: number;
  errorCount: number;
  warnCount: number;
};

export type QaCard = {
  slug: string;
  title: string;
  translationGroup: string;
  publishedAt: string;
  draft: boolean;
  featuredImage?: string;
  sourcePath: string;
  wordCount: number;
  errorCount: number;
  warnCount: number;
  errors: QaError[];
  htmlHighlighted: string;
  status: 'error' | 'warn' | 'ok';
};

type PostLike = {
  lang: string;
  slug: string;
  title: string;
  translationGroup: string;
  publishedAt: string;
  draft?: boolean;
  featuredImage?: string;
  body: string;
  path: string;
};

const FORBIDDEN: Array<{ re: RegExp; id: string; label: string }> = [
  { re: /\bSoft CTA\b/i, id: 'soft-cta', label: 'Soft CTA (planning jargon)' },
  { re: /\bSoft next step\b/i, id: 'soft-next', label: 'Soft next step (planning jargon)' },
  { re: /\bNext step:/i, id: 'next-step', label: 'Next step: (planning jargon prefix)' },
  { re: /\bTraveler angle\b/i, id: 'traveler-angle', label: 'Traveler angle (template heading)' },
  { re: /\bSME confirm\b/i, id: 'sme-confirm', label: 'SME confirm (internal flag)' },
  { re: /\bSME review\b/i, id: 'sme-review', label: 'SME review (internal flag)' },
  { re: /\bSME confirmation\b/i, id: 'sme-confirmation', label: 'SME confirmation (internal flag)' },
  {
    re: /when notes flag uncertainty/i,
    id: 'notes-flag',
    label: 'notes flag uncertainty (generator boilerplate)',
  },
  {
    re: /Hotels stay vague on purpose/i,
    id: 'hotels-vague',
    label: 'Hotels stay vague on purpose (generator boilerplate)',
  },
  {
    re: /Access is guided and licensed\. Hotels stay vague/i,
    id: 'access-hotels',
    label: 'Access/hotels SME boilerplate',
  },
  { re: /\bdestination SEO\b/i, id: 'dest-seo', label: 'destination SEO (shop talk)' },
  { re: /\bmicro content\b/i, id: 'micro-content', label: 'micro content (shop talk)' },
  { re: /\bsoft CTAs\b/i, id: 'soft-ctas', label: 'soft CTAs (shop talk)' },
  {
    re: /answers the search around/i,
    id: 'answers-search',
    label: 'answers the search around (SEO template)',
  },
  {
    re: /Why this place earns its own page/i,
    id: 'earns-page',
    label: 'Why this place earns its own page (SEO template)',
  },
  { re: /\bearns its own page\b/i, id: 'earns-page-2', label: 'earns its own page (SEO template)' },
  { re: /Closing east sampler/i, id: 'closing-east', label: 'Closing east sampler (catalog Notes)' },
  { re: /\bAccessible east\b/i, id: 'accessible-east', label: 'Accessible east (catalog Notes)' },
  {
    re: /\bguest facing version\b/i,
    id: 'guest-facing',
    label: 'guest facing version (meta shop talk)',
  },
  { re: /\bpackage bones\b/i, id: 'package-bones', label: 'package bones (shop talk)' },
  { re: /\bWave 1\b/, id: 'wave-1', label: 'Wave 1 (internal content wave label)' },
  { re: /\bWave 2\b/, id: 'wave-2', label: 'Wave 2 (internal content wave label)' },
  { re: /send us a note\b/i, id: 'send-note', label: 'send us a note (email CTA)' },
  { re: /send a short note\b/i, id: 'send-short', label: 'send a short note (email CTA)' },
  {
    re: /<!--\s*primary-keyword/i,
    id: 'primary-keyword',
    label: 'primary-keyword HTML comment in body',
  },
  { re: /<!--\s*cdn-refs/i, id: 'cdn-refs', label: 'cdn-refs HTML comment in body' },
  {
    re: /sounds like a packing list/i,
    id: 'packing-list',
    label: 'packing list metaphor (stale stamp)',
  },
  {
    re: /discovery with adult supervision/i,
    id: 'adult-supervision',
    label: 'adult supervision metaphor (stale stamp)',
  },
  { re: /plastic pyramid/i, id: 'plastic-pyramid', label: 'plastic pyramid metaphor (stale stamp)' },
  {
    re: /Mint tea after dusty shoes/i,
    id: 'mint-tea',
    label: 'mint tea stamp metaphor',
  },
  {
    re: /Why guests say they will come back/i,
    id: 'come-back',
    label: 'Why guests say they will come back (stale h2)',
  },
  {
    re: /Little joys that do not show up/i,
    id: 'little-joys',
    label: 'Little joys packing list (stale h2)',
  },
  {
    re: /Beauty plus a workable plan/i,
    id: 'beauty-plan',
    label: 'Beauty plus workable plan (stale closer)',
  },
  {
    re: /That is the whole pitch/i,
    id: 'whole-pitch',
    label: 'whole pitch closer (stale stamp)',
  },
  {
    re: /Here is the honest version from the IntoLibya team/i,
    id: 'honest-version',
    label: 'honest version stamp opener',
  },
];

const JUNK_H2: Array<{ re: RegExp; id: string; label: string }> = [
  {
    re: /planning note \d+/i,
    id: 'junk-h2-planning-note',
    label: 'Junk H2: planning note N',
  },
  {
    re: /guest notes? \d+/i,
    id: 'junk-h2-guest-note',
    label: 'Junk H2: guest notes N',
  },
  {
    re: /\bregarding\b/i,
    id: 'junk-h2-regarding',
    label: 'Junk H2: regarding …',
  },
  {
    re: /Who thrives when /i,
    id: 'junk-h2-thrives',
    label: 'Junk H2: machine template Who thrives when',
  },
];

function buildLinkIndex(repoRoot: string): { posts: Set<string>; dests: Set<string> } {
  const posts = new Set<string>();
  const dests = new Set<string>();
  const postsDir = path.join(repoRoot, 'src/content/posts/en');
  const destsDir = path.join(repoRoot, 'src/content/destinations/en');
  if (fs.existsSync(postsDir)) {
    for (const f of fs.readdirSync(postsDir)) {
      if (f.endsWith('.md')) posts.add(f.replace(/\.md$/, ''));
    }
  }
  if (fs.existsSync(destsDir)) {
    for (const f of fs.readdirSync(destsDir)) {
      if (f.endsWith('.md')) dests.add(f.replace(/\.md$/, ''));
    }
  }
  return { posts, dests };
}

/** Draft or future publishedAt → not live yet. */
export function isUnpublishedPost(
  data: { draft?: boolean; publishedAt: string },
  now: Date = new Date(),
): boolean {
  if (data.draft === true) return true;
  const day = String(data.publishedAt ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return true;
  const pub = new Date(`${day}T00:00:00`);
  if (Number.isNaN(pub.getTime())) return true;
  return pub.getTime() > now.getTime();
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function wordCount(html: string): number {
  const text = stripTags(html);
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightInHtml(
  html: string,
  re: RegExp,
  qaId: string,
): { html: string; matched: boolean; snippet?: string } {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const globalRe = new RegExp(re.source, flags);
  const parts = html.split(/(<[^>]+>)/);
  let matched = false;
  let snippet: string | undefined;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part || part.startsWith('<')) continue;
    globalRe.lastIndex = 0;
    const m = globalRe.exec(part);
    if (!m) continue;
    matched = true;
    snippet = m[0].slice(0, 80);
    parts[i] = part.replace(
      globalRe,
      (hit) => `<mark class="qa-hit" data-qa="${escapeHtml(qaId)}">${hit}</mark>`,
    );
    break;
  }
  return { html: parts.join(''), matched, snippet };
}

function proseHyphenIssues(html: string): { count: number; snippet?: string } {
  const parts = html.split(/(<[^>]+>)/);
  for (const part of parts) {
    if (!part || part.startsWith('<')) continue;
    const m = part.match(/[A-Za-z0-9]-[A-Za-z0-9]/);
    if (m) {
      const idx = part.indexOf(m[0]);
      const start = Math.max(0, idx - 20);
      const end = Math.min(part.length, idx + m[0].length + 20);
      return { count: 1, snippet: part.slice(start, end).trim() };
    }
  }
  return { count: 0 };
}

function inlineEnLinkCount(html: string): number {
  const pre = html.split(/<h2>\s*Related reading\s*<\/h2>/i)[0] ?? html;
  const matches = pre.match(/href="\/en\/[^"#]+"/g);
  return matches?.length ?? 0;
}

function brokenInternalLinks(
  html: string,
  index: { posts: Set<string>; dests: Set<string> },
): string[] {
  const broken: string[] = [];
  const re = /href="(\/en\/[^"#]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = m[1];
    const slug = href.replace(/\/$/, '').split('/').pop() || '';
    if (href.startsWith('/en/destination/')) {
      if (!index.dests.has(slug)) broken.push(href);
    } else if (!index.posts.has(slug)) {
      broken.push(href);
    }
  }
  return [...new Set(broken)];
}

export function scanPostBody(
  html: string,
  linkIndex: { posts: Set<string>; dests: Set<string> },
): QaScanResult {
  const errors: QaError[] = [];
  let highlighted = html;
  const wc = wordCount(html);

  for (const rule of FORBIDDEN) {
    const result = highlightInHtml(highlighted, rule.re, rule.id);
    highlighted = result.html;
    if (result.matched) {
      errors.push({
        id: rule.id,
        severity: 'error',
        label: rule.label,
        snippet: result.snippet,
      });
    }
  }

  const h2s = [...html.matchAll(/<h2>(.*?)<\/h2>/gi)].map((m) => m[1]);
  for (const h of h2s) {
    if (h === 'Related reading' || h === 'Plan your Libya trip with IntoLibya') {
      continue;
    }
    for (const rule of JUNK_H2) {
      if (rule.re.test(h)) {
        errors.push({
          id: rule.id,
          severity: 'error',
          label: rule.label,
          snippet: h.slice(0, 100),
        });
        const result = highlightInHtml(
          highlighted,
          new RegExp(h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
          rule.id,
        );
        highlighted = result.html;
        break;
      }
    }
    const words = h.trim().split(/\s+/);
    const last = words[words.length - 1] || '';
    if (
      words.length >= 5 &&
      /^[A-Z][a-z]{0,2}$/.test(last) &&
      !['CTA', 'OG', 'SEO', 'FAQ'].includes(last)
    ) {
      errors.push({
        id: 'truncated-h2',
        severity: 'error',
        label: 'Junk H2: truncated title stump',
        snippet: h.slice(0, 100),
      });
    }
  }

  const hy = proseHyphenIssues(html);
  if (hy.count > 0) {
    errors.push({
      id: 'prose-hyphen',
      severity: 'error',
      label: 'Hyphen character in body prose',
      snippet: hy.snippet,
    });
    const result = highlightInHtml(
      highlighted,
      /[A-Za-z0-9]+-[A-Za-z0-9]+/,
      'prose-hyphen',
    );
    highlighted = result.html;
  }

  if (!/<h2>\s*Related reading\s*<\/h2>/i.test(html)) {
    errors.push({
      id: 'missing-related',
      severity: 'error',
      label: 'Missing Related reading section',
    });
  }
  if (!/\/tourbuilder\/booking/.test(html)) {
    errors.push({
      id: 'missing-cta',
      severity: 'error',
      label: 'Missing TourBuilder booking CTA',
    });
  }

  if (wc < 500) {
    errors.push({
      id: 'short-wordcount',
      severity: 'warn',
      label: `Word count ${wc} (floor 500)`,
    });
  }

  const inlineLinks = inlineEnLinkCount(html);
  if (inlineLinks < 2) {
    errors.push({
      id: 'thin-inline-links',
      severity: 'warn',
      label: `Fewer than 2 inline /en/ links (${inlineLinks})`,
    });
  }

  const broken = brokenInternalLinks(html, linkIndex);
  for (const href of broken.slice(0, 8)) {
    errors.push({
      id: `broken-link:${href}`,
      severity: 'warn',
      label: `Broken internal link: ${href}`,
      snippet: href,
    });
  }

  const seen = new Set<string>();
  const deduped: QaError[] = [];
  for (const e of errors) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    deduped.push(e);
  }

  return {
    errors: deduped,
    htmlHighlighted: highlighted,
    wordCount: wc,
    errorCount: deduped.filter((e) => e.severity === 'error').length,
    warnCount: deduped.filter((e) => e.severity === 'warn').length,
  };
}

export function buildQaCardsFromPosts(repoRoot: string, posts: PostLike[]): QaCard[] {
  const linkIndex = buildLinkIndex(repoRoot);
  const unpublished = posts
    .filter((p) => p.lang === 'en' && isUnpublishedPost(p))
    .sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));

  return unpublished.map((post) => {
    const scan = scanPostBody(post.body || '', linkIndex);
    return {
      slug: post.slug,
      title: post.title,
      translationGroup: post.translationGroup || post.slug,
      publishedAt: post.publishedAt.slice(0, 10),
      draft: post.draft === true,
      featuredImage: post.featuredImage,
      sourcePath: post.path || `src/content/posts/en/${post.slug}.md`,
      wordCount: scan.wordCount,
      errorCount: scan.errorCount,
      warnCount: scan.warnCount,
      errors: scan.errors,
      htmlHighlighted: scan.htmlHighlighted,
      status: scan.errorCount > 0 ? 'error' : scan.warnCount > 0 ? 'warn' : 'ok',
    };
  });
}
