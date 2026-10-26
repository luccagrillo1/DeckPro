// Every control on Styles → Text, for every row, reaches the element that row
// styles — not just "somewhere in the export". For each (row, control, value)
// the deck is built with only that one setting changed and the row's own
// element (or RTF run) is checked for the change.
//
// Box-level controls (overflow, vertical alignment, margins, outline, shadow)
// only exist on rows that own a text box; span rows (Bold, Notes Alt) and the
// slide notes are runs of text, so those rows only get the text-level checks —
// and the Styles editor doesn't show them the box controls (TEXT_ROW_KIND in
// public/app.js; keep the two in step). Point Stacked is a span row too: the
// earlier bullets share the Point box, whose own row sets the box.

const { buildPresentation } = require('./builder.js');
const { buildAllPropCues } = require('./buildProp.js');

let pass = 0, fail = 0;
const fails = [];
function ok(name, cond, detail) {
  if (cond) pass++;
  else { fail++; fails.push(name + (detail !== undefined ? '  ' + JSON.stringify(detail).slice(0, 200) : '')); }
}

const REF = 'John 3:16';
const deck = {
  name: 'Matrix', includeResponseCard: false,
  slides: [
    { type: 'start', label: 'START', text: 'Start text' },
    { type: 'scripture', label: REF, reference: REF, bodies: [[{ text: 'plain words ' }, { text: 'emph', alt: true }]],
      bodyLines: 1, ascent: 43, descent: 11, capAscent: 31, titleAscent: 46, titleDescent: 12 },
    { type: 'point', mode: 'single', label: 'PT', bodyText: 'A point' },
  ],
};
const propSpecs = [
  { type: 'scripture', propName: 'SCR', reference: REF, bodies: [[{ text: 'plain words ' }, { text: 'emph', alt: true }]] },
  { type: 'point-single', propName: 'PT', bodyText: 'A point' },
  { type: 'point-revealing', propName: 'REV', bullets: ['One', 'Two'], activeIdx: 1 },
];

const els = slide => (slide?.baseSlide?.elements || []).map(e => e.element || e);
const cueSlide = (doc, label) => {
  for (const c of doc.cues) for (const a of c.actions) {
    if (a.label?.text === label && a.slide) return a.slide.presentation || a.slide.prop;
    if (a.slide?.prop && c.name === label) return a.slide.prop;
  }
  return null;
};
const propSlide = (doc, name) => {
  const c = doc.cues.find(c => c.name === name);
  return c?.actions.find(a => a.slide)?.slide.prop;
};
const rtfOf = el => Buffer.from(el?.text?.rtfData || el?.rtfData || '', 'base64').toString('latin1');

// Where each row's text ends up.
const ROWS = [
  { adv: 'bodyFontAdv',        kind: 'box',  get: o => els(cueSlide(o.main, REF)).find(e => e.name === 'body') },
  { adv: 'boldFontAdv',        kind: 'span', get: o => els(cueSlide(o.main, REF)).find(e => e.name === 'body') },
  { adv: 'titleFontAdv',       kind: 'box',  get: o => els(cueSlide(o.main, REF)).find(e => e.name === 'title') },
  { adv: 'pointFontAdv',       kind: 'box',  get: o => els(cueSlide(o.main, 'PT')).find(e => e.name === 'body') },
  { adv: 'propBodyFontAdv',    kind: 'box',  get: o => els(propSlide(o.prop, 'SCR')).find(e => e.name === 'body') },
  { adv: 'propBoldFontAdv',    kind: 'span', get: o => els(propSlide(o.prop, 'SCR')).find(e => e.name === 'body') },
  { adv: 'propTitleFontAdv',   kind: 'box',  get: o => els(propSlide(o.prop, 'SCR')).find(e => e.name === 'reference') },
  { adv: 'propPointFontAdv',   kind: 'box',  get: o => els(propSlide(o.prop, 'PT')).find(e => e.name === 'body') },
  { adv: 'pointStackedFontAdv',kind: 'span',  get: o => els(propSlide(o.prop, 'REV')).find(e => e.name === 'body') },
  { adv: 'notesFontAdv',       kind: 'notes',get: o => cueSlide(o.main, REF)?.notes },
  { adv: 'notesBoldFontAdv',   kind: 'span', notes: true, get: o => cueSlide(o.main, 'PT')?.notes },
  { adv: 'startEndFontAdv',    kind: 'box',  get: o => els(cueSlide(o.main, 'START')).find(e => e.name === 'body') },
  { adv: 'liveFontAdv',        kind: 'box',  get: o => els(cueSlide(o.main, REF)).find(e => e.name === 'live') },
  { adv: 'queueFontAdv',       kind: 'box',  get: o => els(cueSlide(o.main, REF)).find(e => e.name === 'queue') },
];

