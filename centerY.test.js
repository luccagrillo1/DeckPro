// LED wall "Center on wall": reference + gap + verse move together as one
// block, centred on the full LED wall height; taller than the wall → pinned top.
const { buildScripturePropCue } = require('./buildProp');
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) pass++; else { fail++; console.error('FAIL', n, x ?? ''); } };
const near = (a, b, t = 0.6) => Math.abs(a - b) < t;
function findEls(o, name, out = []) {
  if (!o || typeof o !== 'object') return out;
  if (o.name === name && o.bounds) out.push(o);
  for (const v of Object.values(o)) findEls(v, name, out);
  return out;
}
const verse = [{ text: 'For God so loved the world', bold: false }];
const metrics = { propAscent: 80, propDescent: 20, propCapAscent: 70, propTitleAscent: 50, propTitleDescent: 10 };
const spec = (lines) => ({ propName: 'J', reference: 'John 3:16', bodies: [verse], propBodyLines: lines, ...metrics });
const style = { propAutoTitleY: true, propTitleAutoGap: 16, propCanvasH: 1280, propBodyY: 853, propBodyH: 427, propTitleH: 60 };
const els = (sp, st) => { const c = buildScripturePropCue(sp, st); return { b: findEls(c, 'body')[0].bounds, t: findEls(c, 'reference')[0].bounds }; };

for (const lines of [1, 2, 3]) {
  const off = els(spec(lines), style);
  const on = els(spec(lines), { ...style, propCenterY: true });
  const dOff = on.t.origin.y - off.t.origin.y, dBody = on.b.origin.y - off.b.origin.y;
  ok(`${lines} lines: title + body move together`, near(dOff, dBody, 0.02), { dOff, dBody });
  // block: title top → bottom of text (bottom-aligned, 60 bottom margin)
  const top = on.t.origin.y, bottom = on.b.origin.y + 427 - 60;
  ok(`${lines} lines: centred on wall`, near((top + bottom) / 2, 640), { top, bottom });
  ok(`${lines} lines: gap kept`, near((on.b.origin.y + 427 - 60 - lines * 100) - (on.t.origin.y + 60), off.b.origin.y + 427 - 60 - lines * 100 - (off.t.origin.y + 60), 0.02));
}
{
  const off = els(spec(2), { ...style, propCenterY: true, propAutoTitleY: false });
  const base = els(spec(2), { ...style, propAutoTitleY: false });
  ok('needs Auto Title Y', off.t.origin.y === base.t.origin.y && off.b.origin.y === base.b.origin.y);
  const def = els(spec(2), style), plain = els(spec(2), { ...style, propCenterY: undefined });
  ok('off by default', def.b.origin.y === 853 && plain.b.origin.y === 853);
}
{
  // Taller than the wall: block pins to the top edge.
  const tall = els(spec(14), { ...style, propCenterY: true });
  ok('too tall: stays on the wall', tall.t.origin.y >= 0 && tall.t.origin.y < 100, tall.t.origin.y);
}
console.log(`centerY: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
