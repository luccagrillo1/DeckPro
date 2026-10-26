'use strict';

/**
 * diffPresentation.js — detects hand-edits made in ProPresenter to a file
 * DeckPro previously wrote, so the next export can offer to carry them
 * forward instead of silently overwriting them.
 *
 * Compares two DECODED .pro structures (from extractScheme.js's
 * decodePresentation) field by field, everywhere — bounds, colors, fonts,
 * text content, macros, props, transitions, build orders. The only thing
 * excluded is `uuid` fields, which builder.js mints fresh on every export
 * and would otherwise make every single re-export look "changed" even when
 * nothing meaningful actually is.
 *
 * Matching across two independently-generated files (no shared UUIDs):
 *  - cues read in SLIDE order — the order of the presentation's cue groups,
 *    not the `cues` array: ProPresenter re-saves a file (e.g. when it opens
 *    it in a newer version) with `cues` in no particular order.
 *  - cues matched by their UUID — DeckPro mints it, Pro7 keeps it — so a
 *    slide added, deleted or moved in Pro7 is reported as just that. Cues
 *    without a shared UUID fall back to matching by label, in order
 *    (longest common subsequence). Matching by array index compared every
 *    slide with an unrelated one, producing pages of meaningless changes.
 *  - elements within a slide's `elements` array matched by NAME (title/
 *    body/live/queue/atem_gradient/"this slide") — the one place order
 *    could plausibly differ, and the one stable identifier DeckPro always
 *    preserves (see extractScheme.js's own header comment).
 *  - everything else (actions, macros, props, build order entries, cue
 *    metadata) matched by INDEX, same reasoning as cues.
 */

const { rtfString } = require('./extractScheme');
const rtf = require('./rtf');

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// UUID reference fields aren't all literally named "uuid" — elementUUID,
// parameterUuid, completion_target_uuid, etc. all use the same {string:
// "XXXXXXXX-XXXX-..."} wrapper shape. Detecting by VALUE shape (rather than
// trying to enumerate every field name) catches all of them: builder.js
// mints a fresh one on every export, so comparing two different UUIDs is
// meaningless noise — but a UUID going from present to null/missing (a
// reference genuinely cleared) is a real, worth-reporting change.
const UUID_RE = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;
function isUuidValue(v) {
  return isPlainObject(v) && typeof v.string === 'string' && Object.keys(v).length === 1 && UUID_RE.test(v.string);
}

// Windows-1252 bytes 0x80–0x9F that differ from Latin-1 (\'xx escapes).
const CP1252 = { 0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰',
  0x8A: 'Š', 0x8B: '‹', 0x8C: 'Œ', 0x8E: 'Ž', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–',
  0x97: '—', 0x98: '˜', 0x99: '™', 0x9A: 'š', 0x9B: '›', 0x9C: 'œ', 0x9E: 'ž', 0x9F: 'Ÿ' };
// Groups whose content is never visible text.
const RTF_SKIP_DEST = new Set(['fonttbl', 'colortbl', 'expandedcolortbl', 'stylesheet', 'info', 'pict', 'listtable', 'listoverridetable']);

