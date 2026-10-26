-- One-time migration for databases created before the main-Mac feature.
--   npx wrangler d1 execute deckpro-sync --remote --file=migrate-main-mac.sql
ALTER TABLE spaces ADD COLUMN main_device_id TEXT;
ALTER TABLE spaces ADD COLUMN main_device_name TEXT DEFAULT '';
ALTER TABLE spaces ADD COLUMN main_seen_at TEXT;
