'use strict';

/**
 * buildProp.js
 * Generates a single Pro7 prop (.pro) file containing all props as cues.
 *
 * Matching: parameterName in presentation prop action = cue.name in prop file.
 *
 * Usage:
 *   const { buildAllPropCues, encodePropDocument } = require('./buildProp');
 *
 *   const propSpecs = [
 *     { type: 'scripture', propName: 'John 13:35', reference: 'John 13:35', bodies: [[spans]] },
 *     { type: 'point-single', propName: 'Create Opportunities', bodyText: 'Create Opportunities' },
 *     { type: 'point-revealing', propName: 'Series_1', title: 'Vision', bullets: [...], activeIdx: 0 },
 *   ];
 *
 *   const propDoc = buildAllPropCues(propSpecs);
 *   const buf = await encodePropDocument(propDoc);
 *   fs.writeFileSync('output_Props.pro', buf);
 */

const { randomUUID } = require('crypto');
const protobuf = require('protobufjs');
const path = require('path');
const rtf = require('./rtf');

const PROTO_PATH = path.join(__dirname, 'ProPresenter7-Proto/proto/propDocument.proto');

// ─── Proto loader (cached) ─────────────────────────────────────────────────

let _root = null;
async function getRoot() {
  if (!_root) _root = await protobuf.load(PROTO_PATH);
  return _root;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function uuid() { return { string: randomUUID().toUpperCase() }; }

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

const C_WHITE   = { red: 1, green: 1, blue: 1, alpha: 1 };
const C_BLACK_A = { alpha: 1 };
const C_CHORD   = { red: 0.9450980424880981, green: 0.8156862854957581, blue: 0.1882352977991104, alpha: 1 };

// ─── Style helpers ────────────────────────────────────────────────────────

const FONT_ADV_DEFAULTS = () => ({
  yOffset: 0, charSpacing: 0, lineHeight: 1,
  paragraphSpacingBefore: 0, paragraphSpacingAfter: 0,
  alignment: '', italic: false, underline: false, capitalization: '',
});

const DEFAULT_STYLE = {
  bodyFill:    '#2196f2',
  titleFill:   '#a9391a',
  fillEnabled: false,
  bodyFont:     'Montserrat-Medium',
  propBodyFont: 'Montserrat-SemiBold',
  pointFont:    'Montserrat-ExtraBold',
  propPointFont:'Montserrat-ExtraBold',
  pointStackedFont: 'Montserrat-Medium',
  titleFont:    'Montserrat-ExtraBold',
  startEndFont: 'Montserrat-ExtraBold',
  bodySize:      44,
  titleSize:     60,
  startEndSize:  45,
  propBodySize:  80,
  propPointSize: 80,
  pointStackedSize: 66,
  propTitleSize: 110,
  transitionType:         'fade',
  transitionDuration:     0.6,
  propTransitionType:     'fade',
  propTransitionDuration: 0.6,
  // Advanced font styling
  bodyFontAdv:     null,
  propBodyFontAdv: null,
  pointFontAdv:    null,
  propPointFontAdv:null,
  pointStackedFontAdv: null,
  titleFontAdv:    null,
  propTitleFontAdv:null,
  boldFontAdv:     null,
  propBoldFontAdv: null,
  // Prop canvas
  propCanvasW: 3200, propCanvasH: 1280,
  // Prop element bounds
  propBodyX: 0, propBodyY: 853, propBodyW: 3200, propBodyH: 427,
  propPointX: 0, propPointY: 853, propPointW: 3200, propPointH: 427,
  propTitleX: -0.30, propTitleY: 1040, propTitleW: 3200.30, propTitleH: 60,
};

// ─── Transitions ──────────────────────────────────────────────────────────

const TRANSITION_DEFS = {
  fade: {
    name: 'Fade', renderId: '99BDD1C3-EE98-4E80-A8DE-3699CE9F338E',
    behaviorDescription: 'Fade', category: 'Dissolves', defaultDuration: 0.6,
  },
  dissolve: {
    name: 'Dissolve', renderId: 'EC52A828-AD85-4602-B70C-1DEE7C904DB6',
    behaviorDescription: 'Cross Dissolve.', category: 'Dissolves', defaultDuration: 0.6,
  },
  cut: {
    name: 'Cut', renderId: 'AB29D07B-E9E2-4E0A-93BD-AD3EA58120FA',
    behaviorDescription: 'Cut.', category: 'None', defaultDuration: 0,
  },
};

function makeTransition(type, duration) {
  const def = TRANSITION_DEFS[type] || TRANSITION_DEFS.fade;
  const dur = (duration !== undefined && duration !== null) ? duration : def.defaultDuration;
  const t = { effect: { uuid: uuid(), name: def.name, renderId: def.renderId, behaviorDescription: def.behaviorDescription, category: def.category } };
  if (dur > 0) t.duration = dur;
  return t;
}

function hexToColor(hex) {
  const h = (hex || '#000000').replace('#', '');
  return {
    red:   (parseInt(h.slice(0,2),16)||0) / 255,
    green: (parseInt(h.slice(2,4),16)||0) / 255,
    blue:  (parseInt(h.slice(4,6),16)||0) / 255,
    alpha: 1,
  };
}

function resolveStyle(style = {}) {
  const s  = { ...DEFAULT_STYLE, ...style };
  const fa = s.fillEnabled ? 1 : 0;
  const out = {
    ...s,
    cFill:        { ...hexToColor(s.bodyFill),  alpha: fa },
    cTitleFill:   { ...hexToColor(s.titleFill), alpha: fa },
  };
  for (const k of ['bodyFontAdv', 'propBodyFontAdv', 'titleFontAdv', 'propTitleFontAdv', 'boldFontAdv', 'propBoldFontAdv', 'pointFontAdv', 'propPointFontAdv', 'pointStackedFontAdv']) {
    out[k] = { ...FONT_ADV_DEFAULTS(), ...(s[k] || {}) };
  }
  return out;
}

/** Overlay prop-specific size/font overrides so RTF calls use LED-wall values. */
function makePropStyle(rs) {
  return {
    ...rs,
    bodyFont:  rs.propBodyFont  || rs.bodyFont,
    bodySize:  rs.propBodySize  || rs.bodySize,
    bodyFontAdv: rs.propBodyFontAdv ? { ...FONT_ADV_DEFAULTS(), ...rs.propBodyFontAdv } : rs.bodyFontAdv,
    titleFont: rs.propTitleFont || rs.titleFont,
    titleSize: rs.propTitleSize || rs.titleSize,
    titleFontAdv: rs.propTitleFontAdv ? { ...FONT_ADV_DEFAULTS(), ...rs.propTitleFontAdv } : rs.titleFontAdv,
    // Emphasis (alt-span) advanced styling on the LED wall
    boldFont: rs.propBoldFont || rs.boldFont || rs.propBodyFont || rs.bodyFont,
    boldFontAdv: rs.propBoldFontAdv ? { ...FONT_ADV_DEFAULTS(), ...rs.propBoldFontAdv } : rs.boldFontAdv,
    // Point text on the LED wall has its own font entry, falling back to the main point font
    pointFont:    rs.propPointFont || rs.pointFont,
    pointSize:    rs.propPointSize || rs.pointSize || rs.propBodySize || rs.bodySize,
    pointFontAdv: rs.propPointFontAdv
      ? { ...FONT_ADV_DEFAULTS(), ...rs.propPointFontAdv }
      : (rs.pointFontAdv || (rs.propBoldFontAdv ? { ...FONT_ADV_DEFAULTS(), ...rs.propBoldFontAdv } : rs.boldFontAdv)),
  };
}

const SHADOW_STD = { angle: 315, offset: 5, radius: 5, color: C_BLACK_A, opacity: 0.75 };
const TXT_SHADOW = { angle: 315, offset: 2, radius: 3, color: C_BLACK_A, opacity: 1, enable: true };

const APP_INFO = {
  platform: 'PLATFORM_MACOS',
  platformVersion: { majorVersion: 26, patchVersion: 1 },
  application: 'APPLICATION_PROPRESENTER',
  applicationVersion: { majorVersion: 20, patchVersion: 1, build: '335544583' },
};

// ─── Element builder for props ────────────────────────────────────────────

function makeTextElement({ name, x, y, w, h, rtfData, font, fontSize, center, charCount, vertAlign, scaleBehavior, margins, adv, spans, altAdv }, rs = {}) {
  const id = uuid();
  const hasAlt = (spans || []).some(s => s.alt);
  const customAttrs = hasAlt
    ? spanCapitalizationRanges(spans, adv, altAdv)
    : capitalizationCustomAttributes(adv, charCount);
  const paraStyle = {
    lineHeightMultiple: 1,
    defaultTabInterval: 84,
    textList: {},
  };
  // Paragraph alignment follows the font's Advanced → Alignment when set,
  // otherwise the element's default (centered for point/title, natural-left for body).
  // LEFT is the proto default, so it's left unset (matches the RTF's natural-left).
  const _al = adv && adv.alignment;
  const _alignEnum = _al === 'right' ? 'ALIGNMENT_RIGHT'
                   : _al === 'center' ? 'ALIGNMENT_CENTER'
                   : _al === 'left' ? null
                   : (center ? 'ALIGNMENT_CENTER' : null);
  if (_alignEnum) paraStyle.alignment = _alignEnum;

  return {
    uuid: id,
    name,
    bounds: { origin: { x, y }, size: { width: w, height: h } },
    opacity: 1,
    path: RECT_PATH,
    fill: { color: rs.cFill || hexToColor('#2196f2') },
    stroke: resolveStroke(adv, { width: 3, color: C_WHITE }),
    shadow: resolveShadow(adv, SHADOW_STD),
    feather: { radius: 0.05 },
    text: {
      attributes: {
        font: { name: font, size: fontSize, bold: !!adv?.bold, family: font },
        ...capitalizationAttr(adv),
        textSolidFill: adv?.color ? hexToColor(adv.color) : C_WHITE,
        underlineStyle: {},
        paragraphStyle: paraStyle,
        strikethroughStyle: {},
        ...resolveTextStroke(adv),
        customAttributes: customAttrs,
      },
      shadow: resolveTextShadow(adv, TXT_SHADOW),
      rtfData,
      ...(resolveScaleBehavior(adv, scaleBehavior) !== undefined ? { scaleBehavior: resolveScaleBehavior(adv, scaleBehavior) } : {}),
      ...(vertAlign ? { verticalAlignment: vertAlign } : {}),
      margins: margins ?? {},
      isSuperscriptStandardized: true,
      transformDelimiter: '  •  ',
      chordPro: { color: C_CHORD },
    },
    textLineMask: {},
  };
}

function makeSlot(element, info = 3) {
  return {
    element,
    info,
    textScroller: { scrollRate: 0.5, shouldRepeat: true },
  };
}

// ─── Prop cue builder ─────────────────────────────────────────────────────

/**
 * Returns a single cue object for inclusion in a PropDocument.
 * cue.name = propName → matched by parameterName in presentation prop action.
 */
function makePropCue(propName, elements, transition, rs = {}, uuidOverride = null) {
  return {
    uuid: uuidOverride ? { string: uuidOverride } : uuid(),
    name: propName,
    hotKey: {},
    completionActionType: 'COMPLETION_ACTION_TYPE_LAST',
    isEnabled: true,
    actions: [{
      uuid: uuid(),
      isEnabled: true,
      type: 'ACTION_TYPE_PRESENTATION_SLIDE',
      slide: {
        prop: {
          baseSlide: {
            elements,
            elementBuildOrder: [],
            size: { width: rs.propCanvasW ?? 1920, height: rs.propCanvasH ?? 1080 },
            uuid: uuid(),
          },
          transition,
        },
      },
    }],
  };
}

// ─── Font adv helpers ────────────────────────────────────────────────────

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

// Mirrors builder.js — LED-wall (prop) text needs the same meta-level
// capitalization attribute as the main screen, or ProPresenter won't render it.
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

// Mirrors builder.js — see its spanCapitalizationRanges for the full rationale.
// Every range gets an explicit value (CAPITALIZATION_NONE when unset) rather than
// omitting the field, since an omitted field inherits the element's base
// capitalization instead of explicitly clearing it.
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

// TEXT-level stroke/shadow — what ProPresenter actually renders on the text
// (mirrors builder.js; the element-level stroke/shadow above don't drive text).
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

// ─── Auto prop title Y estimation ────────────────────────────────────────

// `knownLines`: see estimateTitleY's doc comment in builder.js — same idea,
// for Display 2 (LED wall).
function estimatePropTitleY(spans, bw, prs, knownLines) {
  // Real canvas pixels throughout this function (by/bh/th are all pixel
  // coordinates) — NOT RTF half-points, so bodySize must NOT be doubled here.
  // The old `* 2` made every line-height estimate 2x too tall, pushing the
  // reference bar far too high above the body on any multi-line verse.
  const bodySize = prs.propBodySize ?? 80;
  const lineH = bodySize * 1.3;
  const gap = prs.propTitleAutoGap ?? 16;
  const by = prs.propBodyY ?? 729.98;
  const bh = prs.propBodyH ?? 350.02;
  const th = prs.propTitleH ?? 50.51;

  let totalLines = Number.isFinite(knownLines) && knownLines > 0 ? knownLines : null;

  if (totalLines === null) {
    const fullText = (spans || []).map(s => s.text || '').join('');
    const paragraphs = fullText.split('\n');
    const avgCharW = bodySize * 0.52;
    const charsPerLine = Math.max(1, bw / avgCharW);
    totalLines = 0;
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;
      const words = trimmed.split(/\s+/);
      let lineLen = 0, lines = 1;
      for (const word of words) {
        const wLen = word.length;
        if (lineLen > 0 && lineLen + 1 + wLen > charsPerLine) { lines++; lineLen = wLen; }
        else lineLen += (lineLen > 0 ? 1 : 0) + wLen;
      }
      totalLines += lines;
    }
    if (totalLines === 0) totalLines = 1;
  }

  const marginBottom = prs.propBodyFontAdv?.marginBottom ?? prs.bodyMarginBottom ?? 60;
  const estimatedTextH = totalLines * lineH;
  const textTop = by + bh - marginBottom - estimatedTextH;
  return Math.round(textTop - gap - th);
}

