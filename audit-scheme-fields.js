// Differential-export audit for every scheme field.
//
// For each field we set a distinctive SENTINEL value, build the main
// presentation AND the prop document, then prove the sentinel actually reaches
// the output — in BOTH layers it should touch:
//   meta = the protobuf element attributes (font.size, bounds, fill, stroke…)
//   rtf  = the decoded RTF payload (\fsNN, \colortbl, \fonttbl, \pard…)
//
// A field "PASSES" only if every check it declares is found. A field that
// declares checks but finds nothing is a real export bug. A field marked
// {dead:true} is asserted to have NO consumer (regression guard for removal).
//
// Run:  node audit-scheme-fields.js          (summary)
//       node audit-scheme-fields.js -v        (show every needle)

const { buildPresentation } = require('./builder.js');
const { buildAllPropCues }  = require('./buildProp.js');

const VERBOSE = process.argv.includes('-v');

// ── sentinels ───────────────────────────────────────────────────────────────
const S = {
  size:   137,            // distinctive pt size  → meta "size":137, rtf \fs274
  font:   'ZZSENTINELFONT',
  num:    1234.5,         // distinctive coordinate
  margin: 97,
  hex:    '#7f1322',      // r=127 g=19 b=34 → unique float + int triplet
};
function hexFloats(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16),
    rf: String(parseInt(h.slice(0, 2), 16) / 255),
    gf: String(parseInt(h.slice(2, 4), 16) / 255),
    bf: String(parseInt(h.slice(4, 6), 16) / 255),
  };
}
const HX = hexFloats(S.hex);
const colorMeta = `"red":${HX.rf},"green":${HX.gf},"blue":${HX.bf}`;
const colorRtf  = `\\red${HX.r}\\green${HX.g}\\blue${HX.b}`;

// ── kitchen-sink deck (exercises every main-presentation element) ────────────
function sinkDeck() {
  return {
    name: 'AUDIT',
    includeResponseCard: true,
    responses: { decision: 'D', r1: 'A', r2: 'B', r3: 'C' },
    slides: [
      { type: 'start', label: 'START', text: 'START' },
      // bodyLines/ascent/descent/capAscent stand in for a real Fit Width pass
      // (app.js normally supplies these) — estimateTitleY runs in strict mode
      // for scripture now (see Task 3, builder.js) and throws without them,
      // since a missing real result there is a bug, not something to guess at.
      { type: 'scripture', label: 'John 3:16', reference: 'John 3:16',
        bodies: [[{ text: 'plain verse ' }, { text: 'emphasis', alt: true }]],
        bodyLines: 1, ascent: 43, descent: 11, capAscent: 31 },
      { type: 'point', mode: 'single', label: 'Pt', bodyText: 'A point' },
      { type: 'point', mode: 'revealing', label: 'Rev', points: ['One', 'Two'] },
      { type: 'image', label: 'Img' },
      { type: 'blank', label: 'Blank', spans: [{ text: 'quote' }] },
      { type: 'end', label: 'End', text: 'End' },
    ],
  };
}
// prop specs exercising every prop element
function sinkProps() {
  return [
    { type: 'scripture', propName: 'John 3:16', reference: 'John 3:16',
      bodies: [[{ text: 'plain verse ' }, { text: 'emphasis', alt: true }]] },
    { type: 'point-single', propName: 'Pt', bodyText: 'A point' },
    { type: 'point-revealing', propName: 'Rev', bullets: ['One', 'Two'], activeIdx: 1 },
    { type: 'response-card', propName: 'RC', decision: 'D', r1: 'A', r2: 'B', r3: 'C' },
  ];
}

// ── haystack: build with a sentineled scheme, return {meta, rtf} strings ──────
function collectRtf(obj, out) {
  if (obj == null || typeof obj !== 'object') return;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (k === 'rtfData' && typeof v === 'string') {
      try { out.push(Buffer.from(v, 'base64').toString('utf8')); } catch {}
    } else collectRtf(v, out);
  }
}
function haystacks(style, { prop = false } = {}) {
  const main = buildPresentation({ ...sinkDeck(), style });
  let meta = JSON.stringify(main);
  const rtfArr = []; collectRtf(main, rtfArr);
  if (prop) {
    const p = buildAllPropCues(sinkProps(), style);
    meta += JSON.stringify(p);
    collectRtf(p, rtfArr);
  }
  // strip base64 rtfData from meta so RTF needles never false-match the blob
  meta = meta.replace(/"rtfData":"[^"]*"/g, '"rtfData":""');
  return { meta, rtf: rtfArr.join('\n---\n') };
}

