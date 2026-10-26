// Merge/Override hand-edit detection (diffPresentation.js) against real
// encoded decks: a re-export with nothing changed reports nothing, Pro7 edits
// are found on the right slide even after slides are added/deleted, DeckPro's
// own auto-generated parts (queue, live badge) never show up, and Merge puts
// each edit back on the same slide in a fresh export whose slides moved.

const path = require('path');
const { encodeToBufferWithMerge } = require('./encode.js');
const { diffPresentations, applyChanges, friendlyRtf } = require('./diffPresentation.js');
const rtf = require('./rtf.js');

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { console.log('✅', name); pass++; }
  else { console.log('❌', name, detail !== undefined ? JSON.stringify(detail) : ''); fail++; }
}

const deck = require(path.join(__dirname, 'test/fixtures/decks/02-scripture-heavy.json'));
const snap = async spec => (await encodeToBufferWithMerge(JSON.parse(JSON.stringify(spec)))).snapshot;
const cueBy = (doc, label) => doc.cues.find(c => c.actions.some(a => a.type === 'ACTION_TYPE_PRESENTATION_SLIDE' && a.label?.text === label));
const elOf = (cue, name) => cue.actions.find(a => a.type === 'ACTION_TYPE_PRESENTATION_SLIDE')
  .slide.presentation.baseSlide.elements.map(e => e.element).find(e => e.name === name);

(async () => {
  const exported = await snap(deck);

  ok('a re-export with nothing edited reports no changes', diffPresentations(exported, await snap(deck)).length === 0,
     diffPresentations(exported, await snap(deck)).slice(0, 3));

  // ── A plain Pro7 re-save (no edits): it stores the cues in any order (the
  //    slide order lives in cueGroups), re-encodes the same text its own way,
  //    and re-derives each box's text attributes. None of that is an edit.
  const resaved = JSON.parse(JSON.stringify(exported));
  resaved.cues.reverse();
  for (const c of resaved.cues) {
    for (const e of c.actions.find(a => a.slide)?.slide.presentation.baseSlide.elements.map(w => w.element) || []) {
      if (e.name !== 'body' || !e.text?.rtfData) continue;
      const words = friendlyRtf(e.text.rtfData).replace(/’/g, '\\uc0\\u8217 ').replace(/\n/g, '\\\n');
      e.text.rtfData = Buffer.from(`{\\rtf1\\ansi\\ansicpg1252\\cocoartf2870\n{\\fonttbl\\f0\\fswiss\\fcharset0 Helvetica;}\n\\pard\\qc\\f0\\fs88 ${words}}`, 'latin1').toString('base64');
      if (e.text.attributes) e.text.attributes.paragraphStyle = { ...(e.text.attributes.paragraphStyle || {}), alignment: 'ALIGNMENT_CENTER' };
    }
  }
  const resaveChanges = diffPresentations(exported, resaved);
  ok('a plain Pro7 re-save (cue order, text encoding, attributes) reports no changes', resaveChanges.length === 0,
     resaveChanges.slice(0, 3).map(c => [c.slideLabel, c.path, c.oldValue, c.newValue]));

  // ── Simulated Pro7 session: move + retype one slide, delete another,
  //    and touch every queue list (which DeckPro rebuilds anyway).
  const installed = JSON.parse(JSON.stringify(exported));
  const eph = elOf(cueBy(installed, 'Ephesians 5:18'), 'body');
  eph.bounds.origin.x += 50;
  eph.text.rtfData = Buffer.from(Buffer.from(rtf.rtfBody([{ text: 'Do not get drunk on wine.' }]), 'base64')).toString('base64');
  installed.cues.splice(installed.cues.indexOf(cueBy(installed, '2 Corinthians 3:18')), 1);
  for (const c of installed.cues) {
    const q = c.actions.find(a => a.slide)?.slide.presentation.baseSlide.elements.map(e => e.element).find(e => e.name === 'queue');
    if (q?.text?.attributes?.font) q.text.attributes.font.size = 32;
  }

  // A second slide retyped in Pro7's own RTF encoding (what a real edit
  // looks like), not DeckPro's.
  elOf(cueBy(installed, 'Ephesians 5:19-21'), 'body').text.rtfData = Buffer.from(
    '{\\rtf1\\ansi\\ansicpg1252\\cocoartf2870\n{\\fonttbl\\f0\\fswiss\\fcharset0 Helvetica;}\n\\pard\\f0\\fs88 Speak to one another\\uc0\\u8217 s hearts.}', 'latin1').toString('base64');
  const changes = diffPresentations(exported, installed);
  const slides = new Set(changes.map(c => c.slideLabel));
  ok('the deleted slide is reported once, as deleted', changes.filter(c => c.kind === 'slideRemoved').map(c => c.slideLabel).join() === '2 Corinthians 3:18',
     changes.filter(c => c.kind === 'slideRemoved'));
  ok('slides after the deleted one are still compared with themselves (no false edits)',
     [...slides].every(l => ['Ephesians 5:18', 'Ephesians 5:19-21', '2 Corinthians 3:18'].includes(l)), [...slides]);
  ok('the queue list is never reported', !changes.some(c => c.elementName === 'queue'));
  const ephChanges = changes.filter(c => c.slideLabel === 'Ephesians 5:18');
  ok('the move is found on its own slide', ephChanges.some(c => /bounds\.origin\.x$/.test(c.path) && c.newValue - c.oldValue === 50), ephChanges.map(c => c.path));
  ok('the retype is found as a mergeable text edit', ephChanges.some(c => /\.text\.text$/.test(c.path) && c.mergeable && /drunk on wine/.test(c.newValue)));

  // ── Next export: a slide was added at the top in DeckPro since. Merge must
  //    still land on Ephesians 5:18, not on whatever is now in its position.
  const grown = JSON.parse(JSON.stringify(deck));
  grown.slides.splice(1, 0, { type: 'scripture', label: 'John 1:1', reference: 'John 1:1', bodies: [[{ text: 'In the beginning was the Word.' }]], propName: 'John 1:1' });
  const fresh = await snap(grown);
  const before = elOf(cueBy(fresh, 'John 1:1'), 'body').bounds.origin.x;
  const merged = applyChanges(fresh, changes);
  const mEph = elOf(cueBy(merged, 'Ephesians 5:18'), 'body');
  ok('merge moves Ephesians 5:18 in the new export', mEph.bounds.origin.x === eph.bounds.origin.x, { got: mEph.bounds.origin.x, want: eph.bounds.origin.x });
  ok('merge keeps the retyped text', /drunk on wine/.test(friendlyRtf(mEph.text.rtfData)));
  const m2 = friendlyRtf(elOf(cueBy(merged, 'Ephesians 5:19-21'), 'body').text.rtfData);
  ok('merge of text retyped in Pro7 brings the words, not RTF code', m2 === 'Speak to one another’s hearts.', m2);
  ok('merge leaves the newly added slide alone', elOf(cueBy(merged, 'John 1:1'), 'body').bounds.origin.x === before);
  ok('merge does not delete the slide deleted in Pro7', !!cueBy(merged, '2 Corinthians 3:18'));

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
