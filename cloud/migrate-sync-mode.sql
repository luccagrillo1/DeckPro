-- One-time migration for databases created before the one-at-a-time sync mode.
--   npx wrangler d1 execute deckpro-sync --remote --command="ALTER TABLE spaces ADD COLUMN sync_mode TEXT DEFAULT ''"
-- (--file can fail with an OAuth error; --command works.)
ALTER TABLE spaces ADD COLUMN sync_mode TEXT DEFAULT '';
