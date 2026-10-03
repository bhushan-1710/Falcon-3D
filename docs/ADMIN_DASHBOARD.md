# Admin Dashboard & CMS Manual — Falcon 3D Prints

## Overview

The Falcon CMS is an administrative control center for managing studio catalog products, workshop wall projects, media uploads, copy edits, navigation links, and system health.

- **Route**: `/admin`
- **Login Route**: `/admin/login`
- **Robots / SEO**: Enforced `<meta name="robots" content="noindex, nofollow" />` across all admin routes.

---

## 1. Authentication & Security

- **Algorithm**: WebCrypto PBKDF2 with SHA-512, 100,000 iterations, 32-byte unique salt.
- **Sessions**: Random 32-byte cryptographic token stored as a SHA-256 hash in D1 `sessions`.
- **Cookies**:
  - `__Host-session` in production HTTPS environments (`httpOnly: true`, `sameSite: 'strict'`, `path: '/'`, `maxAge: 7 days`).
  - Fallback to `session` on HTTP localhost.
- **CSRF Protection**: Mutating HTTP requests (`POST`, `PUT`, `DELETE`, `PATCH`) validate the client `Origin` against the host.
- **Rate Limiting**: Monitored via `login_attempts` table. Enforces max 5 failed attempts per 15-minute rolling window per email hash.
- **Admin Creation CLI**:
  ```bash
  npm run create-admin
  # or
  npx tsx scripts/create-admin.ts
  ```

---

## 2. CMS Sections & Capabilities

### Dashboard (`/admin`)
- Real-time metric cards for Products, Workshop Projects, Media Assets, and Videos.
- Quick action links to add new products, projects, or upload assets.
- Live administrative audit feed showing latest mutations.

### Products (`/admin/products`)
- Full catalog CRUD: Title, slug, summary, description, category, price, lead time, materials, specifications, tags, and status (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
- Safe deletion policy: A product must be moved to `ARCHIVED` before it can be deleted, preventing accidental catalog destruction.
- Slug collision validation prevents duplicate URL conflicts.
- One-click duplication (`/api/admin/products/[id]/duplicate`).
- Embedded `MediaPicker` to assign featured images and gallery photos.

### Workshop Wall Projects (`/admin/projects`)
- Manages the prints featured on the public 3D Workshop Wall scene.
- Workshop Wall slot indicator: Highlights when the 6-slot limit is reached.
- Controls: Title, slug, subtitle, description, category, tags, and featured status.
- One-click project duplication (`/api/admin/projects/[id]/duplicate`).

### Media Library (`/admin/media`)
- Grid layout with MIME type filtering and real-time previews.
- Direct-to-R2 file upload with client & server-side magic byte inspection.
- **Delete-with-warning modal**: Automatically scans all 9 foreign key references and JSON content fields across the database before allowing asset removal.

### Videos (`/admin/videos`)
- Supports external video embed URLs (YouTube, Vimeo) and direct R2 multipart uploads for hero/demo reels.

### Website Content (`/admin/content`)
- Section-by-section live copy editor for:
  - Hero section (H1, support line, secondary line, CTA buttons)
  - Process (heading, turnaround, stages)
  - About (heading, kinetic eyebrow, philosophy body, owner sign-off)
  - Contact / Final CTA (heading, supporting copy, WhatsApp CTA)
  - Products Page (eyebrows, headlines, empty state copy)
- Dedicated "Reset to Defaults" button for each section.

### Navigation (`/admin/navigation`)
- Controls order, labels, URLs, visibility, and external tab settings for public header links.
- Reorder items up and down with instant sort-order persistence.
- "Reset Defaults" restores canonical studio menu architecture.

### Settings & System Diagnostics (`/admin/settings`)
- Live status indicators for Cloudflare D1 and R2 bindings.
- Studio profile configuration (brand name, contact email, WhatsApp phone, currency).
- Audit log viewer displaying recent administrative mutations and timestamps.
