# Media Storage & R2 Pipeline — Falcon 3D Prints

## Overview

All static image and video assets uploaded via the CMS are stored in **Cloudflare R2** under the `falcon-media` bucket (bound as `MEDIA_BUCKET` in `wrangler.jsonc`). Media delivery is orchestrated through an edge route handler with cryptographic validation and cache optimizations.

---

## 1. Upload Pipeline & Security Validation

All image uploads pass through `lib/media/validation.ts` before reaching R2:

### Permitted File Types
- **Allowlist**: `image/jpeg`, `image/png`, `image/webp`, `image/avif`
- **Max File Size**: 15 MB
- **Explicit SVG Rejection**: SVG uploads are strictly prohibited to eliminate stored Cross-Site Scripting (XSS) vectors.

### Magic Byte Verification
The server reads the initial bytes of every upload to ensure the file contents match the claimed MIME type:
- **JPEG**: `FF D8 FF`
- **PNG**: `89 50 4E 47 0D 0A 1A 0A`
- **WebP**: `52 49 46 46` ... `57 45 42 50`
- **AVIF**: `00 00 00 ... 66 74 79 70` (`ftypavif` or `ftypavis`)

Spoofed files (such as an `.exe` or `.html` renamed to `.png`) are immediately rejected with HTTP 400.

---

## 2. Serving Media (`/api/media/[...key]`)

The serving route (`app/api/media/[...key]/route.ts`) handles delivery directly from R2 with edge optimizations:

- **D1 Existence Check**: Checks that the requested key exists in the D1 `media` table and has not been marked as deleted. Dangling or unregistered objects are never served.
- **Cache-Control**: Sets `Cache-Control: public, max-age=31536000, immutable` for high cache hit rates across Cloudflare Edge nodes.
- **Security Headers**: Injects `X-Content-Type-Options: nosniff`.
- **Conditional Requests (ETags)**: Returns HTTP 304 Not Modified when client sends matching `If-None-Match`.
- **HTTP Range Requests**: Supports `Range: bytes=start-end`, returning HTTP 206 Partial Content for streaming large videos.

---

## 3. Delete-With-Warning Architecture (`lib/media/usage.ts`)

To prevent broken images across the website, deleting an asset triggers a comprehensive reference audit:

1. `categories.image_id`
2. `projects.featured_image_id`
3. `projects.og_image_id`
4. `project_media.media_id`
5. `products.featured_image_id`
6. `products.og_image_id`
7. `product_media.media_id`
8. `videos.thumbnail_id`
9. `website_content.content_json` (scans JSON blobs for referenced keys)

If an asset is in use, the CMS displays an explicit warning modal detailing exactly which products or pages are actively using the image before allowing the administrator to confirm deletion.
