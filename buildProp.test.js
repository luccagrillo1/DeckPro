// Structural regression tests for buildProp.js (buildAllPropCues).
// Verifies element shape, names, scaleBehavior defaults, and style inheritance
// so prop-layer regressions are caught before they reach a real deck.

const { buildAllPropCues } = require('./buildProp.js');

let pass = 0, fail = 0;
function ok(name, cond) {
  if (cond) { console.log('✅', name); pass++; }
  else { console.log('❌', name); fail++; }
}

// ── helpers ──────────────────────────────────────────────────────────────────
function cuesOf(specs, style = {}) {
  return buildAllPropCues(specs, style).cues;
}
function slideOf(cue) {
  const a = (cue.actions || []).find(a => a.type === 'ACTION_TYPE_PRESENTATION_SLIDE');
  return a?.slide?.prop?.baseSlide;
}
function elementsOf(cue) {
  return (slideOf(cue)?.elements || []).map(s => s.element);
}
function elByName(cue, name) {
  return elementsOf(cue).find(e => e.name === name);
}
function scaleBehaviorOf(el) {
  return el?.text?.scaleBehavior;
}
function rtfOf(el) {
  try { return Buffer.from(el?.text?.rtfData || '', 'base64').toString('utf8'); }
  catch { return ''; }
}

// ── 1. Scripture prop ─────────────────────────────────────────────────────────
(() => {
  const cues = cuesOf([{
    type: 'scripture',
    propName: 'John 3:16',
    reference: 'John 3:16',
    bodies: [[{ text: 'For God so loved the world.', bold: false }]],
  }]);
  ok('scripture: cue name matches propName', cues[0].name === 'John 3:16');
  const body = elByName(cues[0], 'body');
  const ref  = elByName(cues[0], 'reference');
  ok('scripture: body element present', !!body);
  ok('scripture: reference element present', !!ref);
  ok('scripture: body scaleBehavior=SCALE_FONT_DOWN', scaleBehaviorOf(body) === 'SCALE_BEHAVIOR_SCALE_FONT_DOWN');
  ok('scripture: reference scaleBehavior=SCALE_FONT_DOWN', scaleBehaviorOf(ref) === 'SCALE_BEHAVIOR_SCALE_FONT_DOWN');
  ok('scripture: body RTF contains verse text', rtfOf(body).includes('For God so loved'));
  ok('scripture: reference RTF contains reference text', rtfOf(ref).includes('John 3:16'));
})();

// ── 2. Point-single prop ──────────────────────────────────────────────────────
(() => {
  const cues = cuesOf([{
    type: 'point-single',
    propName: 'Create Opportunities',
    bodyText: 'Create Opportunities',
  }]);
  ok('point-single: cue name matches propName', cues[0].name === 'Create Opportunities');
  const body = elByName(cues[0], 'body');
  ok('point-single: body element present', !!body);
  ok('point-single: body scaleBehavior=SCALE_FONT_DOWN', scaleBehaviorOf(body) === 'SCALE_BEHAVIOR_SCALE_FONT_DOWN');
  ok('point-single: body RTF contains point text', rtfOf(body).includes('Create Opportunities'));
})();

// ── 2b. Point-split prop — Display 2's own independent text and box ──────────
(() => {
  const cues = cuesOf([{
    type: 'point-single',
    mode: 'split',
    propName: 'Main Line',
    bodyText: 'Main Line',
    propBodyText: 'LED Wall Only Text',
    propBodyX: 111,
    propBodyW: 222,
    bodyX: 999,   // Display 1's own box — must NOT leak into Display 2
    bodyW: 888,
  }]);
  const body = elByName(cues[0], 'body');
  ok('point-split: body RTF contains propBodyText, not bodyText', rtfOf(body).includes('LED Wall Only Text') && !rtfOf(body).includes('Main Line'));
  ok('point-split: box uses propBodyX/propBodyW, not Display 1\'s bodyX/bodyW', body.bounds.origin.x === 111 && body.bounds.size.width === 222);
})();

// ── 2c. Point-single (mirrored, not split) still uses bodyText for the box ───
(() => {
  const cues = cuesOf([{
    type: 'point-single',
    propName: 'Mirrored',
    bodyText: 'Mirrored',
    propBodyX: 111,
    propBodyW: 222,
    bodyX: 999,   // Display 1's own box — must NOT be used for Display 2 either
    bodyW: 888,
  }]);
  const body = elByName(cues[0], 'body');
  ok('point-single (no split): still mirrors bodyText when propBodyText is absent', rtfOf(body).includes('Mirrored'));
  ok('point-single (no split): still uses its own propBodyX/propBodyW, not Display 1\'s bodyX/bodyW', body.bounds.origin.x === 111 && body.bounds.size.width === 222);
})();

