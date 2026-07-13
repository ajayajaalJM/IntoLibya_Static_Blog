/**
 * Allowlist HTML sanitizer for writer body content.
 * Strips scripts, event handlers, and unsafe URLs.
 */
import { ensureHrBeforeH2 } from '../../../src/lib/ensure-hr-before-h2';

const ALLOWED_TAGS = new Set([
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'UL',
  'OL',
  'LI',
  'BLOCKQUOTE',
  'STRONG',
  'B',
  'EM',
  'I',
  'U',
  'A',
  'BR',
  'HR',
  'FIGURE',
  'FIGCAPTION',
  'IMG',
  'DIV',
  'SPAN',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(['href', 'title', 'rel', 'target']),
  IMG: new Set(['src', 'alt', 'width', 'height', 'loading', 'decoding']),
  DIV: new Set(['data-gallery-marker', 'class', 'contenteditable']),
  SPAN: new Set(['class']),
  BLOCKQUOTE: new Set(['class']),
  P: new Set(['class']),
  H1: new Set(['class']),
  H2: new Set(['class']),
  H3: new Set(['class']),
  H4: new Set(['class']),
  UL: new Set(['class']),
  OL: new Set(['class']),
  FIGURE: new Set(['class']),
  HR: new Set(['class']),
};

/** Escape plain text for safe insertion into HTML. */
export function escapeText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('/')) return !trimmed.toLowerCase().startsWith('/\\');
  if (/^(https?:|mailto:)/i.test(trimmed)) return true;
  return false;
}

function isSafeImgSrc(src: string): boolean {
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/media/')) return true;
  if (/^https?:\/\/(cdn\.)?intolibya\.com\//i.test(trimmed)) return true;
  return false;
}

function sanitizeElement(el: Element): void {
  const tag = el.tagName.toUpperCase();

  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED') {
    el.remove();
    return;
  }

  if (!ALLOWED_TAGS.has(tag)) {
    // Unwrap unknown tags (keep children)
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    } else {
      el.remove();
    }
    return;
  }

  const allowed = ALLOWED_ATTRS[tag] ?? new Set<string>();
  for (const attr of [...el.attributes]) {
    const name = attr.name.toLowerCase();
    if (name.startsWith('on') || name === 'style' || name === 'srcdoc') {
      el.removeAttribute(attr.name);
      continue;
    }
    if (!allowed.has(name)) {
      el.removeAttribute(attr.name);
      continue;
    }

    if (name === 'href' && !isSafeHref(attr.value)) {
      el.removeAttribute(attr.name);
    }
    if (name === 'src' && tag === 'IMG' && !isSafeImgSrc(attr.value)) {
      el.remove();
      return;
    }
    if (name === 'target' && attr.value === '_blank') {
      el.setAttribute('rel', 'noopener noreferrer');
    }
  }

  // Gallery marker divs: lock down
  if (tag === 'DIV' && el.hasAttribute('data-gallery-marker')) {
    const id = el.getAttribute('data-gallery-marker') || '';
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      el.remove();
      return;
    }
    el.className = 'gallery-marker';
    el.setAttribute('contenteditable', 'false');
    el.textContent = `Gallery: ${id}`;
  }

  for (const child of [...el.children]) {
    sanitizeElement(child);
  }
}

/**
 * Convert editor markers ↔ saved HTML comment markers.
 */
export function editorHtmlToSaved(html: string): string {
  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html');
  const root = doc.getElementById('root');
  if (!root) return '';

  root.querySelectorAll('[data-gallery-marker]').forEach((node) => {
    const id = node.getAttribute('data-gallery-marker') || '';
    const comment = doc.createComment(`gallery:${id}`);
    node.replaceWith(comment);
  });

  sanitizeElement(root);
  // Walk and keep comments, then enforce HR-before-H2 house style
  return ensureHrBeforeH2(serializeWithComments(root).trim());
}

export function savedHtmlToEditor(html: string): string {
  // Turn <!--gallery:id--> into marker divs before parse
  const withMarkers = html.replace(
    /<!--\s*gallery:\s*([a-z0-9-]+)\s*-->/gi,
    (_m, id: string) =>
      `<div data-gallery-marker="${escapeText(id)}" class="gallery-marker" contenteditable="false">Gallery: ${escapeText(id)}</div>`,
  );

  const doc = new DOMParser().parseFromString(`<div id="root">${withMarkers}</div>`, 'text/html');
  const root = doc.getElementById('root');
  if (!root) return '<p></p>';
  sanitizeElement(root);
  const out = root.innerHTML.trim();
  return out || '<p></p>';
}

function serializeWithComments(node: Node): string {
  let out = '';
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.COMMENT_NODE) {
      out += `<!--${(child as Comment).data}-->`;
    } else if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? '';
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();
      const attrs = [...el.attributes]
        .map((a) => ` ${a.name}="${escapeText(a.value)}"`)
        .join('');
      if (['br', 'hr', 'img'].includes(tag)) {
        out += `<${tag}${attrs}>`;
      } else {
        out += `<${tag}${attrs}>${serializeWithComments(el)}</${tag}>`;
      }
    }
  });
  return out;
}

/** Sanitize HTML string for persistence (browser or jsdom-like). */
export function sanitizeHtml(html: string): string {
  return ensureHrBeforeH2(editorHtmlToSaved(savedHtmlToEditor(html)));
}

/** Escape a plain-text field (titles, SEO) for safe display / attribute use. */
export function escapePlainField(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
}
