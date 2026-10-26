'use strict';

// ─── DeckPro Cloud — account sign-in + background deck sync ──────────────────
//
// Talks to the deckpro-sync Worker (cloud/). The local SQLite library stays the
// source of truth on this Mac; this module keeps it in step with the account:
//   push  — decks edited here (cloud_pending) and permanent deletes
//   pull  — everything changed on the server since our cursor
// The app UI reads status from here and reloads the open deck when a pull
// changes it. Settings (styles, preferences) are synced by the app itself
// through settingsPull/settingsPush, which just proxy to the server.
//
// The session token lives in <data dir>/cloud.json (mode 600). Nothing that
// belongs to this computer alone — Pro7 password, API keys, folders — is ever
// uploaded: MACHINE_CONFIG_KEYS are stripped from each deck before pushing.

const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const crypto = require('crypto');
const library = require('./library');

const ROOT_DIR = process.env.DECKPRO_DATA_DIR ||
  path.join(os.homedir(), 'Library', 'Application Support', 'DeckPro');
const ACCOUNT_FILE = path.join(ROOT_DIR, 'cloud.json');
const CLOUD_URL = (process.env.DECKPRO_CLOUD_URL || 'https://deckpro-sync.luccagrillo1.workers.dev').replace(/\/$/, '');
// e2e runs never reach the real server unless a test server is named.
const ENABLED = !(process.env.DECKPRO_E2E === '1' && !process.env.DECKPRO_CLOUD_URL);

const MACHINE_CONFIG_KEYS = [
  'pro7Port', 'pro7Password', 'pro7RootFolder', 'pro7LibraryFolder', 'styleSampleLibraryFolder', 'autoManagePro7',
  'outputFolder', 'setupComplete', 'icloudSync', 'theme', 'updateChannel', 'bibleApiKey',
  // Stage screen UUIDs are made by each Mac's own Pro7 install.
  'stageScreen',
];
const SYNC_EVERY_MS  = 10 * 1000;
const NUDGE_DELAY_MS = 3 * 1000;
// Pull re-reads a few seqs before the cursor: two writes can commit out of seq
// order, and re-applying a deck we already have is a no-op.
const PULL_OVERLAP = 20;

const deviceName = () => os.hostname().replace(/\.local$/, '');

let account = null;         // { token, user, cursorOwner }
let status  = { state: 'off', lastSync: null, error: null };
let syncing = false;
let syncAgain = false;
let timer = null;
let nudgeTimer = null;
let login = null;           // { nonce, startedAt, error }
let changeSeq = 0;          // bumps whenever a pull changes local decks
const changes = [];         // [{ seq, id, kind }] — last 200, for the UI to catch up

function loadAccount() {
  try { account = JSON.parse(fs.readFileSync(ACCOUNT_FILE, 'utf8')); } catch (_) { account = null; }
  if (account && !account.token) account = null;
}
function saveAccount() {
  fs.mkdirSync(ROOT_DIR, { recursive: true });
  if (account) fs.writeFileSync(ACCOUNT_FILE, JSON.stringify(account, null, 2), { mode: 0o600 });
  else try { fs.unlinkSync(ACCOUNT_FILE); } catch (_) {}
}

