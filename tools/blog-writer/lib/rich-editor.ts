import { editorHtmlToSaved, escapeText, savedHtmlToEditor } from './sanitize-html';

export interface RichEditor {
  getHtml: () => string;
  setHtml: (html: string) => void;
  focus: () => void;
  insertGalleryMarker: (id: string) => void;
  insertHtml: (html: string) => void;
  destroy: () => void;
}

type BlockCommand =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'blockquote'
  | 'ul'
  | 'ol'
  | 'bold'
  | 'italic'
  | 'link'
  | 'image'
  | 'hr'
  | 'clear';

const TOOLS: Array<{ cmd: BlockCommand; label: string; title: string }> = [
  { cmd: 'paragraph', label: 'P', title: 'Paragraph' },
  { cmd: 'h1', label: 'H1', title: 'Heading 1' },
  { cmd: 'h2', label: 'H2', title: 'Heading 2' },
  { cmd: 'h3', label: 'H3', title: 'Heading 3' },
  { cmd: 'bold', label: 'B', title: 'Bold' },
  { cmd: 'italic', label: 'I', title: 'Italic' },
  { cmd: 'ul', label: '• List', title: 'Bullet list' },
  { cmd: 'ol', label: '1. List', title: 'Numbered list' },
  { cmd: 'blockquote', label: 'Quote', title: 'Quoted text' },
  { cmd: 'link', label: 'Link', title: 'Insert / edit link' },
  { cmd: 'image', label: 'Img', title: 'Insert image from library' },
  { cmd: 'hr', label: '—', title: 'Horizontal rule' },
  { cmd: 'clear', label: 'Clear', title: 'Clear formatting' },
];

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function ensureHrBeforeCurrentH2(surface: HTMLElement) {
  const sel = window.getSelection();
  const node = sel?.anchorNode;
  const el =
    node?.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node?.parentElement;
  const h2 = el?.closest('h2');
  if (!h2 || !surface.contains(h2)) {
    // Fallback: normalize all H2s in the surface
    surface.querySelectorAll('h2').forEach((heading) => {
      const prev = heading.previousElementSibling;
      if (prev?.tagName === 'HR') return;
      if (!prev && heading === surface.firstElementChild) return;
      const hr = document.createElement('hr');
      hr.className = 'wp-block-separator has-alpha-channel-opacity';
      heading.parentElement?.insertBefore(hr, heading);
    });
    return;
  }
  const prev = h2.previousElementSibling;
  if (prev?.tagName === 'HR') return;
  if (!prev && h2 === surface.firstElementChild) return;
  const hr = document.createElement('hr');
  hr.className = 'wp-block-separator has-alpha-channel-opacity';
  h2.parentElement?.insertBefore(hr, h2);
}

