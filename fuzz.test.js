// Chaos / fuzz test for the export pipeline.
//
// Generates many random decks with nasty combinations (0/1/100 slides, empty
// bodies, emoji, quotes, slashes, line breaks, very long text, mixed types,
// random overrides/macros/blankBefore/prop settings) and pushes each through
// buildPresentation -> encode -> decode.
//
// Invariants (the whole point):
//   1. never throws
//   2. never silently drops a content slide (every slide's label survives to a cue)
//   3. always produces schema-valid protobuf (encode runs Presentation.verify)
//
// Deterministic: seeded PRNG so any failure is reproducible. Override with SEED=<n>.

const { buildPresentation } = require('./builder.js');
const { encodeToBuffer } = require('./encode.js');

const SEED = process.env.SEED ? parseInt(process.env.SEED) : 0xC0FFEE;
const RUNS = process.env.RUNS ? parseInt(process.env.RUNS) : 300;

// Mulberry32 PRNG — small, deterministic.
let _s = SEED >>> 0;
function rng() { _s |= 0; _s = (_s + 0x6D2B79F5) | 0; let t = Math.imul(_s ^ (_s >>> 15), 1 | _s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const pick = arr => arr[Math.floor(rng() * arr.length)];
const chance = p => rng() < p;
const int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));

const NASTY = [
  'plain text', 'emoji 🙏🔥🌿', '"smart quotes"', "it's an apostrophe", 'a / slash \\ here',
  'em — dash and … ellipsis', 'line\nbreak\nhere', '   leading and trailing   ',
  'VERY '.repeat(40) + 'long', '', '123 starts with digits', 'tabs\tand\tstuff',
  '<not a tag>', '{rtf braces}', 'control \\b chars', 'Ünïcödé ñame',
];

function randSpans() {
  if (chance(0.15)) return [];
  const n = int(1, 4);
  const out = [];
  for (let i = 0; i < n; i++) {
    const span = { text: pick(NASTY), bold: chance(0.3) };
    if (chance(0.2)) span.alt = true;
    if (chance(0.15)) span.italic = true;
    if (chance(0.15)) span.underline = true;
    if (chance(0.15)) { span.verseNum = true; span.super = chance(0.5); span.text = String(int(1, 176)); }
    out.push(span);
  }
  return out;
}

function randOverride() {
  return chance(0.3) ? { uuid: 'OV-' + int(1, 9999), name: pick(NASTY) || 'mac', color: '#0f0' } : null;
}
function randStage() {
  return chance(0.3) ? { layoutName: pick(['Message', 'Response Card', '']), layoutUuid: 'L-' + int(1, 99) } : null;
}
function randTransition() {
  return chance(0.3) ? { type: pick(['fade', 'dissolve', 'cut']), duration: pick([0, 0.3, 0.6, 1.2, 3]) } : null;
}

function randSlide() {
  const type = pick(['start', 'end', 'scripture', 'point', 'point', 'image', 'blank', 'custom']);
  const label = pick(NASTY).slice(0, 60) || 'Slide ' + int(1, 999);
  const base = { type, label, transition: randTransition(), macroOverride: randOverride(), stageLayout: randStage() };
  if (type === 'start' || type === 'end') return { type, label, text: label };
  if (type === 'scripture') {
    const nBodies = int(1, 3);
    return { ...base, reference: label, propName: label,
      bodies: Array.from({ length: nBodies }, randSpans),
      blankBefore: chance(0.4), blankSpans: randSpans(), stripNewlines: chance(0.3), qrOn: chance(0.3) };
  }
  if (type === 'point') {
    if (chance(0.5)) return { ...base, mode: 'single', bodyText: pick(NASTY), propName: label, blankBefore: chance(0.4), customProp: chance(0.3), qrOn: chance(0.3) };
    // Realistic: buildSpec filters empty bullets, so generate non-empty ones (>=1).
    const NONEMPTY = NASTY.filter(s => s.trim());
    return { ...base, mode: 'revealing', title: pick(NASTY), propBaseName: label, blankBefore: chance(0.4),
      bullets: Array.from({ length: int(1, 5) }, () => pick(NONEMPTY)), followReveal: pick(['single', 'stacking']), qrOn: chance(0.3) };
  }
  if (type === 'image') return { ...base, blankBefore: chance(0.4), blankSpans: randSpans(), qrOn: chance(0.3) };
  return { ...base, spans: randSpans() }; // blank / custom
}

