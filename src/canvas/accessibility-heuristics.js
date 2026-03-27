"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findSmallestManualListRegion = findSmallestManualListRegion;
exports.normalizeAriaRoleValue = normalizeAriaRoleValue;
exports.suggestIframeTitleFromSrc = suggestIframeTitleFromSrc;
exports.truncateHeadingText = truncateHeadingText;
exports.detectLangWithFranc = detectLangWithFranc;
exports.normalizeLangCode = normalizeLangCode;
exports.extractTableCaptionFromContext = extractTableCaptionFromContext;
exports.isLayoutTableCandidate = isLayoutTableCandidate;
var franc_1 = require("franc");
var MANUAL_LIST_LINE = /^\s*(?:[-*•]|\d{1,3}\.\s+)\S/;
function findSmallestManualListRegion(html) {
    var pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
    var m;
    while ((m = pRe.exec(html)) !== null) {
        var inner = m[1] || '';
        var plain = inner
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .trim();
        if (!plain)
            continue;
        var lines = plain
            .split(/\n+/)
            .map(function (l) { return l.trim(); })
            .filter(Boolean);
        if (!lines.length || !lines.some(function (l) { return MANUAL_LIST_LINE.test(l); }))
            continue;
        var isOrdered = lines.some(function (l) { return /^\d{1,3}\.\s+/.test(l); });
        var items = lines.map(function (l) {
            return l.replace(/^\s*(?:[-*•]|\d{1,3}\.\s+)/, '').trim();
        });
        var tag = isOrdered ? 'ol' : 'ul';
        var lis = items.map(function (t) { return "<li>".concat(escapeHtmlText(t), "</li>"); }).join('');
        var replacement = "<".concat(tag, ">").concat(lis, "</").concat(tag, ">");
        return {
            start: m.index,
            end: m.index + m[0].length,
            before: m[0],
            after: replacement,
        };
    }
    var divRe = /<div\b[^>]*>([\s\S]*?)<\/div>/gi;
    while ((m = divRe.exec(html)) !== null) {
        var inner = m[1] || '';
        if (/<[uo]l\b/i.test(inner))
            continue;
        var plain = inner
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .trim();
        if (!plain || plain.length > 800)
            continue;
        var lines = plain
            .split(/\n+/)
            .map(function (l) { return l.trim(); })
            .filter(Boolean);
        if (!lines.length || !lines.some(function (l) { return MANUAL_LIST_LINE.test(l); }))
            continue;
        var isOrdered = lines.some(function (l) { return /^\d{1,3}\.\s+/.test(l); });
        var items = lines.map(function (l) {
            return l.replace(/^\s*(?:[-*•]|\d{1,3}\.\s+)/, '').trim();
        });
        var tag = isOrdered ? 'ol' : 'ul';
        var lis = items.map(function (t) { return "<li>".concat(escapeHtmlText(t), "</li>"); }).join('');
        var replacement = "<".concat(tag, ">").concat(lis, "</").concat(tag, ">");
        return {
            start: m.index,
            end: m.index + m[0].length,
            before: m[0],
            after: replacement,
        };
    }
    return null;
}
function escapeHtmlText(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
var INVALID_ROLE_TO_VALID = {
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
var VALID_ARIA_ROLES = new Set([
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
function normalizeAriaRoleValue(raw, tagName) {
    var r = raw.trim().toLowerCase();
    if (!r)
        return { next: null, action: 'strip' };
    if (VALID_ARIA_ROLES.has(r))
        return { next: r, action: 'keep' };
    var mapped = INVALID_ROLE_TO_VALID[r];
    if (mapped === '')
        return { next: null, action: 'strip' };
    if (mapped)
        return { next: mapped, action: 'replace' };
    if (r === 'button' && tagName !== 'button')
        return { next: 'button', action: 'replace' };
    return { next: null, action: 'strip' };
}
function suggestIframeTitleFromSrc(src) {
    var s = String(src || '').trim();
    var u;
    try {
        u = s.startsWith('//') ? new URL('https:' + s) : new URL(s);
    }
    catch (_a) {
        return 'Embedded content';
    }
    var host = (u.hostname || '').toLowerCase();
    var path = (u.pathname || '').toLowerCase();
    if (host.includes('youtube.com') && path.includes('/embed'))
        return 'YouTube video player';
    if (host.includes('youtu.be'))
        return 'YouTube video player';
    if (host.includes('vimeo.com'))
        return 'Vimeo video player';
    if (host.includes('docs.google.com')) {
        if (path.includes('/presentation'))
            return 'Google slideshow';
        if (path.includes('/forms'))
            return 'Google form';
        return 'Google document';
    }
    if (host.includes('forms.gle') || host.includes('forms.google.com'))
        return 'Google form';
    return "".concat(host || 'Site', " embedded content");
}
function truncateHeadingText(text, maxLen) {
    var t = String(text || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (t.length <= maxLen)
        return t;
    var slice = t.slice(0, maxLen);
    var lastSentence = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('? '), slice.lastIndexOf('! '));
    if (lastSentence > maxLen * 0.5)
        return slice.slice(0, lastSentence + 1).trim();
    var lastSpace = slice.lastIndexOf(' ');
    if (lastSpace > 40)
        return slice.slice(0, lastSpace).trim() + '…';
    return slice.trim() + '…';
}
function detectLangWithFranc(text) {
    var sample = String(text || '')
        .replace(/<[^>]+>/g, ' ')
        .trim()
        .slice(0, 500);
    if (sample.length < 10)
        return 'en';
    var code = (0, franc_1.franc)(sample);
    if (!code || code === 'und')
        return 'en';
    return code;
}
var LANG_ALIAS = {
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
function normalizeLangCode(raw) {
    var s = String(raw || '').trim();
    if (!s)
        return 'en';
    var lower = s.toLowerCase().replace(/_/g, '-');
    if (/^[a-z]{2}(-[a-z0-9]+)?$/i.test(lower))
        return lower.slice(0, 24);
    var compact = lower.replace(/[^a-z]/g, '');
    var alias = LANG_ALIAS[compact] || LANG_ALIAS[lower];
    if (alias)
        return alias;
    return detectLangWithFranc(s);
}
function stripTags(s) {
    return String(s || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function extractTableCaptionFromContext(html, tableIndex) {
    var before = html.slice(0, tableIndex);
    var hAll = __spreadArray([], before.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi), true);
    if (hAll.length) {
        var inner = stripTags(hAll[hAll.length - 1][1] || '');
        if (inner)
            return inner.slice(0, 200);
    }
    var pAll = __spreadArray([], before.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi), true);
    if (pAll.length) {
        var inner = stripTags(pAll[pAll.length - 1][1] || '');
        if (inner)
            return inner.slice(0, 200);
    }
    return 'Table';
}
function isLayoutTableCandidate(html, tableOpenIdx) {
    var rest = html.slice(tableOpenIdx);
    var close = rest.search(/<\/table\b/i);
    var chunk = close > 0 ? rest.slice(0, close) : rest.slice(0, 4000);
    if (/<th\b/i.test(chunk))
        return false;
    if (/<caption\b/i.test(chunk))
        return false;
    if (/\bscope\s*=/i.test(chunk))
        return false;
    var cells = chunk.match(/<t[dh]\b/gi) || [];
    if (cells.length < 2)
        return false;
    var hasImg = /<img\b/i.test(chunk);
    var longText = />([^<]{120,})</.test(chunk) ||
        (chunk.replace(/<[^>]+>/g, ' ').trim().length > 400 && cells.length >= 4);
    return hasImg || longText;
}