async function api(method, route, body, token = account?.token) {
  const res = await fetch(CLOUD_URL + route, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const data = await res.json().catch(() => ({ ok: false, error: `Server error ${res.status}` }));
  if (res.status === 401 && data.signedOut && token) {
    // The session was revoked (signed out from another device or the server).
    account = null; saveAccount();
    status = { state: 'off', lastSync: null, error: 'Signed out' };
    throw Object.assign(new Error('Signed out'), { signedOut: true });
  }
  return data;
}

// ─── Sign-in ──────────────────────────────────────────────────────────────────

async function startSignIn() {
  if (!ENABLED) return { ok: false, error: 'Cloud sync is off in test runs' };
  const nonce = crypto.randomBytes(32).toString('base64url');
  try {
    const r = await api('POST', '/auth/begin', { nonce, device: deviceName() }, null);
    if (!r.ok) return { ok: false, error: r.error || 'Couldn’t reach DeckPro Cloud' };
  } catch (_) {
    return { ok: false, error: 'Couldn’t reach DeckPro Cloud — check your internet connection' };
  }
  login = { nonce, startedAt: Date.now(), error: null };
  pollLogin(nonce);
  return { ok: true, url: `${CLOUD_URL}/auth/start?nonce=${encodeURIComponent(nonce)}` };
}

async function pollLogin(nonce) {
  while (login && login.nonce === nonce) {
    if (Date.now() - login.startedAt > 15 * 60 * 1000) { login.error = 'Sign-in timed out'; return; }
    await new Promise(r => setTimeout(r, 2000));
    if (!login || login.nonce !== nonce) return;
    try {
      const r = await api('POST', '/auth/poll', { nonce }, null);
      if (r.pending) continue;
      if (!r.ok) { login.error = r.error || 'Sign-in failed'; return; }
      const prevOwner = library.cloudGetMeta('cloud_account');
      if (prevOwner !== r.user.id) {
        // A different account (or first sign-in): this library has never synced with it.
        library.cloudReset();
        library.cloudSetMeta('cloud_account', r.user.id);
      }
      account = { token: r.token, user: r.user };
      saveAccount();
      login = null;
      status = { state: 'syncing', lastSync: null, error: null };
      start();
      syncNow();
      return;
    } catch (_) { /* offline — keep polling */ }
  }
}

function cancelSignIn() { login = null; }

async function signOut() {
  if (account) {
    try { await api('POST', '/auth/signout', {}); } catch (_) {}
  }
  account = null;
  saveAccount();
  // Keep every deck here; mark them unsynced so a later sign-in uploads them.
  library.cloudReset();
  library.cloudSetMeta('cloud_account', '');
  status = { state: 'off', lastSync: null, error: null };
  stop();
  return { ok: true };
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

// What goes up: the deck minus this Mac's machine settings and view state.
function stripForUpload(state) {
  if (!state) return state;
  const out = { ...state };
  for (const k of library.UI_STATE_KEYS) delete out[k];
  if (out.config) {
    out.config = { ...out.config };
    for (const k of MACHINE_CONFIG_KEYS) delete out.config[k];
  }
  return out;
}

function noteChange(id, kind) {
  changeSeq++;
  changes.push({ seq: changeSeq, id, kind });
  if (changes.length > 200) changes.shift();
}

function applyRemote(deck, force = false) {
  const r = library.cloudApplyRemote(deck, { force, keepConfigKeys: MACHINE_CONFIG_KEYS });
  if (r !== 'skipped') noteChange(deck.id, r);
  return r;
}

async function pushAll() {
  for (const t of library.cloudTombstones()) {
    const r = await api('POST', '/decks/push', { decks: [{ id: t.id, baseRev: t.rev, deleted: true, updatedAt: t.deleted_at }] });
    const res = r.results?.[0];
    if (!res || res.error) throw new Error(res?.error || r.error || 'Push failed');
    library.cloudClearTombstone(t.id);
    // A delete that lost (edited elsewhere) brings the edited deck back here.
    if (res.winner === 'server' && res.server) applyRemote(res.server, true);
  }
  for (let round = 0; round < 50; round++) {
    const batch = library.cloudPendingDecks(10);
    if (!batch.length) return;
    const r = await api('POST', '/decks/push', {
      decks: batch.map(d => ({ ...d, state: stripForUpload(d.state) })),
    });
    if (!r.ok) throw new Error(r.error || 'Push failed');
    for (const res of r.results || []) {
      const sent = batch.find(d => d.id === res.id);
      if (!sent || res.error) continue;
      if (res.winner === 'server' && res.server) {
        // Our version lost a conflict; the server kept it as a "(conflicted
        // copy)" deck, which the pull below brings in. Take the winner here.
        applyRemote(res.server, true);
      } else {
        library.cloudMarkPushed(res.id, res.rev, sent.updatedAt);
      }
    }
    if (r.results?.some(x => x.error)) throw new Error('Some decks didn’t sync — will retry');
  }
}

async function pullAll() {
  let cursor = parseInt(library.cloudGetMeta('cloud_cursor') || '0', 10) || 0;
  for (let round = 0; round < 200; round++) {
    const r = await api('GET', `/decks/pull?since=${Math.max(0, cursor - PULL_OVERLAP)}`);
    if (!r.ok) throw new Error(r.error || 'Pull failed');
    for (const d of r.decks) applyRemote(d);
    if (r.cursor > cursor) { cursor = r.cursor; library.cloudSetMeta('cloud_cursor', String(cursor)); }
    if (!r.more) return;
  }
}

async function syncNow() {
  if (!ENABLED || !account) return;
  if (syncing) { syncAgain = true; return; }
  syncing = true;
  status = { ...status, state: 'syncing' };
  try {
    do {
      syncAgain = false;
      await pushAll();
      await pullAll();
    } while (syncAgain);
    status = { state: 'synced', lastSync: new Date().toISOString(), error: null };
  } catch (err) {
    if (err.signedOut) return;
    const offline = err.name === 'TimeoutError' || /fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(err.message || '');
    status = { ...status, state: offline ? 'offline' : 'error', error: offline ? 'Offline — will retry' : err.message };
  } finally {
    syncing = false;
  }
}

// Called after any local deck write: sync soon, batching bursts of edits.
function nudge() {
  if (!account) return;
  clearTimeout(nudgeTimer);
  nudgeTimer = setTimeout(syncNow, NUDGE_DELAY_MS);
}

function start() {
  stop();
  if (!ENABLED || !account) return;
  timer = setInterval(syncNow, SYNC_EVERY_MS);
}
function stop() { clearInterval(timer); timer = null; clearTimeout(nudgeTimer); }

function init() {
  loadAccount();
  if (account) { start(); syncNow(); }
}

// ─── Status / account / settings ─────────────────────────────────────────────

function getStatus(since = 0) {
  return {
    ok: true,
    available: ENABLED,
    signedIn: !!account,
    user: account?.user || null,
    device: deviceName(),
    state: status.state,
    lastSync: status.lastSync,
    error: status.error,
    pending: account ? library.cloudPendingCount() : 0,
    signingIn: !!login && !login.error,
    signInError: login?.error || null,
    changeSeq,
    changes: changes.filter(c => c.seq > since),
  };
}

async function getAccount() {
  if (!account) return { ok: false, signedIn: false };
  try { return await api('GET', '/me'); }
  catch (err) { return { ok: false, error: err.message }; }
}

async function settingsPull() {
  if (!account) return { ok: false, available: false };
  try {
    const r = await api('GET', '/settings');
    return r.ok ? { ok: true, available: true, doc: r.doc } : { ok: false, available: false, error: r.error };
  } catch (err) { return { ok: false, available: false, error: err.message }; }
}

async function settingsPush(doc) {
  if (!account) return { ok: false, available: false };
  try {
    const r = await api('POST', '/settings', { doc });
    return r.ok ? { ok: true, available: true, doc: r.doc } : { ok: false, error: r.error };
  } catch (err) { return { ok: false, error: err.message }; }
}

module.exports = {
  init, startSignIn, cancelSignIn, signOut, syncNow, nudge,
  getStatus, getAccount, settingsPull, settingsPush, MACHINE_CONFIG_KEYS,
};
