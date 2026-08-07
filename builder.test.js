// Structural regression tests for builder.js (buildPresentation).
// Asserts the cue/action shape of every slide type so export-pipeline
// regressions are caught before they reach a real deck.

const { buildPresentation } = require('./builder.js');

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { console.log('✅', name); pass++; }
  else { console.log('❌', name); fail++; }
}

// ---- helpers to read the built structure ----
const cuesOf = spec => buildPresentation(spec, {}).cues || [];
const slideAction = c => (c.actions || []).find(a => a.type === 'ACTION_TYPE_PRESENTATION_SLIDE');
const labelOf = c => { const a = slideAction(c); return a && a.label ? a.label.text : (c.name || ''); };
const typesOf = c => (c.actions || []).map(a => a.type.replace('ACTION_TYPE_', ''));
const has = (c, t) => typesOf(c).includes(t);
const macrosOf = c => (c.actions || []).filter(a => a.type === 'ACTION_TYPE_MACRO').map(a => a.macro.identification.parameterName);
const propsOf = c => (c.actions || []).filter(a => a.type === 'ACTION_TYPE_PROP').map(a => a.prop.identification.parameterName);
const bodyRtf = c => {
  const a = slideAction(c);
  const els = a.slide.presentation.baseSlide.elements.map(s => s.element);
  return els.map(e => { try { return Buffer.from(e.text.rtfData, 'base64').toString('utf8'); } catch { return ''; } });
};

// ---- 1. Every slide type produces a cue (no silent drops) ----
(() => {
  const cues = cuesOf({ name: 'T', slides: [
    { type: 'start' },
    { type: 'scripture', label: 'Sirach 38:4', reference: 'Sirach 38:4', bodies: [[{ text: 'med.', bold: false }]], propName: 'Sirach 38:4' },
    { type: 'point', mode: 'single', label: 'P', bodyText: 'Go First', propName: 'Go First' },
    { type: 'point', mode: 'revealing', label: 'R', title: 'Three', bullets: ['A', 'B', 'C'], propBaseName: 'Three' },
    { type: 'image', label: 'Img' },
    { type: 'blank', label: 'Blank' },
    { type: 'custom', label: 'CustomSlide' },
    { type: 'end' },
  ] });
  const labels = cues.map(labelOf);
  ok('start cue present', labels.includes('START'));
  ok('scripture cue present', labels.includes('Sirach 38:4'));
  ok('point single cue present', labels.includes('P'));
  ok('point revealing expands to 3 cues', labels.filter(l => l.startsWith('R')).length === 3);
  ok('image cue present', labels.includes('Img'));
  ok('blank cue present', labels.includes('Blank'));
  ok('custom cue NOT dropped (exported as blank)', labels.includes('CustomSlide'));
  ok('end cue present', labels.includes('End of Notes'));
})();

// ---- 2. Action shapes per type ----
(() => {
  const cues = cuesOf({ name: 'T', slides: [
    { type: 'start' },
    { type: 'scripture', label: 'X', reference: 'X', bodies: [[{ text: 'hi', bold: false }]], propName: 'X' },
    { type: 'point', mode: 'single', label: 'Pt', bodyText: 'Pt', propName: 'Pt' },
    { type: 'image', label: 'Im' },
    { type: 'end' },
  ] });
  const by = lbl => cues.find(c => labelOf(c) === lbl);
  ok('start has SLIDE + CLEAR', has(by('START'), 'PRESENTATION_SLIDE') && has(by('START'), 'CLEAR'));
  ok('scripture has SLIDE + PROP', has(by('X'), 'PRESENTATION_SLIDE') && has(by('X'), 'PROP'));
  ok('scripture prop name matches', propsOf(by('X')).includes('X'));
  ok('point has SLIDE + PROP', has(by('Pt'), 'PRESENTATION_SLIDE') && has(by('Pt'), 'PROP'));
  ok('image has SLIDE + PROP (placeholder, not Clear)', has(by('Im'), 'PRESENTATION_SLIDE') && has(by('Im'), 'PROP') && !has(by('Im'), 'CLEAR'));
  ok('end has SLIDE + CLEAR', has(by('End of Notes'), 'PRESENTATION_SLIDE') && has(by('End of Notes'), 'CLEAR'));
})();

