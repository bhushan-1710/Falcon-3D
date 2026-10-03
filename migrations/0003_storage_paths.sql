-- ─── Migration 0003: Supabase Storage Paths & Public URLs ────────────────────────
-- Amends media and videos to store storage_path and public_url directly.
-- Do NOT edit 0001 or 0002.

ALTER TABLE media ADD COLUMN storage_path TEXT;
ALTER TABLE media ADD COLUMN public_url TEXT;

-- Backfill existing records if any
UPDATE media SET storage_path = key WHERE storage_path IS NULL AND key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_media_storage_path ON media(storage_path);

-- Support storage_path and public_url on videos table
ALTER TABLE videos ADD COLUMN storage_path TEXT;
ALTER TABLE videos ADD COLUMN public_url TEXT;