function build(style) {
  const main = buildPresentation({ ...JSON.parse(JSON.stringify(deck)), style });
  const prop = buildAllPropCues(JSON.parse(JSON.stringify(propSpecs)), style);
  return { main, prop };
}
const metaOf = el => JSON.stringify(el || {}).replace(/"rtfData":"[^"]*"/g, '');
const pardOf = rtf => (rtf.match(/\\pard[^\s{}]*/g) || []).join(' ');

const HEX = '#7f1322', RGB = '\\red127\\green19\\blue34';
// [control label, adv patch, check(rtf, meta, el), kinds it applies to]
const TEXT = ['box', 'span', 'notes'], BOX = ['box'], PARA = ['box', 'notes'], OUTLINE = ['box', 'notes'];
const CONTROLS = [
  ['color',            { color: HEX },                  r => r.includes(RGB), TEXT],
  ['bold',             { bold: true },                  r => /\\b[ \\]/.test(r), TEXT],
  ['italic',           { italic: true },                r => /\\i[ \\]/.test(r), TEXT],
  ['underline',        { underline: true },             r => /\\ul[ \\]/.test(r), TEXT],
  ['strikethrough',    { strikethrough: true },         r => r.includes('\\strike'), TEXT],
  ['caps ALL CAPS',    { capitalization: 'allCaps' },   (r, m) => r.includes('\\caps') || m.includes('CAPITALIZATION_ALL_CAPS'), TEXT],
  ['caps Title Case',  { capitalization: 'titleCase' }, (r, m) => m.includes('CAPITALIZATION_TITLE_CASE') || /Plain Words|Start Text|A Point|One/.test(r), TEXT],
  ['caps Start Case',  { capitalization: 'startCase' }, (r, m) => m.includes('CAPITALIZATION_START_CASE') || /Plain Words|Start Text|A Point|One/.test(r), TEXT],
  ['letter spacing',   { charSpacing: 7 },              r => r.includes('\\expndtw140'), TEXT],
  ['line height',      { lineHeight: 1.5 },             r => r.includes('\\sl360'), PARA],
  ['space before',     { paragraphSpacingBefore: 9 },   r => r.includes('\\sb180'), PARA],
  ['space after',      { paragraphSpacingAfter: 11 },   r => r.includes('\\sa220'), PARA],
  ['align left',       { alignment: 'left' },           r => !/\\q[crj]/.test(pardOf(r)), PARA],
  ['align center',     { alignment: 'center' },         r => pardOf(r).includes('\\qc'), PARA],
  ['align right',      { alignment: 'right' },          r => pardOf(r).includes('\\qr'), PARA],
  ['align justify',    { alignment: 'justify' },        r => pardOf(r).includes('\\qj'), PARA],
  ['vertical top',     { verticalAlignment: 'top' },    (r, m, el) => el?.text?.verticalAlignment === 'VERTICAL_ALIGNMENT_TOP' || (el?.text && el.text.verticalAlignment === undefined), BOX],
  ['vertical middle',  { verticalAlignment: 'middle' }, (r, m, el) => el?.text?.verticalAlignment === 'VERTICAL_ALIGNMENT_MIDDLE', BOX],
  ['vertical bottom',  { verticalAlignment: 'bottom' }, (r, m, el) => el?.text?.verticalAlignment === 'VERTICAL_ALIGNMENT_BOTTOM', BOX],
  ['overflow shrink',  { scaleBehavior: 'SCALE_BEHAVIOR_SCALE_FONT_DOWN' }, (r, m, el) => el?.text?.scaleBehavior === 'SCALE_BEHAVIOR_SCALE_FONT_DOWN', BOX],
  ['overflow never',   { scaleBehavior: 'none' },       (r, m, el) => !el?.text?.scaleBehavior, BOX],
  ['margin top',       { marginTop: 97 },               (r, m, el) => el?.text?.margins?.top === 97, BOX],
  ['margin bottom',    { marginBottom: 97 },            (r, m, el) => el?.text?.margins?.bottom === 97, BOX],
  ['margin left',      { marginLeft: 97 },              (r, m, el) => el?.text?.margins?.left === 97, BOX],
  ['margin right',     { marginRight: 97 },             (r, m, el) => el?.text?.margins?.right === 97, BOX],
  ['outline',          { strokeEnabled: true, strokeWidth: 7, strokeColor: HEX }, (r, m) => r.includes('\\strokewidth') && /"width":7|strokewidth-?\d*14|strokewidth-?\d+/.test(m + r) && r.includes(RGB), OUTLINE],
  ['shadow',           { shadowEnabled: true, shadowAngle: 123, shadowOffset: 13, shadowBlur: 17, shadowColor: HEX }, (r, m) => m.includes('"angle":123') && m.includes('"offset":13') && m.includes('"radius":17'), BOX],
  ['font',             null, null, TEXT],
  ['size',             null, null, ['box', 'notes', 'span']],
];

