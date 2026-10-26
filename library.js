'use strict';

// ─── DeckPro Library — durable deck storage (SQLite) ─────────────────────────
//
// Replaces localStorage deck persistence. Lives in the Electron userData dir
// (or a user-chosen synced folder via a pointer file). The deck state is
// stored as a JSON document alongside queryable metadata columns.
//
// Layout:
//   <root>/library-location.json   — optional pointer to a custom library dir
//   <libdir>/deckpro.db            — decks, generations, meta
//   <libdir>/backups/              — daily db backups + pre-migration JSON
//   <libdir>/assets/               — reserved for copied media/PDFs
//   <libdir>/exports/              — reserved for deck JSON exports
//
// journal_mode = DELETE on purpose: no .wal/.shm sidecar files, which keeps
// the db safe to place in iCloud Drive / Dropbox / shared folders.

const { DatabaseSync } = require('node:sqlite');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const ROOT_DIR = process.env.DECKPRO_DATA_DIR ||
  path.join(os.homedir(), 'Library', 'Application Support', 'DeckPro');

const POINTER_FILE = path.join(ROOT_DIR, 'library-location.json');
const SCHEMA_VERSION = 1;
const HOSTNAME = os.hostname();

let db      = null;
let LIB_DIR = null;

// ─── Location ─────────────────────────────────────────────────────────────────

function readPointer() {
  try {
    const p = JSON.parse(fs.readFileSync(POINTER_FILE, 'utf8'));
    if (p && p.libraryDir && fs.existsSync(p.libraryDir)) return p.libraryDir;
  } catch (_) {}
  return null;
}

function defaultLibraryDir() {
  return path.join(ROOT_DIR, 'library');
}

function resolveLibraryDir() {
  return readPointer() || defaultLibraryDir();
}

// ─── Open / schema ────────────────────────────────────────────────────────────