// ─── Prop cue builders ────────────────────────────────────────────────────

/**
 * Scripture prop cue: body text (all bodies concatenated) + reference bar.
 * Returns a cue object.
 */
function buildScripturePropCue(spec, rs = {}) {
  const { propName, reference, bodies } = spec;
  const prs = makePropStyle(rs);
  // bodies[0] uses Fit Width's OWN Display-2 hard-break override when one won
  // (see buildSpec in public/app.js) — independently computed against this
  // display's own metrics, never Display 1's spec.bodyDisplaySpans.
  const allSpans = bodies.reduce((acc, body, idx) => {
    if (idx > 0) acc.push({ text: '\n', bold: false });
    return acc.concat((idx === 0 && spec.propBodyDisplaySpans) ? spec.propBodyDisplaySpans : body);
  }, []);

  const bodyRtf   = rtf.rtfBody(allSpans, prs);
  const titleRtf  = rtf.rtfTitle(reference, prs);
  const plainBody = allSpans.map(s => s.text).join('');

  // Fit Width override (per-slide, computed against Display 2's own metrics —
  // see computeSlideFitWidth in public/app.js) takes precedence over the
  // palette's static prop width, same as spec.bodyW does for the main slide.
  const bx = spec.bodyX ?? prs.propBodyX ?? 0;
  const by = prs.propBodyY ?? 729.98;
  const bw = spec.bodyW ?? prs.propBodyW ?? prs.propCanvasW ?? 1920;
  const bh = prs.propBodyH ?? 350.02;
  const bodyYOff = prs.propBodyFontAdv?.yOffset ?? 0;

  const bodyEl = makeTextElement({
    name: 'body',
    x: bx, y: by + bodyYOff, w: bw, h: bh,
    rtfData: bodyRtf,
    font: prs.bodyFont || 'Montserrat-SemiBold',
    fontSize: prs.bodySize || 80,
    center: false,
    charCount: plainBody.length,
    vertAlign: resolveVertAlign(prs.propBodyFontAdv, 'VERTICAL_ALIGNMENT_BOTTOM'),
    scaleBehavior: 'SCALE_BEHAVIOR_SCALE_FONT_DOWN',
    margins: resolveMargins(prs.propBodyFontAdv, { bottom: 60 }),
    adv: prs.propBodyFontAdv,
    spans: allSpans,
    altAdv: prs.boldFontAdv,
  }, rs);

  const th = prs.propTitleH ?? 50.51;
  const tx = prs.propTitleX ?? -0.18;
  const tw = prs.propTitleW ?? (prs.propCanvasW ?? 1920) + 0.18;
  const titleYOff = prs.titleFontAdv?.yOffset ?? 0;
  let titleY;
  if (prs.propAutoTitleY) {
    titleY = estimatePropTitleY(allSpans, bw, prs, spec.bodyLines);
  } else {
    titleY = prs.propTitleY ?? (by + (prs.propTitleGapShort ?? 0));
  }

  const titleEl = makeTextElement({
    name: 'reference',
    x: tx, y: titleY + titleYOff, w: tw, h: th,
    rtfData: titleRtf,
    font: prs.titleFont || 'Montserrat-ExtraBold',
    fontSize: prs.titleSize || 60,
    center: true,
    charCount: reference.length,
    scaleBehavior: 'SCALE_BEHAVIOR_SCALE_FONT_DOWN',
    vertAlign: resolveVertAlign(prs.titleFontAdv, 'VERTICAL_ALIGNMENT_MIDDLE'),
    margins: resolveMargins(prs.titleFontAdv, {}),
    adv: prs.titleFontAdv,
  }, prs);

  return makePropCue(propName, [makeSlot(bodyEl), makeSlot(titleEl)], rs._propTransition ?? rs._transition, rs, spec.slotUuid ?? null);
}