// ── 3. Point-revealing prop ───────────────────────────────────────────────────
(() => {
  const bullets = ['First bullet', 'Second bullet', 'Third bullet'];

  // activeIdx=0: only first bullet visible
  const cues0 = cuesOf([{ type: 'point-revealing', propName: 'Rev', bullets, activeIdx: 0 }]);
  const rtf0  = rtfOf(elByName(cues0[0], 'body'));
  ok('revealing: only first bullet when activeIdx=0', rtf0.includes('First bullet') && !rtf0.includes('Second bullet'));

  // activeIdx=1: first two visible, second highlighted
  const cues1 = cuesOf([{ type: 'point-revealing', propName: 'Rev', bullets, activeIdx: 1 }]);
  const rtf1  = rtfOf(elByName(cues1[0], 'body'));
  ok('revealing: two bullets when activeIdx=1', rtf1.includes('First bullet') && rtf1.includes('Second bullet'));

  // title shown when provided
  const cuesT = cuesOf([{ type: 'point-revealing', propName: 'Rev', title: 'Sermon Title', bullets, activeIdx: 0 }]);
  const rtfT  = rtfOf(elByName(cuesT[0], 'body'));
  ok('revealing: title present in RTF when provided', rtfT.includes('Sermon Title'));

  // scaleBehavior default
  const body  = elByName(cues0[0], 'body');
  ok('revealing: body scaleBehavior=SCALE_FONT_DOWN', scaleBehaviorOf(body) === 'SCALE_BEHAVIOR_SCALE_FONT_DOWN');
})();

// ── 4. Response-card prop ─────────────────────────────────────────────────────
(() => {
  const cues = cuesOf([{
    type: 'response-card',
    propName: 'Response Card',
    responses: {
      r1: 'First time',
      r2: 'Recommit',
      r3: 'Baptism interest',
      r4: 'Following Jesus',
    },
  }]);
  ok('response-card: cue name matches propName', cues[0].name === 'Response Card');
  const els = elementsOf(cues[0]);
  ok('response-card: has elements', els.length > 0);
  // response text should appear somewhere in the RTF payload
  const allRtf = els.map(rtfOf).join('\n');
  ok('response-card: r4 text present', allRtf.includes('Following Jesus'));
  ok('response-card: r1 text present', allRtf.includes('First time'));
})();

// ── 5. Canvas size flows through ──────────────────────────────────────────────
(() => {
  const cues = cuesOf(
    [{ type: 'point-single', propName: 'Pt', bodyText: 'x' }],
    { propCanvasW: 3840, propCanvasH: 2160 },
  );
  const slide = slideOf(cues[0]);
  ok('canvas: propCanvasW flows to baseSlide.size.width',  slide?.size?.width  === 3840);
  ok('canvas: propCanvasH flows to baseSlide.size.height', slide?.size?.height === 2160);
})();

// ── 6. scaleBehavior override via adv ─────────────────────────────────────────
(() => {
  // When adv.scaleBehavior is explicitly set, it overrides the default SCALE_FONT_DOWN
  const cues = cuesOf(
    [{ type: 'scripture', propName: 'X', reference: 'X', bodies: [[{ text: 'test' }]] }],
    { propBodyFontAdv: { scaleBehavior: 'SCALE_BEHAVIOR_SHRINK_TO_FIT' } },
  );
  const body = elByName(cues[0], 'body');
  ok('adv override: propBodyFontAdv.scaleBehavior reaches body element', scaleBehaviorOf(body) === 'SCALE_BEHAVIOR_SHRINK_TO_FIT');
})();

// ── 7. titleFontAdv.scaleBehavior reaches prop reference element ───────────────
// Regression guard: buildProp.js reference element uses adv:prs.titleFontAdv.
// Before the fix, no scaleBehavior default was passed → element had none.
(() => {
  // Default: should be SCALE_FONT_DOWN even with no adv set
  const cuesDefault = cuesOf([{ type: 'scripture', propName: 'Y', reference: 'Y', bodies: [[{ text: 'y' }]] }]);
  const refDefault = elByName(cuesDefault[0], 'reference');
  ok('reference default scaleBehavior=SCALE_FONT_DOWN (regression guard)', scaleBehaviorOf(refDefault) === 'SCALE_BEHAVIOR_SCALE_FONT_DOWN');

  // Override via propTitleFontAdv (takes precedence over titleFontAdv in makePropStyle)
  const cuesAdv = cuesOf(
    [{ type: 'scripture', propName: 'Y', reference: 'Y', bodies: [[{ text: 'y' }]] }],
    { propTitleFontAdv: { scaleBehavior: 'SCALE_BEHAVIOR_SHRINK_TO_FIT' } },
  );
  const refAdv = elByName(cuesAdv[0], 'reference');
  ok('reference propTitleFontAdv.scaleBehavior override reaches element', scaleBehaviorOf(refAdv) === 'SCALE_BEHAVIOR_SHRINK_TO_FIT');
})();

// ── 8. Multi-body scripture: one cue per body ─────────────────────────────────
(() => {
  const specs = [
    { type: 'scripture', propName: 'A', reference: 'A', bodies: [[{ text: 'line 1' }]] },
    { type: 'scripture', propName: 'B', reference: 'B', bodies: [[{ text: 'line 2' }]] },
  ];
  const cues = cuesOf(specs);
  ok('multi-spec: two specs produce two cues', cues.length === 2);
  ok('multi-spec: first cue name is A', cues[0].name === 'A');
  ok('multi-spec: second cue name is B', cues[1].name === 'B');
})();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
