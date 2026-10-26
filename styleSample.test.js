// Style sample round trip (styleSample.js): a sample deck exported by DeckPro,
// then restyled "in Pro7" (simulated by editing the decoded snapshot the way
// Pro7 saves it), is read back as the right style changes — and an untouched
// sample, or a plain Pro7 re-save, reads as no changes at all.

const { encodeToBufferWithMerge, propBank } = require('./encode.js');
const { buildAllPropCues, encodePropDocument, decodePropDocument } = require('./buildProp.js');
const { observeStyleChanges, rtfChars, textFormat, SAMPLE_LABELS, SAMPLE_EMPHASIS_WORD } = require('./styleSample.js');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { console.log('✅', name); pass++; }
  else { console.log('❌', name, detail !== undefined ? JSON.stringify(detail) : ''); fail++; }
}

const bodySpans = [
  { text: '16 ', verseNum: true, super: true },
  { text: 'For God so ' }, { text: SAMPLE_EMPHASIS_WORD, alt: true }, { text: ' the world that he gave his only Son.' },
];
const spec = {
  name: 'DeckPro Style Sample',
  includeResponseCard: true,
  responses: { r1: 'I want to follow Jesus', r2: '', r3: '', r4: '' },
  propCollection: 3,
  style: { boldFont: 'Montserrat-Black', propBoldFont: 'Montserrat-Black' },
  slides: [
    { type: 'start', label: SAMPLE_LABELS.start, text: 'Start of Notes' },
    { type: 'scripture', label: SAMPLE_LABELS.scripture, reference: 'John 3:16', propName: 'Sample Scripture', bodies: [bodySpans] },
    { type: 'point', mode: 'single', label: SAMPLE_LABELS.point, bodyText: 'Love goes first', propName: 'Sample Point' },
    { type: 'blank', label: 'Sample Blank', spans: [] },
  ],
};

const clone = o => JSON.parse(JSON.stringify(o));
const cueBy = (doc, label) => doc.cues.find(c => c.actions.some(a => a.label?.text === label));
const elOf = (cue, name) => {
  const a = cue.actions.find(x => x.slide);
  const bs = a.slide.presentation?.baseSlide || a.slide.prop?.baseSlide;
  return bs.elements.map(e => e.element || e).find(e => e.name === name);
};
const rtfOf = el => Buffer.from(el.text.rtfData, 'base64').toString('latin1');
const setRtf = (el, s) => { el.text.rtfData = Buffer.from(s, 'latin1').toString('base64'); };
const find = (obs, role, prop) => obs.find(o => o.role === role && o.prop === prop);

