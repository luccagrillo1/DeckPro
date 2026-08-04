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
 *  - cues matched by INDEX — DeckPro and a normal Pro7 editing session both
 *    preserve cue order/count; a count mismatch (slide added/removed in
 *    Pro7) is reported as a single structural change rather than guessed at.
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

// Good enough for a human-readable diff, not a full RTF parser: strips
// control words/braces/hex-escapes, leaving the visible text run.
function friendlyRtf(rtfData) {
  if (!rtfData) return '';
  const raw = rtfString(rtfData);
  const bodyStart = raw.indexOf('\\pard');
  const tail = bodyStart >= 0 ? raw.slice(bodyStart) : raw;
  return tail
    .replace(/\\'[0-9a-fA-F]{2}/g, '')
    .replace(/\\[a-zA-Z]+-?\d*/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
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
  if (/(^|\.)rtfData$/.test(path)) {
    const ta = friendlyRtf(a), tb = friendlyRtf(b);
    if (ta === tb) return;
    if (ctx.textMergeKind) {
      // Parsed as spans/plain text per the element's own renderer (not just
      // flattened display text) so a real edit — including bold/emphasis
      // boundaries where the renderer supports them — can be reapplied by
      // re-running it back through that renderer, rather than risking a
      // hand-spliced RTF string. See TEXT_MERGE_KIND for what's parsed how.
      const mergeData = ctx.textMergeKind === 'pointBody' ? { spans: rtf.parsePointBodySpans(b) }
        : (ctx.textMergeKind === 'title' || ctx.textMergeKind === 'startEnd') ? { text: tb }
        : { spans: rtf.parseRtfSpans(b) };
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
// Response Card Hold (the only things that ever set that element; blank
// slides render no visible element at all, their confidence-monitor text
// only ever reaches the notes field, not a slide element).
// Response Card's "Response Card"/"Response 1/2/3" cues build their body+
// title elements with these exact same rtfBody/rtfTitle calls (see
// builder.js's makeRCSlide1), so classifyElements' body+title→'scripture'
// heuristic already covers them here for free — no separate case needed.
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

/**
 * Deep-diff two decoded .pro Presentation objects. Returns a flat array of
 * change records: { slideIndex, slideLabel, elementName, path, oldValue,
 * newValue, kind } — kind is 'changed' | 'added' | 'removed' | 'structural'.
 * elementName is null for changes outside a specific named element (cue/
 * action-level fields — macros, props, transitions, build order, etc).
 */
function diffPresentations(baseline, current) {
  const changes = [];
  const baseCues = baseline?.cues || [];
  const curCues  = current?.cues  || [];

  if (baseCues.length !== curCues.length) {
    changes.push({
      slideIndex: null, slideLabel: null, elementName: null,
      path: 'cues.length', oldValue: baseCues.length, newValue: curCues.length,
      kind: 'structural',
    });
  }

  const n = Math.min(baseCues.length, curCues.length);
  for (let i = 0; i < n; i++) {
    const baseCue = baseCues[i], curCue = curCues[i];
    const slideLabel = cueLabel(curCue) || cueLabel(baseCue);
    const slideIndex = i + 1;

    const local = [];
    deepDiff(baseCue, curCue, '', local);
    for (const d of local) {
      changes.push({
        slideIndex, slideLabel,
        elementName: d.elementName ?? null,
        path: d.path, oldValue: d.oldValue, newValue: d.newValue,
        kind: d.kind || 'changed',
        mergeable: d.mergeable !== false,
        mergeData: d.mergeData,
      });
    }
  }
  return changes;
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
 * generated decoded structure — IN PLACE, using the same cue-index +
 * element-name matching as the diff. Skips: structural changes (cue count
 * mismatches — nothing sensible to reapply), changes whose target cue
 * doesn't exist, and mergeable:false changes (text content outside the one
 * supported case — see deepDiff's rtfData handling for why). `style` is the
 * resolved style scheme (builder.js's resolveStyle output) — needed only for
 * reapplying a Scripture body text-content change through rtfBody, which
 * this is a no-op without. Returns `target` for convenience.
 */
function applyChanges(target, changes, style = {}) {
  for (const change of changes) {
    if (change.kind === 'structural' || change.slideIndex == null) continue;
    if (change.mergeable === false) continue;
    const cue = target?.cues?.[change.slideIndex - 1];
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
