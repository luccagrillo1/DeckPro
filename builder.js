'use strict';

/**
 * builder.js
 * Constructs a protobuf-encodable JS object for a Pro7 presentation.
 *
 * Usage:
 *   const { buildPresentation } = require('./builder');
 *   const obj = buildPresentation(spec);
 *
 * Spec shape:
 *   {
 *     name: 'Message_26.02.24_Series_Title',
 *     qrMacro: { name, uuid } | null,   // fires on any blank-before cue with qrOn
 *     includeResponseCard: true,
 *     slides: [
 *       { type: 'start' },
 *       { type: 'scripture', label, reference, bodies: [[spans]], propName,
 *           blankBefore: true, blankSpans: [], qrOn: false },
 *       { type: 'point', mode: 'single', label, bodyText, propName,
 *           blankBefore: true, blankSpans: [], qrOn: false },
 *       { type: 'point', mode: 'revealing', label, title, bullets: ['…'], propBaseName,
 *           blankBefore: true, blankSpans: [], qrOn: false },
 *       { type: 'image',  label, blankBefore: true, blankSpans: [], qrOn: false },
 *       { type: 'blank',  label, spans: [] },
 *       { type: 'end' },
 *     ]
 *   }
 *
 * qrOn is computed client-side (public/app.js: effectiveQR()) from a per-slide
 * manual override, or the deck's QR toggle + a 'qrmarker' boundary slide's
 * position — builder.js just reads the final boolean per blank-before cue.
 */

const { randomUUID } = require('crypto');
const rtf = require('./rtf');

// ─── Style system ─────────────────────────────────────────────────────────────

const FONT_ADV_DEFAULTS = () => ({
  yOffset:                0,   // px shift on element Y position
  charSpacing:            0,   // pt — converted to RTF \expndtw (×20)
  lineHeight:             1,   // multiplier; 1 = default
  paragraphSpacingBefore: 0,   // pt
  paragraphSpacingAfter:  0,   // pt
  alignment:              '',  // '' = font default, 'left', 'center', 'right'
  italic:                 false,
  underline:              false,
  capitalization:         '',  // '' = none, 'allCaps', 'smallCaps'
});

const DEFAULT_STYLE = {
  // Fill colors (only used when fillEnabled is true)
  bodyFill:    '#2196f2',
  titleFill:   '#a9391a',
  fillEnabled: false,

  // Fonts
  bodyFont:     'Montserrat-Medium',
  propBodyFont: 'Montserrat-SemiBold',
  pointFont:    'Montserrat-ExtraBold',   // point text (main screen)
  propPointFont:'Montserrat-ExtraBold',   // point text (LED wall)
  rcBodyFont:   'Montserrat-Medium',
  rcTitleFont:  'Montserrat-ExtraBold',
  titleFont:    'Montserrat-ExtraBold',
  startEndFont: 'Montserrat-ExtraBold',
  notesFont:     'Montserrat-Medium',  // confidence-monitor slide notes
  liveFont:      'HelveticaNeue',
  queueFont:     'HelveticaNeue',

  // Sizes (pt)
  bodySize:      44,
  pointSize:     44,
  titleSize:     60,
  startEndSize:  45,
  propBodySize:  80,
  propPointSize: 80,
  propTitleSize: 110,
  rcBodySize:    44,
  rcTitleSize:   60,
  notesSize:     50,
  liveSize:      42,
  queueSize:     32,

  // Transitions
  transitionType:     'fade',
  transitionDuration: 0.6,

  // Build order per slide type (mirrors DEFAULT_STYLE_SCHEME in app.js)
  buildOrders: {
    content: [
      { id: 'bo-c1', element: 'body',  dir: 'out', start: 'START_AFTER_PREVIOUS', delay: 60, transition: 'dissolve', duration: 0.6, enabled: true },
      { id: 'bo-c2', element: 'title', dir: 'out', start: 'START_WITH_PREVIOUS',  delay: 0,  transition: 'dissolve', duration: 0.6, enabled: true },
    ],
    point:   [],
    blank:   [],
    startEnd:[
      { id: 'bo-se1', element: 'body', dir: 'in', start: 'START_WITH_SLIDE', delay: 1, transition: 'cut', duration: 0, enabled: true },
    ],
  },

  // Advanced font styling (per font)
  bodyFontAdv:     null,  // null = use FONT_ADV_DEFAULTS()
  propBodyFontAdv: null,
  boldFontAdv:     null,
  propBoldFontAdv: null,
  pointFontAdv:    null,
  propPointFontAdv:null,
  titleFontAdv:    null,
  propTitleFontAdv:null,
  rcBodyFontAdv:   null,
  rcTitleFontAdv:  null,
  startEndFontAdv: null,
  notesFontAdv:    null,
  liveFontAdv:     null,
  queueFontAdv:    null,

  // Canvas (presentation)
  canvasW: 1920, canvasH: 1080,

  // Element bounds — presentation
  bodyX: 0, bodyY: 729.98, bodyW: 1920, bodyH: 350.02,
  pointX: 0, pointY: 729.98, pointW: 1920, pointH: 350.02,
  titleX: -0.18, titleY: 880, titleW: 1920.18, titleH: 50.51,
  startEndX: 0, startEndY: 900.14, startEndW: 1920, startEndH: 179.86,
  rcBodyX: 0, rcBodyY: 729.98, rcBodyW: 1920, rcBodyH: 350.02,
  rcTitleX: -0.18, rcTitleY: 880, rcTitleW: 1920.18, rcTitleH: 50.51,
  rcAutoTitleY: true, rcTitleAutoGap: 16,
  propPointX: 0, propPointY: 853, propPointW: 3200, propPointH: 427,
  // live badge + queue sidebar — the real defaults live here so the make-fns
  // don't carry magic numbers; their inline fallbacks are neutral placeholders.
  liveX: 1736.73, liveY: 1096.71, liveW: 183.27, liveH: 71.56,
  queueX: 0, queueY: 0, queueW: 400, queueH: 1080,
};

function hexToColor(hex) {
  const h = (hex || '#000000').replace('#', '');
  return {
    red:   (parseInt(h.slice(0,2),16)||0) / 255,
    green: (parseInt(h.slice(2,4),16)||0) / 255,
    blue:  (parseInt(h.slice(4,6),16)||0) / 255,
    alpha: 1,
  };
}

/** Merge user style with defaults and pre-compute protobuf color objects. */
function resolveStyle(style = {}) {
  const s  = { ...DEFAULT_STYLE, ...style };
  const fa = s.fillEnabled ? 1 : 0;
  // Normalize fontAdv fields — merge with defaults so callers always get a full object
  const ADKEY = [
    'bodyFontAdv', 'propBodyFontAdv', 'boldFontAdv', 'propBoldFontAdv',
    'pointFontAdv', 'propPointFontAdv', 'titleFontAdv', 'propTitleFontAdv',
    'rcBodyFontAdv', 'rcTitleFontAdv',
    'startEndFontAdv', 'notesFontAdv', 'notesBoldFontAdv', 'liveFontAdv', 'queueFontAdv',
  ];
  const out = {
    ...s,
    cFill:        { ...hexToColor(s.bodyFill),  alpha: fa },
    cFill70:      { ...hexToColor(s.bodyFill),  alpha: s.fillEnabled ? 0.7 : 0 },
    cTitleFill:   { ...hexToColor(s.titleFill), alpha: fa },
  };
  for (const k of ADKEY) {
    out[k] = { ...FONT_ADV_DEFAULTS(), ...(s[k] || {}) };
  }
  return out;
}

// ─── UUID ──────────────────────────────────────────────────────────────────

function uuid() {
  return { string: randomUUID().toUpperCase() };
}

// ─── Structural constants ──────────────────────────────────────────────────

const RECT_PATH = {
  closed: true,
  points: [
    { point: {},              q0: {},              q1: {} },
    { point: { x: 1 },       q0: { x: 1 },        q1: { x: 1 } },
    { point: { x: 1, y: 1 }, q0: { x: 1, y: 1 },  q1: { x: 1, y: 1 } },
    { point: { y: 1 },       q0: { y: 1 },         q1: { y: 1 } },
  ],
  shape: { type: 'TYPE_RECTANGLE' },
};

// ─── Colors ────────────────────────────────────────────────────────────────

// Fixed colors (not part of the style system)
const C_WHITE   = { red: 1, green: 1, blue: 1, alpha: 1 };
const C_BLACK_A = { alpha: 1 };
const C_CHORD   = { red: 0.9450980424880981, green: 0.8156862854957581, blue: 0.1882352977991104, alpha: 1 };
const C_TAN     = { red: 222/255, green: 168/255, blue: 125/255, alpha: 1 };

// ─── Shadows ───────────────────────────────────────────────────────────────

const EL_SHADOW_STD  = { angle: 315, offset: 5, radius: 5, color: C_BLACK_A, opacity: 0.75 };
const TXT_SHADOW_STD = { angle: 315, offset: 5, radius: 5, color: C_BLACK_A, opacity: 0.75 };
const TXT_SHADOW_LO  = { angle: 315, offset: 2, radius: 3, color: C_BLACK_A, opacity: 1, enable: true };

// ─── Transitions ─────────────────────────────────────────────────────────

const TRANSITION_DEFS = {
  fade: {
    name: 'Fade',
    renderId: '99BDD1C3-EE98-4E80-A8DE-3699CE9F338E',
    behaviorDescription: 'Fade',
    category: 'Dissolves',
    defaultDuration: 0.6,
  },
  dissolve: {
    name: 'Dissolve',
    renderId: 'EC52A828-AD85-4602-B70C-1DEE7C904DB6',
    behaviorDescription: 'Cross Dissolve.',
    category: 'Dissolves',
    defaultDuration: 0.6,
  },
  cut: {
    name: 'Cut',
    renderId: 'AB29D07B-E9E2-4E0A-93BD-AD3EA58120FA',
    behaviorDescription: 'Cut.',
    category: 'None',
    defaultDuration: 0,
  },
};

function makeTransition(type, duration) {
  const def = TRANSITION_DEFS[type] || TRANSITION_DEFS.fade;
  const dur = (duration !== undefined && duration !== null) ? duration : def.defaultDuration;
  const t = { effect: { uuid: uuid(), name: def.name, renderId: def.renderId, behaviorDescription: def.behaviorDescription, category: def.category } };
  if (dur > 0) t.duration = dur;
  return t;
}