/**
 * Point single prop cue: highlighted point text, centered.
 * Returns a cue object.
 */
function buildPointSinglePropCue(spec, rs = {}) {
  const { propName, bodyText } = spec;
  const prs = makePropStyle(rs);
  // Display 2's own hard-break override (spans, bold preserved), independent
  // of Display 1's spec.bodyDisplaySpans — see buildSpec in public/app.js.
  const bodyDisplay = spec.propBodyDisplaySpans || spec.propBodyDisplayText || bodyText;
  const bodyRtf = rtf.rtfPointBody(bodyDisplay, prs);
  const adv     = prs.pointFontAdv || prs.boldFontAdv || {};

  // Fit Width override (per-slide, computed against Display 2's own metrics)
  // takes precedence over the palette's static prop width.
  const bx = spec.bodyX ?? prs.propPointX ?? prs.propBodyX ?? 0;
  const by = prs.propPointY ?? prs.propBodyY ?? 729.98;
  const bw = spec.bodyW ?? prs.propPointW ?? prs.propBodyW ?? prs.propCanvasW ?? 1920;
  const bh = prs.propPointH ?? prs.propBodyH ?? 350.02;
  const boldYOff = adv.yOffset ?? 0;

  const bodyEl = makeTextElement({
    name: 'body',
    x: bx, y: by + boldYOff, w: bw, h: bh,
    rtfData: bodyRtf,
    font: prs.pointFont || 'Montserrat-ExtraBold',
    fontSize: prs.pointSize || prs.bodySize || 80,
    center: true,
    charCount: bodyText.length,
    vertAlign: resolveVertAlign(adv, 'VERTICAL_ALIGNMENT_BOTTOM'),
    scaleBehavior: 'SCALE_BEHAVIOR_SCALE_FONT_DOWN',
    margins: resolveMargins(adv, {}),
    adv,
  }, rs);

  return makePropCue(propName, [makeSlot(bodyEl)], rs._propTransition ?? rs._transition, rs, spec.slotUuid ?? null);
}