export function createRichEditor(
  mount: HTMLElement,
  options: {
    onChange?: (html: string) => void;
    placeholder?: string;
    onInsertImage?: () => void;
  } = {},
): RichEditor {
  mount.innerHTML = '';
  mount.classList.add('rich-editor');

  const toolbar = document.createElement('div');
  toolbar.className = 'rich-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', 'Formatting');

  for (const tool of TOOLS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rich-tool';
    btn.dataset.cmd = tool.cmd;
    btn.title = tool.title;
    btn.setAttribute('aria-label', tool.title);
    btn.textContent = tool.label;
    if (tool.cmd === 'bold') btn.style.fontWeight = '800';
    if (tool.cmd === 'italic') btn.style.fontStyle = 'italic';
    toolbar.appendChild(btn);
  }

  const surface = document.createElement('div');
  surface.className = 'rich-surface';
  surface.contentEditable = 'true';
  surface.spellcheck = true;
  surface.setAttribute('role', 'textbox');
  surface.setAttribute('aria-multiline', 'true');
  surface.setAttribute('aria-label', 'Body content');
  surface.dataset.placeholder = options.placeholder || 'Start writing…';
  surface.innerHTML = '<p><br></p>';

  mount.append(toolbar, surface);

  const emitChange = () => {
    options.onChange?.(editorHtmlToSaved(surface.innerHTML));
  };

  const run = (cmd: BlockCommand) => {
    surface.focus();
    switch (cmd) {
      case 'paragraph':
        document.execCommand('formatBlock', false, 'p');
        break;
      case 'h1':
        document.execCommand('formatBlock', false, 'h1');
        break;
      case 'h2':
        document.execCommand('formatBlock', false, 'h2');
        ensureHrBeforeCurrentH2(surface);
        break;
      case 'h3':
        document.execCommand('formatBlock', false, 'h3');
        break;
      case 'blockquote':
        document.execCommand('formatBlock', false, 'blockquote');
        break;
      case 'ul':
        document.execCommand('insertUnorderedList');
        break;
      case 'ol':
        document.execCommand('insertOrderedList');
        break;
      case 'bold':
        document.execCommand('bold');
        break;
      case 'italic':
        document.execCommand('italic');
        break;
      case 'hr':
        document.execCommand('insertHorizontalRule');
        break;
      case 'clear':
        document.execCommand('removeFormat');
        document.execCommand('formatBlock', false, 'p');
        break;
      case 'link': {
        const sel = window.getSelection();
        let current = '';
        if (sel?.anchorNode) {
          const anchor =
            sel.anchorNode.nodeType === Node.ELEMENT_NODE
              ? (sel.anchorNode as Element).closest('a')
              : sel.anchorNode.parentElement?.closest('a');
          current = anchor?.getAttribute('href') || '';
        }
        const raw = window.prompt('Link URL (https://…, /path, or mailto:)', current || 'https://');
        if (raw === null) break;
        const href = raw.trim();
        if (!href) {
          document.execCommand('unlink');
          break;
        }
        if (!/^(https?:\/\/|mailto:|\/|#)/i.test(href)) {
          window.alert('Links must start with https://, http://, mailto:, /, or #');
          break;
        }
        document.execCommand('createLink', false, href);
        surface.querySelectorAll('a[href]').forEach((a) => {
          const h = a.getAttribute('href') || '';
          if (h.startsWith('http')) {
            a.setAttribute('rel', 'noopener noreferrer');
            a.setAttribute('target', '_blank');
          }
        });
        break;
      }
      case 'image':
        options.onInsertImage?.();
        return;
      default:
        break;
    }
    emitChange();
  };

  toolbar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-cmd]');
    if (!btn?.dataset.cmd) return;
    e.preventDefault();
    run(btn.dataset.cmd as BlockCommand);
  });

  surface.addEventListener('input', emitChange);
  surface.addEventListener('keyup', emitChange);

  surface.addEventListener('paste', (e) => {
    e.preventDefault();
    const html = e.clipboardData?.getData('text/html');
    const text = e.clipboardData?.getData('text/plain') || '';
    if (html) {
      const cleaned = savedHtmlToEditor(html);
      document.execCommand('insertHTML', false, cleaned);
    } else {
      document.execCommand('insertHTML', false, escapeText(text).replace(/\n/g, '<br>'));
    }
    emitChange();
  });

  // Prevent dropping arbitrary HTML files / rich content without sanitize
  surface.addEventListener('drop', (e) => {
    const html = e.dataTransfer?.getData('text/html');
    const text = e.dataTransfer?.getData('text/plain');
    if (!html && !text) return;
    e.preventDefault();
    if (html) {
      document.execCommand('insertHTML', false, savedHtmlToEditor(html));
    } else if (text) {
      document.execCommand('insertHTML', false, escapeText(text).replace(/\n/g, '<br>'));
    }
    emitChange();
  });

  return {
    getHtml: () => editorHtmlToSaved(surface.innerHTML),
    setHtml: (html: string) => {
      surface.innerHTML = savedHtmlToEditor(html || '');
      emitChange();
    },
    focus: () => {
      surface.focus();
      placeCaretAtEnd(surface);
    },
    insertGalleryMarker: (id: string) => {
      const safeId = id.replace(/[^a-z0-9-]/gi, '').toLowerCase();
      if (!safeId) return;
      surface.focus();
      const marker = `<div data-gallery-marker="${escapeText(safeId)}" class="gallery-marker" contenteditable="false">Gallery: ${escapeText(safeId)}</div><p><br></p>`;
      document.execCommand('insertHTML', false, marker);
      emitChange();
    },
    insertHtml: (html: string) => {
      surface.focus();
      document.execCommand('insertHTML', false, html);
      emitChange();
    },
    destroy: () => {
      mount.innerHTML = '';
    },
  };
}
