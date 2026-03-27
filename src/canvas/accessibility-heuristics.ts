import { franc } from 'franc';

const MANUAL_LIST_LINE = /^\s*(?:[-*•]|\d{1,3}\.\s+)\S/;

export function findSmallestManualListRegion(html: string): {
  start: number;
  end: number;
  before: string;
  after: string;
} | null {
  const pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m: RegExpExecArray | null;
  while ((m = pRe.exec(html)) !== null) {
    const inner = m[1] || '';
    const plain = inner
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (!plain) continue;
    const lines = plain
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length || !lines.some((l) => MANUAL_LIST_LINE.test(l))) continue;
    const isOrdered = lines.some((l) => /^\d{1,3}\.\s+/.test(l));
    const items = lines.map((l) =>
      l.replace(/^\s*(?:[-*•]|\d{1,3}\.\s+)/, '').trim(),
    );
    const tag = isOrdered ? 'ol' : 'ul';
    const lis = items.map((t) => `<li>${escapeHtmlText(t)}</li>`).join('');
    const replacement = `<${tag}>${lis}</${tag}>`;
    return {
      start: m.index,
      end: m.index + m[0].length,
      before: m[0],
      after: replacement,
    };
  }
  const divRe = /<div\b[^>]*>([\s\S]*?)<\/div>/gi;
  while ((m = divRe.exec(html)) !== null) {
    const inner = m[1] || '';
    if (/<[uo]l\b/i.test(inner)) continue;
    const plain = inner
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();
    if (!plain || plain.length > 800) continue;
    const lines = plain
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length || !lines.some((l) => MANUAL_LIST_LINE.test(l))) continue;
    const isOrdered = lines.some((l) => /^\d{1,3}\.\s+/.test(l));
    const items = lines.map((l) =>
      l.replace(/^\s*(?:[-*•]|\d{1,3}\.\s+)/, '').trim(),
    );
    const tag = isOrdered ? 'ol' : 'ul';
    const lis = items.map((t) => `<li>${escapeHtmlText(t)}</li>`).join('');
    const replacement = `<${tag}>${lis}</${tag}>`;
    return {
      start: m.index,
      end: m.index + m[0].length,
      before: m[0],
      after: replacement,
    };
  }
  return null;
}

function escapeHtmlText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

const INVALID_ROLE_TO_VALID: Record<string, string> = {
  text: '',
  textbox: '',
  input: '',
  toggle: 'switch',
  dropdown: 'combobox',
  dropdownlist: 'combobox',
  selectbox: 'combobox',
  link: 'link',
  btn: 'button',
  image: 'img',
  picture: 'img',
  section: 'region',
  panel: 'region',
  pane: 'region',
  navigation: 'navigation',
  nav: 'navigation',
  header: 'banner',
  footer: 'contentinfo',
  sidebar: 'complementary',
};

const VALID_ARIA_ROLES = new Set([
  'alert',
  'alertdialog',
  'application',
  'article',
  'banner',
  'button',
  'cell',
  'checkbox',
  'columnheader',
  'combobox',
  'complementary',
  'contentinfo',
  'definition',
  'dialog',
  'directory',
  'document',
  'feed',
  'figure',
  'form',
  'grid',
  'gridcell',
  'group',
  'heading',
  'img',
  'link',
  'list',
  'listbox',
  'listitem',
  'log',
  'main',
  'marquee',
  'math',
  'menu',
  'menubar',
  'menuitem',
  'menuitemcheckbox',
  'menuitemradio',
  'navigation',
  'none',
  'note',
  'option',
  'presentation',
  'progressbar',
  'radio',
  'radiogroup',
  'region',
  'row',
  'rowgroup',
  'rowheader',
  'scrollbar',
  'search',
  'searchbox',
  'separator',
  'slider',
  'spinbutton',
  'status',
  'switch',
  'tab',
  'table',
  'tablist',
  'tabpanel',
  'term',
  'textbox',
  'timer',
  'toolbar',
  'tooltip',
  'tree',
  'treegrid',
  'treeitem',
]);

export function normalizeAriaRoleValue(
  raw: string,
  tagName: string,
): { next: string | null; action: 'keep' | 'replace' | 'strip' } {
  const r = raw.trim().toLowerCase();
  if (!r) return { next: null, action: 'strip' };
  if (VALID_ARIA_ROLES.has(r)) return { next: r, action: 'keep' };
  const mapped = INVALID_ROLE_TO_VALID[r];
  if (mapped === '') return { next: null, action: 'strip' };
  if (mapped) return { next: mapped, action: 'replace' };
  if (r === 'button' && tagName !== 'button')
    return { next: 'button', action: 'replace' };
  return { next: null, action: 'strip' };
}