function open() {
  if (db) return;
  LIB_DIR = resolveLibraryDir();
  for (const sub of ['', 'backups', 'assets', 'exports']) {
    fs.mkdirSync(path.join(LIB_DIR, sub), { recursive: true });
  }
  db = new DatabaseSync(path.join(LIB_DIR, 'deckpro.db'));
  db.exec('PRAGMA journal_mode = DELETE');
  db.exec('PRAGMA synchronous = FULL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      id                TEXT PRIMARY KEY,
      series            TEXT DEFAULT '',
      title             TEXT DEFAULT '',
      date              TEXT DEFAULT '',
      speaker           TEXT DEFAULT '',
      scheme_id         TEXT DEFAULT '',
      slide_count       INTEGER DEFAULT 0,
      slide_types       TEXT DEFAULT '',
      status            TEXT DEFAULT 'active',
      is_template       INTEGER DEFAULT 0,
      notes_link        TEXT DEFAULT '',
      dirty             INTEGER DEFAULT 1,
      created_at        TEXT DEFAULT '',
      updated_at        TEXT DEFAULT '',
      last_opened_at    TEXT DEFAULT '',
      last_generated_at TEXT DEFAULT '',
      last_delivered_at TEXT DEFAULT '',
      last_export_path  TEXT DEFAULT '',
      last_saved_by     TEXT DEFAULT '',
      state_json        TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS generations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id    TEXT DEFAULT '',
      file_name  TEXT DEFAULT '',
      path       TEXT DEFAULT '',
      size_kb    INTEGER DEFAULT 0,
      delivered  INTEGER DEFAULT 0,
      created_at TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
    CREATE INDEX IF NOT EXISTS idx_decks_status ON decks(status);
    CREATE INDEX IF NOT EXISTS idx_gen_deck ON generations(deck_id);
  `);
  // Additive column migrations — CREATE TABLE IF NOT EXISTS above only
  // covers a brand-new db; existing dbs need ALTER TABLE for new columns.
  // node:sqlite has no "ADD COLUMN IF NOT EXISTS", so just swallow the
  // "duplicate column" error on every subsequent open.
  try { db.exec(`ALTER TABLE decks ADD COLUMN last_export_snapshot TEXT DEFAULT ''`); } catch (_) {}
  // Paired QR export writes two files (no-QR + QR); last_export_path already
  // tracks the no-QR/primary one (recordGeneration), this tracks the second.
  try { db.exec(`ALTER TABLE decks ADD COLUMN last_export_path_qr TEXT DEFAULT ''`); } catch (_) {}
  // DeckPro Cloud: cloud_rev = the server version this row is based on (0 =
  // never synced); cloud_pending = edited here since the last push. Existing
  // rows start pending so the first sign-in uploads them.
  try { db.exec(`ALTER TABLE decks ADD COLUMN cloud_rev INTEGER DEFAULT 0`); } catch (_) {}
  try { db.exec(`ALTER TABLE decks ADD COLUMN cloud_pending INTEGER DEFAULT 1`); } catch (_) {}
  // Permanent deletes of synced decks, waiting to be pushed.
  db.exec(`CREATE TABLE IF NOT EXISTS cloud_tombstones (id TEXT PRIMARY KEY, rev INTEGER, deleted_at TEXT)`);

  const ver = getMeta('schema_version');
  if (!ver) setMeta('schema_version', String(SCHEMA_VERSION));
  dailyBackup();
}

function close() {
  if (db) { try { db.close(); } catch (_) {} db = null; }
}

function getMeta(key) {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key);
  return row ? row.value : null;
}
function setMeta(key, value) {
  db.prepare('INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}

// ─── Backups ──────────────────────────────────────────────────────────────────

function dailyBackup() {
  try {
    const today  = new Date().toISOString().slice(0, 10);
    const dbPath = path.join(LIB_DIR, 'deckpro.db');
    const dest   = path.join(LIB_DIR, 'backups', `deckpro-${today}.db`);
    if (!fs.existsSync(dest) && fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, dest);
      // prune to most recent 14
      const backups = fs.readdirSync(path.join(LIB_DIR, 'backups'))
        .filter(f => /^deckpro-\d{4}-\d{2}-\d{2}\.db$/.test(f)).sort();
      while (backups.length > 14) {
        fs.unlinkSync(path.join(LIB_DIR, 'backups', backups.shift()));
      }
    }
  } catch (_) { /* backups are best-effort */ }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now() { return new Date().toISOString(); }

function summarizeSlides(state) {
  const slides = (state && state.slides) || [];
  const content = slides.filter(s => !['start', 'end'].includes(s.type));
  const counts = {};
  for (const s of content) counts[s.type] = (counts[s.type] || 0) + 1;
  const parts = Object.entries(counts).map(([t, n]) => `${n} ${t}`);
  return { slideCount: content.length, slideTypes: parts.join(' · ') };
}

// View-only parts of a deck's state: which slide is selected, whether blanks
// show in the sidebar. Changing them isn't an edit, and they never sync.
const UI_STATE_KEYS = ['activeId', 'showBlanks'];
function contentJson(json) {
  try {
    const st = typeof json === 'string' ? JSON.parse(json) : { ...json };
    for (const k of UI_STATE_KEYS) delete st[k];
    return JSON.stringify(st);
  } catch (_) { return null; }
}

function rowMeta(row) {
  // Everything except state_json — what the library list needs
  const { state_json, ...meta } = row;
  return meta;
}

// ─── Decks ────────────────────────────────────────────────────────────────────

function listDecks() {
  return db.prepare(`
    SELECT id, series, title, date, speaker, scheme_id, slide_count, slide_types,
           status, is_template, notes_link, dirty, created_at, updated_at,
           last_opened_at, last_generated_at, last_delivered_at, last_export_path, last_saved_by,
           -- json_valid guard: one corrupt state_json would otherwise fail the whole list
           CASE WHEN json_valid(state_json) THEN json_extract(state_json, '$.config.propCollection') END AS prop_collection
    FROM decks ORDER BY updated_at DESC
  `).all();
}

function getDeck(id) {
  const row = db.prepare('SELECT * FROM decks WHERE id = ?').get(id);
  if (!row) return null;
  let state = null;
  try { state = JSON.parse(row.state_json); } catch (_) {}
  return { ...rowMeta(row), state };
}

/**
 * Upsert a deck (full state save).
 * Optimistic concurrency: when baseUpdatedAt is provided and doesn't match
 * the stored row's updated_at, returns { conflict: true } unless force.
 */
function saveDeck({ id, series, title, date, speaker, schemeId, notesLink, state, baseUpdatedAt, force }) {
  const existing = db.prepare('SELECT updated_at, created_at, status, is_template, dirty, state_json, series, title, date, speaker, scheme_id, notes_link FROM decks WHERE id = ?').get(id);

  const ts = now();
  const { slideCount, slideTypes } = summarizeSlides(state);
  const stateJson = JSON.stringify(state);

  // Nothing changed except which slide is selected (or nothing at all, e.g. a
  // save echoed after opening the deck): store it, but keep the timestamp so
  // the deck isn't marked edited or re-synced.
  if (existing &&
      existing.series === (series || '') && existing.title === (title || '') &&
      existing.date === (date || '') && existing.speaker === (speaker || '') &&
      existing.scheme_id === (schemeId || '') && existing.notes_link === (notesLink || '') &&
      (existing.state_json === stateJson || contentJson(existing.state_json) === contentJson(stateJson))) {
    if (existing.state_json !== stateJson) db.prepare('UPDATE decks SET state_json = ? WHERE id = ?').run(stateJson, id);
    return { ok: true, updatedAt: existing.updated_at, unchanged: true };
  }

  // Checked after the no-op case: a stale save that carries the same content
  // (e.g. a view-only autosave racing a sync) isn't a conflict.
  if (existing && !force && baseUpdatedAt !== undefined && baseUpdatedAt !== null &&
      existing.updated_at && existing.updated_at !== baseUpdatedAt) {
    return { conflict: true, theirsUpdatedAt: existing.updated_at };
  }

  if (existing) {
    db.prepare(`
      UPDATE decks SET series=?, title=?, date=?, speaker=?, scheme_id=?, notes_link=?,
        slide_count=?, slide_types=?, dirty=1, cloud_pending=1, updated_at=?, last_saved_by=?, state_json=?
      WHERE id=?
    `).run(series || '', title || '', date || '', speaker || '', schemeId || '', notesLink || '',
           slideCount, slideTypes, ts, HOSTNAME, stateJson, id);
  } else {
    db.prepare(`
      INSERT INTO decks (id, series, title, date, speaker, scheme_id, notes_link,
        slide_count, slide_types, status, dirty, created_at, updated_at, last_saved_by, state_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?, ?)
    `).run(id, series || '', title || '', date || '', speaker || '', schemeId || '', notesLink || '',
           slideCount, slideTypes, ts, ts, HOSTNAME, stateJson);
  }
  return { ok: true, updatedAt: ts };
}

/** Update metadata only (Edit Info) — also patches the stored state's config. */
function updateDeckInfo(id, { series, title, date, speaker, qrCode }) {
  const row = db.prepare('SELECT state_json FROM decks WHERE id = ?').get(id);
  if (!row) return { ok: false, error: 'Deck not found' };
  let state = null;
  try { state = JSON.parse(row.state_json); } catch (_) { state = {}; }
  if (state.config) {
    if (series  !== undefined) state.config.seriesName   = series;
    if (title   !== undefined) state.config.messageTitle = title;
    if (date    !== undefined) state.config.weekDate     = date;
    if (speaker !== undefined) state.config.speaker      = speaker;
    if (qrCode  !== undefined) state.config.qrCode       = !!qrCode;
  }
  const ts = now();
  db.prepare(`
    UPDATE decks SET series=COALESCE(?, series), title=COALESCE(?, title),
      date=COALESCE(?, date), speaker=COALESCE(?, speaker),
      updated_at=?, last_saved_by=?, state_json=?, cloud_pending=1
    WHERE id=?
  `).run(series ?? null, title ?? null, date ?? null, speaker ?? null, ts, HOSTNAME, JSON.stringify(state), id);
  return { ok: true, updatedAt: ts };
}

function touchOpened(id) {
  db.prepare('UPDATE decks SET last_opened_at = ? WHERE id = ?').run(now(), id);
}

function setStatus(id, status) {
  if (!['active', 'archived', 'deleted'].includes(status)) return { ok: false, error: 'Bad status' };
  db.prepare('UPDATE decks SET status = ?, updated_at = ?, cloud_pending = 1 WHERE id = ?').run(status, now(), id);
  return { ok: true };
}

function setTemplate(id, isTemplate) {
  db.prepare('UPDATE decks SET is_template = ?, updated_at = ?, cloud_pending = 1 WHERE id = ?').run(isTemplate ? 1 : 0, now(), id);
  return { ok: true };
}

function hardDelete(id) {
  const row = db.prepare('SELECT cloud_rev FROM decks WHERE id = ?').get(id);
  if (row && row.cloud_rev > 0) {
    db.prepare('INSERT OR REPLACE INTO cloud_tombstones (id, rev, deleted_at) VALUES (?, ?, ?)').run(id, row.cloud_rev, now());
  }
  db.prepare('DELETE FROM decks WHERE id = ?').run(id);
  db.prepare('DELETE FROM generations WHERE deck_id = ?').run(id);
  return { ok: true };
}

function duplicateDeck(id, newId) {
  const src = getDeck(id);
  if (!src) return { ok: false, error: 'Deck not found' };
  const state = src.state || {};
  state.currentDeckId = newId;
  const ts = now();
  const { slideCount, slideTypes } = summarizeSlides(state);
  db.prepare(`
    INSERT INTO decks (id, series, title, date, speaker, scheme_id, notes_link,
      slide_count, slide_types, status, dirty, created_at, updated_at, last_saved_by, state_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?, ?)
  `).run(newId, src.series, `${src.title || 'Untitled'} Copy`, src.date, src.speaker, src.scheme_id,
         src.notes_link, slideCount, slideTypes, ts, ts, HOSTNAME, JSON.stringify(state));
  return { ok: true, id: newId };
}

// ─── Generations ──────────────────────────────────────────────────────────────

// ─── Export snapshots (merge/override diffing) ───────────────────────────────
// The decoded structure of the last presentation DeckPro wrote for this deck,
// used as a baseline: diffing it against what's actually installed in Pro7
// (which may have been hand-edited since) surfaces those edits so the next
// export can offer to merge them forward instead of silently discarding them.
// Only the MOST RECENT export is kept (not one per generation) — that's all
// the diff ever needs, and it keeps this from growing unbounded.
// Snapshots are stored per "role" — 'single' for the plain export path,
// 'noQr'/'qr' for the two files a paired QR export writes — since those are
// genuinely separate files that could each be independently hand-edited in
// Pro7. Stored as one JSON map so a single column covers all roles.
// Each snapshot also records the file it was written to (`<role>Path`): a
// snapshot is only a valid baseline for that exact file. Comparing it with a
// file DeckPro wrote later (say a QR-pair export after a single one) made
// every style difference between the two exports look like a hand edit.
function getDeckSnapshot(deckId, role = 'single') {
  const row = db.prepare('SELECT last_export_snapshot FROM decks WHERE id = ?').get(deckId);
  if (!row || !row.last_export_snapshot) return null;
  try { return (JSON.parse(row.last_export_snapshot) || {})[role] || null; } catch (_) { return null; }
}
function getDeckSnapshotPath(deckId, role = 'single') {
  const row = db.prepare('SELECT last_export_snapshot FROM decks WHERE id = ?').get(deckId);
  try { return (JSON.parse(row?.last_export_snapshot || '{}') || {})[`${role}Path`] || null; } catch (_) { return null; }
}
// `roles`: { role: { snapshot, path } } written together; every role not
// listed is cleared, since a new export replaces the deck's files.
function setDeckSnapshots(deckId, roles) {
  const all = {};
  for (const [role, r] of Object.entries(roles)) { all[role] = r.snapshot || null; all[`${role}Path`] = r.path || null; }
  db.prepare('UPDATE decks SET last_export_snapshot = ? WHERE id = ?').run(JSON.stringify(all), deckId);
}

/** Records both file paths from a paired QR export directly (rather than
 *  relying on two separate recordGeneration calls, which would just
 *  overwrite the same last_export_path column twice). */
function setDeckPairedExportPaths(deckId, noQrPath, qrPath) {
  db.prepare('UPDATE decks SET last_export_path = ?, last_export_path_qr = ? WHERE id = ?')
    .run(noQrPath || '', qrPath || '', deckId);
}

function recordGeneration({ deckId, fileName, path: filePath, sizeKB, delivered, skipPathUpdate }) {
  const ts = now();
  db.prepare(`
    INSERT INTO generations (deck_id, file_name, path, size_kb, delivered, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(deckId || '', fileName || '', filePath || '', sizeKB || 0, delivered ? 1 : 0, ts);
  if (deckId && skipPathUpdate) {
    // Paired QR export: last_export_path (no-QR) and last_export_path_qr were
    // already set authoritatively by setDeckPairedExportPaths. DON'T touch
    // last_export_path here — this is called once PER FILE, and the second
    // (QR) call would otherwise overwrite the no-QR path, making the next
    // export's hand-edit check diff the no-QR snapshot against the QR file.
    db.prepare(`
      UPDATE decks SET dirty = 0, last_generated_at = ?,
        last_delivered_at = CASE WHEN ? THEN ? ELSE last_delivered_at END
      WHERE id = ?
    `).run(ts, delivered ? 1 : 0, ts, deckId);
  } else if (deckId) {
    db.prepare(`
      UPDATE decks SET dirty = 0, last_generated_at = ?, last_export_path = ?,
        last_delivered_at = CASE WHEN ? THEN ? ELSE last_delivered_at END
      WHERE id = ?
    `).run(ts, filePath || '', delivered ? 1 : 0, ts, deckId);
  }
  // prune to most recent 200
  db.prepare(`
    DELETE FROM generations WHERE id NOT IN (SELECT id FROM generations ORDER BY id DESC LIMIT 200)
  `).run();
  return { ok: true };
}

function listGenerations({ deckId, limit = 30 } = {}) {
  if (deckId) {
    return db.prepare('SELECT * FROM generations WHERE deck_id = ? ORDER BY id DESC LIMIT ?').all(deckId, limit);
  }
  return db.prepare('SELECT * FROM generations ORDER BY id DESC LIMIT ?').all(limit);
}

// ─── Migration from localStorage ──────────────────────────────────────────────

function importLegacy({ decks = [], history = [] }) {
  // JSON safety backup before touching anything
  try {
    const backupPath = path.join(LIB_DIR, 'backups', `pre-migration-${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify({ decks, history }, null, 2));
  } catch (_) {}

  let imported = 0, skipped = 0;
  for (const d of decks) {
    if (!d || !d.id || !d.state) { skipped++; continue; }
    const exists = db.prepare('SELECT id FROM decks WHERE id = ?').get(d.id);
    if (exists) { skipped++; continue; }
    const ts = d.updatedAt || now();
    const { slideCount, slideTypes } = summarizeSlides(d.state);
    db.prepare(`
      INSERT INTO decks (id, series, title, date, speaker, scheme_id,
        slide_count, slide_types, status, dirty, created_at, updated_at, last_saved_by, state_json)
      VALUES (?, ?, ?, ?, '', ?, ?, ?, 'active', 0, ?, ?, ?, ?)
    `).run(d.id, d.series || '', d.title || '', d.date || '', d.schemeId || '',
           slideCount, slideTypes, ts, ts, HOSTNAME, JSON.stringify(d.state));
    imported++;
  }

  let historyImported = 0;
  for (const h of history) {
    if (!h || !h.fileName) continue;
    db.prepare(`
      INSERT INTO generations (deck_id, file_name, path, size_kb, delivered, created_at)
      VALUES ('', ?, ?, ?, ?, ?)
    `).run(h.fileName, h.path || '', h.sizeKB || 0, h.delivered ? 1 : 0, h.date || now());
    historyImported++;
  }

  setMeta('migrated_from_localstorage', now());
  return { ok: true, imported, skipped, historyImported };
}

// ─── Status / location management ────────────────────────────────────────────

function getStatus() {
  const deckCount = db.prepare('SELECT COUNT(*) AS n FROM decks').get().n;
  return {
    ok: true,
    deckCount,
    migrated: !!getMeta('migrated_from_localstorage'),
    libraryDir: LIB_DIR,
    isCustomLocation: !!readPointer(),
    defaultDir: defaultLibraryDir(),
  };
}

/**
 * Point the library at a new folder.
 * If the target already contains deckpro.db → adopt it (cross-computer join).
 * Otherwise copy the current library files there.
 */
function setLocation(newDir) {
  const targetDb = path.join(newDir, 'deckpro.db');
  const adopting = fs.existsSync(targetDb);
  close();
  try {
    if (!adopting) {
      for (const sub of ['', 'backups', 'assets', 'exports']) {
        fs.mkdirSync(path.join(newDir, sub), { recursive: true });
      }
      const curDb = path.join(LIB_DIR, 'deckpro.db');
      if (fs.existsSync(curDb)) fs.copyFileSync(curDb, targetDb);
    }
    fs.mkdirSync(ROOT_DIR, { recursive: true });
    fs.writeFileSync(POINTER_FILE, JSON.stringify({ libraryDir: newDir }, null, 2));
  } catch (err) {
    open(); // reopen old location on failure
    return { ok: false, error: err.message };
  }
  open();
  return { ok: true, adopted: adopting, libraryDir: LIB_DIR };
}

function resetLocation() {
  close();
  try { fs.unlinkSync(POINTER_FILE); } catch (_) {}
  open();
  return { ok: true, libraryDir: LIB_DIR };
}

// ─── DeckPro Cloud ────────────────────────────────────────────────────────────
// What a deck looks like on the wire: the synced metadata columns + state.
// Machine-only columns (export paths, export history, "edited since export")
// never leave this computer.
const CLOUD_META_COLS = ['series', 'title', 'date', 'speaker', 'scheme_id', 'notes_link', 'status', 'is_template', 'created_at'];

function cloudPendingDecks(limit = 10) {
  return db.prepare(`SELECT * FROM decks WHERE cloud_pending = 1 ORDER BY updated_at LIMIT ?`).all(limit).map(row => {
    let state = null;
    try { state = JSON.parse(row.state_json); } catch (_) {}
    const meta = {};
    for (const c of CLOUD_META_COLS) meta[c] = row[c];
    return { id: row.id, baseRev: row.cloud_rev || 0, updatedAt: row.updated_at, meta, state };
  });
}

// After a push: remember the server rev. Only clear "pending" if the row
// wasn't edited again while the push was in flight.
function cloudMarkPushed(id, rev, pushedUpdatedAt) {
  db.prepare(`UPDATE decks SET cloud_rev = ?, cloud_pending = CASE WHEN updated_at = ? THEN 0 ELSE 1 END WHERE id = ?`)
    .run(rev, pushedUpdatedAt, id);
}

function cloudTombstones() {
  return db.prepare('SELECT id, rev, deleted_at FROM cloud_tombstones').all();
}
function cloudClearTombstone(id) {
  db.prepare('DELETE FROM cloud_tombstones WHERE id = ?').run(id);
}

// Apply a deck that came from the server. Returns 'applied', 'deleted' or
// 'skipped'. A row with unpushed local edits is left alone unless force (the
// server already decided it lost a conflict and kept it as a copy).
function cloudApplyRemote(remote, { force = false, keepConfigKeys = [] } = {}) {
  const local = db.prepare('SELECT cloud_rev, cloud_pending, state_json FROM decks WHERE id = ?').get(remote.id);
  if (local && !force && (local.cloud_pending || (local.cloud_rev || 0) >= remote.rev)) return 'skipped';
  if (remote.deleted) {
    if (!local) return 'skipped';
    db.prepare('DELETE FROM decks WHERE id = ?').run(remote.id);
    db.prepare('DELETE FROM generations WHERE deck_id = ?').run(remote.id);
    return 'deleted';
  }
  const state = remote.state || {};
  // Keep this computer's own machine settings and view state inside the stored state.
  if (local) {
    let prev = null;
    try { prev = JSON.parse(local.state_json); } catch (_) {}
    if (prev?.config && keepConfigKeys.length) {
      state.config = state.config || {};
      for (const k of keepConfigKeys) if (prev.config[k] !== undefined) state.config[k] = prev.config[k];
    }
    for (const k of UI_STATE_KEYS) if (prev && prev[k] !== undefined) state[k] = prev[k];
  }
  const m = remote.meta || {};
  const { slideCount, slideTypes } = summarizeSlides(state);
  const vals = [m.series || '', m.title || '', m.date || '', m.speaker || '', m.scheme_id || '', m.notes_link || '',
    ['active', 'archived', 'deleted'].includes(m.status) ? m.status : 'active', m.is_template ? 1 : 0,
    slideCount, slideTypes, remote.updatedAt, remote.savedBy || '', JSON.stringify(state), remote.rev];
  if (local) {
    db.prepare(`UPDATE decks SET series=?, title=?, date=?, speaker=?, scheme_id=?, notes_link=?, status=?, is_template=?,
      slide_count=?, slide_types=?, updated_at=?, last_saved_by=?, state_json=?, cloud_rev=?, cloud_pending=0, dirty=1 WHERE id=?`)
      .run(...vals, remote.id);
  } else {
    db.prepare(`INSERT INTO decks (series, title, date, speaker, scheme_id, notes_link, status, is_template,
      slide_count, slide_types, updated_at, last_saved_by, state_json, cloud_rev, cloud_pending, dirty, created_at, id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?)`)
      .run(...vals, m.created_at || remote.updatedAt, remote.id);
  }
  return 'applied';
}

// Signing into a different account (or out): every deck is "never synced".
function cloudReset() {
  db.prepare('UPDATE decks SET cloud_rev = 0, cloud_pending = 1').run();
  db.prepare('DELETE FROM cloud_tombstones').run();
  setMeta('cloud_cursor', '0');
}
function cloudGetMeta(key) { return getMeta(key); }
function cloudSetMeta(key, value) { setMeta(key, value); }
function cloudPendingCount() {
  return db.prepare('SELECT COUNT(*) AS n FROM decks WHERE cloud_pending = 1').get().n +
         db.prepare('SELECT COUNT(*) AS n FROM cloud_tombstones').get().n;
}

module.exports = {
  cloudPendingDecks, cloudMarkPushed, cloudTombstones, cloudClearTombstone, cloudApplyRemote,
  cloudReset, cloudGetMeta, cloudSetMeta, cloudPendingCount, UI_STATE_KEYS,
  open, close, getStatus,
  listDecks, getDeck, saveDeck, updateDeckInfo, touchOpened,
  setStatus, setTemplate, hardDelete, duplicateDeck,
  recordGeneration, listGenerations,
  getDeckSnapshot, getDeckSnapshotPath, setDeckSnapshots, setDeckPairedExportPaths,
  importLegacy, setLocation, resetLocation,
};
