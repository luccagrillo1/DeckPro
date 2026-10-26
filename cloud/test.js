// Protocol test for the DeckPro Cloud worker. Run against `npm run dev`:
//   node test.js            (defaults to http://localhost:8787)
// Uses the DEV_AUTH login, so it only works against a local dev server.
'use strict';
const BASE = process.argv[2] || 'http://localhost:8787';
const assert = require('assert');
let passed = 0;
const ok = (cond, msg) => { assert.ok(cond, msg); passed++; console.log('  ✓ ' + msg); };

async function call(method, path, { token, body, device } = {}) {
  const res = await fetch(BASE + path, {
    method, headers: { 'Content-Type': 'application/json', ...(device ? { 'X-DeckPro-Device': device } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, ...(await res.json()) };
}

async function signIn(email, device) {
  const nonce = require('crypto').randomBytes(24).toString('base64url');
  await call('POST', '/auth/begin', { body: { nonce, device } });
  const pending = await call('POST', '/auth/poll', { body: { nonce } });
  const r = await fetch(`${BASE}/auth/dev?nonce=${nonce}&email=${encodeURIComponent(email)}&device=${device}`).then(r => r.json());
  if (!r.ok) throw new Error(r.error);
  const p = await call('POST', '/auth/poll', { body: { nonce } });
  const again = await call('POST', '/auth/poll', { body: { nonce } });
  return { token: p.token, user: p.user, pendingBefore: pending, again };
}

(async () => {
  const email = `t${Date.now()}@example.com`;
  const a = await signIn(email, 'MacA');
  ok(a.token && a.user.email === email, 'device A signs in');
  ok(a.pendingBefore.pending, 'a registered login polls as pending until finished');
  ok(a.again.expired, 'a login nonce hands out its token only once');
  const b = await signIn(email, 'MacB');
  ok(b.user.id === a.user.id, 'device B signs into the same account');
  const meA = await call('GET', '/me', { token: a.token });
  ok(meA.devices.length === 2 && meA.devices.filter(d => d.current).length === 1, '/me lists both devices');
  ok((await call('GET', '/me')).status === 401, 'no token → 401');

  // Push from A, pull on B.
  const deck = { id: 'deck-1', baseRev: 0, updatedAt: '2026-10-24T10:00:00.000Z', meta: { title: 'Fill Me', series: 'S' }, state: { slides: [1], config: { messageTitle: 'Fill Me' } } };
  const p1 = await call('POST', '/decks/push', { token: a.token, body: { decks: [deck] } });
  ok(p1.results[0].rev === 1 && p1.results[0].winner === 'client', 'A pushes a new deck at rev 1');
  const pull1 = await call('GET', '/decks/pull?since=0', { token: b.token });
  ok(pull1.decks.length === 1 && pull1.decks[0].state.slides[0] === 1, 'B pulls it');
  const cursorB = pull1.cursor;

  // Clean update from B.
  const p2 = await call('POST', '/decks/push', { token: b.token, body: { decks: [{ ...deck, baseRev: 1, updatedAt: '2026-10-24T10:05:00.000Z', state: { slides: [1, 2] } }] } });
  ok(p2.results[0].rev === 2 && !p2.results[0].conflictCopyId, 'B edits on top of rev 1 → rev 2, no conflict');

  // A still thinks rev 1 and edits later → A newer wins, B's version kept as copy.
  const p3 = await call('POST', '/decks/push', { token: a.token, body: { decks: [{ ...deck, baseRev: 1, updatedAt: '2026-10-24T10:09:00.000Z', state: { slides: ['A'] } }] } });
  ok(p3.results[0].winner === 'client' && p3.results[0].rev === 3 && p3.results[0].conflictCopyId, 'stale but newer edit wins and makes a conflicted copy');
  const pull2 = await call('GET', `/decks/pull?since=${cursorB}`, { token: b.token });
  const main = pull2.decks.find(d => d.id === 'deck-1');
  const copy = pull2.decks.find(d => d.id === p3.results[0].conflictCopyId);
  ok(main.state.slides[0] === 'A', 'B pulls the winning version');
  ok(copy && copy.meta.title === 'Fill Me (conflicted copy)' && copy.state.slides.length === 2 && copy.state.currentDeckId === copy.id, 'B’s losing version survives as "(conflicted copy)"');

  // Stale and OLDER edit → server wins, client's version becomes the copy.
  const p4 = await call('POST', '/decks/push', { token: b.token, body: { decks: [{ ...deck, baseRev: 2, updatedAt: '2026-10-24T10:06:00.000Z', state: { slides: ['old'] } }] } });
  ok(p4.results[0].winner === 'server' && p4.results[0].server.state.slides[0] === 'A' && p4.results[0].conflictCopyId, 'stale older edit loses; response carries the server copy to apply');

  // Stale push with identical content (key order shuffled) → no conflicted copy.
  const p4b = await call('POST', '/decks/push', { token: b.token, body: { decks: [{ id: 'deck-1', baseRev: 2, updatedAt: '2026-10-24T10:10:00.000Z', meta: { series: 'S', title: 'Fill Me' }, state: { slides: ['A'] } }] } });
  ok(p4b.results[0].winner === 'client' && !p4b.results[0].conflictCopyId && p4b.results[0].rev === 4, 'stale push with the same content merges without a copy');

  // Delete that didn't see the latest edit doesn't destroy it.
  const p5 = await call('POST', '/decks/push', { token: b.token, body: { decks: [{ id: 'deck-1', baseRev: 2, deleted: true, updatedAt: '2026-10-24T11:00:00.000Z' }] } });
  ok(p5.results[0].winner === 'server', 'a stale delete doesn’t wipe a newer edit');
  const p6 = await call('POST', '/decks/push', { token: b.token, body: { decks: [{ id: 'deck-1', baseRev: 4, deleted: true, updatedAt: '2026-10-24T11:00:00.000Z' }] } });
  ok(p6.results[0].rev === 5, 'an up-to-date delete becomes a tombstone');
  const pull3 = await call('GET', `/decks/pull?since=${pull2.cursor}`, { token: a.token });
  ok(pull3.decks.some(d => d.id === 'deck-1' && d.deleted && d.state === null), 'A pulls the tombstone');

  // Settings: per-section newest wins, concurrent pushes merge.
  const docA = { schemaVersion: 1, sections: { speakers: { data: ['Kevin'], updatedAt: 100 }, displayNames: { data: { a: 1 }, updatedAt: 50 }, palettes: { items: { p1: { id: 'p1', data: { n: 'A' }, updatedAt: 100, deletedAt: null } } } } };
  const docB = { schemaVersion: 1, sections: { speakers: { data: ['Old'], updatedAt: 90 }, displayNames: { data: { a: 2 }, updatedAt: 60 }, palettes: { items: { p2: { id: 'p2', data: { n: 'B' }, updatedAt: 80, deletedAt: null }, p1: { id: 'p1', data: null, updatedAt: 0, deletedAt: 70 } } } } };
  await call('POST', '/settings', { token: a.token, body: { doc: docA } });
  const s2 = await call('POST', '/settings', { token: b.token, body: { doc: docB } });
  const sec = s2.doc.sections;
  ok(sec.speakers.data[0] === 'Kevin' && sec.displayNames.data.a === 2, 'settings merge per section by newest');
  ok(sec.palettes.items.p1.data.n === 'A' && sec.palettes.items.p2.data.n === 'B', 'palettes merge per item; an older delete doesn’t remove a newer edit');
  ok(s2.doc.updatedAt === 100, 'merged doc carries the newest timestamp');
  const g = await call('GET', '/settings', { token: b.token });
  ok(g.doc.sections.speakers.data[0] === 'Kevin', 'GET /settings returns the merged doc');

  // Another account can't see these decks.
  const other = await signIn(`other${Date.now()}@example.com`, 'MacC');
  const pullOther = await call('GET', '/decks/pull?since=0', { token: other.token });
  ok(pullOther.decks.length === 0, 'a different account sees none of it');

  // Sign out revokes only that device.
  await call('POST', '/auth/signout', { token: b.token });
  ok((await call('GET', '/me', { token: b.token })).status === 401, 'signed-out device token stops working');
  ok((await call('GET', '/me', { token: a.token })).ok, 'the other device stays signed in');

  // ── Main Mac ──────────────────────────────────────────────────────────────
  const em = `m${Date.now()}@example.com`;
  const M = await signIn(em, 'MainMac'), F = await signIn(em, 'OtherMac');
  const mc = (method, path, body) => call(method, path, { token: M.token, device: 'dev-main', body });
  const fc = (method, path, body) => call(method, path, { token: F.token, device: 'dev-follow', body });
  const mdeck = (id, v, baseRev) => ({ id, baseRev, updatedAt: new Date().toISOString(), meta: { title: id }, state: { v } });
  ok((await fc('GET', '/main')).main.set === false, 'no main Mac by default');
  ok((await fc('POST', '/decks/push', { decks: [mdeck('free', 1, 0)] })).results[0].winner === 'client', 'with no main, any Mac pushes');
  const setM = await mc('POST', '/main', { main: true });
  ok(setM.main.set && setM.main.isMe && setM.main.online && setM.main.name === 'MainMac', 'a Mac becomes the main');
  const fm = (await fc('GET', '/decks/pull?since=0')).main;
  ok(fm.set && !fm.isMe && fm.online && fm.name === 'MainMac', 'the other Mac sees the main online in its pull');
  const heldOn = await fc('POST', '/decks/push', { approved: true, decks: [mdeck('x', 'F', 0)] });
  ok(heldOn.status === 409 && heldOn.held, 'follower push is held while the main is online (even approved)');
  ok((await fc('POST', '/settings', { approved: true, doc: { sections: {} } })).held, 'follower settings push is held too');
  await mc('POST', '/main/bye', {});
  ok((await fc('GET', '/main')).main.online === false, 'main says goodbye on quit → offline');
  ok((await fc('POST', '/decks/push', { decks: [mdeck('x', 'F', 0)] })).held, 'main offline, not approved → still held');
  const appr = await fc('POST', '/decks/push', { approved: true, decks: [mdeck('x', 'F1', 0)] });
  ok(appr.results[0].winner === 'client' && appr.results[0].rev === 1, 'main offline + approved → follower push goes through');
  // Main comes back with its own offline edit of the same deck (stale base): main wins, nothing kept.
  const mp = await mc('POST', '/decks/push', { decks: [mdeck('x', 'M', 0)] });
  ok(mp.results[0].winner === 'client' && !mp.results[0].conflictCopyId, 'main’s stale edit wins with no conflicted copy');
  const after = (await mc('GET', '/decks/pull?since=0')).decks;
  ok(after.filter(d => d.id === 'x').length === 1 && after.find(d => d.id === 'x').state.v === 'M' && !after.some(d => /conflicted/.test(d.meta.title || '')), 'only the main’s version exists');
  await mc('POST', '/main/bye', {});
  const fs1 = await fc('POST', '/decks/push', { approved: true, decks: [mdeck('x', 'F2', 1)] });
  ok(fs1.results[0].winner === 'server' && fs1.results[0].server.state.v === 'M' && !fs1.results[0].conflictCopyId, 'follower’s stale edit loses to the main’s, discarded');
  ok((await mc('POST', '/main', { main: false })).main.set === false, 'the main can be cleared');

  console.log(`\n${passed} passed`);
})().catch(e => { console.error('✗', e.message); process.exit(1); });
