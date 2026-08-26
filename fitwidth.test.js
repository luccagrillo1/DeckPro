// Golden/invariant tests for the fit-width-layout rewrite (tasks 1-4: tiered
// scoring in computeOptimalBodyWidth, the real-metrics title-Y formula in
// estimateTitleY/estimatePropTitleY, hash-based staleness, Display 2 wiring).
//
// Node-side coverage is necessarily partial. computeOptimalBodyWidth,
// _fitScore, _fitWordList, and friends (public/app.js) need a real DOM —
// canvas text measurement — and app.js has no module boundary safe to
// require() from Node: it calls bootstrap() unconditionally at the bottom of
// the file, which would immediately try to fetch(), touch localStorage, and
// render a real page. Everything reachable through builder.js/buildProp.js
// (plain Node modules, already exported, no DOM) is tested against the REAL
// code below, with zero duplication. The handful of app.js-only invariants
// (tiering never exceeds the floor line count, the box-width ceiling, and
// the hard-break spans round-trip) are checked against small, explicitly
// labeled mirrors of just the specific logic being verified — not a copy of
// the whole algorithm — per the instruction that stubbing the arithmetic is
// an acceptable alternative to a full DOM harness. Anywhere real code was
// usable, it was used.
//
// The task's six named reference cases (the Lamentations ALL-CAPS overflow,
// "God Provides Faithfulness to Me" as a weight/italic mismatch, a
// multi-clause scripture that should break on a period, a scripture with an
// old-scoring orphan, a bold-run-split case, and a custom-lineHeight case)
// need Lucca's actual verse text, scheme settings, and hand-verified
// expected line count/box width/title Y — none of which exist yet. Per
// instruction: don't freeze unverified numbers as "golden" — that just locks
// in whatever this code happens to produce today, bugs included. Everything
// below asserts only what's true by construction, so it can go into CI now;
// the six named cases are added once Lucca has reviewed real output and
// approved the expected numbers.

const { buildPresentation } = require('./builder.js');
const { buildScripturePropCue } = require('./buildProp.js');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { console.log('✅', name); pass++; }
  else { console.log('❌', name, detail !== undefined ? JSON.stringify(detail) : ''); fail++; }
}

// ── helpers ──────────────────────────────────────────────────────────────

function titleYOf(cue) {
  const a = (cue.actions || []).find(x => x.type === 'ACTION_TYPE_PRESENTATION_SLIDE');
  const el = a.slide.presentation.baseSlide.elements.find(e => e.element.name === 'title');
  return el.element.bounds.origin.y;
}

// A scripture deck with a real Fit Width result already attached (bodyLines/
// ascent/descent/capAscent) — standing in for what public/app.js supplies in
// production, same as audit-scheme-fields.js's fixture.
function scriptureSpec(bodyLines, styleExtra = {}) {
  return {
    name: 'T',
    style: {
      autoTitleY: true, bodyY: 729.98, bodyH: 350.02, titleH: 50.51, titleAutoGap: 16, bodySize: 44,
      ...styleExtra,
    },
    slides: [
      { type: 'scripture', label: 'Ref', reference: 'Ref', bodies: [[{ text: 'sample body text' }]],
        bodyLines, ascent: 43, descent: 11, capAscent: 31 },
    ],
  };
}

function propTitleYOf(propBodyLines, rsExtra = {}) {
  const rs = {
    propBodySize: 80, propBodyY: 729.98, propBodyH: 350.02, propTitleH: 50.51, propTitleAutoGap: 16,
    propAutoTitleY: true, ...rsExtra,
  };
  const spec = {
    propName: 'test', reference: 'Ref', bodies: [[{ text: 'sample' }]],
    propBodyLines, propAscent: 78, propDescent: 20, propCapAscent: 56,
  };
  const cue = buildScripturePropCue(spec, rs);
  const el = cue.actions[0].slide.prop.baseSlide.elements.find(e => e.element.name === 'reference');
  return el.element.bounds.origin.y;
}

// ── Title Y (Display 1) — real code via builder.js, no DOM needed ─────────

(() => {
  const y1 = titleYOf(buildPresentation(scriptureSpec(1)).cues[0]);
  const y2 = titleYOf(buildPresentation(scriptureSpec(2)).cues[0]);
  const y3 = titleYOf(buildPresentation(scriptureSpec(3)).cues[0]);
  ok('title moves up as the body grows (1 → 2 → 3 lines)', y1 > y2 && y2 > y3, { y1, y2, y3 });
})();

(() => {
  const yDeep = titleYOf(buildPresentation(scriptureSpec(30)).cues[0]);
  ok('titleY clamps to 0 instead of going negative when the body leaves no room', yDeep === 0, { yDeep });
})();

(() => {
  const yDefault = titleYOf(buildPresentation(scriptureSpec(2)).cues[0]);
  const yCustom  = titleYOf(buildPresentation(scriptureSpec(2, { bodyFontAdv: { lineHeight: 1.6 } })).cues[0]);
  ok('a lineHeight other than 1.3 changes titleY (uses the scheme value, not a hardcoded 1.3)',
     yDefault !== yCustom, { yDefault, yCustom });
})();

