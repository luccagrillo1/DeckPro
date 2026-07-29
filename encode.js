'use strict';

/**
 * encode.js
 * Encodes a presentation spec to a Pro7 .pro binary file,
 * and writes a single _Props.pro file alongside it.
 *
 * Usage:
 *   const { encode } = require('./encode');
 *   await encode(spec, '/path/to/output.pro');
 *   // or with explicit output folder:
 *   await encode(spec, null, '/path/to/folder/');
 */

const protobuf = require('protobufjs');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { buildPresentation } = require('./builder');
const { buildAllPropCues, encodePropDocument } = require('./buildProp');

// ─── Pro7 config backup safety net ──────────────────────────────────────────
// Before each export we patch Pro7's Configuration/Props in place. Keep a
// rolling set of timestamped backups so a bad export can always be undone.

function normalizePro7Root(root) {
  if (!root) return '';
  let p = path.resolve(String(root));
  const base = path.basename(p);
  if (base === 'Props' && path.basename(path.dirname(p)) === 'Configuration') p = path.dirname(path.dirname(p));
  else if (base === 'Configuration' || base === 'Libraries') p = path.dirname(p);
  return p;
}

function getLibraryInsideRoot(root) {
  const pro7Root = normalizePro7Root(root);
  if (!pro7Root) return '';
  const librariesDir = path.join(pro7Root, 'Libraries');
  if (!fs.existsSync(librariesDir)) return '';

  // Prefer Pro7's own active-library pointer when it exists.
  try {
    const libDataPath = path.join(librariesDir, 'LibraryData');
    if (fs.existsSync(libDataPath)) {
      const str = fs.readFileSync(libDataPath).toString('latin1');
      const match = str.match(/file:\/\/\/([^\x00-\x1f\x7f]+?Libraries\/[^\x00-\x1f\x7f]+?)\//);
      if (match) {
        const decoded = decodeURIComponent('/' + match[1]);
        if (fs.existsSync(decoded)) return decoded;
      }
    }
  } catch (_) {}

  // Fallback: use the most recently touched library subfolder.
  try {
    const dirs = fs.readdirSync(librariesDir)
      .filter(d => fs.statSync(path.join(librariesDir, d)).isDirectory())
      .sort((a, b) => fs.statSync(path.join(librariesDir, b)).mtimeMs - fs.statSync(path.join(librariesDir, a)).mtimeMs);
    if (dirs.length) return path.join(librariesDir, dirs[0]);
  } catch (_) {}

  return librariesDir;
}

function getPro7WorkspaceBase(overrideRoot) {
  const root = normalizePro7Root(overrideRoot);
  if (root) return root;
  const existing = allPro7WorkspaceBases();
  const withProps = existing.find(wsBase => fs.existsSync(path.join(wsBase, 'Configuration/Props')));
  if (withProps) return withProps;
  const withLibraries = existing.find(wsBase => fs.existsSync(path.join(wsBase, 'Libraries')));
  if (withLibraries) return withLibraries;
  const p = path.join(os.homedir(), 'Library/Application Support/RenewedVision/ProPresenter/UserWorkspaces/ProPresenter');
  fs.mkdirSync(p, { recursive: true });
  return p;
}

function getPropsConfigPath(overrideRoot) { return path.join(getPro7WorkspaceBase(overrideRoot), 'Configuration/Props'); }

function propsBackupDir() {
  const base = process.env.DECKPRO_DATA_DIR || path.join(os.homedir(), '.deckpro');
  return path.join(base, 'pro7-config-backups');
}

const PROPS_BACKUP_KEEP = 10;

/** Write a timestamped backup of the current Props config and prune to the last N. */
function backupPropsConfig(raw) {
  const dir = propsBackupDir();
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(dir, `Props-${stamp}.bak`);
  fs.writeFileSync(dest, raw);
  // Prune oldest beyond the keep limit
  try {
    const files = fs.readdirSync(dir)
      .filter(f => f.startsWith('Props-') && f.endsWith('.bak'))
      .sort(); // ISO timestamps sort chronologically
    while (files.length > PROPS_BACKUP_KEEP) {
      fs.unlinkSync(path.join(dir, files.shift()));
    }
  } catch (_) {}
  return dest;
}

/** List available Props-config backups, newest first. */
function listPropsBackups() {
  const dir = propsBackupDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.startsWith('Props-') && f.endsWith('.bak'))
    .map(f => {
      const full = path.join(dir, f);
      const st = fs.statSync(full);
      return { file: f, path: full, sizeKb: Math.round(st.size / 1024), at: st.mtime.toISOString() };
    })
    .sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * Restore a Props-config backup over the live config.
 * Pro7 MUST be closed first (caller's responsibility) or it will clobber the restore on quit.
 * Before overwriting, snapshots the current config so a restore is itself undoable.
 */
function restorePropsBackup(backupFile) {
  const dir = propsBackupDir();
  // Accept either a bare filename or an absolute path; never escape the backups dir
  const src = path.isAbsolute(backupFile) ? backupFile : path.join(dir, path.basename(backupFile));
  if (!src.startsWith(dir) && !path.isAbsolute(backupFile)) throw new Error('Invalid backup path');
  if (!fs.existsSync(src)) throw new Error('Backup not found');
  if (fs.existsSync(getPropsConfigPath())) backupPropsConfig(fs.readFileSync(getPropsConfigPath()));
  fs.copyFileSync(src, getPropsConfigPath());
  return true;
}

/**
 * Find the active Pro7 library folder in Application Support.
 * Pro7 scans this folder for PropDocument files — _Props.pro must go here.
 * Falls back to ~/Documents/ProPresenter if the library can't be determined.
 */
// Return all ProPresenter workspace base paths that exist on this machine,
// covering both UserWorkspaces and Workspaces (with UUID-suffixed subfolder names).
function allPro7WorkspaceBases() {
  const base = path.join(os.homedir(), 'Library/Application Support/RenewedVision/ProPresenter');
  const results = [];
  const documentsRoot = path.join(os.homedir(), 'Documents', 'ProPresenter');
  if (fs.existsSync(documentsRoot)) results.push(documentsRoot);
  for (const root of ['UserWorkspaces', 'Workspaces']) {
    const rootDir = path.join(base, root);
    if (!fs.existsSync(rootDir)) continue;
    try {
      const dirs = fs.readdirSync(rootDir)
        .filter(d => d.startsWith('ProPresenter') && fs.statSync(path.join(rootDir, d)).isDirectory())
        .sort((a, b) => fs.statSync(path.join(rootDir, b)).mtimeMs - fs.statSync(path.join(rootDir, a)).mtimeMs);
      for (const d of dirs) results.push(path.join(rootDir, d));
    } catch (_) {}
  }
  return results;
}

function getPro7LibraryPath(override, overrideRoot) {
  if (override) return override;
  const rootLibrary = getLibraryInsideRoot(overrideRoot);
  if (rootLibrary) return rootLibrary;
  for (const wsBase of allPro7WorkspaceBases()) {
    const lib = getLibraryInsideRoot(wsBase);
    if (lib) return lib;
  }
  return path.join(os.homedir(), 'Documents/ProPresenter');
}

// ── Permanent prop slot UUIDs (created once in Pro7, never change) ────────
const DECKPRO_PROP_SLOTS = [
  { slot: 'prop_1',  uuid: '36B6501B-1A8D-447C-A2DB-D5777099B43B' },
  { slot: 'prop_2',  uuid: '615C3447-D531-4659-91C4-D3EAFD5A0B14' },
  { slot: 'prop_3',  uuid: '540F0513-F5A0-4A89-88CA-96310C40C045' },
  { slot: 'prop_4',  uuid: '19F4E1C4-8D9A-47C7-B041-3B53E090CA8F' },
  { slot: 'prop_5',  uuid: '97645B8E-9788-4160-A5BF-3E7C99DDFBD6' },
  { slot: 'prop_6',  uuid: '54D70ECA-5D71-48E6-94E8-51351BB1AAF5' },
  { slot: 'prop_7',  uuid: '1CE392FB-B68F-4E3C-8518-01A528C9FAF7' },
  { slot: 'prop_8',  uuid: 'C90131A2-9CDF-4C63-97D9-6E358F7AFE76' },
  { slot: 'prop_9',  uuid: '742F477B-4730-482F-BC02-20C766F35844' },
  { slot: 'prop_10', uuid: '0A667048-9408-4B74-8548-9F761A4A93C5' },
  { slot: 'prop_11', uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567811' },
  { slot: 'prop_12', uuid: 'B2C3D4E5-F6A7-8901-BCDE-F12345678912' },
  { slot: 'prop_13', uuid: 'C3D4E5F6-A7B8-9012-CDEF-123456789013' },
  { slot: 'prop_14', uuid: 'D4E5F6A7-B8C9-0123-DEF0-234567890114' },
  { slot: 'prop_15', uuid: 'E5F6A7B8-C9D0-1234-EF01-345678901215' },
  { slot: 'prop_16', uuid: 'F6A7B8C9-D0E1-2345-F012-456789012316' },
  { slot: 'prop_17', uuid: 'A7B8C9D0-E1F2-3456-0123-567890123417' },
  { slot: 'prop_18', uuid: 'B8C9D0E1-F2A3-4567-1234-678901234518' },
  { slot: 'prop_19', uuid: 'C9D0E1F2-A3B4-5678-2345-789012345619' },
  { slot: 'prop_20', uuid: 'D0E1F2A3-B4C5-6789-3456-890123456720' },
  { slot: 'prop_21', uuid: 'E1F2A3B4-C5D6-7890-4567-901234567821' },
  { slot: 'prop_22', uuid: 'F2A3B4C5-D6E7-8901-5678-012345678922' },
  { slot: 'prop_23', uuid: 'A3B4C5D6-E7F8-9012-6789-123456789023' },
  { slot: 'prop_24', uuid: 'B4C5D6E7-F8A9-0123-7890-234567890124' },
  { slot: 'prop_25', uuid: 'C5D6E7F8-A9B0-1234-8901-345678901225' },
  { slot: 'prop_26', uuid: 'D6E7F8A9-B0C1-2345-9012-456789012326' },
  { slot: 'prop_27', uuid: 'E7F8A9B0-C1D2-3456-0123-567890123427' },
  { slot: 'prop_28', uuid: 'F8A9B0C1-D2E3-4567-1234-678901234528' },
  { slot: 'prop_29', uuid: 'A9B0C1D2-E3F4-5678-2345-789012345629' },
  { slot: 'prop_30', uuid: 'B0C1D2E3-F4A5-6789-3456-890123456730' },
  { slot: 'prop_31', uuid: 'C1D2E3F4-A5B6-7890-4567-901234567831' },
  { slot: 'prop_32', uuid: 'D2E3F4A5-B6C7-8901-5678-012345678932' },
  { slot: 'prop_33', uuid: 'E3F4A5B6-C7D8-9012-6789-123456789033' },
  { slot: 'prop_34', uuid: 'F4A5B6C7-D8E9-0123-7890-234567890134' },
  { slot: 'prop_35', uuid: 'A5B6C7D8-E9F0-1234-8901-345678901235' },
  { slot: 'prop_36', uuid: 'B6C7D8E9-F0A1-2345-9012-456789012336' },
  { slot: 'prop_37', uuid: 'C7D8E9F0-A1B2-3456-0123-567890123437' },
  { slot: 'prop_38', uuid: 'D8E9F0A1-B2C3-4567-1234-678901234538' },
  { slot: 'prop_39', uuid: 'E9F0A1B2-C3D4-5678-2345-789012345639' },
  { slot: 'prop_40', uuid: 'F0A1B2C3-D4E5-6789-3456-890123456740' },
  { slot: 'prop_41', uuid: 'A1B2C3D4-E5F6-7891-4567-901234567841' },
  { slot: 'prop_42', uuid: 'B2C3D4E5-F6A7-8902-5678-012345678942' },
  { slot: 'prop_43', uuid: 'C3D4E5F6-A7B8-9013-6789-123456789043' },
  { slot: 'prop_44', uuid: 'D4E5F6A7-B8C9-0124-7890-234567890144' },
  { slot: 'prop_45', uuid: 'E5F6A7B8-C9D0-1235-8901-345678901245' },
  { slot: 'prop_46', uuid: 'F6A7B8C9-D0E1-2346-9012-456789012346' },
  { slot: 'prop_47', uuid: 'A7B8C9D0-E1F2-3457-0123-567890123447' },
  { slot: 'prop_48', uuid: 'B8C9D0E1-F2A3-4568-1234-678901234548' },
  { slot: 'prop_49', uuid: 'C9D0E1F2-A3B4-5679-2345-789012345649' },
  { slot: 'prop_50', uuid: 'D0E1F2A3-B4C5-6780-3456-890123456750' },
];

const PROTO_PATH = path.join(__dirname, 'ProPresenter7-Proto/proto/propresenter.proto');

let _root = null;

async function getRoot() {
  if (!_root) {
    _root = await protobuf.load(PROTO_PATH);
  }
  return _root;
}

async function encodeToBuffer(spec, propUuidMap = {}) {
  const root = await getRoot();
  const Presentation = root.lookupType('rv.data.Presentation');
  const obj = buildPresentation(spec, propUuidMap);
  const errMsg = Presentation.verify(Presentation.fromObject(obj));
  if (errMsg) throw new Error(`Protobuf verify failed: ${errMsg}`);
  const msg = Presentation.fromObject(obj);
  return Presentation.encode(msg).finish();
}

// ─── Binary protobuf helpers ──────────────────────────────────────────────────

/** Read a varint from buf at pos. Returns { value, nextPos }. */
function readVarint(buf, pos) {
  let result = 0, shift = 0;
  while (pos < buf.length) {
    const b = buf[pos++];
    result |= (b & 0x7f) << shift;
    shift += 7;
    if (!(b & 0x80)) break;
  }
  return { value: result >>> 0, nextPos: pos };
}

/** Encode a varint into a Buffer. */
function encodeVarint(value) {
  const bytes = [];
  value = value >>> 0;
  while (value > 0x7f) {
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  bytes.push(value & 0x7f);
  return Buffer.from(bytes);
}

/**
 * Walk a protobuf binary and return a map of each field 2 (repeated cues) entry:
 *   uuid string → { tagStart, dataStart, dataEnd }
 * tagStart = byte offset of the 0x12 tag byte
 * dataStart = first byte of the cue message payload
 * dataEnd   = one past the last byte of the cue message payload
 *
 * All other bytes are left untouched.
 */
function parseCueRanges(buf) {
  const ranges = [];   // { uuid, tagStart, dataStart, dataEnd }
  let pos = 0;
  while (pos < buf.length) {
    const tagStart = pos;
    const tv = readVarint(buf, pos);
    pos = tv.nextPos;
    const fieldNum = tv.value >>> 3;
    const wireType = tv.value & 7;
    if (wireType === 0) {
      // varint — skip
      const v = readVarint(buf, pos); pos = v.nextPos;
    } else if (wireType === 1) {
      pos += 8;
    } else if (wireType === 5) {
      pos += 4;
    } else if (wireType === 2) {
      const lv = readVarint(buf, pos); pos = lv.nextPos;
      const dataStart = pos;
      const dataEnd   = pos + lv.value;
      if (fieldNum === 2) {
        // This is a cue field — extract its UUID string
        const uuid = extractUuidFromCueBytes(buf, dataStart, dataEnd);
        if (uuid) ranges.push({ uuid, tagStart, dataStart, dataEnd });
      }
      pos = dataEnd;
    } else {
      break; // unknown wire type — stop
    }
  }
  return ranges;
}

/**
 * Extract the UUID string from a raw cue message (field 1 = uuid message, field 1 of that = string).
 */
function extractUuidFromCueBytes(buf, start, end) {
  let pos = start;
  while (pos < end) {
    const tv = readVarint(buf, pos); pos = tv.nextPos;
    const fieldNum = tv.value >>> 3;
    const wireType = tv.value & 7;
    if (wireType === 2) {
      const lv = readVarint(buf, pos); pos = lv.nextPos;
      if (fieldNum === 1) {
        // uuid field — recurse one level to get the string
        const innerStart = pos;
        const innerEnd   = pos + lv.value;
        const str = extractStringFromUuidBytes(buf, innerStart, innerEnd);
        if (str) return str;
      }
      pos += lv.value;
    } else if (wireType === 0) {
      const v = readVarint(buf, pos); pos = v.nextPos;
    } else if (wireType === 1) { pos += 8; }
      else if (wireType === 5) { pos += 4; }
      else break;
  }
  return null;
}

/** Extract string field 1 from a UUID message. */
function extractStringFromUuidBytes(buf, start, end) {
  let pos = start;
  while (pos < end) {
    const tv = readVarint(buf, pos); pos = tv.nextPos;
    const fieldNum = tv.value >>> 3;
    const wireType = tv.value & 7;
    if (wireType === 2) {
      const lv = readVarint(buf, pos); pos = lv.nextPos;
      if (fieldNum === 1) return buf.slice(pos, pos + lv.value).toString('utf8');
      pos += lv.value;
    } else if (wireType === 0) {
      const v = readVarint(buf, pos); pos = v.nextPos;
    } else if (wireType === 1) { pos += 8; }
      else if (wireType === 5) { pos += 4; }
      else break;
  }
  return null;
}

// Fixed UUID for the DeckPro collection folder — same on every machine
const DECKPRO_COLLECTION_UUID = 'DECADE00-CAFE-4000-8000-BABE00000001';

/**
 * Encode a UUID string as a full UUID message (2-level nested: outer msg → inner string msg).
 * Returns 40 bytes: 0a 26 0a 24 <36-char UUID>
 */
function encodeUuidMsgBytes(uuidStr) {
  const uuidBuf  = Buffer.from(uuidStr, 'utf8');               // 36 bytes
  const inner    = Buffer.concat([Buffer.from([0x0a, uuidBuf.length]), uuidBuf]); // 38 bytes
  return Buffer.concat([Buffer.from([0x0a]), encodeVarint(inner.length), inner]); // 40 bytes
}

/**
 * Build a field-4 collection entry (0x22 + varint(len) + collection message).
 * memberUuids: string[] of prop cue UUIDs that belong to this collection.
 * singlePropEnabled: PropCollection.single_prop_enabled (proto field 4, bool) —
 * proto3 default is false, so it's only written when true.
 */
function buildCollectionField4(collectionUuid, name, memberUuids, singlePropEnabled = false) {
  const parts = [];
  // f1: collection UUID
  const uuidInner = Buffer.concat([Buffer.from([0x0a, 36]), Buffer.from(collectionUuid, 'utf8')]);
  parts.push(Buffer.concat([Buffer.from([0x0a]), encodeVarint(uuidInner.length), uuidInner]));
  // f2: name string
  const nameBuf = Buffer.from(name, 'utf8');
  parts.push(Buffer.concat([Buffer.from([0x12]), encodeVarint(nameBuf.length), nameBuf]));
  // f3 (repeated): member UUID messages
  for (const uuid of memberUuids) {
    const uuidMsg = encodeUuidMsgBytes(uuid);
    parts.push(Buffer.concat([Buffer.from([0x1a]), encodeVarint(uuidMsg.length), uuidMsg]));
  }
  // f4: single_prop_enabled (varint bool) — tag = (4 << 3) | 0 = 0x20
  if (singlePropEnabled) parts.push(Buffer.from([0x20, 0x01]));
  const msgBytes = Buffer.concat(parts);
  return Buffer.concat([Buffer.from([0x22]), encodeVarint(msgBytes.length), msgBytes]);
}

/**
 * Extract field 4 (single_prop_enabled, varint bool) from a field-4 collection data bytes.
 */
function getCollectionSingleFlag(buf, start, end) {
  let pos = start;
  while (pos < end) {
    const tv = readVarint(buf, pos); pos = tv.nextPos;
    const fn = tv.value >>> 3, wt = tv.value & 7;
    if (wt === 0) {
      const v = readVarint(buf, pos); pos = v.nextPos;
      if (fn === 4) return v.value !== 0;
    } else if (wt === 2) {
      const lv = readVarint(buf, pos); pos = lv.nextPos;
      pos += lv.value;
    } else if (wt === 1) { pos += 8; } else if (wt === 5) { pos += 4; } else break;
  }
  return false;
}

/**
 * Extract all field-3 member UUIDs from a field-4 collection data bytes.
 */
function getCollectionMembers(buf, start, end) {
  const members = []; let pos = start;
  while (pos < end) {
    const tv = readVarint(buf, pos); pos = tv.nextPos;
    const fn = tv.value >>> 3, wt = tv.value & 7;
    if (wt === 2) {
      const lv = readVarint(buf, pos); pos = lv.nextPos;
      if (fn === 3) {
        const uuid = extractUuidFromCueBytes(buf, pos, pos + lv.value);
        if (uuid) members.push(uuid);
      }
      pos += lv.value;
    } else if (wt === 0) { const v = readVarint(buf, pos); pos = v.nextPos; }
    else if (wt === 1) { pos += 8; } else if (wt === 5) { pos += 4; } else break;
  }
  return members;
}

/**
 * Extract the name string (field 2) from a field-4 collection data bytes.
 */
function getCollectionName(buf, start, end) {
  let pos = start;
  while (pos < end) {
    const tv = readVarint(buf, pos); pos = tv.nextPos;
    const fn = tv.value >>> 3, wt = tv.value & 7;
    if (wt === 2) {
      const lv = readVarint(buf, pos); pos = lv.nextPos;
      if (fn === 2) return buf.slice(pos, pos + lv.value).toString('utf8');
      pos += lv.value;
    } else if (wt === 0) { const v = readVarint(buf, pos); pos = v.nextPos; }
    else if (wt === 1) { pos += 8; } else if (wt === 5) { pos += 4; } else break;
  }
  return '';
}

/**
 * Walk the outer PropDocument binary and return all field entries with their byte ranges.
 * { fn, tagStart, dataStart, dataEnd } — for all wire-type-2 fields.
 */
function parseOuterFields(buf) {
  const fields = []; let pos = 0;
  while (pos < buf.length) {
    const tagStart = pos;
    const tv = readVarint(buf, pos); pos = tv.nextPos;
    const fn = tv.value >>> 3, wt = tv.value & 7;
    if (wt === 0) { const v = readVarint(buf, pos); pos = v.nextPos; fields.push({ fn, wt, tagStart, tagEnd: pos }); }
    else if (wt === 1) { fields.push({ fn, wt, tagStart, tagEnd: pos + 8 }); pos += 8; }
    else if (wt === 5) { fields.push({ fn, wt, tagStart, tagEnd: pos + 4 }); pos += 4; }
    else if (wt === 2) {
      const lv = readVarint(buf, pos); pos = lv.nextPos;
      fields.push({ fn, wt, tagStart, dataStart: pos, dataEnd: pos + lv.value });
      pos += lv.value;
    } else break;
  }
  return fields;
}

/**
 * Encode a single cue object to its field-2-wrapped bytes (0x12 + varint(len) + cueBytes).
 */
async function encodeCueField(cueObj) {
  const PROP_PROTO = path.join(__dirname, 'ProPresenter7-Proto/proto/propDocument.proto');
  const root    = await protobuf.load(PROP_PROTO);
  const CueType = root.lookupType('rv.data.Cue');
  const msg     = CueType.fromObject(cueObj);
  const cueBytes = CueType.encode(msg).finish();
  return Buffer.concat([Buffer.from([0x12]), encodeVarint(cueBytes.length), cueBytes]);
}

// Set of all DeckPro slot UUIDs (for collection membership management)
const DECKPRO_SLOT_UUID_SET = new Set(DECKPRO_PROP_SLOTS.map(s => s.uuid));

/**
 * Patch Configuration/Props in-place at the binary level.
 * - DeckPro prop cues are replaced/appended (never re-encodes foreign cues).
 * - A "DeckPro" collection folder is created/updated to contain all active DeckPro slots.
 * - DeckPro UUIDs are removed from all other collections (keeps the folder clean).
 * - All other data — unknown fields, collections, Pro7 internals — is preserved byte-for-byte.
 */
async function updateConfigProps(newCues, pro7RootFolder = '') {
  const confPath = getPropsConfigPath(pro7RootFolder);
  let backupPath = null;
  try {
    if (!fs.existsSync(confPath)) {
      console.log('updateConfigProps: Config/Props not found, skipping');
      return { backupPath: null, skipped: true, reason: `Configuration/Props not found at ${confPath}` };
    }

    const raw = fs.readFileSync(confPath);
    backupPath = backupPropsConfig(raw);

    // Build map: uuid → encoded field bytes for incoming prop cues
    const incomingEncoded = {};
    const incomingUuids = new Set();
    for (const c of newCues) {
      const id = c.uuid?.string;
      if (id) { incomingEncoded[id] = await encodeCueField(c); incomingUuids.add(id); }
    }

    // Walk all outer fields
    const outerFields = parseOuterFields(raw);

    // Collect existing cue UUIDs (field 2) and collection info (field 4)
    const existingCueUuids = new Set();
    let deckproCollectionUuid = null; // UUID of the existing DeckPro collection if found

    for (const f of outerFields) {
      if (f.fn === 2 && f.dataStart !== undefined) {
        const uuid = extractUuidFromCueBytes(raw, f.dataStart, f.dataEnd);
        if (uuid) existingCueUuids.add(uuid);
      }
      if (f.fn === 4 && f.dataStart !== undefined) {
        const name = getCollectionName(raw, f.dataStart, f.dataEnd);
        if (name === 'DeckPro') {
          deckproCollectionUuid = extractUuidFromCueBytes(raw, f.dataStart, f.dataEnd);
        }
      }
    }

    // Use existing DeckPro collection UUID if found, otherwise use our fixed one
    const collectionUuid = deckproCollectionUuid || DECKPRO_COLLECTION_UUID;

    // DeckPro collection members = all DeckPro slot UUIDs already in the file
    // PLUS any new ones being appended this generation (not yet in existingCueUuids)
    const deckproCollectionMembers = [
      ...[...existingCueUuids].filter(u => DECKPRO_SLOT_UUID_SET.has(u)),
      ...[...incomingUuids].filter(u => !existingCueUuids.has(u)),
    ];

    // Build new binary chunk by chunk
    const chunks = [];
    let pos = 0;
    let deckproCollectionWritten = false;

    for (const f of outerFields) {
      const tagStart = f.tagStart;
      const fieldEnd = f.dataEnd ?? f.tagEnd;

      // Copy any bytes before this field (shouldn't happen normally but just in case)
      if (tagStart > pos) chunks.push(raw.slice(pos, tagStart));

      if (f.fn === 2 && f.dataStart !== undefined) {
        // Prop cue field
        const uuid = extractUuidFromCueBytes(raw, f.dataStart, f.dataEnd);
        if (uuid && incomingEncoded[uuid]) {
          chunks.push(incomingEncoded[uuid]); // replace DeckPro cue
        } else {
          chunks.push(raw.slice(tagStart, fieldEnd)); // preserve foreign cue byte-for-byte
        }
      } else if (f.fn === 4 && f.dataStart !== undefined) {
        // Collection field
        const collUuid = extractUuidFromCueBytes(raw, f.dataStart, f.dataEnd);
        const collName = getCollectionName(raw, f.dataStart, f.dataEnd);

        if (collUuid === collectionUuid || collName === 'DeckPro') {
          // This IS the DeckPro collection — replace with updated member list.
          // Single Prop Mode is always forced on for the DeckPro collection —
          // otherwise every export would silently revert a user's manual toggle
          // back off, since this rebuild replaces the whole field-4 entry.
          chunks.push(buildCollectionField4(collectionUuid, 'DeckPro', deckproCollectionMembers, true));
          deckproCollectionWritten = true;
        } else {
          // Another collection — remove any DeckPro slot UUIDs from its member list
          const members = getCollectionMembers(raw, f.dataStart, f.dataEnd);
          const filteredMembers = members.filter(u => !DECKPRO_SLOT_UUID_SET.has(u));
          if (filteredMembers.length !== members.length) {
            // Rebuild this collection without the DeckPro UUIDs — preserve its
            // own Single Prop Mode setting rather than silently dropping it.
            const name = collName;
            const singleFlag = getCollectionSingleFlag(raw, f.dataStart, f.dataEnd);
            chunks.push(buildCollectionField4(collUuid, name, filteredMembers, singleFlag));
          } else {
            chunks.push(raw.slice(tagStart, fieldEnd)); // nothing to change
          }
        }
      } else {
        // Any other field (app_info, transition, etc.) — preserve byte-for-byte
        chunks.push(raw.slice(tagStart, fieldEnd));
      }
      pos = fieldEnd;
    }
    // Copy any trailing bytes
    if (pos < raw.length) chunks.push(raw.slice(pos));

    // Append new DeckPro cues not yet in the file
    let added = 0;
    for (const [id, fieldBytes] of Object.entries(incomingEncoded)) {
      if (!existingCueUuids.has(id)) { chunks.push(fieldBytes); added++; }
    }

    // Append DeckPro collection if it wasn't in the file at all
    if (!deckproCollectionWritten) {
      chunks.push(buildCollectionField4(collectionUuid, 'DeckPro', deckproCollectionMembers, true));
    }

    const patched = Buffer.concat(chunks);
    fs.writeFileSync(confPath, patched);
    const replaced = [...incomingUuids].filter(u => existingCueUuids.has(u)).length;
    console.log(`updateConfigProps: patched ${replaced} cues, added ${added} new, DeckPro collection ${deckproCollectionWritten ? 'updated' : 'created'} (file: ${raw.length}b → ${patched.length}b)`);
    return { backupPath };
  } catch (err) {
    console.error('updateConfigProps failed (non-fatal):', err.message);
    return { backupPath };
  }
}

/**
 * Collect prop specs from the slide list, assigning permanent prop slots sequentially.
 * Each content prop gets the next slot (prop_1, prop_2, …).
 * Returns { propSpecs, propUuidMap } where propUuidMap maps propName → permanent UUID.
 */
function collectPropSpecs(slides, responses = {}, includeResponseCard = false) {
  const propSpecs  = [];
  const propUuidMap = {};  // propName → permanent UUID (for builder.js PROP actions)
  let slotIdx = 0;

  function nextSlot() {
    if (slotIdx >= DECKPRO_PROP_SLOTS.length) throw new Error(`Exceeded ${DECKPRO_PROP_SLOTS.length} permanent prop slots`);
    return DECKPRO_PROP_SLOTS[slotIdx++];
  }

  for (const slide of slides) {
    if (slide.type === 'scripture') {
      const pName = slide.propName || slide.reference || 'scripture';
      const slot  = nextSlot();
      propUuidMap[pName] = slot.uuid;
      propSpecs.push({
        type: 'scripture',
        propName: pName,
        slotName: slot.slot,
        slotUuid: slot.uuid,
        reference: slide.reference || '',
        bodies: slide.bodies || (slide.body ? [slide.body] : [[]]),
        propTransition: slide.propTransition || null,
        bodyW: slide.propBodyW || null,
        bodyX: slide.propBodyX || null,
        bodyLines: slide.propBodyLines || null,
      });
    } else if (slide.type === 'point') {
      if (slide.mode === 'revealing') {
        const bullets = slide.bullets || [];
        for (let i = 0; i < bullets.length; i++) {
          const pName = `${slide.propBaseName}_${i + 1}`;
          const slot  = nextSlot();
          propUuidMap[pName] = slot.uuid;
          propSpecs.push({
            type: 'point-revealing',
            propName: pName,
            slotName: slot.slot,
            slotUuid: slot.uuid,
            title: slide.title || null,
            bullets,
            activeIdx: i,
            propTransition:        slide.propTransition        || null,
            propInitialTransition: slide.propInitialTransition || null,
            propRevealTransition:  slide.propRevealTransition  || null,
            bodyW: slide.propBodyW || null,
            bodyX: slide.propBodyX || null,
          });
        }
      } else {
        const pName = slide.propName || slide.bodyText || 'point';
        const slot  = nextSlot();
        propUuidMap[pName] = slot.uuid;
        if (slide.customProp) {
          propSpecs.push({ type: 'manual', propName: pName, slotName: slot.slot, slotUuid: slot.uuid });
        } else {
          propSpecs.push({
            type: 'point-single',
            propName: pName,
            slotName: slot.slot,
            slotUuid: slot.uuid,
            bodyText: slide.propBodyDisplayText || slide.bodyText || '',
            propTransition: slide.propTransition || null,
            bodyW: slide.propBodyW || null,
            bodyX: slide.propBodyX || null,
          });
        }
      }
    }
  }

  if (includeResponseCard) {
    const slot = nextSlot();
    propUuidMap['Response Card'] = slot.uuid;
    propSpecs.push({
      type: 'response-card',
      propName: 'Response Card',
      slotName: slot.slot,
      slotUuid: slot.uuid,
      responses: responses || {},
      propTransition: null,
    });
  }
  return { propSpecs, propUuidMap };
}

/**
 * Encode presentation + write all output files.
 *
 * @param {object} spec         - Presentation spec (spec.outputFolder used if set)
 * @param {string} [outputPath] - Explicit .pro output path (overrides outputFolder)
 * @param {string} [legacyPropsDir] - Ignored (kept for backward compat signature)
 */
async function encode(spec, outputPath, legacyPropsDir) {
  const safeName = (spec.name || 'Untitled').replace(/[^a-zA-Z0-9_\-. ]/g, '_');

  // ── 1. Assign permanent prop slots and build prop cues ───────────────────
  const { propSpecs, propUuidMap } = collectPropSpecs(spec.slides || [], spec.responses || {}, !!spec.includeResponseCard);

  // Always fill all 50 slots — unused ones get empty placeholders so the
  // DeckPro collection in Pro7 is always consistent from the first export.
  const usedSlotUuids = new Set(propSpecs.map(p => p.slotUuid).filter(Boolean));
  for (const slot of DECKPRO_PROP_SLOTS) {
    if (!usedSlotUuids.has(slot.uuid)) {
      propSpecs.push({
        type:          'point-single',
        propName:      slot.slot,
        slotName:      slot.slot,
        slotUuid:      slot.uuid,
        bodyText:      '',
        propTransition: null,
      });
    }
  }

  let propBuf    = null;
  let propDocObj = null;

  if (propSpecs.length > 0) {
    propDocObj = buildAllPropCues(propSpecs, spec.style || {});
    propBuf    = await encodePropDocument(propDocObj);
  }

  // ── 2. Build presentation — propUuidMap already has permanent UUIDs ──────
  const presentationBuf = await encodeToBuffer(spec, propUuidMap);

  // Download mode — return buffers, skip disk writes
  if (spec.downloadMode) {
    const props = propBuf ? [{
      name: `${safeName}_Props`,
      fileName: `${safeName}_Props.pro`,
      data: propBuf.toString('base64'),
      bytes: propBuf.length,
    }] : [];
    return {
      downloadMode: true,
      fileName: `${safeName}.pro`,
      data: presentationBuf.toString('base64'),
      presentationBytes: presentationBuf.length,
      props,
    };
  }

  // Deliver mode — write presentation to library, inject prop cues into Configuration/Props
  if (spec.deliverMode) {
    const libraryDir = getPro7LibraryPath(spec.pro7LibraryFolder || '', spec.pro7RootFolder || '');
    const presPath   = path.join(libraryDir, `${safeName}.pro`);
    fs.mkdirSync(libraryDir, { recursive: true });

    // Remove any existing copies (including Pro7's -1, -2 suffixed duplicates) before writing
    try {
      const entries = fs.readdirSync(libraryDir);
      for (const entry of entries) {
        // Match exact name or name with numeric suffix (e.g. "Deck-1.pro", "Deck-2.pro")
        if (entry === `${safeName}.pro` || /^.+-\d+\.pro$/.test(entry) && entry.startsWith(safeName)) {
          fs.unlinkSync(path.join(libraryDir, entry));
        }
      }
    } catch (_) {}

    fs.writeFileSync(presPath, presentationBuf);

    // Also clean up any old _Props.pro that may have been left in the library by previous versions
    try {
      const oldPropsPath = path.join(libraryDir, `${safeName}_Props.pro`);
      if (fs.existsSync(oldPropsPath)) fs.unlinkSync(oldPropsPath);
    } catch (_) {}

    const writtenProps = [];
    let propsBackup = null;
    let propsInstalled = true;
    let propsError = null;
    if (propBuf && propDocObj) {
      // Props go directly into Configuration/Props — no _Props.pro needed in the library
      // Update visual content of permanent prop slots in Configuration/Props
      const r = await updateConfigProps(propDocObj.cues || [], spec.pro7RootFolder || '');
      propsBackup = r && r.backupPath ? path.basename(r.backupPath) : null;
      if (r && r.skipped) {
        propsInstalled = false;
        propsError = r.reason || 'Configuration/Props not found';
      }
    }
    return { presentationBytes: presentationBuf.length, props: writtenProps, presentationPath: presPath, delivered: true, propsBackup, propsInstalled, propsError };
  }

  // Local file mode — write to disk
  const outputFolder = spec.outputFolder
    || (outputPath ? path.dirname(outputPath) : null)
    || legacyPropsDir
    || process.env.PRO7_DIR
    || require('os').homedir() + '/Documents/ProPresenter';

  const outPath = outputPath || path.join(outputFolder, `${safeName}.pro`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, presentationBuf);

  const writtenProps = [];
  if (propBuf) {
    fs.mkdirSync(outputFolder, { recursive: true });
    const propPath = path.join(outputFolder, `${safeName}_Props.pro`);
    fs.writeFileSync(propPath, propBuf);
    writtenProps.push({ name: `${safeName}_Props`, bytes: propBuf.length, path: propPath });
  }

  return { presentationBytes: presentationBuf.length, props: writtenProps, presentationPath: outPath };
}

/**
 * Deliver TWO presentations that share one prop collection — e.g. a QR/no-QR
 * pair for Saturday/Sunday. Both specs must carry the same prop-bearing slide
 * content (same scripture/point propNames in the same order); QR-only
 * differences are fine since collectPropSpecs never reads qrOn/qrMacro, only
 * content fields. Props are built ONCE from specA and Configuration/Props is
 * patched ONCE, so both presentations reference identical prop UUIDs instead
 * of duplicating the DeckPro collection.
 *
 * @param {object} specA - first presentation to deliver (e.g. no-QR / v1)
 * @param {object} specB - second presentation to deliver (e.g. QR / v2)
 */
async function encodeDeliverPair(specA, specB) {
  const safeA = (specA.name || 'Untitled').replace(/[^a-zA-Z0-9_\-. ]/g, '_');
  const safeB = (specB.name || 'Untitled').replace(/[^a-zA-Z0-9_\-. ]/g, '_');

  // ── Build props ONCE — specA and specB have identical prop-relevant content ──
  const { propSpecs, propUuidMap } = collectPropSpecs(specA.slides || [], specA.responses || {}, !!specA.includeResponseCard);
  const usedSlotUuids = new Set(propSpecs.map(p => p.slotUuid).filter(Boolean));
  for (const slot of DECKPRO_PROP_SLOTS) {
    if (!usedSlotUuids.has(slot.uuid)) {
      propSpecs.push({
        type:          'point-single',
        propName:      slot.slot,
        slotName:      slot.slot,
        slotUuid:      slot.uuid,
        bodyText:      '',
        propTransition: null,
      });
    }
  }
  let propBuf = null, propDocObj = null;
  if (propSpecs.length > 0) {
    propDocObj = buildAllPropCues(propSpecs, specA.style || {});
    propBuf    = await encodePropDocument(propDocObj);
  }

  // ── Encode both presentations against the SAME propUuidMap ──
  const bufA = await encodeToBuffer(specA, propUuidMap);
  const bufB = await encodeToBuffer(specB, propUuidMap);

  const libraryDir = getPro7LibraryPath(specA.pro7LibraryFolder || '', specA.pro7RootFolder || '');
  fs.mkdirSync(libraryDir, { recursive: true });

  function writeOne(safeName, buf) {
    const presPath = path.join(libraryDir, `${safeName}.pro`);
    try {
      const entries = fs.readdirSync(libraryDir);
      for (const entry of entries) {
        if (entry === `${safeName}.pro` || (/^.+-\d+\.pro$/.test(entry) && entry.startsWith(safeName))) {
          fs.unlinkSync(path.join(libraryDir, entry));
        }
      }
    } catch (_) {}
    fs.writeFileSync(presPath, buf);
    try {
      const oldPropsPath = path.join(libraryDir, `${safeName}_Props.pro`);
      if (fs.existsSync(oldPropsPath)) fs.unlinkSync(oldPropsPath);
    } catch (_) {}
    return presPath;
  }

  const pathA = writeOne(safeA, bufA);
  const pathB = writeOne(safeB, bufB);

  let propsBackup = null, propsInstalled = true, propsError = null;
  if (propBuf && propDocObj) {
    const r = await updateConfigProps(propDocObj.cues || [], specA.pro7RootFolder || '');
    propsBackup = r && r.backupPath ? path.basename(r.backupPath) : null;
    if (r && r.skipped) {
      propsInstalled = false;
      propsError = r.reason || 'Configuration/Props not found';
    }
  }

  return {
    delivered: true,
    presentations: [
      { fileName: `${safeA}.pro`, path: pathA, bytes: bufA.length },
      { fileName: `${safeB}.pro`, path: pathB, bytes: bufB.length },
    ],
    propsBackup, propsInstalled, propsError,
  };
}

module.exports = { encode, encodeDeliverPair, encodeToBuffer, listPropsBackups, restorePropsBackup, getPropsConfigPath };