// ---- 3. Blank-before injection ----
(() => {
  const cues = cuesOf({ name: 'T', slides: [
    { type: 'scripture', label: 'V', reference: 'V', bodies: [[{ text: 'verse', bold: false }]], propName: 'V', blankBefore: true, blankSpans: [] },
  ] });
  ok('blankBefore injects an extra cue before scripture', cues.length === 2 && labelOf(cues[1]) === 'V');

  // image blankBefore (regression: builder used to ignore it)
  const imgNoBb = cuesOf({ name: 'T', slides: [{ type: 'image', label: 'I' }] });
  const imgBb = cuesOf({ name: 'T', slides: [{ type: 'image', label: 'I', blankBefore: true, blankSpans: [] }] });
  ok('image blankBefore injects an extra cue', imgNoBb.length === 1 && imgBb.length === 2 && labelOf(imgBb[1]) === 'I');
})();

// ---- 4. Response Card package ----
(() => {
  const cues = cuesOf({ name: 'T', includeResponseCard: true, slides: [{ type: 'start' }, { type: 'end' }] });
  const labels = cues.map(labelOf);
  ok('RC adds Response 1/2/3', labels.includes('Response 1') && labels.includes('Response 2') && labels.includes('Response 3'));
  ok('RC inserted before END', labels.indexOf('Response 1') < labels.indexOf('End of Notes'));
})();

// ---- 5. Macro injection: scheme trigger + per-slide override, no dupes ----
(() => {
  const schemeMac = { id: 'm', name: 'NO LOGO', uuid: 'U-NL', color: '#fff', triggers: ['scripture'] };
  const cues = cuesOf({ name: 'T', customMacros: [schemeMac], slides: [
    { type: 'scripture', label: 'A', reference: 'A', bodies: [[{ text: 'a', bold: false }]], propName: 'A',
      macroOverride: { uuid: 'U-OV', name: 'OVERRIDE', color: '#0f0' } },
    { type: 'point', mode: 'single', label: 'B', bodyText: 'b', propName: 'B' },
  ] });
  const a = cues.find(c => labelOf(c) === 'A');
  const b = cues.find(c => labelOf(c) === 'B');
  ok('scheme-trigger macro fires on scripture', macrosOf(a).includes('NO LOGO'));
  ok('per-slide override macro fires', macrosOf(a).includes('OVERRIDE'));
  ok('non-triggered slide gets no scheme macro', !macrosOf(b).includes('NO LOGO'));
})();

// ---- 6. No macros fire when none configured ----
(() => {
  const cues = cuesOf({ name: 'T', slides: [
    { type: 'scripture', label: 'A', reference: 'A', bodies: [[{ text: 'a', bold: false }]], propName: 'A' },
  ] });
  ok('no macros fire by default', macrosOf(cues[0]).length === 0);
})();

// ---- 7. Transition override applied; default otherwise ----
(() => {
  const cues = cuesOf({ name: 'T', slides: [
    { type: 'scripture', label: 'A', reference: 'A', bodies: [[{ text: 'a', bold: false }]], propName: 'A', transition: { type: 'dissolve', duration: 1.2 } },
    { type: 'scripture', label: 'B', reference: 'B', bodies: [[{ text: 'b', bold: false }]], propName: 'B' },
  ] });
  const tDur = c => slideAction(c).slide.presentation.transition.duration;
  ok('transition override duration applied (1.2)', JSON.stringify(tDur(cues[0])).includes('1.2'));
  ok('default transition duration otherwise (0.6)', JSON.stringify(tDur(cues[1])).includes('0.6') || JSON.stringify(tDur(cues[1])) !== JSON.stringify(tDur(cues[0])));
})();

// ---- 8. Stage layout override reaches the cue ----
(() => {
  const cues = cuesOf({ name: 'T',
    stageScreen: { screenName: 'S', screenUuid: 'SU', messageLayoutName: 'Msg', messageLayoutUuid: 'ML' },
    slides: [{ type: 'scripture', label: 'A', reference: 'A', bodies: [[{ text: 'a', bold: false }]], propName: 'A',
      stageLayout: { layoutName: 'Msg', layoutUuid: 'ML' } }] });
  ok('stage-layout action injected', has(cues[0], 'STAGE_LAYOUT'));
})();

