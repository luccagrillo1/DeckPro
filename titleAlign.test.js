// Scripture reference lines up with the verse text (IMG_2900: "1 John 1:7"
// sat centred on the whole screen over a left-aligned, Fit-Width-narrowed
// verse at x=75). Checks the shared helper, the main-screen export, the LED
// wall prop export, and that the toggle turns it off.
const { titleAdvFollowingBody, bodyTextAlign } = require('./public/titleAlign');
const { buildPresentation } = require('./builder');
const { buildScripturePropCue } = require('./buildProp');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) pass++; else { fail++; console.error('FAIL', name, extra ?? ''); } };
const near = (a, b) => Math.abs(a - b) < 0.02;

// Every element named `name` anywhere in a built object.
function findEls(obj, name, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  if (obj.name === name && obj.bounds) out.push(obj);
  for (const v of Object.values(obj)) findEls(v, name, out);
  return out;
}
const rtfOf = el => Buffer.from(el.text.rtfData, 'base64').toString('latin1');
const alignOf = el => el.text.attributes.paragraphStyle.alignment || 'natural';

// ── helper ──
{
  const t = { titleX: -0.18, titleW: 1920.18 };
  const l = titleAdvFollowingBody({ ...t, bodyX: 75, bodyW: 1424, bodyAlign: 'left' });
  ok('left: text starts at verse', l.alignment === 'left' && near(l.marginLeft, 75.18) && l.marginRight === 0, l);
  const r = titleAdvFollowingBody({ ...t, bodyX: 75, bodyW: 1424, bodyAlign: 'right' });
  ok('right: text ends at verse', r.alignment === 'right' && near(r.marginRight, 421) && r.marginLeft === 0, r);
  const c = titleAdvFollowingBody({ ...t, bodyX: 75, bodyW: 1424, bodyAlign: 'center' });
  const mid = -0.18 + c.marginLeft + (1920.18 - c.marginLeft - c.marginRight) / 2;
  ok('center: centred over verse', c.alignment === 'center' && near(mid, 75 + 712), { c, mid });
  ok('center: never negative', c.marginLeft >= 0 && c.marginRight >= 0);
  const m = titleAdvFollowingBody({ ...t, bodyX: 75, bodyW: 1424, bodyAlign: 'left', bodyMarginLeft: 25 });
  ok('body margin counted', near(m.marginLeft, 100.18), m);
  const keep = titleAdvFollowingBody({ ...t, titleAdv: { color: '#f6d046', marginTop: 4 }, bodyX: 0, bodyW: 1920, bodyAlign: 'left' });
  ok('keeps other title settings', keep.color === '#f6d046' && keep.marginTop === 4);
  ok('justify reads as left', titleAdvFollowingBody({ ...t, bodyX: 75, bodyW: 1424, bodyAlign: 'justify' }).alignment === 'left');
  ok('unset body align → left', bodyTextAlign(null, [{ text: 'a' }, { text: 'b', alt: true }]) === 'left');
  ok('all-emphasis verse → centre', bodyTextAlign(null, [{ text: 'a', alt: true }]) === 'center');
  ok('row alignment wins', bodyTextAlign({ alignment: 'right' }, [{ text: 'a', alt: true }]) === 'right');
}

// ── main screen export ──
const verse = [{ text: 'But if we walk in the light, as he is in the light, we have fellowship with one another', bold: false }];
const mainSpec = (style = {}) => ({
  style: { autoTitleY: false, ...style },
  slides: [{ type: 'scripture', label: '1 John 1:7', reference: '1 John 1:7', bodies: [verse], propName: '1 John 1:7', bodyX: 75, bodyW: 1424 }],
});
{
  const p = buildPresentation(mainSpec(), {});
  const body = findEls(p, 'this slide').find(e => e.bounds.size.width < 1900) || findEls(p, 'body')[0];
  const title = findEls(p, 'title')[0];
  ok('main: body at x=75 (Fit Width)', body && near(body.bounds.origin.x, 75), body?.bounds);
  ok('main: title bar keeps full width', near(title.bounds.origin.x, -0.18) && near(title.bounds.size.width, 1920.18));
  ok('main: title left-aligned', alignOf(title) !== 'ALIGNMENT_CENTER', alignOf(title));
  ok('main: title RTF not centred', !/\\qc/.test(rtfOf(title)));
  ok('main: reference starts at verse x', near(title.text.margins.left, 75.18), title.text.margins);

  const off = buildPresentation(mainSpec({ titleFollowsBody: false }), {});
  const t2 = findEls(off, 'title')[0];
  ok('main off: centred like before', alignOf(t2) === 'ALIGNMENT_CENTER' && /\\qc/.test(rtfOf(t2)));

  const cen = buildPresentation(mainSpec({ bodyFontAdv: { alignment: 'center' } }), {});
  const t3 = findEls(cen, 'title')[0];
  const m3 = t3.text.margins;
  const mid3 = -0.18 + m3.left + (1920.18 - m3.left - m3.right) / 2;
  ok('main centred verse: reference centred over verse', alignOf(t3) === 'ALIGNMENT_CENTER' && near(mid3, 787), { m3, mid3 });
}

// ── LED wall prop export ──
{
  const spec = { propName: '1 John 1:7', reference: '1 John 1:7', bodies: [verse], propBodyX: 300, propBodyW: 2400 };
  const cue = buildScripturePropCue(spec, {});
  const title = findEls(cue, 'reference')[0];
  ok('LED: reference box unchanged', near(title.bounds.origin.x, -0.18));
  ok('LED: reference left-aligned', alignOf(title) !== 'ALIGNMENT_CENTER' && !/\\qc/.test(rtfOf(title)), alignOf(title));
  ok('LED: reference starts at verse x', near(title.text.margins.left, 300.18), title.text.margins);

  const off = findEls(buildScripturePropCue(spec, { propTitleFollowsBody: false }), 'reference')[0];
  ok('LED off: centred like before', alignOf(off) === 'ALIGNMENT_CENTER' && /\\qc/.test(rtfOf(off)));

  const main = findEls(buildScripturePropCue(spec, { titleFollowsBody: false }), 'reference')[0];
  ok('LED follows its own toggle, not the main one', near(main.text.margins.left, 300.18));
}

console.log(`titleAlign: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
