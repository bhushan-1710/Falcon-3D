# Database Migrations Guide — Cloudflare D1

## Overview

Falcon 3D Prints uses Cloudflare D1's built-in migration management via Wrangler. Migrations are organized as sequential SQL files inside the `migrations/` directory.

---

## 1. Migration Files

- **`migrations/0001_initial_schema.sql`**: Creates the 13 foundational database tables, primary keys, foreign key constraints, and performance indexes.
- **`migrations/0002_seed_initial.sql`**: Seeds default categories and canonical navigation links.

---

## 2. Running Migrations

### Local Environment
Wrangler manages a local SQLite file in `.wrangler/state/v3/d1`:

```bash
# Apply pending migrations locally
npx wrangler d1 migrations apply DB --local

# Inspect local database tables
npx wrangler d1 execute DB --local --command "SELECT name FROM sqlite_master WHERE type='table';"
```

### Production Cloudflare Environment
Before applying migrations in production, create your remote D1 database and paste its ID into `wrangler.jsonc`:

```bash
# 1. Create production database on Cloudflare
npx wrangler d1 create falcon-db

# 2. Update wrangler.jsonc with the generated database_id:
# "database_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# 3. Apply all migrations to remote production D1
npx wrangler d1 migrations apply DB --remote
```

---

## 3. Creating New Migrations

To add a new schema migration:

```bash
# Generate a new migration file
npx wrangler d1 migrations create DB add_new_feature
```

This creates a file like `migrations/0003_add_new_feature.sql`. Write idempotent SQL statements:

```sql
-- Migration: Add custom field
ALTER TABLE products ADD COLUMN lead_time_notes TEXT;
```

Always test new migrations locally first:
```bash
npx wrangler d1 migrations apply DB --local
```

---

## 4. Backups & Disaster Recovery

- **Remote Cloudflare D1 Backups**:
  ```bash
  # Cloudflare D1 supports time-travel and manual export
  npx wrangler d1 export falcon-db --remote --output backup.sql
  ```
- **Local Database Reset**:
  ```bash
  # Delete local wrangler state to start fresh
  Remove-Item -Recurse -Force .wrangler/state/v3/d1
  npx wrangler d1 migrations apply DB --local
  ```