// Font / size live outside the adv object.
const FONT_FIELD = { bodyFontAdv: 'bodyFont', boldFontAdv: 'boldFont', titleFontAdv: 'titleFont', pointFontAdv: 'pointFont',
  propBodyFontAdv: 'propBodyFont', propBoldFontAdv: 'propBoldFont', propTitleFontAdv: 'propTitleFont', propPointFontAdv: 'propPointFont',
  pointStackedFontAdv: 'pointStackedFont', notesFontAdv: 'notesFont', notesBoldFontAdv: 'notesBoldFont',
  startEndFontAdv: 'startEndFont', liveFontAdv: 'liveFont', queueFontAdv: 'queueFont' };
const SIZE_FIELD = { bodyFontAdv: 'bodySize', titleFontAdv: 'titleSize', pointFontAdv: 'pointSize', propBodyFontAdv: 'propBodySize',
  propTitleFontAdv: 'propTitleSize', propPointFontAdv: 'propPointSize', pointStackedFontAdv: 'pointStackedSize',
  notesFontAdv: 'notesSize', startEndFontAdv: 'startEndSize', liveFontAdv: 'liveSize', queueFontAdv: 'queueSize' };

const base = build({});
for (const row of ROWS) {
  const baseEl = row.get(base);
  ok(`${row.adv}: element found`, !!baseEl);
  if (!baseEl) continue;
  const baseRtf = rtfOf(baseEl);
  for (const [label, patch, check, kinds] of CONTROLS) {
    if (!kinds.includes(row.kind)) continue;
    const name = `${row.adv} · ${label}`;
    if (label === 'font') {
      const out = build({ [FONT_FIELD[row.adv]]: 'ZZSentinelFont' });
      ok(name, rtfOf(row.get(out)).includes('ZZSentinelFont'));
      continue;
    }
    if (label === 'size') {
      if (!SIZE_FIELD[row.adv]) continue;
      const out = build({ [SIZE_FIELD[row.adv]]: 137 });
      ok(name, rtfOf(row.get(out)).includes('\\fs274'));
      continue;
    }
    const out = build({ [row.adv]: patch });
    const el = row.get(out);
    const rtf = rtfOf(el);
    // Span rows: the change must land, and must not be the base run's own
    // formatting already (i.e. the export actually differs).
    const changed = rtf !== baseRtf || metaOf(el) !== metaOf(baseEl);
    ok(name, !!el && check(rtf, metaOf(el), el) && (changed || /left|top|shrink/.test(label)), { pard: pardOf(rtf) });
  }
}