// The visible text of any RTF — DeckPro's own or ProPresenter's re-encoding
// of it (which writes the same words with different control words: \uN
// escapes, other font tables, leftovers in an emptied box), so the same
// words always come out the same. Line breaks become '\n'.
function friendlyRtf(rtfData) {
  if (!rtfData) return '';
  const raw = rtfString(rtfData);
  let out = '', i = 0, ucSkip = 1, pendingSkip = 0;
  const stack = [];
  let skip = false;
  const put = ch => { if (pendingSkip > 0) { pendingSkip--; return; } if (!skip) out += ch; };
  while (i < raw.length) {
    const c = raw[i];
    if (c === '{') { stack.push({ skip, ucSkip }); i++; continue; }
    if (c === '}') { const st = stack.pop(); if (st) ({ skip, ucSkip } = st); i++; continue; }
    if (c === '\r' || c === '\n') { i++; continue; }
    if (c !== '\\') { put(c); i++; continue; }
    const nx = raw[i + 1];
    if (nx === '\\' || nx === '{' || nx === '}') { put(nx); i += 2; continue; }
    if (nx === '\n' || nx === '\r') { put('\n'); i += 2; continue; }      // "\<newline>" = line break
    if (nx === '~') { put(' '); i += 2; continue; }
    if (nx === '*') { skip = true; i += 2; continue; }                      // {\* ...} ignorable destination
    if (nx === "'") { const b = parseInt(raw.substr(i + 2, 2), 16); put(CP1252[b] || String.fromCharCode(b)); i += 4; continue; }
    const m = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(raw.slice(i, i + 40));
    if (!m) { i += 2; continue; }
    const [all, word, arg] = m;
    i += all.length;
    if (RTF_SKIP_DEST.has(word)) skip = true;
    else if (word === 'uc') ucSkip = +arg;
    else if (word === 'u') { let n = +arg; if (n < 0) n += 65536; put(String.fromCharCode(n)); pendingSkip = ucSkip; }
    else if (word === 'par' || word === 'line') put('\n');
    else if (word === 'tab') put('\t');
  }
  return out.replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
}

// Same words? Ignores spacing and curly-vs-straight quotes, which Pro7's
// re-save may change without anyone touching the text.
function sameText(a, b) {
  const norm = t => (t || '').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, '');
  return norm(a) === norm(b);
}

