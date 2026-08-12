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
           last_opened_at, last_generated_at, last_delivered_at, last_export_path, last_saved_by
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
  const existing = db.prepare('SELECT updated_at, created_at, status, is_template, dirty FROM decks WHERE id = ?').get(id);

  if (existing && !force && baseUpdatedAt !== undefined && baseUpdatedAt !== null &&
      existing.updated_at && existing.updated_at !== baseUpdatedAt) {
    return { conflict: true, theirsUpdatedAt: existing.updated_at };
  }

  const ts = now();
  const { slideCount, slideTypes } = summarizeSlides(state);
  const stateJson = JSON.stringify(state);

  if (existing) {
    db.prepare(`
      UPDATE decks SET series=?, title=?, date=?, speaker=?, scheme_id=?, notes_link=?,
        slide_count=?, slide_types=?, dirty=1, updated_at=?, last_saved_by=?, state_json=?
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
      updated_at=?, last_saved_by=?, state_json=?
    WHERE id=?
  `).run(series ?? null, title ?? null, date ?? null, speaker ?? null, ts, HOSTNAME, JSON.stringify(state), id);
  return { ok: true, updatedAt: ts };
}

function touchOpened(id) {
  db.prepare('UPDATE decks SET last_opened_at = ? WHERE id = ?').run(now(), id);
}

function setStatus(id, status) {
  if (!['active', 'archived', 'deleted'].includes(status)) return { ok: false, error: 'Bad status' };
  db.prepare('UPDATE decks SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), id);
  return { ok: true };
}

function setTemplate(id, isTemplate) {
  db.prepare('UPDATE decks SET is_template = ? WHERE id = ?').run(isTemplate ? 1 : 0, id);
  return { ok: true };
}

function hardDelete(id) {
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
function getDeckSnapshot(deckId, role = 'single') {
  const row = db.prepare('SELECT last_export_snapshot FROM decks WHERE id = ?').get(deckId);
  if (!row || !row.last_export_snapshot) return null;
  try { return (JSON.parse(row.last_export_snapshot) || {})[role] || null; } catch (_) { return null; }
}
function setDeckSnapshot(deckId, role, snapshot) {
  const row = db.prepare('SELECT last_export_snapshot FROM decks WHERE id = ?').get(deckId);
  let all = {};
  try { all = JSON.parse(row?.last_export_snapshot || '{}') || {}; } catch (_) {}
  all[role] = snapshot || null;
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

module.exports = {
  open, close, getStatus,
  listDecks, getDeck, saveDeck, updateDeckInfo, touchOpened,
  setStatus, setTemplate, hardDelete, duplicateDeck,
  recordGeneration, listGenerations,
  getDeckSnapshot, setDeckSnapshot, setDeckPairedExportPaths,
  importLegacy, setLocation, resetLocation,
};