// ─── Build animations ─────────────────────────────────────────────────────

function makeBuildIn() {
  return {
    uuid: uuid(),
    start: 'START_WITH_SLIDE',
    delayTime: 1,
    transition: {
      effect: {
        uuid: uuid(),
        name: 'Cut',
        renderId: 'AB29D07B-E9E2-4E0A-93BD-AD3EA58120FA',
        behaviorDescription: 'Cut.',
        category: 'None',
      },
    },
  };
}

function makeBuildOut(start, delayTime) {
  const b = {
    uuid: uuid(),
    start,
    transition: {
      duration: 0.6000000238418579,
      effect: {
        uuid: uuid(),
        name: 'Dissolve',
        renderId: 'EC52A828-AD85-4602-B70C-1DEE7C904DB6',
        behaviorDescription: 'Cross Dissolve.',
        category: 'Dissolves',
      },
    },
  };
  if (delayTime !== undefined) b.delayTime = delayTime;
  return b;
}

// ─── Element slot ─────────────────────────────────────────────────────────

function makeSlot(element, { buildIn, buildOut, info = 3 } = {}) {
  if (!element) return null; // skip removed elements (e.g. gradient)
  const slot = { element, info };
  if (buildIn)  slot.buildIn  = { ...buildIn,  elementUUID: element.uuid };
  if (buildOut) slot.buildOut = { ...buildOut, elementUUID: element.uuid };
  slot.textScroller = { scrollRate: 0.5, shouldRepeat: true };
  return slot;
}

/**
 * Apply build order entries to a slot array.
 * Attaches buildIn/buildOut to matching slots (by element.name) in table-row order.
 * Returns the UUID array for elementBuildOrder, or null if entries is empty.
 */
function applyBuildOrders(slots, entries) {
  if (!entries || !entries.length) return null;

  // Build a name→slot map
  const byName = {};
  for (const slot of slots) {
    if (!slot) continue;
    const name = slot.element?.name;
    if (name && !byName[name]) byName[name] = slot;
  }

  const buildOrder = [];
  for (const entry of entries) {
    if (!entry.enabled) continue;
    const slot = byName[entry.element];
    if (!slot) continue;

    const build = {
      uuid: uuid(),
      start: entry.start,
      transition: makeTransition(entry.transition, entry.duration),
    };
    if (entry.delay > 0) build.delayTime = entry.delay;

    if (entry.dir === 'in') {
      slot.buildIn = { ...build, elementUUID: slot.element.uuid };
      buildOrder.push(slot.buildIn.uuid);
    } else {
      slot.buildOut = { ...build, elementUUID: slot.element.uuid };
      buildOrder.push(slot.buildOut.uuid);
    }
  }

  return buildOrder; // explicit order (may be [] if all disabled)
}

// ─── Font adv helpers ─────────────────────────────────────────────────────

function resolveVertAlign(adv, defaultVal) {
  const map = { top: 'VERTICAL_ALIGNMENT_TOP', middle: 'VERTICAL_ALIGNMENT_MIDDLE', bottom: 'VERTICAL_ALIGNMENT_BOTTOM' };
  return (adv?.verticalAlignment && map[adv.verticalAlignment]) || defaultVal;
}

function resolveMargins(adv, defaults = {}) {
  return {
    left:   adv?.marginLeft   ?? defaults.left   ?? 0,
    top:    adv?.marginTop    ?? defaults.top    ?? 0,
    right:  adv?.marginRight  ?? defaults.right  ?? 0,
    bottom: adv?.marginBottom ?? defaults.bottom ?? 0,
  };
}

function resolveScaleBehavior(adv, defaultVal) {
  const v = adv?.scaleBehavior;
  if (!v) return defaultVal;
  if (v === 'none') return undefined;
  return v;
}

function resolveCapitalization(adv) {
  const map = {
    allCaps: 'CAPITALIZATION_ALL_CAPS',
    smallCaps: 'CAPITALIZATION_SMALL_CAPS',
    titleCase: 'CAPITALIZATION_TITLE_CASE',
    startCase: 'CAPITALIZATION_START_CASE',
  };
  return map[adv?.capitalization] || null;
}

function capitalizationAttr(adv) {
  const cap = resolveCapitalization(adv);
  return cap ? { capitalization: cap } : {};
}

function capitalizationCustomAttributes(adv, charCount) {
  if (!charCount) return [];
  const cap = resolveCapitalization(adv);
  return cap ? [{ range: { end: charCount }, capitalization: cap }] : [{ range: { end: charCount } }];
}

/**
 * Per-span capitalization ranges — for bodies that mix plain text (baseAdv) with
 * alt/emphasis-marked words (altAdv), e.g. scripture bold-word highlighting.
 * The RTF already applies \caps per-run; ProPresenter's live rendering also needs
 * the same split reflected as separate customAttributes ranges, or an alt word's
 * own capitalization setting (e.g. Bold row set to ALL CAPS) never shows on screen.
 *
 * Every range gets an EXPLICIT capitalization value (CAPITALIZATION_NONE when the
 * row has no caps set) rather than omitting the field — omitting it would mean
 * "inherit the element's base capitalization," which silently breaks the case
 * where the base body IS capitalized but the alt words should NOT be.
 * Adjacent spans with the same effective capitalization are merged into one range.
 */
function spanCapitalizationRanges(spans, baseAdv, altAdv) {
  const list = spans || [];
  const totalLen = list.reduce((n, s) => n + (s.text || '').length, 0);
  if (!totalLen) return [];
  const NONE = 'CAPITALIZATION_NONE';
  const ranges = [];
  let pos = 0, curCap = null, curStart = 0;
  for (const s of list) {
    const len = (s.text || '').length;
    if (!len) continue;
    const cap = resolveCapitalization(s.alt ? altAdv : baseAdv) || NONE;
    if (pos === 0) { curCap = cap; curStart = 0; }
    else if (cap !== curCap) {
      ranges.push({ range: { start: curStart, end: pos }, capitalization: curCap });
      curCap = cap; curStart = pos;
    }
    pos += len;
  }
  ranges.push({ range: { start: curStart, end: pos }, capitalization: curCap });
  return ranges;
}

function resolveStroke(adv, defaultStroke) {
  if (!adv?.strokeEnabled) return defaultStroke;
  return { width: adv.strokeWidth ?? 1, color: hexToColor(adv.strokeColor || '#ffffff') };
}

function resolveShadow(adv, defaultShadow) {
  if (!adv?.shadowEnabled) return defaultShadow;
  return {
    angle:   adv.shadowAngle  ?? 315,
    offset:  adv.shadowOffset ?? 5,
    radius:  adv.shadowBlur   ?? 5,
    color:   hexToColor(adv.shadowColor || '#000000'),
    opacity: (adv.shadowOpacity ?? 75) / 100,
  };
}

// ── TEXT-level stroke/shadow (what ProPresenter actually renders on the text) ──
// ProPresenter draws the text outline from text.attributes.strokeWidth (negative
// = outline) + strokeColor, and the text drop-shadow from text.shadow — NOT the
// element-level stroke/shadow. Width N in the UI is stored as -N here.
function resolveTextStroke(adv) {
  if (!adv?.strokeEnabled) return { strokeWidth: -1, strokeColor: C_BLACK_A };
  return {
    strokeWidth: -(adv.strokeWidth ?? 1),
    strokeColor: hexToColor(adv.strokeColor || '#000000'),
  };
}
function resolveTextShadow(adv, defaultShadow) {
  if (!adv?.shadowEnabled) return defaultShadow;
  return { ...resolveShadow(adv, defaultShadow), enable: true };
}

// ─── Element builders ─────────────────────────────────────────────────────

function bounds(x, y, w, h) {
  return { origin: { x, y }, size: { width: w, height: h } };
}

function makeBodyElement({ name = 'body', x, y, w, h, rtfData, charCount, spans }, rs = {}) {
  const id = uuid();
  const hasAlt = (spans || []).some(s => s.alt);
  const customAttrs = hasAlt
    ? spanCapitalizationRanges(spans, rs.bodyFontAdv, rs.boldFontAdv)
    : capitalizationCustomAttributes(rs.bodyFontAdv, charCount);
  return {
    uuid: id,
    name,
    bounds: bounds(x, y, w, h),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: rs.cFill || hexToColor('#2196f2') },
    stroke: resolveStroke(rs.bodyFontAdv, { width: 3, color: C_WHITE }),
    shadow: resolveShadow(rs.bodyFontAdv, EL_SHADOW_STD),
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: rs.bodyFont || 'Montserrat-Medium', size: rs.bodySize || 44, bold: !!rs.bodyFontAdv?.bold, family: 'Montserrat' },
        ...capitalizationAttr(rs.bodyFontAdv),
        textSolidFill: textColorFromAdv(rs.bodyFontAdv),
        underlineStyle: {},
        paragraphStyle: { lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        ...resolveTextStroke(rs.bodyFontAdv),
        customAttributes: customAttrs,
      },
      shadow: resolveTextShadow(rs.bodyFontAdv, TXT_SHADOW_LO),
      rtfData,
      scaleBehavior: resolveScaleBehavior(rs.bodyFontAdv, 'SCALE_BEHAVIOR_SCALE_FONT_DOWN'),
      verticalAlignment: resolveVertAlign(rs.bodyFontAdv, 'VERTICAL_ALIGNMENT_BOTTOM'),
      margins: resolveMargins(rs.bodyFontAdv, {
        left:   rs.bodyMarginLeft   ?? 0,
        top:    rs.bodyMarginTop    ?? 0,
        right:  rs.bodyMarginRight  ?? 0,
        bottom: rs.bodyMarginBottom ?? 0,
      }),
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

