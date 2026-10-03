-- ============================================================================
-- Falcon 3D Prints — D1 Schema
-- Migration: 0001_initial_schema.sql
-- ============================================================================
-- Conventions:
--   • All timestamps are INTEGER (Unix epoch seconds, UTC)
--   • Soft delete via deleted_at INTEGER (NULL = live)
--   • status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
--   • FK join tables: ON DELETE CASCADE
--   • FK media references: ON DELETE SET NULL (delete-with-warning enforced in app)
--   • Wall layout fields (depth/rotation/scale) live in lib/projects.ts, NOT here
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ─── Media ────────────────────────────────────────────────────────────────────
-- Tracks every file stored in R2. key is the R2 object key (media/{id}/...).
CREATE TABLE IF NOT EXISTS media (
  id          TEXT    PRIMARY KEY,            -- nanoid / uuid
  key         TEXT    NOT NULL UNIQUE,        -- R2 object key
  filename    TEXT    NOT NULL,               -- original filename (sanitised)
  mime_type   TEXT    NOT NULL,               -- e.g. image/webp
  size_bytes  INTEGER NOT NULL,
  width       INTEGER,                        -- pixels (images only)
  height      INTEGER,                        -- pixels (images only)
  alt_text    TEXT,
  caption     TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  deleted_at  INTEGER                         -- soft delete
);

CREATE INDEX IF NOT EXISTS idx_media_deleted_at  ON media(deleted_at);
CREATE INDEX IF NOT EXISTS idx_media_created_at  ON media(created_at);
CREATE INDEX IF NOT EXISTS idx_media_mime_type   ON media(mime_type);

-- ─── Videos ──────────────────────────────────────────────────────────────────
-- Supports R2-stored video files AND external URLs (YouTube/Vimeo).
CREATE TABLE IF NOT EXISTS videos (
  id            TEXT    PRIMARY KEY,
  r2_key        TEXT    UNIQUE,               -- NULL for external videos
  external_url  TEXT,                         -- NULL for R2 videos
  title         TEXT    NOT NULL,
  description   TEXT,
  mime_type     TEXT,                         -- NULL for external videos
  size_bytes    INTEGER,                      -- NULL for external videos
  duration_secs INTEGER,
  thumbnail_id  TEXT    REFERENCES media(id) ON DELETE SET NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  deleted_at    INTEGER
);

CREATE INDEX IF NOT EXISTS idx_videos_deleted_at ON videos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);

-- ─── Categories ───────────────────────────────────────────────────────────────
-- type: 'project' | 'product'  (separate namespaces)
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT    PRIMARY KEY,
  type        TEXT    NOT NULL CHECK(type IN ('project','product')),
  name        TEXT    NOT NULL,
  slug        TEXT    NOT NULL,
  description TEXT,
  image_id    TEXT    REFERENCES media(id) ON DELETE SET NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(type, slug)
);

CREATE INDEX IF NOT EXISTS idx_categories_type       ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_is_active  ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON categories(sort_order);

-- ─── Projects ─────────────────────────────────────────────────────────────────
-- Workshop Wall projects. Wall layout fields (depth/rotation/scale) are static
-- in lib/projects.ts; only CMS-managed content lives here.
CREATE TABLE IF NOT EXISTS projects (
  id              TEXT    PRIMARY KEY,
  slug            TEXT    NOT NULL UNIQUE,
  title           TEXT    NOT NULL,
  subtitle        TEXT,
  description     TEXT,
  category_id     TEXT    REFERENCES categories(id) ON DELETE SET NULL,
  status          TEXT    NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  is_featured     INTEGER NOT NULL DEFAULT 0 CHECK(is_featured IN (0,1)),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  featured_image_id TEXT  REFERENCES media(id) ON DELETE SET NULL,
  og_image_id     TEXT    REFERENCES media(id) ON DELETE SET NULL,
  seo_title       TEXT,
  seo_description TEXT,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch()),
  deleted_at      INTEGER
);

