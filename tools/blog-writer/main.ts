import { dump as yamlDump } from 'js-yaml';

const form = document.getElementById('form') as HTMLFormElement;
const output = document.getElementById('output') as HTMLPreElement;
const targetPath = document.getElementById('targetPath') as HTMLParagraphElement;
const copyBtn = document.getElementById('copy') as HTMLButtonElement;
const downloadBtn = document.getElementById('download') as HTMLButtonElement;

const dateInput = form.elements.namedItem('publishedAt') as HTMLInputElement;
dateInput.value = new Date().toISOString().slice(0, 10);

let latestMd = '';

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildMarkdown(data: FormData) {
  const title = String(data.get('title') || '').trim();
  const slug = String(data.get('slug') || slugify(title)).trim();
  const lang = String(data.get('lang') || 'en');
  const publishedAt = String(data.get('publishedAt') || new Date().toISOString().slice(0, 10));
  const translationGroup = String(data.get('translationGroup') || slug).trim();
  const featuredImage = String(data.get('featuredImage') || '').trim();
  const seoTitle = String(data.get('seoTitle') || title).trim();
  const seoDescription = String(data.get('seoDescription') || '').trim();
  const body = String(data.get('body') || '').trim();
  const canonicalPath = `/${lang}/${slug}/`;
  const canonical = `https://intolibya.com${canonicalPath}`;

  const fm: Record<string, unknown> = {
    title,
    slug,
    canonicalPath,
    lang,
    publishedAt,
    translationGroup,
    seo: { title: seoTitle, description: seoDescription, canonical },
  };
  if (featuredImage) fm.featuredImage = featuredImage;

  const yamlBlock = yamlDump(fm, { lineWidth: -1 }).trimEnd();
  return {
    md: `---\n${yamlBlock}\n---\n\n${body}\n`,
    path: `src/content/posts/${lang}/${slug}.md`,
    slug,
  };
}

form.addEventListener('input', () => {
  const title = (form.elements.namedItem('title') as HTMLInputElement).value;
  const slugInput = form.elements.namedItem('slug') as HTMLInputElement;
  if (!slugInput.value && title) slugInput.placeholder = slugify(title);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const result = buildMarkdown(new FormData(form));
  latestMd = result.md;
  output.textContent = latestMd;
  targetPath.textContent = `Save to: ${result.path}`;
});

copyBtn.addEventListener('click', async () => {
  if (!latestMd) return;
  await navigator.clipboard.writeText(latestMd);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
});

downloadBtn.addEventListener('click', () => {
  if (!latestMd) return;
  const slug = (form.elements.namedItem('slug') as HTMLInputElement).value || 'post';
  const blob = new Blob([latestMd], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${slug}.md`;
  a.click();
  URL.revokeObjectURL(a.href);
});
