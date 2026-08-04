'use strict';

/**
 * extractScheme.js — reverse of builder.js.
 *
 * Reads a ProPresenter `.pro` presentation file and derives a DeckPro style
 * scheme from it. Intended workflow: DeckPro exports a presentation, the user
 * restyles it inside Pro7 (fonts, sizes, colours, element positions), then
 * imports it back here so those edits become a reusable scheme.
 *
 * Because DeckPro wrote the original file, the element names it reads
 * (`body`, `title`, `atem_gradient`, `live`, `queue`, `this slide`) are known
 * and preserved across a Pro7 save, so extraction is deterministic — no
 * guessing about which element is which.
 */

const protobuf = require('protobufjs');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PROTO_PATH = path.join(__dirname, 'ProPresenter7-Proto/proto/propresenter.proto');

// Default Pro7 library root. Custom library locations aren't covered here — the
// caller offers a "Browse…" fallback for files outside this tree.
const LIBRARIES_DIR = path.join(
  os.homedir(),
  'Library/Application Support/RenewedVision/ProPresenter/UserWorkspaces/ProPresenter/Libraries'
);

let _root = null;
async function getRoot() {
  if (!_root) _root = await protobuf.load(PROTO_PATH);
  return _root;
}

async function decodePresentation(filePath) {
  const root = await getRoot();
  const Presentation = root.lookupType('rv.data.Presentation');
  const buf = fs.readFileSync(filePath);
  return Presentation.toObject(Presentation.decode(buf), { enums: String, defaults: true });
}