// ── Styles → Macros and Stage: each trigger fires on exactly its slides ────
{
  const TRIGGERS = ['start', 'end', 'scripture', 'point', 'blank', 'blankBefore', 'image', 'rcBlank', 'rcContent'];
  const uid = (p, i) => `${p}0000000-0000-0000-0000-0000000000${String(i).padStart(2, '0')}`;
  const spec = {
    name: 'Triggers', includeResponseCard: true, responses: { r1: 'A', r2: '', r3: '', r4: '' }, style: {},
    customMacros:  TRIGGERS.map((t, i) => ({ name: `M_${t}`, uuid: uid(1, i), triggers: [t] })),
    stageDisplays: TRIGGERS.map((t, i) => ({ name: `S_${t}`, uuid: uid(2, i), triggers: [t] })),
    slides: [
      { type: 'start', label: 'START', text: 'START' },
      { type: 'scripture', label: 'SCR', reference: REF, blankBefore: true, bodies: [[{ text: 'x' }]],
        bodyLines: 1, ascent: 43, descent: 11, capAscent: 31, titleAscent: 46, titleDescent: 12 },
      { type: 'point', mode: 'single', label: 'PT', bodyText: 'A point' },
      { type: 'blank', label: 'BL', spans: [] },
      { type: 'image', label: 'IMG' },
      { type: 'end', label: 'END', text: 'End' },
    ],
  };
  const expect = { START: 'start', SCR: 'scripture', PT: 'point', BL: 'blank', IMG: 'image', END: 'end',
    'Response Card Blank': 'rcBlank', 'Response Card': 'rcContent' };
  const doc = buildPresentation(spec);
  const seenBB = { n: 0 };
  for (const c of doc.cues) {
    const lbl = c.actions.find(a => a.label)?.label?.text;
    const want = lbl ? expect[lbl] : 'blankBefore';
    if (!lbl) seenBB.n++;
    const macros = c.actions.flatMap(a => JSON.stringify(a).match(/"M_[a-zA-Z]+"/g) || []).map(s => s.slice(3, -1));
    const stages = [...new Set(c.actions.flatMap(a => JSON.stringify(a).match(/S_[a-zA-Z]+/g) || []).map(s => s.slice(2)))];
    ok(`macro trigger ${want} fires only on its slide`, macros.length === 1 && macros[0] === want, macros);
    ok(`stage layout ${want} fires only on its slide`, stages.length === 1 && stages[0] === want, stages);
  }
  ok('blank-before slide present', seenBB.n === 1);
}

// ── Styles → Motion: transitions and build steps ───────────────────────────
{
  for (const t of ['fade', 'dissolve', 'cut']) {
    const style = { transitionType: t, transitionDuration: 1.3, propTransitionType: t, propTransitionDuration: 0.9 };
    const { main, prop } = build(style);
    const name = { fade: 'Fade', dissolve: 'Dissolve', cut: 'Cut' }[t];
    const slideTr = cueSlide(main, REF)?.transition;
    const propTr = propSlide(prop, 'SCR')?.transition;
    ok(`main transition ${t}`, slideTr?.effect?.name === name && (t === 'cut' || slideTr.duration === 1.3), slideTr);
    ok(`LED transition ${t}`, propTr?.effect?.name === name && (t === 'cut' || propTr.duration === 0.9), propTr);
  }
  const step = (element, dir) => ({ id: 'x', element, dir, start: 'ON_CLICK', delay: 0.5, transition: 'dissolve', duration: 0.7, enabled: true });
  const builds = { content: [step('title', 'in')], point: [step('body', 'out')], startEnd: [step('body', 'in')] };
  const { main } = build({ buildOrders: builds });
  const slotOf = (label, name) => (cueSlide(main, label)?.baseSlide?.elements || []).find(e => (e.element || e).name === name);
  const check = (label, name, dir) => {
    const b = slotOf(label, name)?.[dir === 'in' ? 'buildIn' : 'buildOut'];
    return b && b.start === 'ON_CLICK' && b.delayTime === 0.5 && b.transition?.effect?.name === 'Dissolve' && b.transition.duration === 0.7;
  };
  ok('Scripture build step reaches its element', check(REF, 'title', 'in'));
  ok('Point build step reaches its element', check('PT', 'body', 'out'));
  ok('Start / End build step reaches its element', check('START', 'body', 'in'));
}

// ── Styles → Response Card: each element's own settings reach the LED prop ──
{
  for (const align of ['left', 'center', 'right']) {
    const rcElements = [{ id: 'c1', role: 'custom', name: 'My Element', text: 'Hello card', x: 111, y: 222, w: 1333, h: 144,
      font: 'ZZRcFont', size: 77, color: HEX, align }];
    const doc = buildAllPropCues([{ type: 'response-card', propName: 'RC', responses: { r1: 'A', r2: '', r3: '', r4: '' } }], { rcElements });
    const el = els(propSlide(doc, 'RC')).find(e => e.name === 'My Element');
    const r = rtfOf(el), b = el?.bounds;
    ok(`RC element (${align}) position/size`, b?.origin?.x === 111 && b?.origin?.y === 222 && b?.size?.width === 1333 && b?.size?.height === 144, b);
    ok(`RC element (${align}) text/font/size/colour`, r.includes('Hello card') && r.includes('ZZRcFont') && r.includes('\\fs154') && r.includes(RGB));
    ok(`RC element (${align}) alignment`, align === 'left' ? !/\\q[crj]/.test(pardOf(r)) : pardOf(r).includes(align === 'center' ? '\\qc' : '\\qr'), pardOf(r));
  }
}

console.log(fails.map(f => '❌ ' + f).join('\n'));
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