// Things DeckPro rewrites on every export, or Pro7 rewrites whenever it saves,
// that never carry a hand edit worth keeping:
//  - the `queue` (upcoming-slides list) and `live` badge elements — rebuilt
//    from the deck on every export, so an edit there would be lost anyway;
//  - a text box's `attributes` block (font, kerning, alignment, underline…):
//    Pro7 re-derives it from the text itself whenever it saves, so it
//    changes on a plain re-save. The text (rtfData) is what's shown, and is
//    compared below;
//  - customAttributes (Pro7's own run ranges), label colour, and the
//    build-order chain.
const IGNORED_ELEMENTS = new Set(['queue', 'live']);
const IGNORED_PATH_RE = /(^|\.)(customAttributes|elementBuildOrder)(\[|\.|$)|\.text\.attributes(\.|$)|(^|\.)label\.color$/;

// A label or notes field Pro7 wrote out empty is the same as one it left out.
function isBlankField(path, v) {
  if (v == null) return true;
  if (/(^|\.)label$/.test(path)) return !v.text;
  if (/(^|\.)notes$/.test(path)) return !v.rtfData || !friendlyRtf(v.rtfData);
  return false;
}

function valuesEqual(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 0.01; // float round-trip noise
  return false;
}

function unwrapElement(w) {
  return (w && typeof w === 'object' && w.element) ? w.element : w;
}

// `body` alone isn't enough to mean "scripture/point" — Start/End/Response-
// Card-Hold ALSO use an element literally named `body` (makeStartEndElement,
// rendered via rtfStartEnd — a completely different renderer/style set than
// rtfBody). The real discriminator is `live`: every scripture/point/
// response-card slide gets a live-badge element, Start/End never does.
// Checked this directly against real buildPresentation() output rather than
// trusting the (wrong, for this case) assumption that body+title alone
// means scripture — extractScheme.js's own classify() has this same gap.
function classifyElements(names) {
  if (names.includes('body')) {
    if (!names.includes('live')) return 'startEnd';
    return names.includes('title') ? 'scripture' : 'point';
  }
  if (names.includes('this slide')) return 'startEnd'; // legacy element name, kept as a fallback
  return 'other';
}

/** Recursively diff two plain values, pushing leaf differences onto `out`
 *  as { path, oldValue, newValue }. `ctx.textMergeKind` (set by
 *  diffElementsArray via TEXT_MERGE_KIND — see there) says which renderer,
 *  if any, can safely reapply an rtfData change on this element; governs
 *  whether the change captures reapplicable spans or stays display-only. */
function deepDiff(a, b, path, out, ctx = {}) {
  if (IGNORED_PATH_RE.test(path)) return;
  if (/(^|\.)rtfData$/.test(path)) {
    const ta = friendlyRtf(a), tb = friendlyRtf(b);
    if (sameText(ta, tb)) return;
    if (ctx.textMergeKind) {
      // Parsed as spans/plain text per the element's own renderer (not just
      // flattened display text) so a real edit — including bold/emphasis
      // boundaries where the renderer supports them — can be reapplied by
      // re-running it back through that renderer, rather than risking a
      // hand-spliced RTF string. See TEXT_MERGE_KIND for what's parsed how.
      // DeckPro's span parsers only read DeckPro's own RTF layout. Text
      // retyped in Pro7 comes back in Pro7's encoding, which they'd return
      // as raw RTF code — so check the parse reproduces the words, and fall
      // back to the plain words (formatting dropped) when it doesn't.
      const parsed = ctx.textMergeKind === 'pointBody' ? rtf.parsePointBodySpans(b)
        : (ctx.textMergeKind === 'title' || ctx.textMergeKind === 'startEnd') ? null
        : rtf.parseRtfSpans(b);
      const spans = parsed && sameText(parsed.map(x => x.text || '').join(''), tb) ? parsed
        : [{ text: tb, bold: ctx.textMergeKind === 'pointBody' }];
      const mergeData = parsed ? { spans } : { text: tb };
      out.push({
        path: path.replace(/rtfData$/, 'text'), oldValue: ta, newValue: tb,
        mergeable: true, mergeData: { kind: ctx.textMergeKind, ...mergeData },
      });
    } else {
      // Reported for visibility, but never auto-merged: safely reconstructing
      // RTF (preserving whatever formatting the original had) needs the
      // element's own font/size/colour context, only available for the
      // element/slide-type combos TEXT_MERGE_KIND covers. mergeable:false
      // tells applyChanges to skip it and the UI to say so.
      out.push({ path: path.replace(/rtfData$/, 'text'), oldValue: ta, newValue: tb, mergeable: false });
    }
    return;
  }
  if (a === b) return;
  if ((a == null || b == null) && isBlankField(path, a) && isBlankField(path, b)) return;
  if (a == null || b == null) {
    if (a !== b) out.push({ path, oldValue: a ?? null, newValue: b ?? null });
    return;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (/(^|\.)elements$/.test(path)) {
      diffElementsArray(a, b, path, out);
      return;
    }
    // A bare array of UUID references (e.g. elementBuildOrder — the chain of
    // build-action UUIDs a slide fires in order) has individually
    // meaningless entries — every value is fresh per export — but its
    // LENGTH is still a real signal (a build step genuinely added/removed).
    const sample = [...a, ...b].find(v => v != null);
    if (sample !== undefined && isUuidValue(sample)) {
      if (a.length !== b.length) out.push({ path: `${path}.length`, oldValue: a.length, newValue: b.length });
      return;
    }
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) deepDiff(a[i], b[i], `${path}[${i}]`, out, ctx);
    return;
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
      const va = a[k], vb = b[k];
      if (isUuidValue(va) && isUuidValue(vb)) continue; // both real UUIDs — always differ, never meaningful
      deepDiff(va, vb, path ? `${path}.${k}` : k, out, ctx);
    }
    return;
  }
  if (!valuesEqual(a, b)) out.push({ path, oldValue: a, newValue: b });
}