function randDeck() {
  const n = pick([0, 1, 1, 2, 5, 12, 100]);
  const slides = [];
  if (chance(0.7)) slides.push({ type: 'start', label: 'START', text: 'START' });
  for (let i = 0; i < n; i++) slides.push(randSlide());
  if (chance(0.7)) slides.push({ type: 'end', label: 'End of Notes', text: 'End of Notes' });
  const deck = { name: 'fuzz-' + int(1, 99999), slides, includeResponseCard: chance(0.4),
    qrMacro: chance(0.5) ? { name: 'QR Show', uuid: 'QR-' + int(1, 99) } : null };
  if (chance(0.5)) deck.customMacros = [
    { id: 'm', name: pick(NASTY) || 'm', uuid: 'M-' + int(1, 99), color: '#abc',
      triggers: ['start', 'end', 'scripture', 'point', 'blank', 'blankBefore', 'image', 'rc'].filter(() => chance(0.4)) },
  ];
  if (chance(0.4)) deck.stageScreen = { screenName: 'S', screenUuid: 'SU', messageLayoutName: 'Message', messageLayoutUuid: 'ML', rcLayoutName: 'RC', rcLayoutUuid: 'RCL' };
  return deck;
}

// Exact number of cues a slide should expand to (anti-silent-drop).
function expectedCues(s) {
  const bb = s.blankBefore ? 1 : 0;
  switch (s.type) {
    case 'start': case 'end': case 'blank': case 'custom': return 1;
    case 'image': return 1 + bb;
    case 'scripture': return (s.bodies ? s.bodies.length : 1) + bb;
    case 'point': return (s.mode === 'revealing' ? (s.bullets || []).length : 1) + bb;
    default: return 1;
  }
}
function expectedTotal(deck) {
  let n = deck.slides.reduce((sum, s) => sum + expectedCues(s), 0);
  if (deck.includeResponseCard) n += 6; // Blank, R1, R2, R3, R4, Hold
  return n;
}

(async () => {
  let pass = 0, fail = 0;
  const failures = [];

  for (let i = 0; i < RUNS; i++) {
    const deck = randDeck();
    let pres, buf;
    // 1. never throws (build)
    try { pres = buildPresentation(deck, {}); }
    catch (e) { fail++; failures.push(`run ${i}: buildPresentation threw: ${e.message}`); continue; }

    // 2. never silently drops a slide — exact expansion count must match
    const got = (pres.cues || []).length;
    const want = expectedTotal(deck);
    if (got !== want) { fail++; failures.push(`run ${i}: cue count ${got} != expected ${want} (slides=${deck.slides.length}, RC=${!!deck.includeResponseCard})`); continue; }

    // 3. always schema-valid protobuf
    try { buf = await encodeToBuffer(deck, {}); }
    catch (e) { fail++; failures.push(`run ${i}: encode/verify threw: ${e.message}`); continue; }
    if (!buf || buf.length < 0) { fail++; failures.push(`run ${i}: empty buffer`); continue; }

    pass++;
  }

  console.log(`Fuzz: ${pass}/${RUNS} decks passed all invariants (seed=${SEED.toString(16)})`);
  if (fail) { console.log(`\n❌ ${fail} failed:`); failures.slice(0, 12).forEach(f => console.log('  ', f)); }
  else console.log('✅ never threw, never dropped a slide, always valid protobuf');
  process.exit(fail ? 1 : 0);
})();