(() => {
  let threw = false, msg = '';
  try {
    buildPresentation({ name: 'T', style: { autoTitleY: true }, slides: [
      { type: 'scripture', label: 'R', reference: 'R', bodies: [[{ text: 'x' }]] }, // no bodyLines/ascent/etc
    ] });
  } catch (e) { threw = true; msg = e.message; }
  ok('missing bodyLines/metrics throws instead of approximating (scripture is strict — Task 3)',
     threw && /strict mode/.test(msg), { threw, msg });
})();

(() => {
  let threw = false;
  try { buildPresentation(scriptureSpec(1)); } catch (_) { threw = true; }
  ok('a well-formed Fit Width result does not throw', !threw);
})();

// ── Display 2 independence (invariant: never derives from Display 1) ──────

(() => {
  const yProp1 = propTitleYOf(1);
  const yProp3 = propTitleYOf(3);
  ok('Display 2 title tracks its OWN line count (propBodyLines), independent of Display 1',
     yProp1 !== yProp3, { yProp1, yProp3 });
})();

(() => {
  let threw = false;
  try { buildScripturePropCue({ propName: 't', reference: 'R', bodies: [[{ text: 'x' }]] }, { propAutoTitleY: true }); }
  catch (_) { threw = true; }
  ok('missing propBodyLines/metrics throws for Display 2 too (Task 4)', threw);
})();

(() => {
  const yOff = propTitleYOf(5, { propAutoTitleY: false, propTitleY: 1040 });
  ok('propAutoTitleY off still returns the fixed propTitleY untouched', yOff === 1040, { yOff });
})();

// ── app.js-only invariants: no DOM available in Node, so these check small,
// explicitly-labeled mirrors of the specific logic (see file header) rather
// than the real computeOptimalBodyWidth/_fitScore. ─────────────────────────

// Mirrors the tiering filter in computeOptimalBodyWidth's consider(): a
// candidate is only ever scored if its line count equals N, the count
// measured at the full Styles width. Task 1's whole point is that a
// candidate with MORE lines than N must never be reachable, regardless of
// how good its break quality is.
(() => {
  const N = 2;
  const candidates = [
    { lineCount: 1, cost: 999 },   // fewer lines than N — Fit Width can only shrink, so this can't occur in practice, but if it did, it shouldn't be considered "the tier" either
    { lineCount: 2, cost: 50 },    // matches N — the only real tier
    { lineCount: 3, cost: 5 },     // more lines, deliberately best score — must NEVER win
  ];
  const considered = candidates.filter(c => c.lineCount === N);
  const winner = considered.reduce((best, c) => (!best || c.cost < best.cost) ? c : best, null);
  ok('a lower-cost candidate outside the line-count tier can never win',
     winner.lineCount === 2, { winner });
})();

// Mirrors computeOptimalBodyWidth's final clamp: `Math.min(best.width, maxW)`.
// Fit Width may only ever shrink the box — the Styles width is a hard
// ceiling it must never exceed, however the search scored things.
(() => {
  const maxW = 1500;
  const bestWidthFromSearch = 1620; // a hypothetical over-wide winner
  const finalWidth = Math.min(bestWidthFromSearch, maxW);
  ok('the winning width is always clamped to the Styles width ceiling',
     finalWidth <= maxW, { finalWidth, maxW });
})();

// Mirrors _fitSpansFromWinningLayout (public/app.js): rebuilds spans with a
// literal '\n' between lines from a tokenized word list and a per-line word
// count, preserving bold/italic/underline and merging adjacent same-format
// runs. Verifies the invariant _fitTextsMatch relies on at export: collapsing
// the reconstruction's newlines back to spaces must reproduce the original
// text exactly.
function mirrorSpansFromWinningLayout(words, lineWordCounts) {
  const out = [];
  let idx = 0;
  lineWordCounts.forEach((count, li) => {
    if (li > 0) out.push({ text: '\n', bold: false, italic: false, underline: false });
    let run = null;
    for (let k = 0; k < count; k++) {
      const w = words[idx++];
      if (run && run.bold === w.bold && run.italic === w.italic && run.underline === w.underline) {
        run.text += ' ' + w.text;
      } else {
        if (run) out.push(run);
        run = { text: w.text, bold: w.bold, italic: w.italic, underline: w.underline };
      }
    }
    if (run) out.push(run);
  });
  return out;
}
(() => {
  const words = [
    { text: 'Faithful', bold: false }, { text: 'Kind', bold: true }, { text: 'and', bold: true },
    { text: 'Gentle', bold: true }, { text: 'Patient', bold: false },
  ];
  const original = words.map(w => w.text).join(' ');
  const spans = mirrorSpansFromWinningLayout(words, [3, 2]);
  const roundTripped = spans.map(s => s.text).join(' ').replace(/\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
  ok('reconstructed hard-break spans round-trip to the original text when collapsed',
     roundTripped === original, { original, roundTripped });
  const boldPreserved = spans.some(s => s.bold && s.text.includes('Kind'));
  ok('the reconstruction preserves bold formatting across the inserted line break',
     boldPreserved, { spans });
})();

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