// ── field table ──────────────────────────────────────────────────────────────
// Each row: { name, set(scheme), prop?, checks:[{layer,needle,note?}], dead? }
const advFull = (advKey, { prop = false } = {}) => ([
  { name: `${advKey}.charSpacing`,            prop, set: s => deep(s, advKey, 'charSpacing', 7),        checks: [r(`\\expndtw140`)] },
  { name: `${advKey}.lineHeight`,             prop, set: s => deep(s, advKey, 'lineHeight', 1.5),       checks: [r(`\\sl360`)] },
  { name: `${advKey}.paragraphSpacingBefore`, prop, set: s => deep(s, advKey, 'paragraphSpacingBefore', 9), checks: [r(`\\sb180`)] },
  { name: `${advKey}.paragraphSpacingAfter`,  prop, set: s => deep(s, advKey, 'paragraphSpacingAfter', 11),  checks: [r(`\\sa220`)] },
  { name: `${advKey}.alignment(right)`,       prop, set: s => deep(s, advKey, 'alignment', 'right'),    checks: [r(`\\qr`)] },
  { name: `${advKey}.italic`,                 prop, set: s => deep(s, advKey, 'italic', true),          checks: [r(`\\i `)] },
  { name: `${advKey}.underline`,              prop, set: s => deep(s, advKey, 'underline', true),       checks: [r(`\\ul `)] },
  // capitalization and bold must reach BOTH layers too — ProPresenter reads the meta
  // attributes.font.{bold,capitalization} for live rendering, not just the embedded RTF.
  // (This is precisely the gap that let buildProp.js ship with no meta capitalization
  // at all for Display 2 — the old RTF-only check couldn't see it.)
  { name: `${advKey}.capitalization(allCaps)`,prop, set: s => deep(s, advKey, 'capitalization', 'allCaps'), checks: [r(`\\caps `), m(`CAPITALIZATION_ALL_CAPS`)] },
  { name: `${advKey}.color`,                  prop, set: s => deep(s, advKey, 'color', S.hex),          checks: [r(colorRtf), m(colorMeta)] },
  { name: `${advKey}.bold`,                   prop, set: s => deep(s, advKey, 'bold', true),            checks: [r(`\\b `), m(`"bold":true`)] },
  { name: `${advKey}.strikethrough`,          prop, set: s => deep(s, advKey, 'strikethrough', true),   checks: [r(`\\strike`)] },
  { name: `${advKey}.verticalAlignment(top)`, prop, set: s => deep(s, advKey, 'verticalAlignment', 'top'), checks: [m(`VERTICAL_ALIGNMENT_TOP`)] },
  { name: `${advKey}.marginLeft`,             prop, set: s => deep(s, advKey, 'marginLeft', S.margin),  checks: [m(`"left":${S.margin}`)] },
  { name: `${advKey}.marginTop`,              prop, set: s => deep(s, advKey, 'marginTop', S.margin),   checks: [m(`"top":${S.margin}`)] },
  { name: `${advKey}.marginRight`,            prop, set: s => deep(s, advKey, 'marginRight', S.margin), checks: [m(`"right":${S.margin}`)] },
  { name: `${advKey}.marginBottom`,           prop, set: s => deep(s, advKey, 'marginBottom', S.margin),checks: [m(`"bottom":${S.margin}`)] },
  { name: `${advKey}.stroke`,                 prop, set: s => { deep(s, advKey, 'strokeEnabled', true); deep(s, advKey, 'strokeWidth', 7); deep(s, advKey, 'strokeColor', S.hex); }, checks: [m(`"width":7`), m(colorMeta)] },
  { name: `${advKey}.shadow`,                 prop, set: s => { deep(s, advKey, 'shadowEnabled', true); deep(s, advKey, 'shadowAngle', 123); deep(s, advKey, 'shadowOffset', 13); deep(s, advKey, 'shadowBlur', 17); deep(s, advKey, 'shadowColor', S.hex); }, checks: [m(`"angle":123`), m(`"offset":13`), m(`"radius":17`)] },
  { name: `${advKey}.scaleBehavior`,          prop, set: s => deep(s, advKey, 'scaleBehavior', 'SCALE_BEHAVIOR_SHRINK_TO_FIT'), checks: [m(`SCALE_BEHAVIOR_SHRINK_TO_FIT`)] },
]);

