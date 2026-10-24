-- DeckPro Cloud — D1 schema.
-- Every row belongs to a "space" (today: one per user, their personal
-- account). Keeping decks/settings keyed by space rather than user is what
-- lets a shared team space slot in later without touching the sync protocol.

CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  google_sub  TEXT UNIQUE NOT NULL,
  email       TEXT NOT NULL,
  name        TEXT DEFAULT '',
  picture     TEXT DEFAULT '',
  space_id    TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS spaces (
  id          TEXT PRIMARY KEY,
  name        TEXT DEFAULT '',
  seq         INTEGER NOT NULL DEFAULT 0,   -- bumps on every deck write; pull cursor
  created_at  TEXT NOT NULL
);

-- One row per signed-in device. Only a hash of the token is stored.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  device_name TEXT DEFAULT '',
  created_at  TEXT NOT NULL,
  last_seen   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- A desktop sign-in in progress: the app opens /auth/start?nonce=…, then polls
-- /auth/poll until the browser side finishes and a session is parked here.
CREATE TABLE IF NOT EXISTS logins (
  nonce       TEXT PRIMARY KEY,
  device_name TEXT DEFAULT '',
  token       TEXT,                 -- plaintext, handed over once, then the row is deleted
  error       TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS decks (
  space_id    TEXT NOT NULL,
  id          TEXT NOT NULL,
  rev         INTEGER NOT NULL,     -- per-deck version; clients push with the rev they started from
  seq         INTEGER NOT NULL,     -- space seq at last write (pull cursor)
  updated_at  TEXT NOT NULL,        -- client edit time; decides "newest wins" on conflict
  deleted     INTEGER NOT NULL DEFAULT 0,  -- permanent delete tombstone (Trash is just meta.status)
  meta        TEXT NOT NULL DEFAULT '{}',
  state       TEXT,
  saved_by    TEXT DEFAULT '',
  PRIMARY KEY (space_id, id)
);
CREATE INDEX IF NOT EXISTS idx_decks_seq ON decks(space_id, seq);

CREATE TABLE IF NOT EXISTS settings (
  space_id    TEXT PRIMARY KEY,
  doc         TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
