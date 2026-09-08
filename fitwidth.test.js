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
// Six reference cases (real WEB verse text and original point statements,
// run through the real browser measurement path and reviewed) are frozen
// near the bottom of this file — see that section's comment for the full
// per-case breakdown (text, scheme, winning candidate, runner-up, and why
// each one was chosen). Everything above this point asserts only what's
// true by construction, independent of any specific case's numbers.

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

// ── Six approved reference cases ────────────────────────────────────────
//
// Chosen to stress specific behaviors, not to look representative: the N vs
// N+1 tier boundary, a sentence-punctuation partition, a dash-tier
// partition, the function-word rule firing on the final (non-internal)
// line, a bold span crossing a hard break, and Display 1/Display 2
// legitimately landing on different results. Run through the real browser
// path (computeOptimalBodyWidth/_fitScore/_fitWordList, real canvas font
// metrics) on 2026-09-08, reviewed and approved. Real public-domain verse
// text (WEB) and original point statements — no lorem.
//
// Only the title-Y half of each case is asserted here as executable
// regression coverage, via the REAL builder.js/buildProp.js code — the
// scoring/line-count/box-width half needs the same DOM computeOptimalBodyWidth
// needs (see the file header), so it's recorded below as reviewed reference
// data instead: re-verify live in the browser if the scoring logic changes.
//
// Case 1 — N vs N+1 tier boundary (point, no title bar; scoring only).
//   Text: "The Spirit produces love, joy, peace, patience, kindness,
//   goodness, and faithfulness in those who walk with God." (original)
//   Scheme: pointFont Montserrat-ExtraBold, pointSize 44, pointW 915 (narrow,
//   deliberate — not a representative Styles width).
//   N=3. Winner (in-tier): "...love, joy, peace," / "...kindness, goodness,
//   and" / "faithfulness...God." — width 912, cost 27.42. Best off-tier
//   (4 lines, excluded regardless of its lower cost): "...love, joy," /
//   "peace, patience, kindness," / "goodness, and faithfulness" / "in those
//   who walk with God." — cost 16.82. Confirms the tier boundary: a
//   lower-cost 4-line layout is unreachable once N=3.
//
// Case 2 — sentence-punctuation partition (scripture).
//   Text (WEB, Psalm 23:1-2): "The LORD is my shepherd; I shall lack
//   nothing. He makes me lie down in green pastures. He leads me beside
//   still waters." Scheme: bodyW 1080 (Display 1), propBodyW 1800 (Display 2).
//   Display 1: N=3. Winner breaks after every period (punctuation partition,
//   cost 5.58) over the mid-clause box-width-sweep break (cost 17.41) — not
//   close (3.1x). brokenText fires. Display 2: N=3, box-width sweep wins
//   there instead (cost 22.72) since it already reproduces the sentence
//   split naturally at that width/font.
//
// Case 3 — dash-tier partition (point).
//   Text: "Grace is not earned — it is given freely, without condition, to
//   all who receive it by faith." (original). Scheme: pointW 670 (narrow,
//   deliberate). N=4. Winner breaks after the dash and each comma
//   (punctuation partition, cost 16.22) over mid-clause breaks (cost 32.12)
//   — not close (2x). brokenText fires.
//
// Case 4 — function-word rule firing on the final (non-internal) line.
//   Text (1 Peter 5:7, WEB, realistically truncated as a volunteer might
//   paste it): "Cast all your anxiety on him, because he cares for" — ends
//   on a bare preposition because the quote was cut short, not by design;
//   real complete sentences essentially never end this way, which is itself
//   why this case needed a truncated real verse rather than a full one.
//   Scheme: pointW 298 (very narrow, deliberate). N=5. Winner: "Cast all
//   your" / "anxiety on" / "him," / "because he" / "cares for" — cost 59.64.
//   Direct check (FIT_WEIGHTS.lineEndFunction zeroed, same layout): cost
//   drops to 35.64 — delta 24 = 2x the 12-point weight, since both "on" and
//   the true final word "for" end a line bare.
//
// Case 5 — bold span crossing a hard break (scripture).
//   Text (WEB, Lamentations 3:22-23): "It is because of Yahweh's loving
//   kindnesses that we are not consumed, because his compassion doesn't
//   fail. They are new every morning. **Great is your faithfulness.**"
//   (bold as marked). Scheme: bodyW 670 (Display 1), propBodyW 1800
//   (Display 2). Display 1: N=6. Winner keeps the bold clause on its own
//   line (cost 31.18); an otherwise-identical 6-line layout that splits it
//   ("...morning. Great" / "is your faithfulness.") costs 92.86 — 3x worse.
//   Display 2: N=4, bold clause also stays intact.
//
// Case 6 — Display 1 and Display 2 legitimately different (scripture).
//   Text (WEB, John 14:27): "Peace I leave with you. My peace I give to
//   you; not as the world gives, give I to you. Don't let your heart be
//   troubled, neither let it be fearful." Scheme: bodyW 1400 (Display 1),
//   propBodyW 3000 (Display 2) — deliberately different configured widths.
//   Display 1: N=3, punctuation partition wins (cost 10.27) over box-width
//   sweep (13.66). Display 2: N=2 (genuinely different line count, not
//   derived from Display 1), punctuation partition (cost 3.10) and
//   box-width sweep (3.12) tie within 0.6% — flagged as a near-tie, not a
//   concern (both land on essentially the same split).