function m(needle, note) { return { layer: 'meta', needle, note }; }
function r(needle, note) { return { layer: 'rtf',  needle, note }; }
function deep(scheme, advKey, sub, val) {
  scheme[advKey] = { ...(scheme[advKey] || {}), [sub]: val };
  return scheme;
}

const FIELDS = [
  // ── Colors ──
  { name: 'fillEnabled+bodyFill', set: s => { s.fillEnabled = true; s.bodyFill = S.hex; }, checks: [m(colorMeta)] },
  { name: 'titleFill',  set: s => { s.fillEnabled = true; s.titleFill = S.hex; }, checks: [m(colorMeta)] },
  { name: 'titleText',  set: s => { s.titleText = S.hex; },  checks: [m(colorMeta), r(colorRtf)], expectDead: 'title text color comes from titleFontAdv.color; cTitleText computed but never used' },
  { name: 'titleShadow',set: s => { s.titleShadow = S.hex; },checks: [m(colorMeta), r(colorRtf)], expectDead: 'cTitleShadow computed in resolveStyle but never consumed by any element' },

  // ── Main font names ──
  { name: 'bodyFont',   set: s => { s.bodyFont = S.font; },   checks: [m(`"name":"${S.font}"`), r(S.font)] },
  { name: 'boldFont',   set: s => { s.boldFont = S.font; },   checks: [r(S.font)] },
  { name: 'pointFont',  set: s => { s.pointFont = S.font; },  checks: [m(`"name":"${S.font}"`), r(S.font)] },
  { name: 'titleFont',  set: s => { s.titleFont = S.font; },  checks: [m(`"name":"${S.font}"`), r(S.font)] },
  { name: 'rcBodyFont', set: s => { s.rcBodyFont = S.font; }, checks: [m(`"name":"${S.font}"`), r(S.font)] },
  { name: 'rcTitleFont',set: s => { s.rcTitleFont = S.font;}, checks: [m(`"name":"${S.font}"`), r(S.font)] },
  { name: 'startEndFont',set: s => { s.startEndFont = S.font;},checks: [m(`"name":"${S.font}"`), r(S.font)] },
  { name: 'notesFont',  set: s => { s.notesFont = S.font; },  checks: [r(S.font)] },
  { name: 'notesBoldFont', set: s => { s.notesBoldFont = S.font; }, checks: [r(S.font)],
    note: 'confidence-monitor alt/emphasis font — exercised via the sink deck\'s alt-marked scripture span' },

  // ── Prop font names ──
  { name: 'propBodyFont', set: s => { s.propBodyFont = S.font; }, prop: true, checks: [r(S.font)] },
  { name: 'propBoldFont', set: s => { s.propBoldFont = S.font; }, prop: true, checks: [r(S.font)] },
  { name: 'propPointFont',set: s => { s.propPointFont = S.font; },prop: true, checks: [r(S.font)] },
  { name: 'propTitleFont',set: s => { s.propTitleFont = S.font; },prop: true, checks: [r(S.font)] },
  { name: 'pointStackedFont', set: s => { s.pointStackedFont = S.font; }, prop: true, checks: [r(S.font)],
    note: 'revealing-point prop — previously-revealed (stacked) bullets, exercised via the sink deck\'s 2-bullet revealing point' },

  // ── Main sizes ──
  { name: 'bodySize',    set: s => { s.bodySize = S.size; },    checks: [m(`"size":${S.size}`), r(`\\fs${S.size*2}`)] },
  { name: 'pointSize',   set: s => { s.pointSize = S.size; },   checks: [m(`"size":${S.size}`), r(`\\fs${S.size*2}`)] },
  { name: 'titleSize',   set: s => { s.titleSize = S.size; },   checks: [m(`"size":${S.size}`), r(`\\fs${S.size*2}`)] },
  { name: 'rcBodySize',  set: s => { s.rcBodySize = S.size; },  checks: [m(`"size":${S.size}`), r(`\\fs${S.size*2}`)] },
  { name: 'rcTitleSize', set: s => { s.rcTitleSize = S.size; }, checks: [m(`"size":${S.size}`), r(`\\fs${S.size*2}`)] },
  { name: 'startEndSize',set: s => { s.startEndSize = S.size; },checks: [m(`"size":${S.size}`), r(`\\fs${S.size*2}`)] },
  { name: 'notesSize',   set: s => { s.notesSize = S.size; },   checks: [r(`\\fs${S.size*2}`)] },

  // ── Prop sizes ──
  { name: 'propBodySize', set: s => { s.propBodySize = S.size; }, prop: true, checks: [m(`"size":${S.size}`), r(`\\fs${S.size*2}`)] },
  { name: 'propPointSize',set: s => { s.propPointSize = S.size;}, prop: true, checks: [m(`"size":${S.size}`), r(`\\fs${S.size*2}`)] },
  { name: 'propTitleSize',set: s => { s.propTitleSize = S.size;}, prop: true, checks: [m(`"size":${S.size}`), r(`\\fs${S.size*2}`)] },
  // pointStackedSize has no meta-layer equivalent — the shared prop element has
  // one font.size attribute (driven by the active bullet); stacked bullets are
  // sized only via the per-run RTF \fs code.
  { name: 'pointStackedSize', set: s => { s.pointStackedSize = S.size; }, prop: true, checks: [r(`\\fs${S.size*2}`)] },

  // ── Transitions ──
  { name: 'transitionType(dissolve)',  set: s => { s.transitionType = 'dissolve'; }, checks: [m(`Dissolve`)] },
  { name: 'transitionDuration',    set: s => { s.transitionDuration = 3.25; }, checks: [m(`3.25`)] },
  { name: 'propTransitionType(dissolve)', set: s => { s.propTransitionType = 'dissolve'; }, prop: true, checks: [m(`Dissolve`)] },
  { name: 'propTransitionDuration',   set: s => { s.propTransitionDuration = 2.75; }, prop: true, checks: [m(`2.75`)] },

  // ── Canvas ── (main canvasW/H only feed body-width fallback, masked by bodyW default → fallback-only)
  { name: 'canvasW/H',     set: s => { s.canvasW = 2222; s.canvasH = 1333; }, checks: [m(`2222`)], soft: true, note: 'fallback-only: masked by bodyW/bodyH defaults' },
  { name: 'propCanvasW/H', set: s => { s.propCanvasW = 4444; s.propCanvasH = 1555; }, prop: true, checks: [m(`4444`)] },

  // ── Main bounds ──
  { name: 'bodyX/Y/W/H',  set: s => { s.bodyX = S.num; s.bodyY = S.num; s.bodyW = S.num; s.bodyH = S.num; }, checks: [m(`${S.num}`)] },
  { name: 'pointX/Y/W/H', set: s => { s.pointX = 1111.1; s.pointY = 1111.1; s.pointW = 1111.1; s.pointH = 1111.1; }, checks: [m(`1111.1`)] },
  { name: 'titleX/Y/W/H', set: s => { s.autoTitleY = false; s.titleX = 222.2; s.titleY = 222.2; s.titleW = 222.2; s.titleH = 222.2; }, checks: [m(`222.2`)] },
  { name: 'autoTitleY+titleAutoGap', set: s => { s.autoTitleY = true; s.titleAutoGap = 47; }, checks: [], soft: true, note: 'computed offset; verify visually' },
  { name: 'rcBodyX/Y/W/H', set: s => { s.rcBodyX = 226.2; s.rcBodyY = 226.2; s.rcBodyW = 226.2; s.rcBodyH = 226.2; }, checks: [m(`226.2`)] },
  { name: 'rcTitleX/Y/W/H', set: s => { s.rcAutoTitleY = false; s.rcTitleX = 227.2; s.rcTitleY = 227.2; s.rcTitleW = 227.2; s.rcTitleH = 227.2; }, checks: [m(`227.2`)] },
  { name: 'startEndX/Y/W/H', set: s => { s.startEndX = 333.3; s.startEndY = 333.3; s.startEndW = 333.3; s.startEndH = 333.3; }, checks: [m(`333.3`)] },
  { name: 'liveX/Y/W/H',  set: s => { s.liveX = 444.4; s.liveY = 444.4; s.liveW = 444.4; s.liveH = 444.4; }, checks: [m(`444.4`)] },
  { name: 'queueX/Y/W/H', set: s => { s.queueX = 555.5; s.queueY = 555.5; s.queueW = 555.5; s.queueH = 555.5; }, checks: [m(`555.5`)] },

  // ── Body margins (Layout tab) ──
  { name: 'bodyMarginLeft',   set: s => { s.bodyMarginLeft = S.margin; },   checks: [m(`"left":${S.margin}`)] },
  { name: 'bodyMarginTop',    set: s => { s.bodyMarginTop = S.margin; },    checks: [m(`"top":${S.margin}`)] },
  { name: 'bodyMarginRight',  set: s => { s.bodyMarginRight = S.margin; },  checks: [m(`"right":${S.margin}`)] },
  { name: 'bodyMarginBottom', set: s => { s.bodyMarginBottom = S.margin; }, checks: [m(`"bottom":${S.margin}`)] },

  // ── Prop bounds ──
  { name: 'propBodyX/Y/W/H',  set: s => { s.propBodyX = 666.6; s.propBodyY = 666.6; s.propBodyW = 666.6; s.propBodyH = 666.6; }, prop: true, checks: [m(`666.6`)] },
  { name: 'propPointX/Y/W/H', set: s => { s.propPointX = 667.6; s.propPointY = 667.6; s.propPointW = 667.6; s.propPointH = 667.6; }, prop: true, checks: [m(`667.6`)] },
  { name: 'propTitleX/Y/W/H', set: s => { s.propAutoTitleY = false; s.propTitleX = 777.7; s.propTitleY = 777.7; s.propTitleW = 777.7; s.propTitleH = 777.7; }, prop: true, checks: [m(`777.7`)] },

  // ── FontAdv: full sweep on body, title, point, startEnd + prop body + prop title ──
  ...advFull('bodyFontAdv'),
  ...advFull('titleFontAdv'),
  ...advFull('pointFontAdv'),
  ...advFull('rcBodyFontAdv'),
  ...advFull('rcTitleFontAdv'),
  ...advFull('startEndFontAdv'),
  ...advFull('propBodyFontAdv', { prop: true }),
  ...advFull('propPointFontAdv', { prop: true }),
  ...advFull('propTitleFontAdv', { prop: true }),
  // FontAdv: color smoke test for the remaining objects
  { name: 'notesFontAdv.color',    set: s => deep(s, 'notesFontAdv', 'color', S.hex),    checks: [r(colorRtf)] },
  { name: 'boldFontAdv.capitalization(allCaps)',     set: s => deep(s, 'boldFontAdv', 'capitalization', 'allCaps'),     checks: [r(`\\caps `)] },
  { name: 'boldFontAdv.color',                       set: s => deep(s, 'boldFontAdv', 'color', S.hex),                  checks: [r(colorRtf)] },
  { name: 'propBoldFontAdv.capitalization(allCaps)', set: s => deep(s, 'propBoldFontAdv', 'capitalization', 'allCaps'), prop: true, checks: [r(`\\caps `)] },
  { name: 'propBoldFontAdv.color',                   set: s => deep(s, 'propBoldFontAdv', 'color', S.hex),              prop: true, checks: [r(colorRtf)] },
  { name: 'pointStackedFontAdv.color',               set: s => deep(s, 'pointStackedFontAdv', 'color', S.hex),          prop: true, checks: [r(colorRtf)] },
  { name: 'notesBoldFontAdv.capitalization(allCaps)', set: s => deep(s, 'notesBoldFontAdv', 'capitalization', 'allCaps'), checks: [r(`\\caps `)] },
  { name: 'notesBoldFontAdv.color',                   set: s => deep(s, 'notesBoldFontAdv', 'color', S.hex),              checks: [r(colorRtf)] },

  // ── liveFontAdv: color (RTF + meta) + margins ──
  { name: 'liveFontAdv.color',     set: s => deep(s, 'liveFontAdv', 'color', S.hex),     checks: [r(colorRtf), m(colorMeta)] },
  { name: 'liveFontAdv.marginLeft',set: s => deep(s, 'liveFontAdv', 'marginLeft', S.margin), checks: [m(`"left":${S.margin}`)] },
  { name: 'liveFontAdv.marginTop', set: s => deep(s, 'liveFontAdv', 'marginTop', S.margin),  checks: [m(`"top":${S.margin}`)] },

  // ── queueFontAdv: color (RTF only — meta textSolidFill is hardcoded white) + margins ──
  { name: 'queueFontAdv.color',     set: s => deep(s, 'queueFontAdv', 'color', S.hex),     checks: [r(colorRtf)] },
  { name: 'queueFontAdv.marginLeft',set: s => deep(s, 'queueFontAdv', 'marginLeft', S.margin), checks: [m(`"left":${S.margin}`)] },
  { name: 'queueFontAdv.marginTop', set: s => deep(s, 'queueFontAdv', 'marginTop', S.margin),  checks: [m(`"top":${S.margin}`)] },
];