CREATE INDEX IF NOT EXISTS idx_projects_slug        ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_status      ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at  ON projects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_projects_is_featured ON projects(is_featured);
CREATE INDEX IF NOT EXISTS idx_projects_sort_order  ON projects(sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at  ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at  ON projects(updated_at);

-- ─── Project Media ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_media (
  project_id  TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  media_id    TEXT    NOT NULL REFERENCES media(id)    ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_project_media_sort ON project_media(project_id, sort_order);

-- ─── Products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                  TEXT    PRIMARY KEY,
  slug                TEXT    NOT NULL UNIQUE,
  title               TEXT    NOT NULL,
  subtitle            TEXT,
  short_description   TEXT,
  description         TEXT,
  price               TEXT,                   -- display string e.g. "₹1,200"
  dimensions          TEXT,                   -- display string e.g. "120 × 80 × 40 mm"
  material            TEXT,
  customization       TEXT,
  availability        TEXT,
  category_id         TEXT    REFERENCES categories(id) ON DELETE SET NULL,
  status              TEXT    NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','PUBLISHED','ARCHIVED')),
  is_featured         INTEGER NOT NULL DEFAULT 0 CHECK(is_featured IN (0,1)),
  sort_order          INTEGER NOT NULL DEFAULT 0,
  featured_image_id   TEXT    REFERENCES media(id) ON DELETE SET NULL,
  video_id            TEXT    REFERENCES videos(id) ON DELETE SET NULL,
  og_image_id         TEXT    REFERENCES media(id) ON DELETE SET NULL,
  seo_title           TEXT,
  seo_description     TEXT,
  created_at          INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at          INTEGER NOT NULL DEFAULT (unixepoch()),
  deleted_at          INTEGER
);

CREATE INDEX IF NOT EXISTS idx_products_slug        ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status      ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_deleted_at  ON products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_sort_order  ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at  ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at  ON products(updated_at);

-- ─── Product Media ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_media (
  product_id  TEXT    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  media_id    TEXT    NOT NULL REFERENCES media(id)    ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, media_id)
);

CREATE INDEX IF NOT EXISTS idx_product_media_sort ON product_media(product_id, sort_order);

-- ─── Website Content ──────────────────────────────────────────────────────────
-- Key-value store for CMS-managed copy. content_json is a validated JSON object.
CREATE TABLE IF NOT EXISTS website_content (
  section_key  TEXT    PRIMARY KEY,
  content_json TEXT    NOT NULL DEFAULT '{}',
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ─── Navigation Items ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS navigation_items (
  id           TEXT    PRIMARY KEY,
  label        TEXT    NOT NULL,
  url          TEXT    NOT NULL,
  is_external  INTEGER NOT NULL DEFAULT 0 CHECK(is_external IN (0,1)),
  open_new_tab INTEGER NOT NULL DEFAULT 0 CHECK(open_new_tab IN (0,1)),
  is_visible   INTEGER NOT NULL DEFAULT 1 CHECK(is_visible IN (0,1)),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_nav_sort    ON navigation_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_nav_visible ON navigation_items(is_visible);

-- ─── Site Settings ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            TEXT    PRIMARY KEY,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,            -- PBKDF2-SHA-512, base64
  password_salt TEXT    NOT NULL,            -- random 32-byte base64
  pbkdf2_iters  INTEGER NOT NULL DEFAULT 600000,
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  created_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── Sessions ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT    NOT NULL UNIQUE,       -- SHA-256(raw_token) hex
  expires_at   INTEGER NOT NULL,              -- Unix epoch
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  last_used_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ─── Login Attempts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
  id           TEXT    PRIMARY KEY,
  email_hash   TEXT    NOT NULL,              -- SHA-256(lower(email)) hex
  attempted_at INTEGER NOT NULL DEFAULT (unixepoch()),
  success      INTEGER NOT NULL DEFAULT 0 CHECK(success IN (0,1)),
  ip_hash      TEXT                           -- SHA-256(ip) hex
);

CREATE INDEX IF NOT EXISTS idx_login_email_at ON login_attempts(email_hash, attempted_at);
CREATE INDEX IF NOT EXISTS idx_login_ip_at    ON login_attempts(ip_hash, attempted_at);

-- ─── Activity Log ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT    NOT NULL,               -- e.g. 'product.publish', 'media.upload'
  entity_type TEXT,                           -- e.g. 'product', 'project', 'media'
  entity_id   TEXT,
  detail_json TEXT    DEFAULT '{}',
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_activity_user_id    ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_entity     ON activity_log(entity_type, entity_id);
