#!/usr/bin/env node
'use strict';

/**
 * DeckPro Plumbing Audit — sentinel-value pipeline check.
 *
 * Proves that values travel the whole server-side pipe:
 *
 *     export spec  →  builder / buildProp  →  RTF + protobuf  →  .pro / _Props.pro
 *
 * The method: put unmistakable "sentinel" values into a deck spec (odd sizes,
 * a weird colour, a made-up font name, smart quotes), run the real encoder in
 * download mode (no disk writes), decode the resulting Pro7 binaries, and prove
 * each sentinel landed in the exact element it controls. The decoded .pro is the
 * source of truth — not the UI, not a screenshot.
 *
 * Scope: this covers spec → .pro. The client half (UI → saved state → spec:
 * scheme resolution, Display-2 inheritance, Fit Width, quote normalization) runs
 * in the browser and is checked separately (see the skill's "manual checks").
 *
 * Run:  node scripts/plumbing-audit.js
 * Exit: 0 if no P0/P1 findings, 1 otherwise.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const protobuf = require('protobufjs');
const { encode } = require('../encode');

const ROOT = path.join(__dirname, '..');

// ── Sentinels ────────────────────────────────────────────────────────────────
// Deliberately weird so a match can't be a coincidence.
const S = {
  bodySize:      47,        // main-screen scripture/point body font size
  titleSize:     61,        // scripture reference bar font size
  queueSize:     33,        // queue sidebar font size
  liveSize:      43,        // live badge font size
  propBodySize:  87,        // LED-wall (Display 2) body font size
  bodyColor:     '#12ab34', // main-screen body text colour
  rcTitleColor:  '#ab12cd', // response-card title colour (LED wall)
  queueMarginL:  37,        // queue text left margin
  propPointFont: 'ObviouslyNarrowBold',   // Display-2 point font name
  scriptureText: 'PLUMBING_BODY_SENTINEL_ALPHA',
  pointText:     'PLUMBING_POINT_SENTINEL_BRAVO',
  reference:     'Plumbing 4:7',
  propName:      'PLUMBING_PROP_CHARLIE',
  smartQuote:    'He said “PLUMBING_QUOTE” today',   // curly quotes → must escape in RTF
  macroName:     'PLUMBING_MACRO_DELTA',
  macroUuid:     'AAAAAAAA-1111-2222-3333-444444444444',
  stageName:     'PLUMBING_STAGE_ECHO',
  stageUuid:     'BBBBBBBB-5555-6666-7777-888888888888',
  stageScreenName: 'PLUMBING_SCREEN_HOTEL',
  stageScreenUuid: 'EEEEEEEE-1212-3434-5656-787878787878',
  rcResponse1:   'PLUMBING_RC_RESPONSE_ONE',
  // per-slide overrides (historically silent-drop-prone) + blank-before + qr
  ovrMacroName:  'PLUMBING_OVR_MACRO_FOXTROT',
  ovrMacroUuid:  'CCCCCCCC-9999-8888-7777-666666666666',
  slideStageName:'PLUMBING_SLIDE_STAGE_GOLF',
  slideStageUuid:'DDDDDDDD-1010-2020-3030-404040404040',
  transType:     'dissolve',
  transDur:      3.7,   // weird per-slide transition duration (main screen)
  revealBase:    'PLUMBING_REVEAL',
  // Strip: a SINGLE span with an embedded newline — mirrors what extractSpans()
  // actually produces for plain multi-line text (adjacent same-format spans get
  // merged, so the break usually isn't its own standalone {text:'\n'} span). An
  // exact `s.text !== '\n'` filter never catches this — only a real fix does.
  stripLine2:    'PLUMBING_STRIP_LINE_TWO',
  // Fit Width: deliberately different values for Display 1 vs Display 2 so a
  // passing check proves Display 2 is independently computed, not just copying
  // Display 1's box (which is what "Fit Width did nothing on Display 2" was).
  fitBodyW:      900,
  fitBodyX:      500,
  fitPropBodyW:  2400,
  fitPropBodyX:  400,
  // Auto Title Y: a line count no char-width heuristic would ever produce for
  // this short sentinel string at this box width (which naturally wraps to
  // ~1 line) — so a match can only mean the known value reached the formula,
  // not a heuristic re-guess. Different per display so Display 1's count
  // can't leak into Display 2 or vice versa and still pass.
  fitBodyLines:     6,
  fitPropBodyLines: 9,
  // QR: fires as a macro (not an image) on blank-before cues with qrOn true.
  qrMacroName: 'PLUMBING_QR_MACRO_INDIA',
  qrMacroUuid: 'FFFFFFFF-1313-2424-3535-464646464646',
};

// ── Findings ─────────────────────────────────────────────────────────────────
const findings = [];
// severity: P0 (release blocker), P1 (workflow blocker), P2 (polish)
function check(severity, area, question, ok, detail) {
  findings.push({ severity, area, question, ok: !!ok, detail: detail || '' });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const b64ToRtf = (b64) => Buffer.from(b64 || '', 'base64').toString('utf8');

// Pull \fsNN (half-points) out of an RTF string → point size.
function rtfFontSize(rtf) {
  const m = rtf.match(/\\fs(\d+)/);
  return m ? parseInt(m[1], 10) / 2 : null;
}
// Does the RTF's expandedcolortbl carry this hex colour? Pro7 renders text
// colour from \*\expandedcolortbl cssrgb entries (see rtf.js / CLAUDE.md).
function rtfHasColor(rtf, hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const pct = (v) => Math.round((v / 255) * 100000);
  const needle = `\\cssrgb\\c${pct(r)}\\c${pct(g)}\\c${pct(b)}`;
  return rtf.includes(needle);
}

// Walk a decoded presentation → every slide element (with its slide/cue context).
function* presentationElements(pres) {
  for (const cue of pres.cues || []) {
    for (const action of cue.actions || []) {
      const base = action.slide && action.slide.presentation && action.slide.presentation.baseSlide;
      for (const slot of (base && base.elements) || []) {
        if (slot.element) yield { cue, action, el: slot.element };
      }
    }
  }
}
// Elements of ONE cue (scoping matters — start/end also carry body/title/queue,
// so a naive "first element named body" grabs the start banner, not scripture).
function* cueElements(cue) {
  for (const action of cue.actions || []) {
    const base = action.slide && action.slide.presentation && action.slide.presentation.baseSlide;
    for (const slot of (base && base.elements) || []) {
      if (slot.element) yield slot.element;
    }
  }
}
function findElInCue(cue, name) {
  for (const el of cueElements(cue)) if (el.name === name) return el;
  return null;
}
// Same as cueElements/findElInCue but for a PROP-file cue (action.slide.prop,
// not action.slide.presentation — different branch of the same oneof).
function* propCueElements(cue) {
  for (const action of cue.actions || []) {
    const base = action.slide && action.slide.prop && action.slide.prop.baseSlide;
    for (const slot of (base && base.elements) || []) {
      if (slot.element) yield slot.element;
    }
  }
}
function findElInPropCue(cue, name) {
  for (const el of propCueElements(cue)) if (el.name === name) return el;
  return null;
}
// First element with this name anywhere in the presentation.
function findEl(pres, name) {
  for (const { el } of presentationElements(pres)) if (el.name === name) return el;
  return null;
}
// Find the cue whose body element carries a given sentinel (index too).
function findCueByBody(pres, text) {
  const cues = pres.cues || [];
  for (let i = 0; i < cues.length; i++) {
    for (const el of cueElements(cues[i])) {
      if (el.name === 'body' && el.text && el.text.rtfData &&
          b64ToRtf(el.text.rtfData).includes(text)) return { cue: cues[i], index: i };
    }
  }
  return { cue: null, index: -1 };
}
const findScriptureCue = (pres) => findCueByBody(pres, S.scriptureText).cue;
// Every macro-action name/uuid on a cue.
function cueMacroUuids(cue) {
  const out = [];
  for (const a of cue.actions || []) {
    const id = a.macro && a.macro.identification;
    if (id && id.parameterUuid) out.push(id.parameterUuid.string || id.parameterUuid);
    if (a.macro && a.macro.uuid) out.push(a.macro.uuid.string || a.macro.uuid);
  }
  return out.map(String);
}
// Decode every rtfData anywhere in an object tree (elements, notes, props).
function collectAllRtf(obj, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  if (obj.rtfData) out.push(b64ToRtf(obj.rtfData));
  for (const k of Object.keys(obj)) collectAllRtf(obj[k], out);
  return out;
}

// ── Build the sentinel deck ──────────────────────────────────────────────────
// spec.style is the RESOLVED scheme the client would send (styleForExport output).
// We set it directly here so the audit isolates the server half of the pipe.
function buildSpec() {
  const style = {
    // sizes
    bodySize: S.bodySize, pointSize: S.bodySize, titleSize: S.titleSize,
    queueSize: S.queueSize, liveSize: S.liveSize,
    propBodySize: S.propBodySize, propPointSize: S.propBodySize,
    rcTitleSize: S.titleSize, rcBodySize: S.bodySize,
    // Auto Title Y — both displays, so estimateTitleY/estimatePropTitleY run.
    autoTitleY: true, propAutoTitleY: true,
    // fonts
    propPointFont: S.propPointFont,
    // advanced styling (colour lives on the adv objects)
    bodyFontAdv:    { color: S.bodyColor },
    pointFontAdv:   { color: S.bodyColor },
    queueFontAdv:   { marginLeft: S.queueMarginL },
    // LED-wall response card is driven by the rcElements array (per-element
    // name/text/pos/colour), so the RC-title colour sentinel goes here.
    rcElements: [
      { id: 'rc-title', role: 'title', name: 'Response Card', text: 'Response Card',
        x: 325, y: 856, w: 2550, h: 400, font: '', size: 0, color: S.rcTitleColor, align: 'center' },
      { id: 'rc-r1', role: 'r1', name: 'Response 1', text: '',
        x: 400, y: 150, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
      { id: 'rc-r2', role: 'r2', name: 'Response 2', text: '',
        x: 400, y: 330, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
      { id: 'rc-r3', role: 'r3', name: 'Response 3', text: '',
        x: 400, y: 510, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
      { id: 'rc-r4', role: 'r4', name: 'Response 4', text: '',
        x: 400, y: 690, w: 2600, h: 150, font: '', size: 0, color: '', align: 'center' },
    ],
  };

  // Embedded newline in a single span — the merged-span shape extractSpans()
  // actually produces, not two separate spans with a standalone \n between them.
  const scriptureSpans = [{ text: `${S.scriptureText}\n${S.stripLine2}` }];
  return {
    name: 'PLUMBING_AUDIT_DECK',
    downloadMode: true,          // return buffers, no disk writes
    includeResponseCard: true,
    qrMacro: { name: S.qrMacroName, uuid: S.qrMacroUuid }, // fires on blank-before cues with qrOn
    responses: { r1: S.rcResponse1, r2: 'RC two', r3: 'RC three', r4: 'RC four' },
    style,
    // palette-level macros + stage displays, triggered on scripture slides
    customMacros: [{ name: S.macroName, uuid: S.macroUuid, triggers: ['scripture'] }],
    stageDisplays: [{ name: S.stageName, uuid: S.stageUuid, triggers: ['scripture'] }],
    // the physical stage screen — a stage-layout action is a no-op in Pro7
    // without it, so the audit must confirm it lands (this is what a stub
    // schemeStageScreen() silently broke).
    stageScreen: { screenName: S.stageScreenName, screenUuid: S.stageScreenUuid },
    slides: [
      { type: 'start' },
      // blankBefore → a blank cue is injected ahead of this one; its Smart
      // Notes should preview the upcoming scripture text.
      { type: 'scripture', label: S.reference, reference: S.reference,
        bodies: [scriptureSpans], propName: S.propName, blankBefore: true, qrOn: true,
        stripNewlines: true,
        bodyW: S.fitBodyW, bodyX: S.fitBodyX, bodyLines: S.fitBodyLines,
        propBodyW: S.fitPropBodyW, propBodyX: S.fitPropBodyX, propBodyLines: S.fitPropBodyLines },
      // per-slide overrides on the point slide: transition + macro override.
      { type: 'point', mode: 'single', label: 'Pt', bodyText: S.pointText,
        propName: 'PLUMBING_POINT_PROP', blankBefore: false,
        transition: { type: S.transType, duration: S.transDur },
        macroOverride: { name: S.ovrMacroName, uuid: S.ovrMacroUuid } },
      { type: 'point', mode: 'revealing', label: 'Rev', title: 'Reveal Title',
        bullets: [[{ text: 'Reveal bullet one' }], [{ text: 'Reveal bullet two' }]],
        propBaseName: S.revealBase, blankBefore: false },
      // qrOn on a standalone Blank (not an auto-injected blank-before) —
      // separate code path in builder.js, its own way to silently drop the flag.
      { type: 'blank', label: 'Blank', spans: [{ text: S.smartQuote }], qrOn: true },
      // per-slide stage-layout override on the image slide.
      { type: 'image', label: 'Image slide',
        stageLayout: { layoutName: S.slideStageName, layoutUuid: S.slideStageUuid } },
      { type: 'custom', label: 'PLUMBING_CUSTOM_SLIDE' },
      { type: 'end' },
    ],
  };
}

// ── Run ──────────────────────────────────────────────────────────────────────
async function main() {
  const [presRoot, propRoot] = await Promise.all([
    protobuf.load(path.join(ROOT, 'ProPresenter7-Proto/proto/propresenter.proto')),
    protobuf.load(path.join(ROOT, 'ProPresenter7-Proto/proto/propDocument.proto')),
  ]);
  const Presentation = presRoot.lookupType('rv.data.Presentation');
  const PropDocument = propRoot.lookupType('rv.data.PropDocument');

  const spec = buildSpec();
  const res = await encode(spec);
  if (!res || !res.downloadMode) throw new Error('encode did not return download-mode buffers');

  const pres = Presentation.toObject(
    Presentation.decode(Buffer.from(res.data, 'base64')), { defaults: false });
  const propFile = res.props && res.props[0];
  const propDoc = propFile
    ? PropDocument.toObject(PropDocument.decode(Buffer.from(propFile.data, 'base64')), { defaults: false })
    : null;

  // ---- Presentation: structural ----
  const cueCount = (pres.cues || []).length;
  check('P0', 'structure', 'Presentation decodes with cues', cueCount > 0, `${cueCount} cues`);

  // ---- Scope to the scripture cue (start/end also carry body/title/queue) ----
  const scrCue = findScriptureCue(pres);
  check('P0', 'structure', 'Scripture cue located', !!scrCue,
    scrCue ? 'found by body sentinel' : 'no cue carries the body sentinel');

  // ---- Body font size + colour (scripture body element) ----
  const bodyEl = scrCue && findElInCue(scrCue, 'body');
  if (bodyEl && bodyEl.text && bodyEl.text.rtfData) {
    const rtf = b64ToRtf(bodyEl.text.rtfData);
    check('P0', 'text', `Body font size = ${S.bodySize}`,
      rtfFontSize(rtf) === S.bodySize, `RTF \\fs → ${rtfFontSize(rtf)}`);
    check('P0', 'colour', `Body colour = ${S.bodyColor}`,
      rtfHasColor(rtf, S.bodyColor), 'expandedcolortbl cssrgb');
    check('P0', 'text', 'Scripture body text present',
      rtf.includes(S.scriptureText), S.scriptureText);
    // Strip: source body is ONE span with an embedded \n (the shape extractSpans()
    // actually produces for plain text) — an exact `s.text !== '\n'` filter can't
    // catch that, so this regressed silently until stripNewlineSpans() replaced it.
    check('P0', 'text', 'Strip removes an embedded (not just standalone) newline',
      !/\\\n/.test(rtf) && rtf.includes(S.scriptureText) && rtf.includes(S.stripLine2),
      /\\\n/.test(rtf) ? 'RTF still contains a line break' : 'flattened, both fragments present');
    // Fit Width, Display 1 — main-screen body box width.
    const bw = bodyEl.bounds && bodyEl.bounds.size && bodyEl.bounds.size.width;
    check('P0', 'layout', `Fit Width (Display 1) body width = ${S.fitBodyW}`,
      Number(bw) === S.fitBodyW, `bounds.size.width → ${bw}`);
  } else {
    check('P0', 'text', 'Scripture body element found', false, "no 'body' element on scripture cue");
  }

  // ---- Title (reference bar) ----
  const titleEl = scrCue && findElInCue(scrCue, 'title');
  if (titleEl && titleEl.text && titleEl.text.rtfData) {
    const rtf = b64ToRtf(titleEl.text.rtfData);
    check('P1', 'text', `Title font size = ${S.titleSize}`,
      rtfFontSize(rtf) === S.titleSize, `RTF \\fs → ${rtfFontSize(rtf)}`);
    check('P1', 'text', 'Reference text in title', rtf.includes(S.reference), S.reference);

    // Auto Title Y (Display 1): must use the REAL known line count from Fit
    // Width (S.fitBodyLines), not re-derive it via a char-width heuristic that
    // routinely disagreed with what Fit Width actually rendered. Mirrors
    // estimateTitleY's formula (builder.js) with its fallback constants —
    // gap=16, marginBottom=60 — and DEFAULT_STYLE's bodyY=729.98/bodyH=350.02/
    // titleH=50.51 (unset by the sentinel style, so those fallbacks apply).
    const lineH = S.bodySize * 1.3;
    const expectedTitleY = Math.round(729.98 + 350.02 - 60 - S.fitBodyLines * lineH - 16 - 50.51);
    const titleY = titleEl.bounds && titleEl.bounds.origin && titleEl.bounds.origin.y;
    check('P0', 'layout', `Auto Title Y (Display 1) uses the known line count (${S.fitBodyLines})`,
      Number(titleY) === expectedTitleY, `bounds.origin.y → ${titleY} (expected ${expectedTitleY})`);
  } else {
    check('P1', 'text', 'Title element found', false, "no 'title' element on scripture cue");
  }

  // ---- Queue sidebar (size + margin) ----
  const queueEl = scrCue && findElInCue(scrCue, 'queue');
  if (queueEl && queueEl.text && queueEl.text.rtfData) {
    const rtf = b64ToRtf(queueEl.text.rtfData);
    check('P1', 'text', `Queue font size = ${S.queueSize}`,
      rtfFontSize(rtf) === S.queueSize, `RTF \\fs → ${rtfFontSize(rtf)}`);
    const inset = queueEl.text && queueEl.text.margins;
    const left = inset && (inset.left ?? inset.marginLeft);
    check('P2', 'layout', `Queue left margin = ${S.queueMarginL}`,
      Number(left) === S.queueMarginL, `margins.left → ${left}`);
  } else {
    check('P1', 'text', 'Queue element found', false, "no 'queue' element on scripture cue");
  }

  // ---- Live badge ----
  check('P1', 'structure', 'Live badge element present', !!(scrCue && findElInCue(scrCue, 'live')), '');

  // ---- Macro + stage-display + prop actions (fire on scripture) ----
  let macroHit = false, propHit = false;
  let stageLayoutHit = false, stageScreenHit = false;
  for (const cue of pres.cues || []) {
    for (const a of cue.actions || []) {
      const nm = (a.macro && a.macro.identification && a.macro.identification.parameterName) ||
                 (a.macro && a.macro.name);
      if (nm === S.macroName) macroHit = true;
      // A real stage-layout action: read the screen + layout assignment. Both
      // UUIDs must be present — an empty screen UUID makes Pro7 ignore the cue.
      const asg = a.stage && a.stage.stageScreenAssignments && a.stage.stageScreenAssignments[0];
      if (asg) {
        const layoutUuid = asg.layout && asg.layout.parameterUuid && (asg.layout.parameterUuid.string || asg.layout.parameterUuid);
        const screenUuid = asg.screen && asg.screen.parameterUuid && (asg.screen.parameterUuid.string || asg.screen.parameterUuid);
        if (String(layoutUuid) === S.stageUuid) {
          stageLayoutHit = true;
          if (String(screenUuid) === S.stageScreenUuid) stageScreenHit = true;
        }
      }
      const pn = a.prop && a.prop.identification && a.prop.identification.parameterName;
      if (pn === S.propName) propHit = true;
    }
  }
  check('P1', 'macros', `Palette macro "${S.macroName}" fires on scripture`, macroHit, '');
  check('P1', 'stage', `Stage layout "${S.stageName}" action present on scripture`, stageLayoutHit, '');
  // The bug that shipped in <=4.8.3: layout present but screen UUID empty → no-op.
  check('P0', 'stage', `Stage action carries the physical screen UUID (not empty)`,
    stageScreenHit, stageScreenHit ? 'screen + layout both set' : 'screen UUID missing/empty — Pro7 will ignore the cue');
  check('P0', 'props', `Scripture prop action names "${S.propName}"`, propHit, '');

  // ---- Props file ----
  if (propDoc) {
    const cues = propDoc.cues || [];
    const propNames = cues.map(c => c.name);
    check('P0', 'props', 'Props file decodes with cues', cues.length > 0, `${cues.length} prop cues`);
    check('P0', 'props', `Scripture prop cue "${S.propName}" exists`,
      propNames.includes(S.propName), propNames.slice(0, 8).join(', '));

    // Fit Width, Display 2 (LED wall) — must be independently computed from
    // Display 1, not left on the palette's static prop width. fitPropBodyW is
    // deliberately != fitBodyW so a pass here can't be Display 1's value leaking
    // through by coincidence (the bug that shipped: Display 2 never received a
    // Fit Width value at all and always used the palette default).
    const scrPropCue = cues.find(c => c.name === S.propName);
    const propBodyEl = scrPropCue && findElInPropCue(scrPropCue, 'body');
    const pbw = propBodyEl && propBodyEl.bounds && propBodyEl.bounds.size && propBodyEl.bounds.size.width;
    check('P0', 'layout', `Fit Width (Display 2) prop body width = ${S.fitPropBodyW}`,
      Number(pbw) === S.fitPropBodyW, `bounds.size.width → ${pbw}`);

    // Auto Title Y (Display 2): same idea as Display 1's check above, but also
    // regression coverage for a real bug found alongside this — the old code
    // doubled propBodySize before computing line height ("RTF doubles pt for
    // Pro7"), conflating the RTF \fs half-point wire convention (already
    // handled inside rtf.js) with this function's own real-pixel canvas math,
    // making every line-height estimate 2x too tall and pushing the reference
    // bar hundreds of pixels too high above the body on any multi-line verse.
    const propTitleEl = scrPropCue && findElInPropCue(scrPropCue, 'reference');
    const propLineH = S.propBodySize * 1.3; // NOT doubled — real canvas pixels
    // buildProp.js has its own default bounds (853/427/60), distinct from the
    // main-screen ones (729.98/350.02/50.51) — see DEFAULT_STYLE in buildProp.js.
    const expectedPropTitleY = Math.round(853 + 427 - 60 - S.fitPropBodyLines * propLineH - 16 - 60);
    const propTitleY = propTitleEl && propTitleEl.bounds && propTitleEl.bounds.origin && propTitleEl.bounds.origin.y;
    check('P0', 'layout', `Auto Title Y (Display 2) uses the known line count (${S.fitPropBodyLines}), not doubled`,
      Number(propTitleY) === expectedPropTitleY, `bounds.origin.y → ${propTitleY} (expected ${expectedPropTitleY})`);

    check('P1', 'props', 'Response Card prop cue exists',
      propNames.some(n => /response card/i.test(n)), propNames.join(', '));

    // Every prop action in the presentation must match a prop cue by name.
    const actionPropNames = new Set();
    for (const cue of pres.cues || []) {
      for (const a of cue.actions || []) {
        const pn = a.prop && a.prop.identification && a.prop.identification.parameterName;
        if (pn) actionPropNames.add(pn);
      }
    }
    const missing = [...actionPropNames].filter(n => !propNames.includes(n));
    check('P0', 'props', 'Every prop action matches a prop cue by name',
      missing.length === 0, missing.length ? `unmatched: ${missing.join(', ')}` : 'all matched');

    // Sentinel colour/text on the response-card prop (Display 2, LED wall).
    const rcCue = cues.find(c => /response card/i.test(c.name));
    if (rcCue) {
      const rcRtfs = collectAllRtf(rcCue);
      check('P1', 'response-card', `RC title colour = ${S.rcTitleColor} on LED wall`,
        rcRtfs.some(r => rtfHasColor(r, S.rcTitleColor)), 'rcElements colour → prop RTF');
      check('P1', 'response-card', `RC Response 1 text "${S.rcResponse1}" present`,
        rcRtfs.some(r => r.includes(S.rcResponse1)), '');
    } else {
      check('P1', 'response-card', 'Response Card prop cue found for colour check', false, '');
    }

    // Display-2 point font name should reach a point prop.
    const propJson = JSON.stringify(propDoc);
    check('P2', 'fonts', `Display-2 point font "${S.propPointFont}" reaches props`,
      propJson.includes(S.propPointFont), '');
  } else {
    check('P0', 'props', 'Props file produced', false, 'no _Props buffer');
  }

  // ---- Smart quotes escaped (not raw curly) across ALL RTF (elements + notes) ----
  const joined = collectAllRtf(pres).join('\n');
  const quoteReached = joined.includes('PLUMBING_QUOTE');
  const rawCurly = joined.includes('“') || joined.includes('”');
  const escapedQuote = joined.includes("\\'93") || joined.includes("\\'94");
  check('P1', 'text', 'Curly quotes escaped in RTF (not raw)',
    quoteReached && !rawCurly && escapedQuote,
    !quoteReached ? 'quote sentinel not found in any RTF'
      : rawCurly ? 'found RAW curly char in shipped RTF' : 'converted to \\\'93/\\\'94');

  // ---- Custom slide survives (exports as a labelled slot) ----
  check('P1', 'structure', 'Custom slide survives export',
    JSON.stringify(pres).includes('PLUMBING_CUSTOM_SLIDE'), '');

  // ---- Per-slide overrides (historically dropped silently) ----
  const { cue: pointCue, index: pointIdx } = findCueByBody(pres, S.pointText);
  if (pointCue) {
    // main-screen transition override on the slide action
    let transDur = null;
    for (const a of pointCue.actions || []) {
      const t = a.slide && a.slide.presentation && a.slide.presentation.transition;
      if (t && (t.duration != null)) transDur = t.duration;
    }
    check('P1', 'motion', `Per-slide transition duration = ${S.transDur}`,
      Math.abs(Number(transDur) - S.transDur) < 1e-6, `slide transition → ${transDur}`);
    // macro override fires on this exact slide
    check('P1', 'macros', `Per-slide macro override "${S.ovrMacroName}"`,
      cueMacroUuids(pointCue).includes(S.ovrMacroUuid), cueMacroUuids(pointCue).join(', '));
  } else {
    check('P1', 'motion', 'Point cue located for override checks', false, '');
  }

  // ---- Per-slide stage-layout override (on the image slide) ----
  check('P1', 'stage', `Per-slide stage layout "${S.slideStageName}" reaches export`,
    JSON.stringify(pres).includes(S.slideStageUuid), '');

  // ---- Blank-before: a blank cue is injected ahead, Smart Notes preview it ----
  if (pointIdx >= 0 && scrCue) {
    const scrIdx = (pres.cues || []).indexOf(scrCue);
    const before = scrIdx > 0 ? pres.cues[scrIdx - 1] : null;
    // A blank is a real slide cue (decoded action carries a `slide` field) but
    // shows black — no scripture body sentinel of its own. (Enums decode as
    // numbers, so detect the slide action by its `slide` payload, not a.type.)
    const beforeIsSlide = before && (before.actions || []).some(a => a.slide);
    const beforeIsBlank = beforeIsSlide && ![...cueElements(before)].some(
      e => e.name === 'body' && e.text && e.text.rtfData && b64ToRtf(e.text.rtfData).includes(S.scriptureText));
    const beforeNotes = before ? collectAllRtf(before).join('\n') : '';
    check('P1', 'blank-before', 'Blank cue injected before scripture',
      !!(before && beforeIsBlank), before ? `cue #${scrIdx - 1}` : 'no preceding cue');
    check('P1', 'notes', 'Blank-before Smart Notes preview the upcoming scripture',
      beforeNotes.includes(S.scriptureText), beforeNotes.includes(S.scriptureText) ? 'preview present' : 'sentinel not in blank notes');

    // ---- QR: fires as a macro on the blank-before cue (qrOn: true), not an
    // image element — that whole approach was removed since QR isn't
    // something DeckPro draws, it's whatever macro actually shows it.
    const beforeMacroUuids = before ? cueMacroUuids(before) : [];
    check('P0', 'macros', `QR macro "${S.qrMacroName}" fires on the blank-before cue`,
      beforeMacroUuids.includes(S.qrMacroUuid), beforeMacroUuids.join(', ') || 'no macros on blank-before cue');
    check('P0', 'structure', 'No QR image element anywhere (QR is a macro, not a drawn element)',
      !findEl(pres, 'qr'), findEl(pres, 'qr') ? 'found a "qr" element — old image-based approach resurfaced' : 'none found');
  }

  // ---- QR on a standalone Blank slide (not an auto-injected blank-before) —
  // separate cue-building branch in builder.js (slide.type === 'blank'), its
  // own way to silently drop qrOn even when the blank-before path works.
  // A standalone blank's confidence-monitor text isn't a visible element at
  // all — buildBlankCue() repurposes it as the cue's Slide Notes — so this
  // has to search the whole cue tree (collectAllRtf), not element.text.rtfData.
  const standaloneBlankCue = (pres.cues || []).find(c => collectAllRtf(c).some(r => r.includes('PLUMBING_QUOTE')));
  if (standaloneBlankCue) {
    const blankMacroUuids = cueMacroUuids(standaloneBlankCue);
    check('P0', 'macros', `QR macro "${S.qrMacroName}" fires on a standalone Blank slide with qrOn`,
      blankMacroUuids.includes(S.qrMacroUuid), blankMacroUuids.join(', ') || 'no macros on the standalone blank cue');
  }

  // ---- Revealing point: one prop per bullet, progressive ----
  if (propDoc) {
    const names = (propDoc.cues || []).map(c => c.name);
    const rev1 = names.includes(`${S.revealBase}_1`);
    const rev2 = names.includes(`${S.revealBase}_2`);
    check('P1', 'props', 'Revealing point makes one prop per bullet',
      rev1 && rev2, names.filter(n => n.startsWith(S.revealBase)).join(', '));
  }

  // ---- Deliver-mode: Configuration/Props binary patch keeps Single Prop Mode on ----
  // This is a separate code path from the download-mode check above — deliverMode
  // patches a real Configuration/Props file byte-for-byte instead of building a
  // fresh PropDocument, so it has its own way to silently drop a field. Regression
  // for the bug where re-exporting reverted a previously-toggled-on "DeckPro"
  // collection back to Single Prop Mode = off on every export.
  await checkDeliverModeSinglePropMode(propRoot);

  // ── Report ──────────────────────────────────────────────────────────────────
  report();
}

async function checkDeliverModeSinglePropMode(propRoot) {
  const PropDocument = propRoot.lookupType('rv.data.PropDocument');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'deckpro-plumbing-'));
  try {
    const confDir = path.join(tmp, 'Configuration');
    fs.mkdirSync(confDir, { recursive: true });
    const confPath = path.join(confDir, 'Props');

    // Seed a pre-existing "DeckPro" collection stuck at singlePropEnabled:false —
    // simulating the state after a prior export wrote it without the flag.
    const seedMsg = PropDocument.fromObject({
      cues: [],
      propCollections: [{
        uuid: { string: 'AAAAAAAA-0000-0000-0000-000000000001' },
        name: 'DeckPro',
        singlePropEnabled: false,
        items: [],
      }],
    });
    fs.writeFileSync(confPath, PropDocument.encode(seedMsg).finish());

    const spec = {
      name: 'PlumbingDeliverTest',
      deliverMode: true,
      pro7RootFolder: tmp,
      slides: [
        { type: 'point', mode: 'single', label: 'Plumbing Point', bodyText: 'PLUMBING_DELIVER_SENTINEL', propName: 'Plumbing Point' },
      ],
    };
    const result = await encode(spec, null, null);

    const patched = PropDocument.toObject(
      PropDocument.decode(fs.readFileSync(confPath)), { defaults: true });
    const deckproColl = (patched.propCollections || []).find(c => c.name === 'DeckPro Slot 1');

    check('P0', 'props', 'Deliver-mode export completes without error', !!(result && result.propsInstalled), result && result.propsError || '');
    check('P0', 'props', 'Single Prop Mode stays on after re-exporting an existing DeckPro collection',
      !!(deckproColl && deckproColl.singlePropEnabled),
      deckproColl ? `singlePropEnabled=${deckproColl.singlePropEnabled}` : 'no DeckPro collection found in patched file');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function report() {
  const order = { P0: 0, P1: 1, P2: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  const pass = findings.filter(f => f.ok).length;
  const fail = findings.filter(f => !f.ok);

  console.log('\n═══ DeckPro Plumbing Audit ═══\n');
  for (const f of findings) {
    const mark = f.ok ? '✅' : '❌';
    const sev = f.ok ? '  ' : f.severity;
    console.log(`${mark} ${sev} [${f.area}] ${f.question}${f.detail ? '  —  ' + f.detail : ''}`);
  }
  console.log(`\n${pass}/${findings.length} checks passed.`);

  const blockers = fail.filter(f => f.severity === 'P0' || f.severity === 'P1');
  if (fail.length) {
    console.log('\n─── FINDINGS ───');
    for (const f of fail) {
      console.log(`\n${f.severity} — ${f.area}: ${f.question}`);
      console.log(`  expected: sentinel present in the ${f.area} element`);
      console.log(`  actual:   ${f.detail || 'not found'}`);
      console.log(`  repro:    node scripts/plumbing-audit.js  (sentinel "${JSON.stringify(S).slice(0, 40)}…")`);
    }
  }
  process.exitCode = blockers.length ? 1 : 0;
}

main().catch(err => { console.error('AUDIT CRASHED:', err); process.exit(2); });