// Which renderer (if any) can safely reconstruct rtfData for a given
// element, keyed by (slideType, elementName) — NOT by element name alone:
// 'body' means something different depending on slideType (see
// classifyElements — Start/End's element is ALSO literally named 'body',
// rendered by a completely different function). 'body' on a scripture-
// shaped cue → rtfBody (spans, incl. bold/emphasis). 'title' → rtfTitle
// (plain text only — the reference bar has no bold support). 'body' on a
// point-shaped cue → rtfPointBody (its own span format — see
// parsePointBodySpans for why it needs a dedicated parser). 'body' on a
// startEnd-shaped cue → rtfStartEnd (plain text) — covers Start, End, and
// the Response Card cue (the only things that ever set that element; blank
// slides render no visible element at all, their confidence-monitor text
// only ever reaches the notes field, not a slide element).
// Out of scope for a different reason, not just unwired: the revealing-
// point LED-wall list (rtfRevealingPoints) lives in the separate Props file
// (_Props.pro, a different protobuf type) — this whole diff/merge system
// only reads the main presentation file, so that's a bigger extension than
// one more dispatch entry, not covered here.
function textMergeKindFor(slideType, elementName) {
  if (elementName === 'body' && slideType === 'scripture') return 'body';
  if (elementName === 'title' && slideType === 'scripture') return 'title';
  if (elementName === 'body' && slideType === 'point') return 'pointBody';
  if ((elementName === 'body' || elementName === 'this slide') && slideType === 'startEnd') return 'startEnd';
  return null;
}

function diffElementsArray(a, b, path, out) {
  const byName = arr => {
    const map = {};
    for (const w of arr) { const el = unwrapElement(w); if (el && el.name) map[el.name] = el; }
    return map;
  };
  const baseEls = byName(a), curEls = byName(b);
  const names = new Set([...Object.keys(baseEls), ...Object.keys(curEls)]);
  const slideType = classifyElements([...names]);
  for (const name of names) {
    if (IGNORED_ELEMENTS.has(name)) continue;
    const be = baseEls[name], ce = curEls[name];
    // oldValue/newValue stay as short display strings ('present'/null) —
    // mergeData carries the actual element object applyChanges needs to
    // splice in/out, kept separate so the UI never has to render a whole
    // element's raw structure.
    if (be && !ce) { out.push({ path: `${path}[${name}]`, oldValue: 'present', newValue: null, elementName: name, kind: 'removed', mergeData: { name } }); continue; }
    if (!be && ce) { out.push({ path: `${path}[${name}]`, oldValue: null, newValue: 'present', elementName: name, kind: 'added', mergeData: { element: ce } }); continue; }
    const local = [];
    deepDiff(be, ce, `${path}[${name}]`, local, { textMergeKind: textMergeKindFor(slideType, name) });
    for (const d of local) out.push({ ...d, elementName: name });
  }
}

function cueLabel(cue) {
  const slideAction = (cue?.actions || []).find(a => a.type === 'ACTION_TYPE_PRESENTATION_SLIDE');
  return (slideAction && slideAction.label && slideAction.label.text) || cue?.name || '(untitled)';
}

// A cue's identity across two files: its label plus which occurrence of that
// label it is (blanks and repeated slides share labels).
function cueKeys(cues) {
  const seen = {};
  return cues.map(c => {
    const label = cueLabel(c);
    const occ = seen[label] = (seen[label] ?? -1) + 1;
    return { label, occ };
  });
}

// A presentation's cues in slide order: as its cue groups list them, then
// any cue no group mentions.
function orderedCues(doc) {
  const cues = doc?.cues || [];
  const byId = new Map(cues.map(c => [c?.uuid?.string, c]));
  const out = [], used = new Set();
  for (const g of doc?.cueGroups || []) {
    for (const id of g?.cueIdentifiers || []) {
      const c = byId.get(id?.string);
      if (c && !used.has(c)) { out.push(c); used.add(c); }
    }
  }
  for (const c of cues) if (!used.has(c)) out.push(c);
  return out;
}