/**
 * Revealing point prop cue: shows bullets up to and including activeIdx,
 * with the active one highlighted. Optional title shown as header.
 * Returns a cue object.
 */
function buildRevealingPointPropCue(spec, rs = {}) {
  const { propName, title, bullets, activeIdx } = spec;
  const prs            = makePropStyle(rs);
  const visibleBullets = bullets.slice(0, activeIdx + 1);
  const rtfData        = rtf.rtfRevealingPoints(visibleBullets, title || null, prs);
  const plainText      = visibleBullets.map((p, i) => `${i + 1} \u2014 ${rtf.bulletToText(p)}`).join('\n');
  const adv            = prs.pointFontAdv || prs.boldFontAdv || {};

  // Fit Width override (per-slide, computed against Display 2's own metrics,
  // sized off the widest bullet so the box stays static across the reveal
  // sequence) takes precedence over the palette's static prop width.
  const bx = spec.bodyX ?? prs.propPointX ?? prs.propBodyX ?? 0;
  const by = prs.propPointY ?? prs.propBodyY ?? 729.98;
  const bw = spec.bodyW ?? prs.propPointW ?? prs.propBodyW ?? prs.propCanvasW ?? 1920;
  const bh = prs.propPointH ?? prs.propBodyH ?? 350.02;
  const boldYOff = adv.yOffset ?? 0;

  const bodyEl = makeTextElement({
    name: 'body',
    x: bx, y: by + boldYOff, w: bw, h: bh,
    rtfData,
    font: prs.pointFont || 'Montserrat-ExtraBold',
    fontSize: prs.pointSize || prs.bodySize || 80,
    center: true,
    charCount: plainText.length,
    vertAlign: resolveVertAlign(adv, 'VERTICAL_ALIGNMENT_BOTTOM'),
    scaleBehavior: 'SCALE_BEHAVIOR_SCALE_FONT_DOWN',
    margins: resolveMargins(adv, {}),
    adv,
  }, prs);

  return makePropCue(propName, [makeSlot(bodyEl)], rs._propTransition ?? rs._transition, rs, spec.slotUuid ?? null);
}