// ── run ───────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0, soft = 0, dead = 0;
const fails = [];
const zombies = [];   // expectDead fields that unexpectedly DID reach output
for (const f of FIELDS) {
  const scheme = {};
  f.set(scheme);
  const needsProp = !!f.prop;
  const { meta, rtf } = haystacks(scheme, { prop: needsProp });
  const results = f.checks.map(c => {
    const hay = c.layer === 'meta' ? meta : rtf;
    return { ...c, found: hay.includes(c.needle) };
  });
  const missing = results.filter(c => !c.found);
  const allFound = f.checks.length > 0 && missing.length === 0;
  const noChecks = f.checks.length === 0;

  let tag;
  if (f.expectDead) {
    // PASS = correctly absent (dead confirmed). Zombie = unexpectedly present.
    if (allFound) { tag = 'ZOMBIE'; zombies.push(f.name); }
    else { tag = 'DEAD'; dead++; }
  } else if (allFound) { tag = 'PASS'; pass++; }
  else if (noChecks) { tag = 'SKIP'; }
  else if (f.soft) { tag = 'SOFT'; soft++; }
  else { tag = 'FAIL'; fail++; fails.push(f.name); }

  const mark = { PASS: '✅', FAIL: '❌', SOFT: '⚠️ ', SKIP: '·  ', DEAD: '🪦', ZOMBIE: '🧟' }[tag];
  const ann = f.expectDead ? `  [dead: ${f.expectDead}]` : (f.note ? `  (${f.note})` : '');
  console.log(`${mark} ${tag}  ${f.name}${ann}`);
  const showNeedles = VERBOSE || (tag === 'FAIL') || (tag === 'ZOMBIE');
  if (showNeedles) {
    for (const c of results) console.log(`        ${c.found ? '·' : '✗'} [${c.layer}] ${c.needle}`);
  }
}

console.log(`\n${pass} pass, ${fail} fail, ${soft} soft-fail, ${dead} dead-confirmed, ${zombies.length} zombie`);
if (fails.length) {
  console.log('\nHARD FAILURES (live UI control, but sentinel never reached output → BUG):');
  for (const n of fails) console.log(`  ❌ ${n}`);
}
if (zombies.length) {
  console.log('\nZOMBIES (marked dead but value DID reach output → reclassify):');
  for (const n of zombies) console.log(`  🧟 ${n}`);
}
if (fails.length || zombies.length) process.exit(1);