export function suggestIframeTitleFromSrc(src: string): string {
  const s = String(src || '').trim();
  let u: URL;
  try {
    u = s.startsWith('//') ? new URL('https:' + s) : new URL(s);
  } catch {
    return 'Embedded content';
  }
  const host = (u.hostname || '').toLowerCase();
  const path = (u.pathname || '').toLowerCase();
  if (host.includes('youtube.com') && path.includes('/embed'))
    return 'YouTube video player';
  if (host.includes('youtu.be')) return 'YouTube video player';
  if (host.includes('vimeo.com')) return 'Vimeo video player';
  if (host.includes('docs.google.com')) {
    if (path.includes('/presentation')) return 'Google slideshow';
    if (path.includes('/forms')) return 'Google form';
    return 'Google document';
  }
  if (host.includes('forms.gle') || host.includes('forms.google.com'))
    return 'Google form';
  return `${host || 'Site'} embedded content`;
}

export function truncateHeadingText(text: string, maxLen: number): string {
  const t = String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.length <= maxLen) return t;
  const slice = t.slice(0, maxLen);
  const lastSentence = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('! '),
  );
  if (lastSentence > maxLen * 0.5)
    return slice.slice(0, lastSentence + 1).trim();
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > 40) return slice.slice(0, lastSpace).trim() + '…';
  return slice.trim() + '…';
}

export function detectLangWithFranc(text: string): string {
  const sample = String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .slice(0, 500);
  if (sample.length < 10) return 'en';
  const code = franc(sample);
  if (!code || code === 'und') return 'en';
  return code;
}

const LANG_ALIAS: Record<string, string> = {
  english: 'en',
  eng: 'en',
  espanol: 'es',
  español: 'es',
  spanish: 'es',
  french: 'fr',
  français: 'fr',
  francais: 'fr',
  german: 'de',
  deutsch: 'de',
  italian: 'it',
  portuguese: 'pt',
  chinese: 'zh',
  japanese: 'ja',
  korean: 'ko',
  russian: 'ru',
  arabic: 'ar',
  dutch: 'nl',
  swedish: 'sv',
  polish: 'pl',
  turkish: 'tr',
  vietnamese: 'vi',
  hindi: 'hi',
};

export function normalizeLangCode(raw: string): string {
  const s = String(raw || '').trim();
  if (!s) return 'en';
  const lower = s.toLowerCase().replace(/_/g, '-');
  if (/^[a-z]{2}(-[a-z0-9]+)?$/i.test(lower)) return lower.slice(0, 24);
  const compact = lower.replace(/[^a-z]/g, '');
  const alias = LANG_ALIAS[compact] || LANG_ALIAS[lower];
  if (alias) return alias;
  return detectLangWithFranc(s);
}

function stripTags(s: string): string {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractTableCaptionFromContext(
  html: string,
  tableIndex: number,
): string {
  const before = html.slice(0, tableIndex);
  const hAll = [
    ...before.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi),
  ] as RegExpMatchArray[];
  if (hAll.length) {
    const inner = stripTags(hAll[hAll.length - 1][1] || '');
    if (inner) return inner.slice(0, 200);
  }
  const pAll = [
    ...before.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi),
  ] as RegExpMatchArray[];
  if (pAll.length) {
    const inner = stripTags(pAll[pAll.length - 1][1] || '');
    if (inner) return inner.slice(0, 200);
  }
  return 'Table';
}

export function isLayoutTableCandidate(
  html: string,
  tableOpenIdx: number,
): boolean {
  const rest = html.slice(tableOpenIdx);
  const close = rest.search(/<\/table\b/i);
  const chunk = close > 0 ? rest.slice(0, close) : rest.slice(0, 4000);
  if (/<th\b/i.test(chunk)) return false;
  if (/<caption\b/i.test(chunk)) return false;
  if (/\bscope\s*=/i.test(chunk)) return false;
  const cells = chunk.match(/<t[dh]\b/gi) || [];
  if (cells.length < 2) return false;
  const hasImg = /<img\b/i.test(chunk);
  const longText =
    />([^<]{120,})</.test(chunk) ||
    (chunk.replace(/<[^>]+>/g, ' ').trim().length > 400 && cells.length >= 4);
  return hasImg || longText;
}