// Pairs of [baseIndex, curIndex] for cues that are the same slide in both:
// same UUID, else (for the rest) a longest-common-subsequence over labels,
// so inserted, deleted and moved slides drop out instead of shifting every
// later comparison.
function alignCues(baseCues, curCues) {
  const curById = new Map();
  curCues.forEach((c, j) => { if (c?.uuid?.string) curById.set(c.uuid.string, j); });
  const pairs = [], takenA = new Set(), takenB = new Set();
  baseCues.forEach((c, i) => {
    const j = curById.get(c?.uuid?.string);
    if (j !== undefined && !takenB.has(j)) { pairs.push([i, j]); takenA.add(i); takenB.add(j); }
  });
  const restA = baseCues.map((_, i) => i).filter(i => !takenA.has(i));
  const restB = curCues.map((_, j) => j).filter(j => !takenB.has(j));
  for (const [x, y] of lcsByLabel(restA.map(i => baseCues[i]), restB.map(j => curCues[j]))) pairs.push([restA[x], restB[y]]);
  return pairs;
}

function lcsByLabel(baseCues, curCues) {
  const a = baseCues.map(cueLabel), b = curCues.map(cueLabel);
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  }
  const pairs = [];
  for (let i = 0, j = 0; i < n && j < m;) {
    if (a[i] === b[j]) { pairs.push([i, j]); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

/**
 * Deep-diff two decoded .pro Presentation objects. Returns a flat array of
 * change records: { slideIndex, slideLabel, cueKey, elementName, path,
 * oldValue, newValue, kind } — kind is 'changed' | 'added' | 'removed' for
 * element/field changes, or 'slideAdded' | 'slideRemoved' for whole slides
 * added or deleted in Pro7 (shown, never merged). slideIndex is the slide's
 * position in Pro7's copy; cueKey ({ label, occ }) is what applyChanges uses
 * to find the same slide in a fresh export. elementName is null for changes
 * outside a specific named element (cue/action-level fields).
 */
function diffPresentations(baseline, current) {
  const changes = [];
  const baseCues = orderedCues(baseline);
  const curCues  = orderedCues(current);
  const baseKeys = cueKeys(baseCues);
  const pairs = alignCues(baseCues, curCues);
  const matchedBase = new Set(pairs.map(p => p[0])), matchedCur = new Set(pairs.map(p => p[1]));

  baseCues.forEach((c, i) => {
    if (!matchedBase.has(i)) changes.push({ slideIndex: null, slideLabel: baseKeys[i].label, cueKey: baseKeys[i],
      elementName: null, path: '', oldValue: 'present', newValue: null, kind: 'slideRemoved', mergeable: false });
  });
  curCues.forEach((c, j) => {
    if (!matchedCur.has(j)) changes.push({ slideIndex: j + 1, slideLabel: cueLabel(c), cueKey: null,
      elementName: null, path: '', oldValue: null, newValue: 'present', kind: 'slideAdded', mergeable: false });
  });

  for (const [i, j] of pairs) {
    const local = [];
    deepDiff(baseCues[i], curCues[j], '', local);
    for (const d of local) {
      changes.push({
        slideIndex: j + 1, slideLabel: baseKeys[i].label, cueKey: baseKeys[i],
        elementName: d.elementName ?? null,
        path: d.path, oldValue: d.oldValue, newValue: d.newValue,
        kind: d.kind || 'changed',
        mergeable: d.mergeable !== false,
        mergeData: d.mergeData,
      });
    }
  }
  // Slide order, so the list reads top to bottom like the deck.
  return changes.sort((x, y) => (x.slideIndex ?? Infinity) - (y.slideIndex ?? Infinity));
}

// ─── Merge: reapply detected changes onto a freshly-generated structure ───

function tokenizePath(path) {
  const tokens = [];
  const re = /([^.[\]]+)|\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(path))) {
    tokens.push(m[1] !== undefined ? { key: m[1] } : { bracket: m[2] });
  }
  return tokens;
}