function makePointBodyElement({ x, y, w, h, rtfData, text }, rs = {}) {
  x = x ?? 0; y = y ?? 0; w = w ?? 1920; h = h ?? 100;
  const id = uuid();
  const charCount = text.length;
  const adv = rs.pointFontAdv || rs.boldFontAdv || {};
  return {
    uuid: id,
    name: 'body',
    bounds: bounds(x, y, w, h),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: rs.cFill || hexToColor('#2196f2') },
    stroke: resolveStroke(adv, { width: 3, color: C_WHITE }),
    shadow: resolveShadow(adv, EL_SHADOW_STD),
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: rs.pointFont || 'Montserrat-Black', size: rs.pointSize || rs.bodySize || 44, bold: !!adv.bold, family: rs.pointFont || 'Montserrat-Black' },
        ...capitalizationAttr(adv),
        textSolidFill: textColorFromAdv(rs.pointFontAdv || rs.boldFontAdv),
        underlineStyle: {},
        // Alignment follows Advanced → Alignment (default centered for points).
        // 'left' omits the field (proto default / natural-left), matching the RTF.
        paragraphStyle: { ...(adv.alignment === 'left' ? {} : { alignment: adv.alignment === 'right' ? 'ALIGNMENT_RIGHT' : 'ALIGNMENT_CENTER' }), lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        ...resolveTextStroke(rs.pointFontAdv || rs.boldFontAdv),
        customAttributes: capitalizationCustomAttributes(adv, charCount),
      },
      shadow: resolveTextShadow(rs.pointFontAdv || rs.boldFontAdv, TXT_SHADOW_LO),
      rtfData,
      scaleBehavior: resolveScaleBehavior(adv, 'SCALE_BEHAVIOR_SCALE_FONT_DOWN'),
      verticalAlignment: resolveVertAlign(adv, 'VERTICAL_ALIGNMENT_BOTTOM'),
      margins: resolveMargins(adv, {
        left:   rs.pointMarginLeft   ?? rs.bodyMarginLeft   ?? 0,
        top:    rs.pointMarginTop    ?? rs.bodyMarginTop    ?? 0,
        right:  rs.pointMarginRight  ?? rs.bodyMarginRight  ?? 0,
        bottom: rs.pointMarginBottom ?? rs.bodyMarginBottom ?? 60,
      }),
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

function makeStartEndElement({ text }, rs = {}) {
  const id = uuid();
  const charCount = text.length;
  const x = rs.startEndX ?? 0;
  const y = rs.startEndY ?? 0;
  const w = rs.startEndW ?? rs.canvasW ?? 1920;
  const h = rs.startEndH ?? 100;
  return {
    uuid: id,
    name: 'body',
    bounds: bounds(x, y + (rs.startEndFontAdv?.yOffset ?? 0), w, h),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: rs.cFill || hexToColor('#2196f2') },
    stroke: resolveStroke(rs.startEndFontAdv, { width: 3, color: C_WHITE }),
    shadow: resolveShadow(rs.startEndFontAdv, EL_SHADOW_STD),
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: rs.startEndFont || 'Montserrat-ExtraBold', size: rs.startEndSize || 45, bold: !!(rs.startEndFontAdv && rs.startEndFontAdv.bold), family: rs.startEndFont || 'Montserrat-ExtraBold' },
        ...capitalizationAttr(rs.startEndFontAdv),
        textSolidFill: textColorFromAdv(rs.startEndFontAdv),
        underlineStyle: {},
        paragraphStyle: { lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        ...resolveTextStroke(rs.startEndFontAdv),
        customAttributes: capitalizationCustomAttributes(rs.startEndFontAdv, charCount),
      },
      shadow: resolveTextShadow(rs.startEndFontAdv, TXT_SHADOW_STD),
      rtfData: rtf.rtfStartEnd(text, rs),
      scaleBehavior: resolveScaleBehavior(rs.startEndFontAdv, 'SCALE_BEHAVIOR_SCALE_FONT_DOWN'),
      verticalAlignment: resolveVertAlign(rs.startEndFontAdv, 'VERTICAL_ALIGNMENT_MIDDLE'),
      margins: resolveMargins(rs.startEndFontAdv, { left: 20, right: 20, top: 20, bottom: 20 }),
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

/**
 * Title element for START/END slides — named 'title', positioned at the live badge bounds
 * (below main canvas, visible on confidence monitor), shows the slide label text.
 * Styled like the live element: HelveticaNeue, blue fill, white text, centered.
 */
function makeStartEndTitleEl({ text }, rs = {}) {
  const id = uuid();
  const label = text || '';
  return {
    uuid: id,
    name: 'title',
    bounds: bounds(rs.liveX ?? 0, rs.liveY ?? 0, rs.liveW ?? 100, rs.liveH ?? 100),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: rs.cFill || hexToColor('#2196f2') },
    stroke: { width: 3, color: C_WHITE },
    shadow: EL_SHADOW_STD,
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: rs.liveFont || 'HelveticaNeue', size: rs.liveSize || 42, family: rs.liveFont || 'Helvetica Neue' },
        textSolidFill: textColorFromAdv(rs.liveFontAdv),
        underlineStyle: {},
        paragraphStyle: { alignment: 'ALIGNMENT_CENTER', lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        strokeWidth: 0,
        customAttributes: [{ range: { end: label.length } }],
      },
      shadow: TXT_SHADOW_STD,
      rtfData: rtf.rtfLiveLabel(label, rs),
      verticalAlignment: resolveVertAlign(rs.liveFontAdv, 'VERTICAL_ALIGNMENT_MIDDLE'),
      margins: resolveMargins(rs.liveFontAdv, {}),
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

function makeLiveElement(rs = {}) {
  const id = uuid();
  return {
    uuid: id,
    name: 'live',
    bounds: bounds(rs.liveX ?? 0, rs.liveY ?? 0, rs.liveW ?? 100, rs.liveH ?? 100),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: rs.cFill || hexToColor('#2196f2') },
    stroke: { width: 3, color: C_WHITE },
    shadow: EL_SHADOW_STD,
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: rs.liveFont || 'HelveticaNeue', size: rs.liveSize || 42, family: rs.liveFont || 'Helvetica Neue' },
        textSolidFill: textColorFromAdv(rs.liveFontAdv),
        underlineStyle: {},
        paragraphStyle: { alignment: 'ALIGNMENT_CENTER', lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        strokeWidth: 0,
        customAttributes: [{ range: { end: 4 } }],
      },
      shadow: TXT_SHADOW_STD,
      rtfData: rtf.rtfLive(rs),
      verticalAlignment: 'VERTICAL_ALIGNMENT_MIDDLE',
      margins: resolveMargins(rs.liveFontAdv, {}),
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

/**
 * Estimate title Y when autoTitleY is enabled, then position the title bar
 * `titleAutoGap` px above the body text's top edge.
 *
 * `knownLines` is the REAL line count Fit Width already measured in the
 * browser (DOM-accurate, aware of the exact wrap Fit Width chose, bold
 * width, punctuation breaks, etc.); `metrics` is that same measurement
 * pass's real font metrics — { ascent, descent, capAscent }, see
 * _fitFontMetrics in public/app.js. Together they give the exact formula:
 *
 *   lineH     = bodySize × (bodyFontAdv.lineHeight || 1.3)
 *   blockTop  = (bodyY + bodyH) − N × lineH        (body is bottom-anchored)
 *   halfLead  = (lineH − (ascent + descent)) / 2
 *   inkTop    = blockTop + halfLead + (ascent − capAscent)
 *   titleY    = inkTop − gap − titleH
 *
 * capAscent — the actual ink-top of a reference capital "H" in the resolved
 * font/weight/style/size — is used instead of the real first line's own ink
 * top on purpose: a line starting "The" sits a few px lower than one
 * starting "were" for the same visual gap, which would make the title
 * bar jitter down the deck line to line. Cap height adapts to font/weight/
 * capitalization while landing every line identically.
 *
 * Without both `knownLines` and `metrics` (a caller with no Fit Width
 * result — currently only Response Card's title, a separate, deliberately
 * unmigrated path) falls back to counting wrapped lines via a char-width
 * estimate. That fallback routinely disagrees with Fit Width's real wrap
 * when one IS available, which is why callers that have real numbers must
 * always pass them rather than relying on this to guess.
 */
function estimateTitleY(displayBody, bw, rs, knownLines, metrics) {
  const bodySize = rs.bodySize ?? 44;
  const gap      = rs.titleAutoGap ?? 16;
  const by       = rs.bodyY ?? 0;
  const bh       = rs.bodyH ?? 100;
  const th       = rs.titleH ?? 100;

  const hasReal = Number.isFinite(knownLines) && knownLines > 0 && metrics
    && Number.isFinite(metrics.ascent) && Number.isFinite(metrics.descent) && Number.isFinite(metrics.capAscent);

  if (hasReal) {
    const lineH    = bodySize * (rs.bodyFontAdv?.lineHeight || 1.3);
    const blockTop = (by + bh) - knownLines * lineH;
    const halfLead = (lineH - (metrics.ascent + metrics.descent)) / 2;
    const inkTop   = blockTop + halfLead + (metrics.ascent - metrics.capAscent);
    const titleY   = inkTop - gap - th;
    // Deferred: auto-shrinking the body font when a long body leaves no room
    // is a separate, explicitly out-of-scope feature. For now, clamp instead
    // of silently changing the body font size — the gap just ends up tighter
    // than requested on a slide that genuinely doesn't have room for both.
    return Math.round(Math.max(0, titleY));
  }

  const lineH = bodySize * 1.3;
  let totalLines = Number.isFinite(knownLines) && knownLines > 0 ? knownLines : null;

  if (totalLines === null) {
    // Flatten text; split into paragraphs on explicit newlines
    const fullText     = (displayBody || []).map(s => s.text || '').join('');
    const paragraphs   = fullText.split('\n');

    // Avg char width for Montserrat-Medium ≈ 0.52 × font size
    const avgCharW     = bodySize * 0.52;
    const charsPerLine = Math.max(1, bw / avgCharW);

    totalLines = 0;
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      const words = trimmed.split(/\s+/);
      let lineLen = 0;
      let lines   = 1;
      for (const word of words) {
        const wLen = word.length;
        if (lineLen > 0 && lineLen + 1 + wLen > charsPerLine) {
          lines++;
          lineLen = wLen;
        } else {
          lineLen += (lineLen > 0 ? 1 : 0) + wLen;
        }
      }
      totalLines += lines;
    }
    if (totalLines === 0) totalLines = 1;
  }

  const marginBottom   = rs.bodyFontAdv?.marginBottom ?? rs.bodyMarginBottom ?? 60;
  const estimatedTextH = totalLines * lineH;
  const textTop        = by + bh - marginBottom - estimatedTextH;
  return Math.round(textTop - gap - th);
}