(async () => {
  const { snapshot: pres } = await encodeToBufferWithMerge(clone(spec), {});
  const bank = propBank(3);
  const propSpecs = [
    { type: 'scripture', propName: 'Sample Scripture', slotName: bank.slots[0].slot, slotUuid: bank.slots[0].uuid, reference: 'John 3:16', bodies: [bodySpans] },
    { type: 'point-single', propName: 'Sample Point', slotName: bank.slots[1].slot, slotUuid: bank.slots[1].uuid, bodyText: 'Love goes first' },
    { type: 'response-card', propName: 'Response Card', slotName: bank.slots[2].slot, slotUuid: bank.slots[2].uuid,
      responses: { r1: 'Response 1 — restyle this one', r2: 'Response 2 — locked', r3: 'Response 3 — locked', r4: 'Response 4 — locked' } },
  ];
  const propDoc = await decodePropDocument(await encodePropDocument(buildAllPropCues(propSpecs, spec.style, bank.name)));
  const byUuid = Object.fromEntries(propDoc.cues.map(c => [c.uuid.string, c]));
  const base = { pres, props: { scripture: byUuid[bank.slots[0].uuid], point: byUuid[bank.slots[1].uuid], rc: byUuid[bank.slots[2].uuid] } };

  // ── RTF reader ───────────────────────────────────────────────────────────
  const body = elOf(cueBy(pres, SAMPLE_LABELS.scripture), 'body');
  const fmt = textFormat(body.text.rtfData, SAMPLE_EMPHASIS_WORD);
  ok('reads the body font and size DeckPro wrote', fmt.base.font === 'Montserrat-Medium' && fmt.base.size > 10, fmt.base);
  ok('reads the emphasised word in the emphasis font', fmt.emphasis?.font === 'Montserrat-Black' && fmt.base.font === 'Montserrat-Medium', fmt);
  ok('verse number is not read as body text', !rtfChars(body.text.rtfData).some(c => c.superscript && c.ch === 'F'));

  // Pro7's own re-encoding of the same text (spaces in \f1, \uc0舗) reads the same.
  const pro7Rtf = '{\\rtf1\\ansi\\ansicpg1252\\cocoartf2865\n{\\fonttbl\\f0\\fswiss\\fcharset0 Montserrat-Medium;\\f1\\fnil\\fcharset0 NotoSansNKo-Regular;}\n{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;\\red0\\green0\\blue0;}\n\\pard\\pardeftab1680\\pardirnatural\\qc\\partightenfactor0\n\\f0\\fs88 \\cf2 Surely\n\\f1  \n\\f0 your goodness\\uc0\\u8217 s mercy}';
  const p7 = textFormat(Buffer.from(pro7Rtf, 'latin1').toString('base64'));
  ok('Pro7-encoded RTF: font of the words, not of the spaces', p7.base.font === 'Montserrat-Medium' && p7.base.size === 44 && p7.base.align === 'center', p7.base);

  // ── No edits ─────────────────────────────────────────────────────────────
  const none = observeStyleChanges(base, { pres: clone(pres), props: clone(base.props) });
  ok('an untouched sample reads as no changes', none.observations.length === 0 && none.missing.length === 0, none);

  // Pro7 re-save: cues reversed, cueGroups kept.
  const resaved = clone(pres); resaved.cues.reverse();
  ok('cue order after a Pro7 re-save does not matter', observeStyleChanges(base, { pres: resaved, props: base.props }).observations.length === 0);

  // ── Restyled ─────────────────────────────────────────────────────────────
  const cur = { pres: clone(pres), props: clone(base.props) };
  const sc = cueBy(cur.pres, SAMPLE_LABELS.scripture);
  // Body: bigger, moved up 40, right-aligned.
  const b = elOf(sc, 'body');
  b.bounds.origin.y -= 40;
  setRtf(b, rtfOf(b).replace(/\\fs(\d+)/g, (m, n) => `\\fs${Number(n) + 8}`).replace(/\\pard\\pardeftab(\d+)/, '\\pard\\pardeftab$1\\qr'));
  // Title: white → gold text (cf2 is the text colour).
  const t = elOf(sc, 'title');
  setRtf(t, rtfOf(t).replace('\\red255\\green255\\blue255;\\red0', '\\red246\\green208\\blue70;\\red0'));
  // LED body: different font.
  const pb = elOf(cur.props.scripture, 'body');
  setRtf(pb, rtfOf(pb).replace(/Montserrat-SemiBold/g, 'Impact'));
  // Point: shadow on.
  const pe = elOf(cueBy(cur.pres, SAMPLE_LABELS.point), 'body');
  pe.text.shadow = { ...(pe.text.shadow || {}), enable: true, color: { red: 1, green: 0, blue: 0, alpha: 1 }, offset: 6, radius: 4, angle: 315, opacity: 0.5 };

  // Scripture slide transition → Dissolve 1.2s.
  const st = sc.actions.find(a => a.slide).slide.presentation.transition;
  st.effect.name = 'Dissolve'; st.duration = 1.2;

  const { observations: obs, missing } = observeStyleChanges(base, cur);
  console.log('   observations:', obs.map(o => `${o.role}.${o.prop}: ${JSON.stringify(o.oldValue)} → ${JSON.stringify(o.newValue)}`).join('; '));
  ok('body move read', find(obs, 'body', 'y') && find(obs, 'body', 'y').newValue === find(obs, 'body', 'y').oldValue - 40);
  ok('body size read (+4pt)', find(obs, 'body', 'size') && find(obs, 'body', 'size').newValue - find(obs, 'body', 'size').oldValue === 4);
  ok('body alignment read', find(obs, 'body', 'align')?.newValue === 'right');
  ok('a body-wide size change is not also reported as an emphasis change', !find(obs, 'bold', 'size'));
  ok('title colour read', find(obs, 'title', 'color')?.newValue === '#f6d046', find(obs, 'title', 'color'));
  ok('slide transition read', find(obs, 'transition', 'type')?.newValue === 'dissolve' && find(obs, 'transition', 'duration')?.newValue === 1.2);
  ok('LED body font read', find(obs, 'propBody', 'font')?.newValue === 'Impact');
  ok('point shadow read whole', find(obs, 'point', 'shadow')?.newValue.color === '#ff0000' && find(obs, 'point', 'shadow')?.newValue.offset === 6 && find(obs, 'point', 'shadow')?.newValue.enabled === true);
  ok('nothing reported for untouched elements', !obs.some(o => ['startEnd', 'propPoint', 'live', 'queue', 'propTitle'].includes(o.role)), obs.filter(o => ['startEnd', 'propPoint', 'live', 'queue', 'propTitle'].includes(o.role)));
  ok('nothing missing', missing.length === 0, missing);

  // Deleted slide in Pro7 → reported missing, rest still read.
  const gone = { pres: clone(cur.pres), props: cur.props };
  gone.pres.cues = gone.pres.cues.filter(c => !c.actions.some(a => a.label?.text === SAMPLE_LABELS.point));
  const g = observeStyleChanges(base, gone);
  ok('a deleted sample slide is reported missing', g.missing.includes('point') && find(g.observations, 'body', 'y'), g.missing);

  // The sample never fires macros or stage layouts, even when the style has them.
  const withMacro = { ...clone(spec), gradientMacro: { name: 'Gradient', uuid: 'DF162F4C-DA5D-4DE2-8379-3F369BC4BA07' } };
  const macros = d => d.cues.flatMap(c => c.actions).filter(a => /MACRO|STAGE_LAYOUT/.test(a.type)).length;
  const normal = (await encodeToBufferWithMerge(clone(withMacro), {})).snapshot;
  const sample = (await encodeToBufferWithMerge({ ...clone(withMacro), styleSample: true }, {})).snapshot;
  ok('style sample has no macro or stage-layout triggers', macros(normal) > 0 && macros(sample) === 0, [macros(normal), macros(sample)]);
  const rcLabels = d => d.cues.map(c => c.actions.find(a => a.slide)?.label?.text).filter(l => /Response Card/.test(l || ''));
  ok('style sample has no Response Card Blank', rcLabels(sample).join() === 'Response Card' && rcLabels(normal).includes('Response Card Blank'), [rcLabels(normal), rcLabels(sample)]);

  // ── Response Card prop: Response 1 + title read, Responses 2–4 ignored ──
  const rcCur = { pres: clone(pres), props: clone(base.props) };
  const r1el = elOf(rcCur.props.rc, 'Response 1');
  setRtf(r1el, rtfOf(r1el).replace(/Montserrat-SemiBold/g, 'Impact'));
  r1el.bounds.origin.y += 30;
  const r2el = elOf(rcCur.props.rc, 'Response 2');
  setRtf(r2el, rtfOf(r2el).replace(/Montserrat-SemiBold/g, 'Georgia'));
  const rcObs = observeStyleChanges(base, rcCur);
  ok('Response 1 font read', find(rcObs.observations, 'rcResponse', 'font')?.newValue === 'Impact', rcObs.observations);
  ok('Response 1 move read', find(rcObs.observations, 'rcResponse', 'y')?.newValue - find(rcObs.observations, 'rcResponse', 'y')?.oldValue === 30);
  ok('Responses 2–4 changes are ignored', !rcObs.observations.some(o => o.newValue === 'Georgia'), rcObs.observations);
  ok('renamed Response 1 found by its recorded name', (() => {
    const b2 = { ...base, props: clone(base.props), rcNames: { rcResponse: 'Answer A' } };
    elOf(b2.props.rc, 'Response 1').name = 'Answer A';
    const c2 = { pres: clone(pres), props: clone(b2.props) };
    setRtf(elOf(c2.props.rc, 'Answer A'), rtfOf(elOf(c2.props.rc, 'Answer A')).replace(/Montserrat-SemiBold/g, 'Impact'));
    return find(observeStyleChanges(b2, c2).observations, 'rcResponse', 'font')?.newValue === 'Impact';
  })());

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
