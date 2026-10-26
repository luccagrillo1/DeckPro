'use strict';

/**
 * styleSample.js — the style sample round trip.
 *
 * "Export style sample" writes a small deck (Start, Scripture, Point,
 * Response Card) styled with one DeckPro style into ProPresenter, plus its
 * three LED-wall props (scripture, point, Response Card) in their own
 * "DeckPro Style Sample" prop collection, and
 * keeps a snapshot of exactly what it wrote. After the user restyles that
 * deck in Pro7, "Import style sample" reads it back and compares it with the
 * snapshot: every difference is something the user changed on purpose, so it
 * becomes a style change (fonts, sizes, colours, alignment, spacing, box
 * positions) without guessing which element is which.
 *
 * This module only reads: it turns two decoded documents into a list of
 * neutral observations ({ role, prop, oldValue, newValue }). public/app.js
 * maps each role/prop onto the right layer of the style (per-field font
 * override, palette size, advanced styling, layout).
 */

// Labels the sample deck's cues carry (see buildStyleSampleSlides in app.js).
const SAMPLE_LABELS = {
  scripture: 'Sample Scripture',
  point:     'Sample Point',
  start:     'Start of Notes',
};
// The one emphasised (alt) word in the sample scripture — read separately as
// the emphasis font/colour.
const SAMPLE_EMPHASIS_WORD = 'loved';

// ─── RTF formatting reader ────────────────────────────────────────────────

const CP1252 = { 0x85: '…', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x96: '–', 0x97: '—' };

function rtfString(rtfData) {
  if (!rtfData) return '';
  if (typeof rtfData === 'object' && Array.isArray(rtfData.data)) return Buffer.from(rtfData.data).toString('latin1');
  try { return Buffer.from(rtfData, 'base64').toString('latin1'); } catch { return ''; }
}

