# Media Storage & Pipeline — Falcon 3D Prints

## Overview

Media storage is powered by **Supabase Storage** (files only; strictly no Supabase Auth or database dependency). The database is hosted on **Turso** via `@libsql/client`, and the application runs on **Vercel** serverless hosting.

All static image and video assets uploaded via the CMS are stored in Supabase Storage under the public bucket:
- **Bucket Name**: `falcon-media`
- **Access**: Public for reads
- **Public URL Format**: `${SUPABASE_URL}/storage/v1/object/public/falcon-media/${storage_path}`
- **Server API**: REST API calls via native Node.js `fetch` using `SUPABASE_SERVICE_ROLE_KEY` (never exposed to client bundles or git).

---

## 1. Vercel ~4.5 MB Limit & Upload Architecture

Vercel serverless functions enforce a strict ~4.5 MB request body limit (`413 Payload Too Large`). Falcon 3D Prints addresses this with a dual-pipeline strategy:

### A. Server-Proxied Uploads (Images $\le 4$ MB)
- **Browser-Side Image Resizing**: Before upload, `lib/media/client-resize.ts` resizes images using an HTML5 Canvas:
  - **Full Version**: Maximum 2560px on longest dimension (high quality JPEG/PNG/WebP).
  - **Thumbnail**: 320px bounding box thumbnail.
- If the resized image is under 4 MB, it is sent through the authenticated route `POST /api/admin/media/upload`.
- The server validates declared size, MIME type allowlist, magic bytes, and explicitly rejects SVG/HTML scripts before writing to Supabase Storage via `putObject()`.

### B. Direct Signed Uploads (Videos & Large Files $\le 50$ MB)
- **Maximum File Size**: Supabase free tier allows up to **50 MB** per file.
- Larger files (and all video files) upload **directly** from the browser to Supabase Storage:
  1. **Pre-flight Validation**: The browser calls authenticated `POST /api/admin/media/signed-upload` with declared filename, MIME type, and size in bytes. The server rejects SVGs, unlisted formats, or files $> 50$ MB, then calls Supabase Storage REST API to generate a signed upload URL (`POST /storage/v1/object/upload/sign/...`).
  2. **Direct Browser Upload**: The browser issues a `PUT` request directly to the signed upload URL with binary file payload. This bypasses Vercel's 4.5 MB function limit entirely.
  3. **Post-Upload Verification**: The browser notifies `POST /api/admin/media/complete-upload`. The server fetches the initial bytes of the stored object from Supabase (`Range: bytes=0-511`), verifies magic bytes (rejecting spoofed files and SVGs), and if verification fails, deletes the object from Supabase immediately (`deleteObject`). If valid, the asset is recorded in Turso database.

### C. External Video Demonstrators
- Video demonstrations may also be registered as YouTube or Vimeo URLs through `POST /api/admin/videos`. Both self-hosted Supabase MP4/WebM videos and YouTube/Vimeo links are supported.

---

## 2. Security & Protections

1. **Authenticated Uploads Only**: All upload endpoints require active admin session cookies verified via PBKDF2/SHA-256 session tokens.
2. **Server-Side MIME Allowlist**:
   - Images: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
   - Videos: `video/mp4`, `video/webm`, `video/quicktime`
3. **Magic-Byte Signature Verification**:
   - **JPEG**: `FF D8 FF`
   - **PNG**: `89 50 4E 47 0D 0A 1A 0A`
   - **WebP**: `RIFF` ... `WEBP`
   - **AVIF**: offset 4-7 `ftyp`, offset 8-11 `avif` or `avis`
   - **MP4**: offset 4-7 `ftyp` (`isom`, `mp41`, `mp42`, `dash`, etc.)
   - **WebM**: `1A 45 DF A3` (EBML identifier)
4. **Strict SVG & Script Rejection**: Any file containing `<svg`, `<?xml`, or `<html` is rejected with HTTP 400 to prevent stored Cross-Site Scripting (XSS).
5. **Secret Protection**:
   - `SUPABASE_SERVICE_ROLE_KEY` is server-side only.
   - Enforced by automated build check (`npm run check-secrets`) verifying that neither the secret key nor its name appears in any `.next/static/` client bundle.
   - `.env*` files are strictly git-ignored; `.env.example` contains variable names only.

---

## 3. Delete-With-Warning Architecture (`lib/media/usage.ts`)

To prevent broken links across public pages, deleting an asset triggers a comprehensive reference audit across 9 foreign keys / JSON fields:
1. `categories.image_id`
2. `projects.featured_image_id`
3. `projects.og_image_id`
4. `project_media.media_id`
5. `products.featured_image_id`
6. `products.og_image_id`
7. `product_media.media_id`
8. `videos.thumbnail_id`
9. `website_content.content_json`

- **Warning on In-Use**: If referenced, returns HTTP 409 Conflict with full list of affected items.
- **Confirmed Delete**: Passing `?force=true` marks the row deleted in Turso and deletes the binary object from Supabase Storage via `deleteObject()`.

---

## 4. Migration 0003 (`migrations/0003_storage_paths.sql`)

Migration 0003 adds storage path and public URL tracking to media and videos tables:
```sql
ALTER TABLE media ADD COLUMN storage_path TEXT;
ALTER TABLE media ADD COLUMN public_url TEXT;

ALTER TABLE videos ADD COLUMN storage_path TEXT;
ALTER TABLE videos ADD COLUMN public_url TEXT;

UPDATE media SET storage_path = key WHERE storage_path IS NULL;
UPDATE media SET public_url = '/api/media/' || key WHERE public_url IS NULL;
```

---

## 5. Free Tier Pause Risk & Keep-Alive Cron

### Risk of Inactivity Pause
Supabase free tier projects are paused after 7 days of inactivity. If paused, storage requests will fail until manually resumed in the dashboard.

### Mitigation: Scheduled Keep-Alive Cron
Falcon 3D Prints implements an automated keep-alive route:
- **Route**: `GET /api/cron/keepalive`
- **Protection**: Checks `Authorization: Bearer <CRON_SECRET>` header.
- **Actions**:
  1. Executes lightweight Turso query (`SELECT 1 as ok`) to warm the database.
  2. Executes lightweight Supabase Storage REST call (`POST /storage/v1/object/list/falcon-media` with limit 1) to keep the Supabase project active.
- **Schedule**: Defined in `vercel.json` (`0 0 */3 * *`) to run once every 3 days.

> **Important**: Even with the keep-alive cron, Supabase policy recommends logging into the [Supabase Dashboard](https://supabase.com/dashboard) at least once a month to ensure account activity compliance.