function makeTitleElement({ reference, titleY }, rs = {}) {
  const id = uuid();
  const charCount = reference.length;
  if (titleY === undefined) titleY = rs.titleY ?? 0;
  const tx = rs.titleX ?? 0;
  const tw = rs.titleW ?? (rs.canvasW ?? 1920) + 0.18;
  const th = rs.titleH ?? 100;
  const adv = rs.titleFontAdv || {};
  return {
    uuid: id,
    name: 'title',
    bounds: bounds(tx, titleY + (adv.yOffset ?? 0), tw, th),
    opacity: 1,
    path: RECT_PATH,
    // Reference bar is fully scheme-driven — no hard-coded background fill,
    // text colour or shadow. Fill is transparent (no bar); text colour, stroke
    // and shadow all come from titleFontAdv. Arial / white are the only fallbacks.
    fill: { color: rs.cTitleFill || { alpha: 0 } },
    stroke: resolveStroke(rs.titleFontAdv, { width: 3, color: C_WHITE }),
    shadow: resolveShadow(rs.titleFontAdv, EL_SHADOW_STD),
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: rs.titleFont || 'Arial', size: rs.titleSize || 40, bold: !!adv.bold, family: rs.titleFont || 'Arial' },
        ...capitalizationAttr(adv),
        textSolidFill: (rs.titleFontAdv && rs.titleFontAdv.color) ? hexToColor(rs.titleFontAdv.color) : C_WHITE,
        underlineStyle: {},
        paragraphStyle: { alignment: 'ALIGNMENT_CENTER', lineHeightMultiple: 1, paragraphSpacing: 20, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        ...resolveTextStroke(rs.titleFontAdv),
        customAttributes: capitalizationCustomAttributes(adv, charCount),
      },
      shadow: resolveTextShadow(rs.titleFontAdv, TXT_SHADOW_LO),
      rtfData: rtf.rtfTitle(reference, rs),
      verticalAlignment: resolveVertAlign(rs.titleFontAdv, 'VERTICAL_ALIGNMENT_MIDDLE'),
      margins: resolveMargins(rs.titleFontAdv, { left: 25 }),
      scaleBehavior: resolveScaleBehavior(rs.titleFontAdv, 'SCALE_BEHAVIOR_SCALE_FONT_DOWN'),
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

function makeGradientElement() {
  // Gradient is handled by a Pro7 macro — not generated by DeckPro.
  return null;
}

// ─── Response card element builders ──────────────────────────────────────────

const RC_LAYOUT = {
  title: { x: 325, y: 856, w: 2550, h: 400 },
  mark:  { x: 310, w: 70, h: 150 },
  row:   { x: 400, w: 2600, h: 150 },
  rowYs: [150, 330, 510, 690],
};
const RC_MARK_LABELS = ['•', '1', '2', '3'];

function rcResponses(responses = {}) {
  return [responses.decisionText || '', responses.r1 || '', responses.r2 || '', responses.r3 || ''];
}

function textColorFromAdv(adv, fallback = C_WHITE) {
  return adv?.color ? hexToColor(adv.color) : fallback;
}

/** Legacy decorative "response N" label — kept for backwards-compatible tests/tools. */
function makeResponseLabelElement(n) {
  const id = uuid();
  return {
    uuid: id,
    name: 'title',
    bounds: bounds(77, 847.8, 1759.8, 211.2),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: hexToColor('#2196f2') },
    stroke: { width: 3, color: C_WHITE },
    shadow: EL_SHADOW_STD,
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: 'Desire-Pro', size: 60, family: 'Desire-Pro' },
        textSolidFill: C_TAN,
        underlineStyle: {},
        paragraphStyle: { alignment: 'ALIGNMENT_CENTER', lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        strokeWidth: -1,
        strokeColor: C_BLACK_A,
        customAttributes: [],
      },
      shadow: TXT_SHADOW_LO,
      rtfData: rtf.rtfResponseLabel(n),
      scaleBehavior: 'SCALE_BEHAVIOR_SCALE_FONT_DOWN',
      verticalAlignment: 'VERTICAL_ALIGNMENT_MIDDLE',
      margins: {},
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

/** Legacy single response body element — kept for backwards-compatible tests/tools. */
function makeResponseBodyElement(text) {
  const id = uuid();
  const charCount = (text || '').length;
  return {
    uuid: id,
    name: 'body',
    bounds: bounds(82.8, 730, 1754.4, 350),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: hexToColor('#2196f2') },
    stroke: { width: 3, color: C_WHITE },
    shadow: EL_SHADOW_STD,
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: rs.bodyFont || 'Montserrat-Medium', size: rs.bodySize || 45, family: rs.bodyFont || 'Montserrat' },
        textSolidFill: C_WHITE,
        underlineStyle: {},
        paragraphStyle: { alignment: 'ALIGNMENT_CENTER', lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        strokeWidth: -1,
        strokeColor: C_BLACK_A,
        customAttributes: charCount ? [{ range: { end: charCount } }] : [],
      },
      shadow: TXT_SHADOW_LO,
      rtfData: rtf.rtfResponseBody(text, rs),
      scaleBehavior: 'SCALE_BEHAVIOR_SCALE_FONT_DOWN',
      verticalAlignment: 'VERTICAL_ALIGNMENT_BOTTOM',
      margins: { bottom: 60 },
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

function makeResponseCardTitleElement(rs = {}) {
  const id = uuid();
  const text = 'Response Card';
  const adv = rs.titleFontAdv || {};
  return {
    uuid: id,
    name: 'response card',
    bounds: bounds(RC_LAYOUT.title.x, RC_LAYOUT.title.y + (adv.yOffset ?? 0), RC_LAYOUT.title.w, RC_LAYOUT.title.h),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: { alpha: 0 } },
    stroke: resolveStroke(adv, { width: 3, color: C_WHITE }),
    shadow: resolveShadow(adv, EL_SHADOW_STD),
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: rs.titleFont || 'Montserrat-ExtraBold', size: rs.titleSize || 60, bold: !!adv.bold, family: rs.titleFont || 'Montserrat' },
        ...capitalizationAttr(adv),
        textSolidFill: textColorFromAdv(adv),
        underlineStyle: {},
        paragraphStyle: { alignment: 'ALIGNMENT_CENTER', lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        strokeWidth: -1,
        strokeColor: C_BLACK_A,
        customAttributes: capitalizationCustomAttributes(adv, text.length),
      },
      shadow: TXT_SHADOW_LO,
      rtfData: rtf.rtfTitle(text, rs),
      ...(resolveScaleBehavior(adv, undefined) !== undefined ? { scaleBehavior: resolveScaleBehavior(adv, undefined) } : {}),
      verticalAlignment: resolveVertAlign(adv, 'VERTICAL_ALIGNMENT_MIDDLE'),
      margins: resolveMargins(adv, {}),
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

function makeResponseCardRowElement(n, text, rs = {}) {
  const id = uuid();
  const adv = rs.bodyFontAdv || {};
  const charCount = (text || '').length;
  const y = RC_LAYOUT.rowYs[n - 1] ?? RC_LAYOUT.rowYs[0];
  return {
    uuid: id,
    name: `response ${n}`,
    bounds: bounds(RC_LAYOUT.row.x, y + (adv.yOffset ?? 0), RC_LAYOUT.row.w, RC_LAYOUT.row.h),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: { alpha: 0 } },
    stroke: resolveStroke(adv, { width: 3, color: C_WHITE }),
    shadow: resolveShadow(adv, EL_SHADOW_STD),
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: rs.bodyFont || 'Montserrat-Medium', size: rs.bodySize || 44, family: rs.bodyFont || 'Montserrat' },
        textSolidFill: textColorFromAdv(adv),
        underlineStyle: {},
        paragraphStyle: { alignment: 'ALIGNMENT_CENTER', lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        strokeWidth: -1,
        strokeColor: C_BLACK_A,
        customAttributes: charCount ? [{ range: { end: charCount } }] : [],
      },
      shadow: TXT_SHADOW_LO,
      rtfData: rtf.rtfResponseBody(text, rs),
      ...(resolveScaleBehavior(adv, undefined) !== undefined ? { scaleBehavior: resolveScaleBehavior(adv, undefined) } : {}),
      verticalAlignment: resolveVertAlign(adv, 'VERTICAL_ALIGNMENT_MIDDLE'),
      margins: resolveMargins(adv, {}),
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

function makeResponseCardMarkElement(n, rs = {}) {
  const id = uuid();
  const text = RC_MARK_LABELS[n - 1] || String(n);
  const adv = rs.bodyFontAdv || {};
  const y = RC_LAYOUT.rowYs[n - 1] ?? RC_LAYOUT.rowYs[0];
  return {
    uuid: id,
    name: `mark ${n}`,
    bounds: bounds(RC_LAYOUT.mark.x, y + (adv.yOffset ?? 0), RC_LAYOUT.mark.w, RC_LAYOUT.mark.h),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: { alpha: 0 } },
    stroke: resolveStroke(adv, { width: 3, color: C_WHITE }),
    shadow: resolveShadow(adv, EL_SHADOW_STD),
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: rs.bodyFont || 'Montserrat-Medium', size: rs.bodySize || 44, family: rs.bodyFont || 'Montserrat' },
        textSolidFill: textColorFromAdv(adv),
        underlineStyle: {},
        paragraphStyle: { alignment: 'ALIGNMENT_RIGHT', lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        strokeWidth: -1,
        strokeColor: C_BLACK_A,
        customAttributes: [{ range: { end: text.length } }],
      },
      shadow: TXT_SHADOW_LO,
      rtfData: rtf.rtfResponseMark(text, rs),
      ...(resolveScaleBehavior(adv, undefined) !== undefined ? { scaleBehavior: resolveScaleBehavior(adv, undefined) } : {}),
      verticalAlignment: resolveVertAlign(adv, 'VERTICAL_ALIGNMENT_MIDDLE'),
      margins: resolveMargins(adv, {}),
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

/** Display 1 RC slide: scheme body + title, just like a scripture slide. */
function makeRCSlide1(label, bodyText, rs = {}) {
  const bodyAdv = rs.rcBodyFontAdv || rs.bodyFontAdv || {};
  const titleAdv = rs.rcTitleFontAdv || rs.titleFontAdv || {};
  const bodyStyle = {
    ...rs,
    bodyFont: rs.rcBodyFont || rs.bodyFont,
    bodySize: rs.rcBodySize || rs.bodySize,
    bodyFontAdv: bodyAdv,
  };
  const titleStyle = {
    ...rs,
    titleFont: rs.rcTitleFont || rs.titleFont,
    titleSize: rs.rcTitleSize || rs.titleSize,
    titleFontAdv: titleAdv,
    titleX: rs.rcTitleX ?? rs.titleX,
    titleW: rs.rcTitleW ?? rs.titleW,
    titleH: rs.rcTitleH ?? rs.titleH,
  };

  const bx = rs.rcBodyX ?? rs.bodyX ?? 0;
  const by = rs.rcBodyY ?? rs.bodyY ?? 0;
  const bw = rs.rcBodyW ?? rs.bodyW ?? rs.canvasW ?? 1920;
  const bh = rs.rcBodyH ?? rs.bodyH ?? 100;
  const bodyYOff = bodyAdv.yOffset ?? 0;
  const spans = bodyText ? [{ text: bodyText }] : [];
  const bodyRtf = rtf.rtfBody(spans, bodyStyle);
  const titleY = (rs.rcAutoTitleY ?? rs.autoTitleY)
    ? estimateTitleY(spans, bw, {
        ...rs,
        bodyY: by,
        bodyH: bh,
        bodySize: bodyStyle.bodySize,
        bodyFontAdv: bodyAdv,
        titleH: titleStyle.titleH,
        titleAutoGap: rs.rcTitleAutoGap ?? rs.titleAutoGap,
      })
    : (rs.rcTitleY ?? rs.titleY ?? 0);
  return [
    makeSlot(makeLiveElement(rs), { info: 2 }),
    makeSlot(makeTitleElement({ reference: label, titleY }, titleStyle)),
    makeSlot(makeBodyElement({ x: bx, y: by + bodyYOff, w: bw, h: bh, rtfData: bodyRtf, charCount: (bodyText || '').length }, bodyStyle)),
  ];
}

/** Confidence monitor element for response slides — off-screen y=1135, full list */
function makeResponseConfMonitorElement(decisionText, r1, r2, r3, rs = {}) {
  const id = uuid();
  const plain = [decisionText || '', `1 — ${r1 || ''}`, `2 — ${r2 || ''}`, `3 — ${r3 || ''}`].join('\n');
  const adv = rs.notesFontAdv || {};
  return {
    uuid: id,
    name: 'this slide',
    bounds: bounds(76.8, 1135.1, 1832.3, 351.6),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: hexToColor('#2196f2') },
    stroke: resolveStroke(adv, { width: 3, color: C_WHITE }),
    shadow: resolveShadow(adv, EL_SHADOW_STD),
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: rs.notesFont || 'Montserrat-Medium', size: rs.notesSize || 40, family: rs.notesFont || 'Montserrat' },
        textSolidFill: textColorFromAdv(adv),
        underlineStyle: {},
        paragraphStyle: { lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        ...resolveTextStroke(adv),
        customAttributes: plain.length ? [{ range: { end: plain.length } }] : [],
      },
      shadow: resolveTextShadow(adv, TXT_SHADOW_LO),
      rtfData: rtf.rtfResponseConfMonitor(decisionText, r1, r2, r3),
      scaleBehavior: resolveScaleBehavior(adv, 'SCALE_BEHAVIOR_SCALE_FONT_DOWN'),
      verticalAlignment: resolveVertAlign(adv, 'VERTICAL_ALIGNMENT_TOP'),
      margins: resolveMargins(adv, { top: 10 }),
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

/** Response Card Hold title — Montserrat-BlackItalic, static */
function makeResponseHoldTitleElement() {
  const id = uuid();
  const text = 'Response Card Hold';
  return {
    uuid: id,
    name: 'title',
    bounds: bounds(118.5, 900.1, 1683.2, 179.9),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: hexToColor('#2196f2') },
    stroke: { width: 3, color: C_WHITE },
    shadow: EL_SHADOW_STD,
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: 'Montserrat-BlackItalic', size: 43, bold: true, family: 'Montserrat' },
        textSolidFill: C_WHITE,
        underlineStyle: {},
        paragraphStyle: { lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        strokeWidth: -1,
        strokeColor: C_BLACK_A,
        customAttributes: [{ range: { end: text.length } }],
      },
      shadow: TXT_SHADOW_LO,
      rtfData: rtf.rtfResponseHoldTitle(),
      scaleBehavior: 'SCALE_BEHAVIOR_SCALE_FONT_DOWN',
      verticalAlignment: 'VERTICAL_ALIGNMENT_MIDDLE',
      margins: {},
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

/**
 * Queue sidebar element: shows upcoming slide labels.
 * x=0, y=0, w=400, h=1080 — full-height left sidebar on confidence monitor.
 * labels: string[] (already truncated to ≤20 chars)
 */
function makeQueueElement(labels, rs = {}) {
  const id = uuid();
  return {
    uuid: id,
    name: 'queue',
    bounds: bounds(rs.queueX ?? 0, rs.queueY ?? 0, rs.queueW ?? 100, rs.queueH ?? 100),
    opacity: 1,
    path: RECT_PATH,
    fill: { color: rs.cFill70 || { ...hexToColor('#2196f2'), alpha: 0.7 } },
    stroke: { width: 3, color: C_WHITE },
    shadow: EL_SHADOW_STD,
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: 'HelveticaNeue', size: 16, family: 'Helvetica Neue' },
        textSolidFill: C_WHITE,
        underlineStyle: {},
        paragraphStyle: { lineHeightMultiple: 1, defaultTabInterval: 84, textList: {} },
        strikethroughStyle: {},
        strokeWidth: 0,
        customAttributes: [],
      },
      shadow: TXT_SHADOW_STD,
      rtfData: rtf.rtfQueue(labels, rs),
      verticalAlignment: 'VERTICAL_ALIGNMENT_TOP',
      margins: resolveMargins(rs.queueFontAdv, { left: 10, top: 10 }),
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

// ─── Notes RTF ────────────────────────────────────────────────────────────

function emptyNotesRtf() {
  return Buffer.from(
    '{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865\n' +
    '\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fnil\\fcharset0 HelveticaNeue;}\n' +
    '{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;}\n' +
    '{\\*\\expandedcolortbl;;\\csgray\\c100000;}\n' +
    '\\deftab1300\n' +
    '\\pard\\pardeftab1300\\pardirnatural\\partightenfactor0\n' +
    '\n' +
    '\\f0\\fs100 \\cf2 }'
  ).toString('base64');
}

// ─── Slide / action builders ───────────────────────────────────────────────

function makeBaseSlide(elements, explicitBuildOrder) {
  let buildOrder;
  if (explicitBuildOrder !== undefined && explicitBuildOrder !== null) {
    buildOrder = explicitBuildOrder;
  } else {
    buildOrder = [];
    for (const slot of elements) {
      if (slot.buildIn)  buildOrder.push(slot.buildIn.uuid);
      if (slot.buildOut) buildOrder.push(slot.buildOut.uuid);
    }
  }
  return {
    elements,
    elementBuildOrder: buildOrder,
    size: { width: 1920, height: 1080 },
    uuid: uuid(),
  };
}

// First few words of a body (spans array or string) for the queue "ref + phrase" mode.
function firstPhrase(body, words = 5) {
  let t = '';
  if (Array.isArray(body)) t = body.map(s => (s && s.text) || '').join('');
  else t = String(body || '');
  t = t.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const parts = t.split(' ');
  return parts.slice(0, words).join(' ') + (parts.length > words ? '…' : '');
}

function makeSlideAction(label, elements, buildOrder, notesRtf) {
  elements = (elements || []).filter(Boolean); // drop null slots (e.g. removed gradient)
  return {
    uuid: uuid(),
    label: { text: label },
    isEnabled: true,
    type: 'ACTION_TYPE_PRESENTATION_SLIDE',
    slide: {
      presentation: {
        baseSlide: makeBaseSlide(elements, buildOrder),
        notes: {
          rtfData: notesRtf || emptyNotesRtf(),
          attributes: {},
        },
        chordChart: { platform: 'PLATFORM_MACOS' },
      },
    },
  };
}

function macroAction(macroName, macroUuid) {
  return {
    uuid: uuid(),
    isEnabled: true,
    type: 'ACTION_TYPE_MACRO',
    macro: {
      identification: {
        parameterUuid: { string: macroUuid },
        parameterName: macroName,
      },
    },
  };
}

function clearPropAction() {
  return {
    uuid: uuid(),
    isEnabled: true,
    type: 'ACTION_TYPE_CLEAR',
    clear: { targetLayer: 'CLEAR_TARGET_LAYER_PROP' },
  };
}

function stageLayoutAction({ screenName, screenUuid, layoutName, layoutUuid } = {}) {
  return {
    uuid: uuid(),
    name: 'Stage',
    isEnabled: true,
    type: 'ACTION_TYPE_STAGE_LAYOUT',
    stage: {
      stageScreenAssignments: [{
        screen: {
          parameterUuid: { string: screenUuid || '' },
          parameterName: screenName || 'Stage Screen 1',
        },
        layout: {
          parameterUuid: { string: layoutUuid || '' },
          parameterName: layoutName || '',
        },
      }],
    },
  };
}

// propUuidMap: { propName → uuidString } — populated by encode.js from buildAllPropCues output
let PROP_UUID_MAP = {};

function propAction(propName) {
  const propUuid = PROP_UUID_MAP[propName] || randomUUID().toUpperCase();
  return {
    uuid: uuid(),
    isEnabled: true,
    type: 'ACTION_TYPE_PROP',
    prop: {
      identification: {
        parameterUuid: { string: propUuid },
        parameterName: propName,
      },
    },
  };
}

// Stage screen config for the current build — set by buildPresentation
let STAGE_SCREEN = {};

// Scheme stage displays (trigger-based) for the current build — set by buildPresentation
let SCHEME_STAGE_DISPLAYS = [];

// ─── Cue type builders ────────────────────────────────────────────────────

function buildStartCue(spec, rs) {
  const text    = spec.text || spec.label || 'START';
  const label   = spec.label || 'START';
  const bodyEl  = makeStartEndElement({ text }, rs);
  const titleEl = makeStartEndTitleEl({ text: '-' }, rs);
  const slots   = [makeSlot(bodyEl), makeSlot(titleEl, { info: 2 })];
  const bo      = applyBuildOrders(slots, rs.buildOrders?.startEnd);
  const notesRtf = rtf.rtfNotes([{ text }], rs) || emptyNotesRtf();
  return {
    uuid: uuid(),
    _type: 'start',
    completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
    hotKey: {},
    isEnabled: true,
    actions: [
      makeSlideAction(spec.label || 'START', slots, bo, notesRtf),
      clearPropAction(),
    ],
  };
}

function buildEndCue(spec, rs) {
  const text    = spec.text || spec.label || 'End of Notes';
  const label   = spec.label || 'End of Notes';
  const bodyEl  = makeStartEndElement({ text }, rs);
  const titleEl = makeStartEndTitleEl({ text: '-' }, rs);
  const slots   = [makeSlot(bodyEl), makeSlot(titleEl, { info: 2 })];
  const bo      = applyBuildOrders(slots, rs.buildOrders?.startEnd);
  const notesRtf = rtf.rtfNotes([{ text }], rs) || emptyNotesRtf();
  return {
    uuid: uuid(),
    _type: 'end',
    completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
    hotKey: {},
    isEnabled: true,
    actions: [
      makeSlideAction(spec.label || 'End of Notes', slots, bo, notesRtf),
      clearPropAction(),
    ],
  };
}

function buildBlankCue(spec, rs) {
  const bo = applyBuildOrders([], rs.buildOrders?.blank);
  // Slides notes from spans (confidence monitor text repurposed as notes)
  const notesRtf = (spec.spans?.length)
    ? (rtf.rtfNotes(spec.spans, rs) || emptyNotesRtf())
    : emptyNotesRtf();
  const actions = [
    makeSlideAction(spec.label || '', [], bo, notesRtf),
  ];
  // Optional stage layout action (inserted before LOGO macro)
  if (spec.stageLayout?.layoutName) {
    actions.push(stageLayoutAction({
      screenName: STAGE_SCREEN.screenName,
      screenUuid: STAGE_SCREEN.screenUuid,
      ...spec.stageLayout,
    }));
  }
  if (spec.blankShowProp && spec.propName) {
    actions.push(propAction(spec.propName));
  }
  return {
    uuid: uuid(),
    _type: 'blank',
    completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
    hotKey: {},
    isEnabled: true,
    actions,
  };
}

// Strip removes line breaks so the main-screen body flows as one block. Line
// breaks aren't always their own span: extractSpans() (public/app.js) merges a
// <br>'s span into the surrounding text whenever the formatting matches on both
// sides — the common case for plain, unformatted scripture — so the break ends
// up embedded inside a longer span's text ("line one\nline two") rather than
// sitting alone as its own {text:'\n'} entry. An exact `s.text !== '\n'` filter
// only ever catches the standalone case, so it silently did nothing for plain
// text. Replace every run of newlines with a single space instead (works for
// both embedded and standalone), then trim the ends.
function stripNewlineSpans(spans) {
  const replaced = (spans || []).map(s => ({ ...s, text: (s.text || '').replace(/\n+/g, ' ') }));
  if (replaced.length) {
    replaced[0] = { ...replaced[0], text: replaced[0].text.replace(/^ +/, '') };
    replaced[replaced.length - 1] = { ...replaced[replaced.length - 1], text: replaced[replaced.length - 1].text.replace(/ +$/, '') };
  }
  return replaced.filter(s => s.text !== '');
}

/** Returns an ARRAY of cues — one per body in spec.bodies. */
function buildScriptureCues(spec, rs) {
  // Per-slide body bounds override spec values take precedence over scheme defaults
  const bx = spec.bodyX ?? rs.bodyX ?? 0;
  const by = rs.bodyY ?? 0;
  const bw = spec.bodyW ?? rs.bodyW ?? rs.canvasW ?? 1920;
  const bh = rs.bodyH ?? 100;
  const bodyYOff = rs.bodyFontAdv?.yOffset ?? 0;

  // Build combined span array across all bodies for slide notes (full verse)
  const allBodies = spec.bodies || [spec.body || []];
  const allBodySpansForNotes = allBodies.reduce((acc, bd, i) => {
    if (i > 0) acc.push({ text: '\n' });
    return acc.concat(bd || []);
  }, []);
  const followReveal = spec.followReveal || 'single';

  return allBodies.map((body, idx) => {
    // Strip newlines for main slide if requested (prop always keeps them).
    // Verse numbers (if any) live as { verseNum, super } spans in the body content already.
    // bodies[0] uses Fit Width's hard-break override when one won and its
    // round-trip guard matched the live text (see buildSpec in app.js) — that
    // was already measured against stripNewlines' own setting, so it's used
    // as-is here, never re-stripped (stripping would collapse the very
    // breaks Fit Width just chose back into spaces).
    const displayBody = (idx === 0 && spec.bodyDisplaySpans)
      ? spec.bodyDisplaySpans
      : spec.stripNewlines
        ? stripNewlineSpans(body || [])
        : (body || []);
    const bodyRtf   = rtf.rtfBody(displayBody, rs);
    const plainBody = displayBody.map(s => s.text).join('');

    const liveEl  = makeLiveElement(rs);
    // Auto Title Y: estimate from line count if enabled; otherwise use scheme titleY directly
    const computedTitleY = rs.autoTitleY
      ? estimateTitleY(displayBody, bw, rs, spec.bodyLines, { ascent: spec.ascent, descent: spec.descent, capAscent: spec.capAscent })
      : (rs.titleY ?? 0);
    const titleEl = makeTitleElement({ reference: spec.reference, titleY: computedTitleY }, rs);
    const bodyEl  = makeBodyElement({ x: bx, y: by + bodyYOff, w: bw, h: bh, rtfData: bodyRtf, charCount: plainBody.length, spans: displayBody }, rs);
    const gradEl  = makeGradientElement(rs);

    const slots = [
      makeSlot(liveEl,  { info: 2 }),
      makeSlot(titleEl),
      makeSlot(bodyEl),
      makeSlot(gradEl,  { info: 1 }),
    ];
    const bo = applyBuildOrders(slots, rs.buildOrders?.content);

    const label = idx === 0 ? spec.label : `${spec.label} (${idx + 1})`;
    let notesRtf;
    if (followReveal === 'stacking' && idx > 0) {
      // Stacking: notes show all bodies up to and including current, current highlighted
      const notesSpans = allBodies.slice(0, idx).flatMap(bd => [
        ...(bd || []),
        { text: '\n' },
      ]).concat((body || []).map(s => ({ ...s, alt: true })));
      notesRtf = rtf.rtfNotes(notesSpans, rs) || emptyNotesRtf();
    } else {
      // Sequential (default): notes always show the full verse for context
      notesRtf = allBodySpansForNotes ? (rtf.rtfNotes(allBodySpansForNotes, rs) || emptyNotesRtf()) : emptyNotesRtf();
    }
    return {
      uuid: uuid(),
      _type: 'scripture',
      completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
      hotKey: {},
      isEnabled: true,
      actions: [
        makeSlideAction(label, slots, bo, notesRtf),
        propAction(spec.propName ?? spec.reference ?? 'scripture'),
      ],
    };
  });
}

/**
 * Returns an ARRAY of cues.
 * mode='single'    → 1 cue
 * mode='revealing' → N cues (one per bullet)
 */
function buildPointCues(spec, rs) {
  const bx = spec.bodyX ?? rs.pointX ?? rs.bodyX ?? 0;
  const by = rs.pointY ?? rs.bodyY ?? 0;
  const bw = spec.bodyW ?? rs.pointW ?? rs.bodyW ?? rs.canvasW ?? 1920;
  const bh = rs.pointH ?? rs.bodyH ?? 100;
  const boldYOff = rs.pointFontAdv?.yOffset ?? rs.boldFontAdv?.yOffset ?? 0;

  if (spec.mode === 'revealing') {
    const followReveal = spec.followReveal || 'single';
    return (spec.bullets || []).map((bullet, idx) => {
      const bulletText = rtf.bulletToText(bullet);
      const bodyRtf = rtf.rtfPointBody(bullet, rs);
      const gradEl  = makeGradientElement(rs);
      const liveEl  = makeLiveElement(rs);
      const bodyEl  = makePointBodyElement({ x: bx, y: by + boldYOff, w: bw, h: bh, rtfData: bodyRtf, text: bulletText }, rs);

      const slots = [
        makeSlot(bodyEl),
        makeSlot(gradEl, { info: 1 }),
        makeSlot(liveEl, { info: 2 }),
      ];
      const bo = applyBuildOrders(slots, rs.buildOrders?.point);

      const propName = `${spec.propBaseName}_${idx + 1}`;
      const label    = idx === 0 ? spec.label : `${spec.label} (${idx + 1})`;

      let notesRtf;
      if (followReveal === 'stacking' && idx > 0) {
        const notesSpans = spec.bullets.slice(0, idx).flatMap(b => [
          { text: rtf.bulletToText(b), alt: false },
          { text: '\n', alt: false },
        ]).concat([{ text: bulletText, alt: true }]);
        notesRtf = rtf.rtfNotes(notesSpans, rs);
      } else {
        notesRtf = rtf.rtfNotes([{ text: bulletText, alt: true }], rs);
      }

      return {
        uuid: uuid(),
        _type: 'point',
        completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
        hotKey: {},
        isEnabled: true,
        actions: [
          makeSlideAction(label, slots, bo, notesRtf),
          propAction(propName),
        ],
      };
    });
  }

  // Single mode. The on-screen body uses bodyDisplaySpans/bodyDisplayText when
  // Fit Width chose hard line breaks (\n after punctuation); prop name, notes
  // and queue below still use the unbroken spec.bodyText. Spans preserve
  // bold/italic/underline for the actual RTF; the flat string is kept only
  // for Pro7's plain-text cache field below (bulletToSpans() would otherwise
  // treat a bare string as one non-bold span, silently dropping emphasis).
  const bodyDisplay = spec.bodyDisplayText || spec.bodyText || '';
  const bodyRtf = rtf.rtfPointBody(spec.bodyDisplaySpans || bodyDisplay, rs);
  const gradEl  = makeGradientElement(rs);
  const liveEl  = makeLiveElement(rs);
  const bodyEl  = makePointBodyElement({ x: bx, y: by + boldYOff, w: bw, h: bh, rtfData: bodyRtf, text: bodyDisplay }, rs);

  const slots = [
    makeSlot(bodyEl),
    makeSlot(gradEl, { info: 1 }),
    makeSlot(liveEl, { info: 2 }),
  ];
  const bo = applyBuildOrders(slots, rs.buildOrders?.point);

  const notesRtf = rtf.rtfNotes([{ text: spec.bodyText || '', alt: true }], rs);
  return [{
    uuid: uuid(),
    _type: 'point',
    completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
    hotKey: {},
    isEnabled: true,
    actions: [
      makeSlideAction(spec.label, slots, bo, notesRtf),
      propAction(spec.propName ?? spec.bodyText ?? 'point'),
    ],
  }];
}

/** Image placeholder slide: atem_gradient + live (no main body content). */
function buildImageCue(spec, rs) {
  const gradEl   = makeGradientElement(rs);
  const liveEl   = makeLiveElement(rs);
  const notesRtf = rtf.rtfNotes([{ text: spec.label || 'Image' }], rs) || emptyNotesRtf();

  const slots = [
    makeSlot(liveEl, { info: 2 }),
    makeSlot(gradEl, { info: 1 }),
  ];

  const propName = spec.propName || spec.label || 'image';
  return {
    uuid: uuid(),
    _type: 'image',
    completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
    hotKey: {},
    isEnabled: true,
    actions: [
      makeSlideAction(spec.label, slots, undefined, notesRtf),
      propAction(propName),
    ],
  };
}

/**
 * 6 response card cues (order: Blank → RC → R1 → R2 → R3 → Hold).
 * Content cues share the full response-card layout from the Pro7 reference:
 * title + four response rows + four number marks.
 * Stage layout actions are injected by the trigger-based step in buildPresentation.
 */
function buildResponseCardCues(responses = {}, rs = {}) {
  const { decisionText = '', r1 = '', r2 = '', r3 = '' } = responses;

  const DEFAULT_RC_NOTES = '{decision}\n1 — {r1}\n2 — {r2}\n3 — {r3}';
  const notesText = (responses.notesTemplate || DEFAULT_RC_NOTES)
    .replace(/\{decision(?:Text)?\}/g, decisionText || '')
    .replace(/\{r1\}/g, r1 || '')
    .replace(/\{r2\}/g, r2 || '')
    .replace(/\{r3\}/g, r3 || '');
  const rcNotesRtf = notesText.trim()
    ? (rtf.rtfNotes([{ text: notesText }], rs) || emptyNotesRtf())
    : emptyNotesRtf();

  // ── 1. Response Card Blank ───────────────────────────────────────────────────
  const blankCue = {
    uuid: uuid(),
    completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
    hotKey: {},
    isEnabled: true,
    actions: [
      makeSlideAction('Response Card Blank', [], null, rcNotesRtf),
    ],
  };

  // ── 2. Response Card (main full card layout) ────────────────────────────────
  const rcMainCue = {
    uuid: uuid(),
    completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
    hotKey: {},
    isEnabled: true,
    actions: [
      makeSlideAction('Response Card', makeRCSlide1('Response Card', decisionText, rs), null, rcNotesRtf),
      propAction('Response Card'),
    ],
  };

  // ── 3–5. Response 1, 2, 3 ──────────────────────────────────────────────────
  const responseCues = [r1, r2, r3].map((text, idx) => {
    const n = idx + 1;
    return {
      uuid: uuid(),
      completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
      hotKey: {},
      isEnabled: true,
      actions: [
        makeSlideAction(`Response ${n}`, makeRCSlide1(`Response ${n}`, text, rs), null, rcNotesRtf),
        propAction('Response Card'),
      ],
    };
  });

  // ── 6. Response Card Hold ────────────────────────────────────────────────────
  const holdCue = {
    uuid: uuid(),
    completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
    hotKey: {},
    isEnabled: true,
    actions: [
      makeSlideAction('Response Card Hold', [
        makeSlot(makeStartEndElement({ text: 'Response Card Hold' }, rs)),
      ], null, rcNotesRtf),
      propAction('Response Card'),
    ],
  };

  blankCue._isRcBlank = true;
  rcMainCue._isRcContent = true;
  for (const c of responseCues) c._isRcContent = true;
  holdCue._isRcHold = true;
  for (const c of [blankCue, rcMainCue, ...responseCues, holdCue]) c._type = 'rc';
  return [blankCue, rcMainCue, ...responseCues, holdCue];
}

// ─── Helper: inject stage layout action into a cue ────────────────────────

function injectStageLayout(cue, stageLayout) {
  if (!stageLayout?.layoutName) return;
  const action = stageLayoutAction({
    screenName: STAGE_SCREEN.screenName,
    screenUuid: STAGE_SCREEN.screenUuid,
    ...stageLayout,
  });
  // Insert right after the PRESENTATION_SLIDE action
  const slideIdx = cue.actions?.findIndex(a => a.type === 'ACTION_TYPE_PRESENTATION_SLIDE') ?? -1;
  if (slideIdx !== -1) {
    cue.actions.splice(slideIdx + 1, 0, action);
  } else {
    cue.actions.push(action);
  }
}

// ─── Helper: fire the configured QR macro on a cue ────────────────────────
// QR isn't an image DeckPro draws — it's a macro (whatever actually shows the
// QR code in Companion/Resolume/etc.). Fires on cues whose originating slide
// had qrOn (see effectiveQR() in public/app.js: manual per-slide override, or
// the deck's QR toggle + QR Stop marker position, computed client-side).
function injectQRMacro(cue, qrMacro) {
  if (qrMacro?.name && qrMacro?.uuid) cue.actions.push(macroAction(qrMacro.name, qrMacro.uuid));
}

// ─── Helper: fire the configured Gradient macro on a content cue ─────────
// Gradient is a macro too (see the retired atem_gradient element note above),
// fired on Scripture, Point, and Response Card content cues. Which macro
// depends on this export's own QR toggle: gradientMacroQr when it's on
// (e.g. the QR half of a paired export), gradientMacro otherwise.
function injectGradientMacro(cue, gradientMacro, gradientMacroQr, qrCode) {
  const m = qrCode ? gradientMacroQr : gradientMacro;
  if (m?.name && m?.uuid) cue.actions.push(macroAction(m.name, m.uuid));
}

// ─── Top-level presentation builder ───────────────────────────────────────

function buildPresentation(spec, propUuidMap = {}) {
  const {
    name, slides = [], qrCode = false, qrMacro = null,
    gradientMacro = null, gradientMacroQr = null,
    includeResponseCard = false, responses = {}, style = {}, stageScreen: specStageScreen = {},
  } = spec;
  const rs = resolveStyle(style);

  // Install prop UUID map so propAction() uses coordinated UUIDs
  PROP_UUID_MAP = propUuidMap;

  // Stage screen config for this build
  STAGE_SCREEN = specStageScreen;

  // Scheme stage displays (trigger-based) for this build
  SCHEME_STAGE_DISPLAYS = spec.stageDisplays || [];

  // ── Step 1: Expand slides → raw cues with blank-before injection ──
  const rawCues = [];

  let _slidePos = 0;
  for (const slide of slides) {
    _slidePos++;
    const _tagCues = (cues) => { for (const c of cues) c._slidePos = _slidePos; };
    if (slide.type === 'start') {
      const c = buildStartCue(slide, rs); c._slidePos = _slidePos; rawCues.push(c);
      continue;
    }
    if (slide.type === 'end') {
      const ec = buildEndCue(slide, rs); ec._slidePos = _slidePos; rawCues.push(ec);
      continue;
    }
    if (slide.type === 'blank' || slide.type === 'custom') {
      // Custom is an unfinished type — export it as a blank slide so its slot
      // is preserved rather than silently dropped.
      const bc = buildBlankCue({
        label:       slide.label || (slide.type === 'custom' ? 'Custom' : 'Blank'),
        spans:       slide.spans || [],
        stageLayout: slide.stageLayout || null,
      }, rs);
      bc._slideTransition = slide.transition || null;
      bc._macroOverride   = slide.macroOverride || null;
      bc._slidePos        = _slidePos;
      if (slide.type === 'blank') {
        // A standalone Blank (not an auto-injected blank-before) can still
        // carry its own QR macro — same eligibility check as the others,
        // just no _isBlankBefore since it isn't an "extra" inserted cue.
        bc._isContentBlank = true;
        bc._qrOn           = !!slide.qrOn;
      }
      rawCues.push(bc);
      continue;
    }
    if (slide.type === 'image') {
      if (slide.blankBefore) {
        const blankCue = buildBlankCue({
          label: '',
          spans: slide.blankSpans || [],
        }, rs);
        blankCue._isBlankBefore  = true;
        blankCue._isContentBlank = true;
        blankCue._qrOn           = !!slide.qrOn;
        blankCue._slidePos       = _slidePos;
        rawCues.push(blankCue);
      }
      const ic = buildImageCue(slide, rs);
      ic._slideTransition = slide.transition || null;
      ic._macroOverride   = slide.macroOverride || null;
      ic._slidePos        = _slidePos;
      injectStageLayout(ic, slide.stageLayout);
      rawCues.push(ic);
      continue;
    }
    if (slide.type === 'scripture') {
      if (slide.blankBefore) {
        // Notes for blank-before = full scripture body so confidence monitor shows upcoming content
        const allBodies  = slide.bodies || [slide.body || []];
        const bodySpans  = allBodies.reduce((acc, bd, i) => {
          if (i > 0) acc.push({ text: '\n' });
          return acc.concat(bd || []);
        }, []);
        const blankSpans = bodySpans.some(s => s.text) ? bodySpans : (slide.blankSpans || []);
        const blankCue = buildBlankCue({
          label: '', spans: blankSpans,
          propName:     slide.propName || slide.reference || 'scripture',
          blankShowProp: !!slide.blankShowProp,
        }, rs);
        blankCue._isBlankBefore  = true;
        blankCue._isContentBlank = true;
        blankCue._qrOn           = !!slide.qrOn;
        blankCue._slidePos       = _slidePos;
        rawCues.push(blankCue);
      }
      const sc = buildScriptureCues(slide, rs);
      const scRef = slide.reference || slide.label || '';
      sc.forEach((c, bi) => {
        c._slideTransition = slide.transition || null;
        c._macroOverride   = slide.macroOverride || null;
        c._slidePos        = _slidePos;
        c._queueRef    = scRef;
        c._queuePhrase = firstPhrase((slide.bodies || [])[bi] || (slide.bodies || [])[0]);
        injectStageLayout(c, slide.stageLayout);
      });
      rawCues.push(...sc);
      continue;
    }
    if (slide.type === 'point') {
      if (slide.blankBefore) {
        // Notes for blank-before = point text so confidence monitor shows upcoming content
        const pointText  = slide.mode === 'revealing'
          ? (slide.bullets || []).filter(Boolean).map(b => rtf.bulletToText(b)).join('\n')
          : (slide.bodyText || '');
        const blankSpans = pointText
          ? [{ text: pointText, alt: true }]
          : (slide.blankSpans || []);
        const blankPropName = slide.mode === 'revealing'
          ? ((slide.bullets?.length) ? `${slide.propBaseName}_1` : null)
          : (slide.propName || slide.bodyText || 'point');
        const blankCue = buildBlankCue({
          label: '', spans: blankSpans,
          propName:     blankPropName,
          blankShowProp: !!slide.blankShowProp,
        }, rs);
        blankCue._isBlankBefore  = true;
        blankCue._isContentBlank = true;
        blankCue._qrOn           = !!slide.qrOn;
        blankCue._slidePos       = _slidePos;
        rawCues.push(blankCue);
      }
      const pc = buildPointCues(slide, rs);
      const ptRef = slide.label || slide.title || slide.bodyText || '';
      pc.forEach((c, bi) => {
        c._slideTransition = slide.transition || null;
        c._macroOverride   = slide.macroOverride || null;
        c._slidePos        = _slidePos;
        c._queueRef    = ptRef;
        c._queuePhrase = slide.mode === 'revealing'
          ? firstPhrase(rtf.bulletToText((slide.bullets || [])[bi] || (slide.bullets || [])[0] || ''))
          : firstPhrase(slide.bodyText || '');
        injectStageLayout(c, slide.stageLayout);
      });
      rawCues.push(...pc);
      continue;
    }
  }

  // ── Step 2: Append Response Card cues before END (if enabled) ──
  if (includeResponseCard) {
    const endIdx = rawCues.findIndex(c => c._type === 'end');
    const rcCues = buildResponseCardCues(responses, rs);
    if (endIdx !== -1) {
      rawCues.splice(endIdx, 0, ...rcCues);
    } else {
      rawCues.push(...rcCues);
    }
  }

  // ── Step 2b: Re-number _slidePos by output cue order so SLIDE #N matches the
  //             Nth visible cue (blank-before cues get their own number). ──
  rawCues.forEach((c, i) => { c._slidePos = i + 1; });

  // ── Step 3: Fire the QR macro on blank-before cues whose slide had QR on ──
  // (qrOn is computed client-side — per-slide override, or the deck's QR
  // toggle + QR Stop marker position — see effectiveQR() in public/app.js.)
  for (const cue of rawCues) {
    if (cue._isContentBlank && cue._qrOn) injectQRMacro(cue, qrMacro);
  }

  // ── Step 3b: Fire the Gradient macro on Scripture/Point/RC Content cues ──
  // (gradientMacroQr instead of gradientMacro whenever this export's own QR
  // toggle is on — see injectGradientMacro above.)
  for (const cue of rawCues) {
    const isGradientCue = cue._type === 'scripture' || cue._type === 'point' || (cue._type === 'rc' && cue._isRcContent);
    if (isGradientCue) injectGradientMacro(cue, gradientMacro, gradientMacroQr, qrCode);
  }

  // ── Step 4: Inject macros from Schemes into matching cues ──
  const customMacros = (spec.customMacros || []).filter(m => m.name && m.uuid && (m.triggers || []).length);
  if (customMacros.length) {
    for (const cue of rawCues) {
      const t = cue._type;
      const isBB = cue._isBlankBefore;
      for (const m of customMacros) {
        const tr = m.triggers;
        const hits =
          (tr.includes('start')       && t === 'start') ||
          (tr.includes('end')         && t === 'end') ||
          (tr.includes('scripture')   && t === 'scripture') ||
          (tr.includes('point')       && t === 'point') ||
          (tr.includes('blank')       && t === 'blank' && !isBB) ||
          (tr.includes('blankBefore') && isBB) ||
          (tr.includes('image')       && t === 'image') ||
          (tr.includes('rcBlank')     && t === 'rc' && cue._isRcBlank) ||
          (tr.includes('rcContent')   && t === 'rc' && cue._isRcContent) ||
          (tr.includes('rcHold')      && t === 'rc' && cue._isRcHold) ||
          (cue._slidePos && tr.includes(`pos:${cue._slidePos}`));
        if (hits) cue.actions.push(macroAction(m.name, m.uuid));
      }
    }
  }

  // ── Step 4b: Per-slide macro override ──
  for (const cue of rawCues) {
    if (cue._macroOverride?.uuid) {
      cue.actions.push(macroAction(cue._macroOverride.name || '', cue._macroOverride.uuid));
    }
  }

  // ── Step 4c: Inject scheme stage display layout actions (trigger-based) ──
  const activeStageDisplays = SCHEME_STAGE_DISPLAYS.filter(d => d.name && d.uuid && (d.triggers || []).length);
  if (activeStageDisplays.length) {
    for (const cue of rawCues) {
      const t = cue._type;
      const isBB = cue._isBlankBefore;
      for (const d of activeStageDisplays) {
        const tr = d.triggers;
        const hits =
          (tr.includes('start')       && t === 'start') ||
          (tr.includes('end')         && t === 'end') ||
          (tr.includes('scripture')   && t === 'scripture') ||
          (tr.includes('point')       && t === 'point') ||
          (tr.includes('blank')       && t === 'blank' && !isBB) ||
          (tr.includes('blankBefore') && isBB) ||
          (tr.includes('image')       && t === 'image') ||
          (tr.includes('rcBlank')     && t === 'rc' && cue._isRcBlank) ||
          (tr.includes('rcContent')   && t === 'rc' && cue._isRcContent) ||
          (tr.includes('rcHold')      && t === 'rc' && cue._isRcHold) ||
          (cue._slidePos && tr.includes(`pos:${cue._slidePos}`));
        if (hits) {
          cue.actions.push(stageLayoutAction({
            screenName: STAGE_SCREEN.screenName,
            screenUuid: STAGE_SCREEN.screenUuid,
            layoutName: d.name,
            layoutUuid: d.uuid,
          }));
        }
      }
    }
  }

  // ── Step 5: Inject queue element into every cue ──
  const getCueLabel = cue => {
    const sa = cue.actions?.find(a => a.type === 'ACTION_TYPE_PRESENTATION_SLIDE');
    return sa?.label?.text || '';
  };

  const queueMode = spec.queueMode || 'ref'; // 'list' (full upcoming queue) | 'ref' | 'refPhrase' (next slide only)
  for (let i = 0; i < rawCues.length; i++) {
    // 'ref'/'refPhrase' show only the single next slide \u2014 'list' is the only mode
    // that shows the full upcoming queue.
    const upcoming = rawCues.slice(i + 1).filter(c => !c._isBlankBefore);
    // A blank-before cue's own notes already preview its content slide ahead of
    // time (see buildBlankCue call sites above \u2014 "Notes for blank-before = full
    // scripture body so confidence monitor shows upcoming content"), so showing
    // that same slide again as "next" is redundant. Skip past it and start from
    // the one after. Only applies to the single-next modes \u2014 'list' stays the
    // complete, unfiltered remaining queue.
    const skipAhead = (queueMode !== 'list' && rawCues[i]._isBlankBefore) ? 1 : 0;
    const relevantCues = queueMode === 'list' ? upcoming : upcoming.slice(skipAhead, skipAhead + 1);
    const futureLabels = relevantCues
      .map(c => {
        const lbl = getCueLabel(c);
        if (queueMode === 'list') return lbl;            // full label, as-is
        const ref = c._queueRef || lbl;
        // Point slides often have their title auto-derived from the body text \u2014
        // if the phrase is just a truncated prefix of the ref, showing both is
        // redundant ("Trust the process \u2014 Trust the process\u2026"). Skip the phrase
        // and fall through to ref-only in that case.
        const phraseCore = (c._queuePhrase || '').replace(/\u2026$/, '').trim().toLowerCase();
        const phraseRedundant = phraseCore && ref.trim().toLowerCase().startsWith(phraseCore);
        if (queueMode === 'refPhrase' && c._queuePhrase && !phraseRedundant) {
          const s = `${ref} \u2014 ${c._queuePhrase}`;
          return s.length > 42 ? s.slice(0, 41) + '\u2026' : s;
        }
        return ref.length > 20 ? ref.slice(0, 19) + '\u2026' : ref; // 'ref'
      })
      .filter(Boolean);

    const queueEl   = makeQueueElement(futureLabels, rs);
    const queueSlot = makeSlot(queueEl);
    const slideAction = rawCues[i].actions?.find(a => a.type === 'ACTION_TYPE_PRESENTATION_SLIDE');
    if (slideAction?.slide?.presentation?.baseSlide?.elements) {
      slideAction.slide.presentation.baseSlide.elements.push(queueSlot);
    }
    // Inject slide-level or presentation-level transition
    if (slideAction?.slide?.presentation) {
      const st = rawCues[i]._slideTransition;
      const tType = st?.type || style.transitionType || 'fade';
      const tDur  = st?.duration !== undefined ? st.duration : (style.transitionDuration !== undefined ? style.transitionDuration : 0.6);
      slideAction.slide.presentation.transition = makeTransition(tType, tDur);
    }
  }

  // ── Clean up internal markers ──
  for (const cue of rawCues) {
    delete cue._type;
    delete cue._isBlankBefore;
    delete cue._isContentBlank;
    delete cue._qrOn;
    delete cue._isRcBlank;
    delete cue._isRcContent;
    delete cue._isRcHold;
    delete cue._slideTransition;
  }

  const presentationUuid = uuid();

  return {
    applicationInfo: {
      platform: 'PLATFORM_MACOS',
      platformVersion: { majorVersion: 26, patchVersion: 1 },
      application: 'APPLICATION_PROPRESENTER',
      applicationVersion: { majorVersion: 20, patchVersion: 1, build: '335544583' },
    },
    uuid: presentationUuid,
    name,
    background: { color: C_BLACK_A },
    chordChart: { platform: 'PLATFORM_MACOS' },
    cueGroups: [{
      group: { uuid: uuid(), hotKey: {} },
      cueIdentifiers: rawCues.map(c => c.uuid),
    }],
    ccli: {},
    timeline: { duration: 300 },
    transition: makeTransition(style.transitionType || 'fade', style.transitionDuration),
    cues: rawCues,
  };
  PROP_UUID_MAP         = {};   // restore for next call
  STAGE_SCREEN          = {};   // restore for next call
  SCHEME_STAGE_DISPLAYS = [];   // restore for next call
}

module.exports = { buildPresentation, resolveStyle };