function parseFontTable(raw) {
  const m = /\{\\fonttbl(.*?)\}\s*\n?\{\\colortbl|\{\\fonttbl(.*?)\}/s.exec(raw);
  const body = m ? (m[1] ?? m[2] ?? '') : '';
  const fonts = {};
  const re = /\\f(\d+)[^;]*?\\fcharset\d+\s*([^;]*);/g;
  let f;
  while ((f = re.exec(body))) fonts[f[1]] = f[2].trim();
  return fonts;
}

function parseColorTable(raw) {
  const m = /\{\\colortbl;?(.*?)\}/s.exec(raw);
  if (!m) return [];
  const hex = n => Number(n).toString(16).padStart(2, '0');
  // Entry 0 is "auto" (the leading ';'), so real entries start at index 1.
  return [null, ...m[1].split(';').filter(e => /\\red/.test(e)).map(e => {
    const r = /\\red(\d+)/.exec(e)?.[1] ?? 0, g = /\\green(\d+)/.exec(e)?.[1] ?? 0, b = /\\blue(\d+)/.exec(e)?.[1] ?? 0;
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  })];
}

/**
 * Every visible character of an RTF document with the formatting it's drawn
 * in: [{ ch, font, size, color, bold, italic, underline, caps, charSpacing,
 * superscript, strokeWidth, strokeColor, align, lineHeight, spaceBefore,
 * spaceAfter }]. Understands what DeckPro writes and what Pro7 re-saves.
 */
function rtfChars(rtfData) {
  const raw = rtfString(rtfData);
  const fonts = parseFontTable(raw), colors = parseColorTable(raw);
  const charDefaults = () => ({ font: fonts['0'] || null, size: 12, color: null, bold: false, italic: false, underline: false,
    caps: false, charSpacing: 0, superscript: false, strokeWidth: 0, strokeColor: null });
  const paraDefaults = () => ({ align: 'left', lineHeight: 1, spaceBefore: 0, spaceAfter: 0 });
  let ch = charDefaults(), para = paraDefaults();
  const stack = [];
  const out = [];
  let skip = false, ucSkip = 1, pending = 0;
  const put = c => {
    if (pending > 0) { pending--; return; }
    if (!skip) out.push({ ch: c, ...ch, ...para });
  };
  const DEST = new Set(['fonttbl', 'colortbl', 'expandedcolortbl', 'stylesheet', 'info']);
  let i = 0;
  while (i < raw.length) {
    const c = raw[i];
    if (c === '{') { stack.push({ ch: { ...ch }, skip, ucSkip }); i++; continue; }
    if (c === '}') { const st = stack.pop(); if (st) { ch = st.ch; skip = st.skip; ucSkip = st.ucSkip; } i++; continue; }
    if (c === '\r' || c === '\n') { i++; continue; }
    if (c !== '\\') { put(c); i++; continue; }
    const nx = raw[i + 1];
    if (nx === '\\' || nx === '{' || nx === '}') { put(nx); i += 2; continue; }
    if (nx === '\n' || nx === '\r') { put('\n'); i += 2; continue; }
    if (nx === '*') { skip = true; i += 2; continue; }
    if (nx === "'") { const b = parseInt(raw.substr(i + 2, 2), 16); put(CP1252[b] || String.fromCharCode(b)); i += 4; continue; }
    const m = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(raw.slice(i, i + 40));
    if (!m) { i += 2; continue; }
    i += m[0].length;
    const w = m[1], n = m[2] === undefined ? null : Number(m[2]);
    if (DEST.has(w)) { skip = true; continue; }
    switch (w) {
      case 'f':          ch.font = fonts[String(n)] ?? ch.font; break;
      case 'fs':         ch.size = n / 2; break;
      case 'cf':         ch.color = colors[n] ?? null; break;
      case 'b':          ch.bold = n !== 0; break;
      case 'i':          ch.italic = n !== 0; break;
      case 'ul':         ch.underline = n !== 0; break;
      case 'ulnone':     ch.underline = false; break;
      case 'caps':       ch.caps = n !== 0; break;
      case 'expndtw':    ch.charSpacing = n / 20; break;
      case 'super': case 'up': ch.superscript = n !== 0; break;
      case 'nosupersub': ch.superscript = false; break;
      case 'strokewidth': ch.strokeWidth = n; break;
      case 'strokec':    ch.strokeColor = colors[n] ?? null; break;
      case 'plain':      ch = charDefaults(); break;
      case 'pard':       para = paraDefaults(); break;
      case 'qc':         para.align = 'center'; break;
      case 'qr':         para.align = 'right'; break;
      case 'qj':         para.align = 'justify'; break;
      case 'ql':         para.align = 'left'; break;
      case 'sl':         para.lineHeight = n ? Math.round(Math.abs(n) / 240 * 100) / 100 : 1; break;
      case 'sb':         para.spaceBefore = n / 20; break;
      case 'sa':         para.spaceAfter = n / 20; break;
      case 'uc':         ucSkip = n; break;
      case 'u':          put(String.fromCharCode(n < 0 ? n + 65536 : n)); pending = ucSkip; break;
      case 'par': case 'line': put('\n'); break;
      default: break;
    }
  }
  return out;
}

// The value most of `chars` share for `key` (Pro7 can put the spaces of a
// line in a different font than its words, so the first run isn't reliable).
function mostCommon(chars, key) {
  const n = new Map();
  for (const c of chars) n.set(c[key], (n.get(c[key]) || 0) + 1);
  let best = null, bestN = -1;
  for (const [v, k] of n) if (k > bestN) { best = v; bestN = k; }
  return best;
}

const TEXT_KEYS = ['font', 'size', 'color', 'italic', 'underline', 'caps', 'charSpacing', 'strokeWidth', 'strokeColor', 'align', 'lineHeight', 'spaceBefore', 'spaceAfter'];

// Formatting of an element's text: `base` (most visible letters) and, when
// `emphasisWord` is given, `emphasis` (that word's letters).
function textFormat(rtfData, emphasisWord = null) {
  const chars = rtfChars(rtfData).filter(c => c.ch.trim() && !c.superscript);
  if (!chars.length) return null;
  let emphIdx = new Set();
  if (emphasisWord) {
    const text = chars.map(c => c.ch).join('');
    const at = text.toLowerCase().indexOf(emphasisWord.toLowerCase());
    if (at !== -1) for (let k = at; k < at + emphasisWord.length; k++) emphIdx.add(k);
  }
  const pick = list => Object.fromEntries(TEXT_KEYS.map(k => [k, mostCommon(list, k)]));
  const baseChars = chars.filter((_, k) => !emphIdx.has(k));
  return {
    base: pick(baseChars.length ? baseChars : chars),
    emphasis: emphIdx.size ? pick(chars.filter((_, k) => emphIdx.has(k))) : null,
  };
}

// ─── Observations ─────────────────────────────────────────────────────────

function elementsOfCue(cue) {
  const a = (cue?.actions || []).find(x => x.slide);
  const bs = a?.slide?.presentation?.baseSlide || a?.slide?.prop?.baseSlide || a?.slide?.baseSlide;
  return (bs?.elements || []).map(w => w.element || w);
}

const round2 = n => Math.round((Number(n) || 0) * 100) / 100;
const colorHex = c => {
  if (!c) return null;
  const h = v => Math.round(Math.max(0, Math.min(1, v || 0)) * 255).toString(16).padStart(2, '0');
  return `#${h(c.red)}${h(c.green)}${h(c.blue)}`;
};

function same(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 0.5;
  return a === b;
}

// Everything worth comparing about one element: its box, its text margins
// and vertical alignment, its text shadow, and its text formatting.
function elementFacts(el, emphasisWord) {
  if (!el) return null;
  const b = el.bounds || {}, o = b.origin || {}, s = b.size || {};
  const t = el.text || {};
  const m = t.margins || {};
  const sh = t.shadow || {};
  const fmt = t.rtfData ? textFormat(t.rtfData, emphasisWord) : null;
  return {
    x: round2(o.x), y: round2(o.y), w: round2(s.width), h: round2(s.height),
    marginLeft: round2(m.left), marginTop: round2(m.top), marginRight: round2(m.right), marginBottom: round2(m.bottom),
    verticalAlignment: ({ VERTICAL_ALIGNMENT_TOP: 'top', VERTICAL_ALIGNMENT_MIDDLE: 'middle', VERTICAL_ALIGNMENT_BOTTOM: 'bottom' })[t.verticalAlignment] || null,
    shadowEnabled: !!sh.enable,
    shadowColor: sh.enable ? colorHex(sh.color) : null,
    shadowOffset: sh.enable ? round2(sh.offset) : null,
    shadowBlur: sh.enable ? round2(sh.radius) : null,
    shadowAngle: sh.enable ? round2(sh.angle) : null,
    shadowOpacity: sh.enable ? Math.round((sh.opacity ?? 0) * 100) : null,
    text: fmt?.base || null,
    emphasis: fmt?.emphasis || null,
  };
}

function compareFacts(role, a, b, out, emphasisRole = null) {
  if (!a || !b) return;
  for (const k of ['x', 'y', 'w', 'h', 'marginLeft', 'marginTop', 'marginRight', 'marginBottom', 'verticalAlignment']) {
    if (!same(a[k], b[k])) out.push({ role, prop: k, oldValue: a[k], newValue: b[k] });
  }
  // Shadow and outline are reported whole — applying one changed part on its
  // own would mix it with DeckPro's defaults for the parts that didn't change.
  const shadow = f => ({ enabled: f.shadowEnabled, color: f.shadowColor, offset: f.shadowOffset, blur: f.shadowBlur, angle: f.shadowAngle, opacity: f.shadowOpacity });
  const sa = shadow(a), sb = shadow(b);
  if (Object.keys(sa).some(k => !same(sa[k], sb[k]))) out.push({ role, prop: 'shadow', oldValue: sa, newValue: sb });
  const stroke = t => t && { width: Math.abs(t.strokeWidth || 0) / 20, color: t.strokeColor };
  const ka = stroke(a.text), kb = stroke(b.text);
  if (ka && kb && (!same(ka.width * 100, kb.width * 100) || ka.color !== kb.color)) out.push({ role, prop: 'stroke', oldValue: ka, newValue: kb });
  const textDiff = (r, ta, tb) => {
    if (!ta || !tb) return;
    for (const k of TEXT_KEYS) if (!k.startsWith('stroke') && !same(ta[k], tb[k])) out.push({ role: r, prop: k, oldValue: ta[k], newValue: tb[k] });
  };
  textDiff(role, a.text, b.text);
  if (emphasisRole) {
    // Emphasis only reports where it differs from the base text's own change —
    // restyling the whole verse shouldn't also read as an emphasis edit.
    const ea = a.emphasis, eb = b.emphasis;
    if (ea && eb) for (const k of ['font', 'color', 'italic', 'underline', 'caps', 'size']) {
      const baseChanged = !same(a.text?.[k], b.text?.[k]);
      if (!same(ea[k], eb[k]) && !(baseChanged && same(eb[k], b.text?.[k]))) {
        out.push({ role: emphasisRole, prop: k, oldValue: ea[k], newValue: eb[k] });
      }
    }
  }
}

// [role, element name, emphasis role] per sample cue, main screen and LED wall.
const MAIN_ROLES = {
  scripture: [['body', 'body', 'bold'], ['title', 'title'], ['live', 'live'], ['queue', 'queue']],
  point:     [['point', 'body']],
  start:     [['startEnd', 'body']],
};
const PROP_ROLES = {
  scripture: [['propBody', 'body', 'propBold'], ['propTitle', 'reference']],
  point:     [['propPoint', 'body']],
  // Response Card: only the title and Response 1 are read — Responses 2–4 are
  // marked locked on the sample and follow Response 1 on import.
  rc:        [['rcTitle', 'Response Card'], ['rcResponse', 'Response 1']],
};

const cueLabelOf = c => (c?.actions || []).find(a => a.slide)?.label?.text || c?.name || '';

/**
 * Compare the sample as DeckPro wrote it (`base`) with the same sample after
 * the user restyled it in Pro7 (`cur`). Each is { pres, props: { scripture,
 * point } } — the decoded presentation and the decoded scripture/point prop
 * cues. Returns { observations, missing } — missing lists sample parts that
 * couldn't be found (deleted or renamed in Pro7), so the UI can say so.
 */
function observeStyleChanges(base, cur) {
  const out = [], missing = [];
  const findCue = (doc, key) => {
    const byUuid = new Map((doc?.cues || []).map(c => [c?.uuid?.string, c]));
    const baseCue = (base.pres?.cues || []).find(c => cueLabelOf(c) === SAMPLE_LABELS[key]);
    if (doc === base.pres) return baseCue;
    return byUuid.get(baseCue?.uuid?.string) || (doc?.cues || []).find(c => cueLabelOf(c) === SAMPLE_LABELS[key]);
  };
  for (const [key, roles] of Object.entries(MAIN_ROLES)) {
    const a = findCue(base.pres, key), b = findCue(cur.pres, key);
    if (!a || !b) { missing.push(key); continue; }
    for (const [role, name, emphRole] of roles) {
      const ea = elementsOfCue(a).find(e => e.name === name), eb = elementsOfCue(b).find(e => e.name === name);
      if (ea && !eb) { missing.push(role); continue; }
      compareFacts(role, elementFacts(ea, emphRole ? SAMPLE_EMPHASIS_WORD : null), elementFacts(eb, emphRole ? SAMPLE_EMPHASIS_WORD : null), out, emphRole);
    }
  }
  for (const [key, roles] of Object.entries(PROP_ROLES)) {
    const a = base.props?.[key], b = cur.props?.[key];
    if (!a) continue;
    if (!b) { missing.push(`prop:${key}`); continue; }
    for (const [role, dflt, emphRole] of roles) {
      const name = (key === 'rc' && base.rcNames?.[role]) || dflt;
      const ea = elementsOfCue(a).find(e => e.name === name), eb = elementsOfCue(b).find(e => e.name === name);
      if (ea && !eb) { missing.push(role); continue; }
      compareFacts(role, elementFacts(ea, emphRole ? SAMPLE_EMPHASIS_WORD : null), elementFacts(eb, emphRole ? SAMPLE_EMPHASIS_WORD : null), out, emphRole);
    }
  }
  // Slide transition: the scripture slide's own (what Pro7's slide inspector
  // edits), falling back to the presentation-wide one.
  const tr = t => t ? { type: (t.effect?.name || '').toLowerCase() || null, duration: round2(t.duration) } : null;
  const slideTr = (doc, key) => (findCue(doc, key)?.actions || []).find(a => a.slide)?.slide?.presentation?.transition;
  let ta = tr(slideTr(base.pres, 'scripture')), tb = tr(slideTr(cur.pres, 'scripture'));
  if (!ta || !tb || (ta.type === tb.type && same(ta.duration * 100, tb.duration * 100))) { ta = tr(base.pres?.transition); tb = tr(cur.pres?.transition); }
  if (ta && tb) {
    if (ta.type !== tb.type) out.push({ role: 'transition', prop: 'type', oldValue: ta.type, newValue: tb.type });
    if (!same(ta.duration * 100, tb.duration * 100)) out.push({ role: 'transition', prop: 'duration', oldValue: ta.duration, newValue: tb.duration });
  }
  return { observations: out, missing };
}

module.exports = { observeStyleChanges, rtfChars, textFormat, SAMPLE_LABELS, SAMPLE_EMPHASIS_WORD };