// A clean decode has a printable name and at least one cue. Files that mis-decode
// (wrong document type, or a Pro7 wrapper the bundled proto doesn't model) come
// back with binary garbage in `name` and zero cues.
function looksReadable(o) {
  const name = o && o.name;
  if (typeof name !== 'string') return false;
  if (!/^[\x09\x0A\x0D\x20-\x7E]+$/.test(name)) return false; // printable ASCII only
  return Array.isArray(o.cues) && o.cues.length > 0;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function round(n) {
  if (typeof n !== 'number' || !isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

function colorToHex(c) {
  if (!c) return null;
  const ch = v => {
    const n = Math.round(Math.max(0, Math.min(1, v || 0)) * 255);
    return n.toString(16).padStart(2, '0');
  };
  return '#' + ch(c.red) + ch(c.green) + ch(c.blue);
}

function rtfString(rtfData) {
  if (!rtfData) return '';
  try { return Buffer.from(rtfData, 'base64').toString('latin1'); }
  catch { return ''; }
}

function rtfFontSize(rtfStr) {
  const m = rtfStr.match(/\\fs(\d+)/);
  return m ? +m[1] / 2 : null; // RTF half-points → points
}

function rtfFonts(rtfStr) {
  const fonts = [];
  const re = /\\fcharset\d+\s+([^;]+);/g;
  let m;
  while ((m = re.exec(rtfStr))) fonts.push(m[1].trim());
  return fonts;
}

function elementsOf(action) {
  const bs = action?.slide?.presentation?.baseSlide || action?.slide?.baseSlide;
  if (!bs || !Array.isArray(bs.elements)) return { elements: [], size: bs && bs.size };
  return { elements: bs.elements.map(w => w.element || w), size: bs.size };
}

function readElement(el) {
  const b   = el.bounds || {};
  const o   = b.origin || {};
  const sz  = b.size || {};
  const fa  = (el.text && el.text.attributes) || {};
  const rtf = rtfString(el.text && el.text.rtfData);
  const rtfFs = rtfFontSize(rtf);
  const fonts = rtfFonts(rtf);
  return {
    name:        el.name,
    x:           round(o.x) ?? 0,
    y:           round(o.y) ?? 0,
    w:           round(sz.width) ?? 0,
    h:           round(sz.height) ?? 0,
    font:        (fa.font && fa.font.name) || fonts[0] || null,
    boldFont:    fonts[1] || null,
    size:        (rtfFs && round(rtfFs)) || (fa.font && round(fa.font.size)) || null,
    fill:        colorToHex(el.fill && el.fill.color),
    textColor:   colorToHex(fa.textSolidFill),
    shadowColor: colorToHex(el.shadow && el.shadow.color),
  };
}

// `body` alone isn't enough to mean "scripture/point" — Start/End/Response-
// Card-Hold ALSO use an element literally named `body` (makeStartEndElement,
// rendered via rtfStartEnd — a completely different renderer/style set than
// rtfBody). The real discriminator is `live`: every scripture/point/
// response-card slide gets a live-badge element, Start/End never does.
// Mirrors classifyElements() in diffPresentation.js.
function classify(names) {
  if (names.includes('body')) {
    if (!names.includes('live')) return 'startEnd';
    return names.includes('title') ? 'scripture' : 'point';
  }
  if (names.includes('this slide')) return 'startEnd'; // legacy element name, kept as a fallback
  return 'other';
}

// ─── Extraction ─────────────────────────────────────────────────────────────

/**
 * Decode a .pro file and derive a partial scheme object plus a human-readable
 * report of what was captured. Returns { ok, scheme, report } or { ok:false, error }.
 */
async function extractScheme(filePath) {
  let o;
  try { o = await decodePresentation(filePath); }
  catch (err) { return { ok: false, error: `Could not decode: ${err.message}` }; }

  if (!looksReadable(o)) {
    return { ok: false, error: 'This file did not decode cleanly — it may be a Props file or a presentation type DeckPro can\'t read. Try a full message presentation that DeckPro exported.' };
  }

  // First occurrence of each element we care about, by slide type.
  const pick = { scriptureTitle: null, scriptureBody: null, pointBody: null,
                 gradient: null, live: null, queue: null, startEnd: null };
  const counts = { scripture: 0, point: 0, startEnd: 0, other: 0 };
  let canvasW = null, canvasH = null;

  for (const cue of o.cues) {
    for (const action of (cue.actions || [])) {
      const { elements, size } = elementsOf(action);
      if (!elements.length) continue;
      if (size && canvasW == null) { canvasW = round(size.width); canvasH = round(size.height); }

      const byName = {};
      for (const el of elements) if (el.name) byName[el.name] = el;
      const type = classify(Object.keys(byName));
      counts[type] = (counts[type] || 0) + 1;

      if (type === 'scripture') {
        if (!pick.scriptureTitle && byName['title']) pick.scriptureTitle = readElement(byName['title']);
        if (!pick.scriptureBody  && byName['body'])  pick.scriptureBody  = readElement(byName['body']);
      } else if (type === 'point') {
        if (!pick.pointBody && byName['body']) pick.pointBody = readElement(byName['body']);
      } else if (type === 'startEnd') {
        if (!pick.startEnd && byName['body']) pick.startEnd = readElement(byName['body']);
        else if (!pick.startEnd && byName['this slide']) pick.startEnd = readElement(byName['this slide']);
      }
      if (!pick.gradient && byName['atem_gradient']) pick.gradient = readElement(byName['atem_gradient']);
      if (!pick.live     && byName['live'])          pick.live     = readElement(byName['live']);
      if (!pick.queue    && byName['queue'])         pick.queue    = readElement(byName['queue']);
    }
  }

  // ── Assemble scheme — only set fields we actually captured ──
  const scheme = {};
  const captured = [];
  const set = (k, v, label) => {
    if (v != null && v !== '') { scheme[k] = v; if (label && !captured.includes(label)) captured.push(label); }
  };

  if (canvasW) { set('canvasW', canvasW); set('canvasH', canvasH, 'Canvas size'); }

  // Body: bodyX/bodyW are per-slide content-fitted (vary by text), so we only
  // take the stable Y/H + font/size/colour. Prefer scripture body, fall back to point.
  const body = pick.scriptureBody || pick.pointBody;
  if (body) {
    set('bodyY', body.y); set('bodyH', body.h, 'Body position');
    set('bodyFont', body.font, 'Body font');
    set('bodySize', body.size, 'Body size');
    set('bodyFill', body.fill, 'Body fill colour');
  }

  if (pick.scriptureTitle) {
    const t = pick.scriptureTitle;
    set('titleX', t.x); set('titleY', t.y); set('titleW', t.w); set('titleH', t.h, 'Reference bar position');
    if (t.y != null) scheme.autoTitleY = false; // respect the imported position literally
    set('titleFont', t.font, 'Reference font');
    set('titleSize', t.size, 'Reference size');
    // Reference text colour is scheme-driven via titleFontAdv.color (the bar has no
    // background fill in the current model, so titleFill/titleShadow aren't imported).
    if (t.textColor) {
      scheme.titleFontAdv = { ...(scheme.titleFontAdv || {}), color: t.textColor };
      captured.push('Reference text colour');
    }
  }

  if (pick.gradient) {
    set('gradientX', pick.gradient.x); set('gradientY', pick.gradient.y); set('gradientH', pick.gradient.h, 'Gradient position');
  }
  if (pick.live) {
    set('liveX', pick.live.x); set('liveY', pick.live.y); set('liveW', pick.live.w); set('liveH', pick.live.h, 'Live badge position');
  }
  if (pick.queue) {
    set('queueX', pick.queue.x); set('queueY', pick.queue.y); set('queueW', pick.queue.w); set('queueH', pick.queue.h, 'Queue sidebar position');
  }
  if (pick.startEnd) {
    const s = pick.startEnd;
    set('startEndX', s.x); set('startEndY', s.y); set('startEndW', s.w); set('startEndH', s.h, 'Start/End banner position');
    set('startEndFont', s.font, 'Start/End font');
    set('startEndSize', s.size, 'Start/End size');
  }

  // ── Transitions ── presentation-level transition is the reliable source.
  // (Per-slide transitions are usually empty; prop transitions live in the
  // separate _Props file and can't be read here.)
  let transitionDetected = false;
  const TNAME = { fade: 'fade', dissolve: 'dissolve', cut: 'cut' };
  const tName = (o.transition && o.transition.effect && o.transition.effect.name || '').toLowerCase();
  if (TNAME[tName]) {
    set('transitionType', TNAME[tName]);
    if (typeof o.transition.duration === 'number') set('transitionDuration', round(o.transition.duration));
    captured.push('Slide transition');
    transitionDetected = true;
  }

  // ── Honest warnings for anything not inferred ──
  const warnings = [];
  if (!pick.scriptureTitle) warnings.push('No scripture slide found — reference-bar styling kept at defaults.');
  if (!pick.startEnd)       warnings.push('No Start/End slide found — Start/End styling kept at defaults.');
  if (!transitionDetected)  warnings.push('Slide transition not detected — kept at default (Fade 0.6s).');
  warnings.push('Point-text font was taken from the body bold font — set a separate Point font afterwards if you want one.');
  warnings.push('Prop / LED-wall fonts and transitions live in a separate props file and can\'t be read here — those keep their defaults.');

  return {
    ok: true,
    scheme,
    report: {
      presentation: o.name,
      slideCounts: counts,
      captured,
      warnings,
      fieldCount: Object.keys(scheme).length,
    },
  };
}

/** Scan the default Pro7 library tree, returning presentations (Props files excluded). */
async function listPresentations() {
  const out = [];
  if (!fs.existsSync(LIBRARIES_DIR)) return out;
  let libs;
  try { libs = fs.readdirSync(LIBRARIES_DIR, { withFileTypes: true }).filter(d => d.isDirectory()); }
  catch { return out; }

  for (const lib of libs) {
    const dir = path.join(LIBRARIES_DIR, lib.name);
    let files;
    try { files = fs.readdirSync(dir); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith('.pro') || f.endsWith('_Props.pro')) continue;
      const full = path.join(dir, f);
      let readable = false, name = f.replace(/\.pro$/, ''), cues = 0;
      try {
        const o = await decodePresentation(full);
        if (looksReadable(o)) { readable = true; name = o.name; cues = o.cues.length; }
      } catch (_) {}
      out.push({ name, file: f, path: full, library: lib.name, readable, cues });
    }
  }
  out.sort((a, b) => (Number(b.readable) - Number(a.readable)) || a.name.localeCompare(b.name));
  return out;
}

module.exports = { extractScheme, listPresentations, LIBRARIES_DIR, decodePresentation, elementsOf, rtfString };