// Walks `tokens` from `root`, resolving to the container holding the FINAL
// segment. Mirrors diffPresentations' own path shape exactly (numeric
// bracket = array index, non-numeric bracket = name-lookup in an elements-
// shaped array), since these paths are only ever meaningful to each other.
function resolvePath(root, tokens) {
  let cur = root;
  for (let i = 0; i < tokens.length - 1; i++) {
    if (cur == null) return null;
    const t = tokens[i];
    if ('key' in t) {
      cur = cur[t.key];
    } else if (Array.isArray(cur)) {
      cur = /^\d+$/.test(t.bracket) ? cur[+t.bracket]
        : unwrapElement(cur[cur.findIndex(w => (unwrapElement(w) || {}).name === t.bracket)]);
    } else {
      return null;
    }
  }
  if (cur == null) return null;
  const last = tokens[tokens.length - 1];
  if ('key' in last) return { container: cur, key: last.key };
  if (!Array.isArray(cur)) return null;
  if (/^\d+$/.test(last.bracket)) return { container: cur, key: +last.bracket };
  const idx = cur.findIndex(w => (unwrapElement(w) || {}).name === last.bracket);
  return { container: cur, key: idx, isArrayName: true, found: idx !== -1 };
}

/**
 * Reapplies changes (from diffPresentations) onto `target` — a freshly
 * generated decoded structure — IN PLACE, finding each slide by its label
 * (cueKey) and each element by name, like the diff. Skips: whole slides
 * added/deleted in Pro7, changes whose slide isn't in the new export, and mergeable:false changes (text content outside the one
 * supported case — see deepDiff's rtfData handling for why). `style` is the
 * resolved style scheme (builder.js's resolveStyle output) — needed only for
 * reapplying a Scripture body text-content change through rtfBody, which
 * this is a no-op without. Returns `target` for convenience.
 */
function applyChanges(target, changes, style = {}) {
  const targetCues = orderedCues(target);
  const targetKeys = cueKeys(targetCues);
  const findCue = key => {
    const i = targetKeys.findIndex(k => k.label === key.label && k.occ === key.occ);
    return i === -1 ? null : targetCues[i];
  };
  for (const change of changes) {
    if (change.mergeable === false || !change.cueKey) continue;
    if (change.kind === 'slideAdded' || change.kind === 'slideRemoved' || change.kind === 'structural') continue;
    // The same slide in the new export (matched by label, like the diff) —
    // the deck may have gained or lost slides in DeckPro since, so its
    // position isn't reliable.
    const cue = findCue(change.cueKey);
    if (!cue) continue;

    // Text-content change: the diff's path is a cosmetic rename
    // (".text.text") for display — the real field is ".text.rtfData", and
    // needs fresh RTF rendered by the SAME renderer that element's kind
    // uses (see TEXT_MERGE_KIND / textMergeKindFor in the diff above), not
    // a raw value set — each renderer has its own RTF structure.
    if (change.mergeData?.kind) {
      const textLoc = resolvePath(cue, tokenizePath(change.path.replace(/\.text$/, '.rtfData')));
      if (textLoc && !textLoc.isArrayName) {
        const { kind, spans, text } = change.mergeData;
        textLoc.container[textLoc.key] =
          kind === 'title'     ? rtf.rtfTitle(text, style) :
          kind === 'startEnd'  ? rtf.rtfStartEnd(text, style) :
          kind === 'pointBody' ? rtf.rtfPointBody(spans, style) :
          rtf.rtfBody(spans, style);
      }
      continue;
    }

    const loc = resolvePath(cue, tokenizePath(change.path));
    if (!loc) continue;

    if (change.kind === 'added') {
      if (loc.isArrayName && !loc.found && change.mergeData?.element) {
        loc.container.push({ element: change.mergeData.element });
      }
      continue;
    }
    if (change.kind === 'removed') {
      if (loc.isArrayName && loc.found) loc.container.splice(loc.key, 1);
      continue;
    }
    // 'changed'
    if (loc.isArrayName ? loc.found : true) loc.container[loc.key] = change.newValue;
  }
  return target;
}

module.exports = { diffPresentations, applyChanges, deepDiff, friendlyRtf };