// ─── Response Card prop cue ───────────────────────────────────────────────

const RC_LAYOUT = {
  title: { x: 325, y: 856, w: 2550, h: 400 },
  mark:  { x: 310, w: 70, h: 150 },
  row:   { x: 400, w: 2600, h: 150 },
  rowYs: [150, 330, 510, 690],
};
const RC_MARK_LABELS = ['•', '1', '2', '3'];

// Default Response Card elements for the LED wall prop (display 2). The base 5
// (title + decision + 3 responses) plus any custom elements live per-scheme as
// rs.rcElements; users edit name/text/position/style and add more via the UI.
// font/size/color/align empty ('' or 0) = inherit the scheme's prop title/body.
function DEFAULT_RC_ELEMENTS() {
  return [
    { id: 'rc-title',    role: 'title',    name: 'Response Card', text: 'Response Card', x: 325, y: 856, w: 2550, h: 400, font: '', size: 0, color: '', align: 'center' },
    { id: 'rc-decision', role: 'decision', name: 'Decision',      text: '',              x: 400, y: 150, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
    { id: 'rc-r1',       role: 'r1',       name: 'Response 1',     text: '',              x: 400, y: 330, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
    { id: 'rc-r2',       role: 'r2',       name: 'Response 2',     text: '',              x: 400, y: 510, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
    { id: 'rc-r3',       role: 'r3',       name: 'Response 3',     text: '',              x: 400, y: 690, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
  ];
}

function responseRows(responses = {}) {
  return [responses.decisionText || '', responses.r1 || '', responses.r2 || '', responses.r3 || ''];
}

function buildResponseCardPropCue(spec, rs = {}) {
  const prs = makePropStyle(rs);
  const responses = spec.responses || {};
  // Per-scheme, fully-editable element list (display 2). Decision/R1–R3 text
  // comes from the Response Card deck item; title/custom text from the element.
  const defs = (Array.isArray(rs.rcElements) && rs.rcElements.length) ? rs.rcElements : DEFAULT_RC_ELEMENTS();
  const roleText = {
    decision: responses.decisionText || '',
    r1: responses.r1 || '', r2: responses.r2 || '', r3: responses.r3 || '',
  };
  const elements = defs.map(el => {
    const isTitle = el.role === 'title';
    const text = (el.role in roleText) ? roleText[el.role] : (el.text || '');
    // Empty font/size/color inherit the scheme's prop title/body styling.
    const font  = el.font  || (isTitle ? (prs.titleFont || 'Montserrat-ExtraBold') : (prs.bodyFont || 'Montserrat-SemiBold'));
    const size  = el.size  || (isTitle ? (prs.titleSize || 110) : (prs.bodySize || 80));
    const color = el.color || ((isTitle ? prs.titleFontAdv : prs.bodyFontAdv) || {}).color || '';
    const align = el.align || 'center';
    // Mini-style so the shared RTF generator picks up this element's font/size/colour.
    const elStyle = { bodyFont: font, bodySize: size, bodyFontAdv: { color, alignment: align } };
    const elEl = makeTextElement({
      name: el.name || 'response element',
      x: el.x ?? 0, y: el.y ?? 0, w: el.w ?? 2600, h: el.h ?? 150,
      rtfData: rtf.rtfResponseBody(text, elStyle),
      font, fontSize: size,
      center: align === 'center',
      charCount: (text || '').length,
      vertAlign: 'VERTICAL_ALIGNMENT_MIDDLE',
      margins: {},
      adv: { color, alignment: align },
    }, prs);
    return makeSlot(elEl);
  });

  return makePropCue(spec.propName || 'Response Card', elements, rs._propTransition ?? rs._transition, rs, spec.slotUuid ?? null);
}

// ─── PropDocument assembler ───────────────────────────────────────────────

/**
 * Builds a full PropDocument object containing all prop cues.
 *
 * @param {Array} propSpecs - Array of prop spec objects:
 *   { type: 'scripture',       propName, reference, bodies }
 *   { type: 'point-single',    propName, bodyText }
 *   { type: 'point-revealing', propName, title?, bullets, activeIdx }
 *   { type: 'response-card',   propName, responses }
 * @returns {object} PropDocument-shaped JS object ready for encodePropDocument()
 */
/**
 * Resolve a transition from a per-spec override or fall back to the global prop transition.
 * specTrans: { type, duration } or null/undefined
 * globalTrans: makeTransition result (the global prop transition object)
 */
function resolveSpecTransition(specTrans, rs) {
  if (specTrans?.type && specTrans.type !== 'default') {
    return makeTransition(specTrans.type, specTrans.duration);
  }
  return rs._propTransition;
}

function buildAllPropCues(propSpecs, style = {}) {
  const rs = resolveStyle(style);
  rs._transition     = makeTransition(rs.transitionType     || 'fade', rs.transitionDuration);
  rs._propTransition = makeTransition(rs.propTransitionType || 'fade', rs.propTransitionDuration);

  const cues = propSpecs.map(spec => {
    // Determine this cue's transition
    let specTrans;
    if (spec.type === 'point-revealing') {
      // Use propInitialTransition for activeIdx=0, propRevealTransition for subsequent
      specTrans = spec.activeIdx === 0
        ? (spec.propInitialTransition || spec.propTransition)
        : (spec.propRevealTransition  || spec.propTransition);
    } else {
      specTrans = spec.propTransition;
    }

    const cueRs = { ...rs, _propTransition: resolveSpecTransition(specTrans, rs) };

    switch (spec.type) {
      case 'scripture':
        return buildScripturePropCue(spec, cueRs);
      case 'point-single':
        return buildPointSinglePropCue(spec, cueRs);
      case 'point-revealing':
        return buildRevealingPointPropCue(spec, cueRs);
      case 'response-card':
        return buildResponseCardPropCue(spec, cueRs);
      case 'manual':
        // Blank cue — slot reserved, user builds the prop manually in Pro7
        return makePropCue(spec.propName, [], cueRs._propTransition ?? cueRs._transition, cueRs, spec.slotUuid ?? null);
      default:
        throw new Error(`Unknown prop spec type: ${spec.type}`);
    }
  });

  return {
    applicationInfo: APP_INFO,
    cues,
    transition: rs._propTransition,
    propCollections: [{
      uuid: uuid(),
      name: 'DeckPro',
      singlePropEnabled: true,
      items: cues.map(c => ({ propCueUuid: c.uuid })),
      cues,
    }],
  };
}

// ─── Encoder ──────────────────────────────────────────────────────────────

async function encodePropDocument(propDocObj) {
  const root = await getRoot();
  const PropDocument = root.lookupType('rv.data.PropDocument');
  const errMsg = PropDocument.verify(PropDocument.fromObject(propDocObj));
  if (errMsg) throw new Error(`PropDocument verify failed: ${errMsg}`);
  const msg = PropDocument.fromObject(propDocObj);
  return PropDocument.encode(msg).finish();
}

module.exports = {
  buildScripturePropCue,
  buildPointSinglePropCue,
  buildRevealingPointPropCue,
  buildResponseCardPropCue,
  buildAllPropCues,
  encodePropDocument,
  // Legacy aliases for any external callers
  buildScriptureProp: ({ cueUuid, reference, body }) =>
    ({ ...buildScripturePropCue({ propName: cueUuid, reference, bodies: [body] }), cues: undefined }),
};
