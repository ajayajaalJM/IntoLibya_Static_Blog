/**
 * Node-safe HTML sanitizer for writer save/translate APIs (no DOMParser).
 */
import { ensureHrBeforeH2 } from '../../../src/lib/ensure-hr-before-h2';

export function sanitizeHtmlNode(html: string): string {
  let out = String(html ?? '');

  // Nuke dangerous elements (paired + self-closing)
  out = out.replace(
    /<\s*(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    '',
  );
  out = out.replace(
    /<\s*(script|style|iframe|object|embed|link|meta|form|input|button|textarea|select)\b[^>]*\/?\s*>/gi,
    '',
  );

  // Event handlers
  out = out.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // javascript:/data: URLs in href/src
  out = out.replace(
    /\s(href|src|xlink:href)\s*=\s*(["'])\s*(javascript|data|vbscript):[\s\S]*?\2/gi,
    '',
  );

  // style attributes (can host expression: / urls)
  out = out.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi, '');

  // srcdoc
  out = out.replace(/\ssrcdoc\s*=\s*("[^"]*"|'[^']*')/gi, '');

  return ensureHrBeforeH2(out.trim());
}

export function sanitizePlainField(value: string): string {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .trim();
}