// ---- 9. Verse-number spans render superscript / inline in body RTF ----
(() => {
  const superCue = cuesOf({ name: 'T', slides: [
    { type: 'scripture', label: 'A', reference: 'A', propName: 'A',
      bodies: [[{ text: '18', verseNum: true, super: true, bold: false }, { text: ' ', bold: false }, { text: 'be filled.', bold: false }]] },
  ] })[0];
  ok('superscript verse number emits \\super', bodyRtf(superCue).some(r => r.includes('\\super') && r.includes('be filled')));

  const inlineCue = cuesOf({ name: 'T', slides: [
    { type: 'scripture', label: 'A', reference: 'A', propName: 'A',
      bodies: [[{ text: '18', verseNum: true, super: false, bold: false }, { text: ' ', bold: false }, { text: 'be filled.', bold: false }]] },
  ] })[0];
  ok('inline verse number emits no \\super', bodyRtf(inlineCue).some(r => r.includes('be filled') && !r.includes('\\super')));
})();

// ---- 10. Multi-body scripture split into multiple cues ----
(() => {
  const cues = cuesOf({ name: 'T', slides: [
    { type: 'scripture', label: 'M', reference: 'M', propName: 'M',
      bodies: [[{ text: 'part one', bold: false }], [{ text: 'part two', bold: false }]] },
  ] });
  ok('two bodies → two scripture cues', cues.filter(c => labelOf(c).startsWith('M')).length === 2);
})();

// ---- 11. Queue margins flow through from scheme ----
(() => {
  // Helper: find the queue element inside a cue's slide action
  const queueEl = c => {
    const a = slideAction(c);
    const els = (a?.slide?.presentation?.baseSlide?.elements || []).map(s => s.element);
    return els.find(e => e.name === 'queue');
  };

  // Default scheme: margins should fall back to {left:10, top:10}
  const defaultCues = cuesOf({ name: 'T', slides: [
    { type: 'scripture', label: 'A', reference: 'A', bodies: [[{ text: 'hi', bold: false }]], propName: 'A' },
  ] });
  const defEl = queueEl(defaultCues[0]);
  ok('queue default margin left=10', defEl?.text?.margins?.left === 10);
  ok('queue default margin top=10',  defEl?.text?.margins?.top  === 10);

  // Custom scheme: margins should come from queueFontAdv
  const customCues = cuesOf({ name: 'T', style: { queueFontAdv: { marginLeft: 30, marginTop: 20 } }, slides: [
    { type: 'scripture', label: 'B', reference: 'B', bodies: [[{ text: 'hi', bold: false }]], propName: 'B' },
  ] });
  const cusEl = queueEl(customCues[0]);
  ok('queue custom marginL=30 applied', cusEl?.text?.margins?.left === 30);
  ok('queue custom marginT=20 applied', cusEl?.text?.margins?.top  === 20);
})();

// ---- 12. Live element present on scripture/point cues ----
(() => {
  const liveEl = c => {
    const a = slideAction(c);
    const els = (a?.slide?.presentation?.baseSlide?.elements || []).map(s => s.element);
    return els.find(e => e.name === 'live');
  };
  const cues = cuesOf({ name: 'T', slides: [
    { type: 'scripture', label: 'A', reference: 'A', bodies: [[{ text: 'hi', bold: false }]], propName: 'A' },
    { type: 'point', mode: 'single', label: 'P', bodyText: 'P', propName: 'P' },
    { type: 'blank', label: 'Bl' },
  ] });
  ok('live element present on scripture', !!liveEl(cues[0]));
  ok('live element present on point',     !!liveEl(cues[1]));
  ok('live element absent on blank',      !liveEl(cues[2]));
})();

// ---- 13. Queue mode: 'ref'/'refPhrase' show only the next slide; 'list' shows all upcoming ----
(() => {
  const queueRtf = c => {
    const a = slideAction(c);
    const els = (a?.slide?.presentation?.baseSlide?.elements || []).map(s => s.element);
    const el = els.find(e => e.name === 'queue');
    try { return Buffer.from(el.text.rtfData, 'base64').toString('utf8'); } catch { return ''; }
  };
  const slides = [
    { type: 'scripture', label: 'John 3:16', reference: 'John 3:16', bodies: [[{ text: 'a' }]], propName: 'A' },
    { type: 'scripture', label: 'Romans 8:28', reference: 'Romans 8:28', bodies: [[{ text: 'b' }]], propName: 'B' },
    { type: 'scripture', label: 'Psalm 23:1', reference: 'Psalm 23:1', bodies: [[{ text: 'c' }]], propName: 'C' },
  ];
  const refCues  = cuesOf({ name: 'T', queueMode: 'ref',  slides });
  const listCues = cuesOf({ name: 'T', queueMode: 'list', slides });
  const refRtf  = queueRtf(refCues[0]);
  const listRtf = queueRtf(listCues[0]);
  ok('queueMode ref shows next slide only',  refRtf.includes('Romans 8:28') && !refRtf.includes('Psalm 23:1'));
  ok('queueMode list shows all upcoming',    listRtf.includes('Romans 8:28') && listRtf.includes('Psalm 23:1'));
})();

