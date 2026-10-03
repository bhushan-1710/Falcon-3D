# Cloudflare Architecture — Falcon 3D Prints

## Overview

The Falcon 3D Prints web application is built on **Next.js 16 (React 19)** and deployed to **Cloudflare Workers** using `@opennextjs/cloudflare`. It utilizes Cloudflare-native edge primitives for database storage, object storage, and computation, completely avoiding heavy Node-native dependencies (such as `sharp` or `bcrypt`).

```
                              ┌──────────────────────────────────────┐
                              │           Cloudflare Edge            │
                              │                                      │
Clients / Browsers ──────────►│  Cloudflare Worker (.open-next)      │
                              │  ├── Next.js App Router (SSR/Edge)   │
                              │  ├── WebCrypto Auth & Rate Limiter   │
                              │  └── OpenNext Adapter Layer          │
                              └───────────┬───────────────────┬──────┘
                                          │                   │
                                          ▼                   ▼
                               ┌─────────────────────┐ ┌─────────────────────┐
                               │ Cloudflare D1 (SQL) │ │ Cloudflare R2       │
                               │ Binding: DB         │ │ Binding: MEDIA_BUCKET│
                               │ `falcon-db`         │ │ `falcon-media`      │
                               │ 13 Tables + Indices │ │ Objects & Video Part│
                               └─────────────────────┘ └─────────────────────┘
```

---

## 1. Cloudflare Primitives & Bindings

Configured in `wrangler.jsonc`:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "falcon-web",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-09-23",
  "compatibility_flags": [
    "nodejs_compat",
    "transform_stream_enable_standard_constructor"
  ],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "falcon-db",
      "database_id": "00000000-0000-0000-0000-000000000000",
      "migrations_dir": "migrations"
    }
  ],
  "r2_buckets": [
    {
      "binding": "MEDIA_BUCKET",
      "bucket_name": "falcon-media"
    }
  ]
}
```

### Context Resolution (`lib/cloudflare/context.ts`)
The application accesses bindings via `@opennextjs/cloudflare`'s `getCloudflareContext()` in runtime. In local development or environments where bindings are cold, it falls back cleanly to local D1 or in-memory simulation, ensuring zero unhandled exceptions.

---

## 2. OpenNext Adapter Pipeline

- **Next.js Version**: 16.3.8 (Turbopack)
- **OpenNext Cloudflare Version**: 1.20.8
- **Build Target**:
  - `npm run build`: Generates the standard Next.js standalone and static output.
  - `npm run build:worker`: Executes `opennextjs-cloudflare build` producing `.open-next/worker.js` and `.open-next/assets`.
- **Static Assets**:
  - Served directly from Cloudflare Edge asset store (`binding: "ASSETS"`), giving 0ms cold-start for static graphics, 3D gltf/glb/canvas artifacts, and css/js bundles.

---

## 3. Database Layer (Cloudflare D1)

- **Engine**: SQLite at the edge, globally replicated with read replication.
- **Transactions & Queries**: Parameterized queries using prepared statements (`db.prepare(...).bind(...)`).
- **Migrations**: Incremental SQL migrations in `migrations/` tracked by Cloudflare Wrangler (`d1 migrations apply`).

---

## 4. Object Storage (Cloudflare R2)

- **Engine**: S3-compatible, zero-egress-fee distributed object storage.
- **Media Serving (`app/api/media/[...key]/route.ts`)**:
  - Verified against D1 `media` table to prevent enumeration or dangling asset leaks.
  - HTTP Range support (206 Partial Content) for streaming MP4/WebM video playback.
  - ETag validation (304 Not Modified) and `Cache-Control: public, max-age=31536000, immutable`.
  - Security headers: `X-Content-Type-Options: nosniff`.