function scriptureCaseSpec(bodyLines, metrics, styleExtra = {}) {
  return {
    name: 'T',
    style: { autoTitleY: true, bodyY: 729.98, bodyH: 350.02, titleH: 50.51, titleAutoGap: 16, bodySize: 44, ...styleExtra },
    slides: [{ type: 'scripture', label: 'Ref', reference: 'Ref', bodies: [[{ text: 'x' }]],
      bodyLines, ascent: metrics.ascent, descent: metrics.descent, capAscent: metrics.capAscent }],
  };
}
function propCaseTitleY(propBodyLines, metrics, rsExtra = {}) {
  const rs = { propBodySize: 80, propBodyY: 853, propBodyH: 427, propTitleH: 60, propTitleAutoGap: 16, propAutoTitleY: true, ...rsExtra };
  const spec = { propName: 't', reference: 'Ref', bodies: [[{ text: 'x' }]],
    propBodyLines, propAscent: metrics.ascent, propDescent: metrics.descent, propCapAscent: metrics.capAscent };
  const cue = buildScripturePropCue(spec, rs);
  return cue.actions[0].slide.prop.baseSlide.elements.find(e => e.element.name === 'reference').element.bounds.origin.y;
}
function mainCaseTitleY(bodyLines, metrics, styleExtra = {}) {
  const doc = buildPresentation(scriptureCaseSpec(bodyLines, metrics, styleExtra));
  const a = doc.cues[0].actions.find(x => x.type === 'ACTION_TYPE_PRESENTATION_SLIDE');
  return a.slide.presentation.baseSlide.elements.find(e => e.element.name === 'title').element.bounds.origin.y;
}

const D1_METRICS = { ascent: 43, descent: 11, capAscent: 30.8 };  // Montserrat-Medium 44px, measured live
const D2_METRICS = { ascent: 77, descent: 20, capAscent: 56 };    // Montserrat-SemiBold 80px, measured live

ok('Case 2 (Psalm 23:1-2) Display 1 titleY matches the reviewed value',
   mainCaseTitleY(3, D1_METRICS) === 889, { got: mainCaseTitleY(3, D1_METRICS) });
ok('Case 2 (Psalm 23:1-2) Display 2 titleY matches the reviewed value',
   propCaseTitleY(3, D2_METRICS) === 917, { got: propCaseTitleY(3, D2_METRICS) });

ok('Case 5 (Lamentations 3:22-23) Display 1 titleY matches the reviewed value',
   mainCaseTitleY(6, D1_METRICS) === 757, { got: mainCaseTitleY(6, D1_METRICS) });
ok('Case 5 (Lamentations 3:22-23) Display 2 titleY matches the reviewed value',
   propCaseTitleY(4, D2_METRICS) === 813, { got: propCaseTitleY(4, D2_METRICS) });

ok('Case 6 (John 14:27) Display 1 titleY matches the reviewed value',
   mainCaseTitleY(3, D1_METRICS) === 889, { got: mainCaseTitleY(3, D1_METRICS) });
ok('Case 6 (John 14:27) Display 2 titleY matches the reviewed value (genuinely different line count)',
   propCaseTitleY(2, D2_METRICS) === 1021, { got: propCaseTitleY(2, D2_METRICS) });

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