// ---- 14. Blank-before's queue skips its own content slide (already fed via its notes) ----
(() => {
  const queueRtf = c => {
    const a = slideAction(c);
    const els = (a?.slide?.presentation?.baseSlide?.elements || []).map(s => s.element);
    const el = els.find(e => e.name === 'queue');
    try { return Buffer.from(el.text.rtfData, 'base64').toString('utf8'); } catch { return ''; }
  };
  const slides = [
    { type: 'scripture', label: 'Scripture 1', reference: 'Scripture 1', bodies: [[{ text: 'a' }]], propName: 'A', blankBefore: true },
    { type: 'scripture', label: 'Scripture 2', reference: 'Scripture 2', bodies: [[{ text: 'b' }]], propName: 'B', blankBefore: true },
    { type: 'scripture', label: 'Scripture 3', reference: 'Scripture 3', bodies: [[{ text: 'c' }]], propName: 'C', blankBefore: true },
  ];
  const refCues  = cuesOf({ name: 'T', queueMode: 'ref',  slides });
  const listCues = cuesOf({ name: 'T', queueMode: 'list', slides });
  // cue[0] = Blank-before-1, cue[1] = Scripture 1, cue[2] = Blank-before-2, ...
  const blank1RefRtf  = queueRtf(refCues[0]);
  const scr1RefRtf    = queueRtf(refCues[1]);
  const blank1ListRtf = queueRtf(listCues[0]);
  ok('blank-before ref queue skips its own content slide, shows the one after',
    blank1RefRtf.includes('Scripture 2') && !blank1RefRtf.includes('Scripture 1'));
  ok('the content slide\'s own ref queue is unaffected (shows the normal next slide)',
    scr1RefRtf.includes('Scripture 2') && !scr1RefRtf.includes('Scripture 3'));
  ok('blank-before list queue is NOT skipped — full remaining list, unfiltered',
    blank1ListRtf.includes('Scripture 1') && blank1ListRtf.includes('Scripture 2') && blank1ListRtf.includes('Scripture 3'));
})();

// ---- 15. refPhrase queue collapses to ref-only when the phrase is redundant with the title ----
(() => {
  const queueRtf = c => {
    const a = slideAction(c);
    const els = (a?.slide?.presentation?.baseSlide?.elements || []).map(s => s.element);
    const el = els.find(e => e.name === 'queue');
    try { return Buffer.from(el.text.rtfData, 'base64').toString('utf8'); } catch { return ''; }
  };
  // cue[0]'s queue describes cue[1] (the next slide) in refPhrase mode.
  const redundantCues = cuesOf({ name: 'T', queueMode: 'refPhrase', slides: [
    { type: 'point', mode: 'single', label: 'First', bodyText: 'filler', propName: 'P0' },
    { type: 'point', mode: 'single', label: 'Trust the process even when hard', bodyText: 'Trust the process even when hard', propName: 'P1' },
  ] });
  const distinctCues = cuesOf({ name: 'T', queueMode: 'refPhrase', slides: [
    { type: 'point', mode: 'single', label: 'First', bodyText: 'filler', propName: 'P0' },
    { type: 'point', mode: 'single', label: 'Be Filled', bodyText: 'You must surrender daily to keep walking in the Spirit', propName: 'P1' },
  ] });
  const scriptureCues = cuesOf({ name: 'T', queueMode: 'refPhrase', slides: [
    { type: 'point', mode: 'single', label: 'First', bodyText: 'filler', propName: 'P0' },
    { type: 'scripture', label: 'John 3:16', reference: 'John 3:16', bodies: [[{ text: 'For God so loved the world.' }]] },
  ] });
  ok('refPhrase drops the phrase when title == body (no em-dash repeat)',
    !queueRtf(redundantCues[0]).includes('\\\'97')); // '\'97' is the RTF em-dash separator
  ok('refPhrase keeps both ref and phrase when they genuinely differ',
    queueRtf(distinctCues[0]).includes('\\\'97') && queueRtf(distinctCues[0]).includes('Be Filled'));
  ok('refPhrase keeps both for scripture (reference never looks redundant with verse text)',
    queueRtf(scriptureCues[0]).includes('\\\'97') && queueRtf(scriptureCues[0]).includes('John 3:16'));
})();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
