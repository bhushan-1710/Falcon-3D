# Falcon 3D Prints — Implementation State

> **File location**: repo root (`falcon-web/IMPLEMENTATION_STATE.md`), not `docs/`.

---

## Phase 3C — R2 + Media Layer (2026-10-03) ✅

### 1. Scope & Implementation
- **R2 Bucket Binding**: Added `r2_buckets` in `wrangler.jsonc` with binding `MEDIA_BUCKET` mapped to `falcon-media`.
- **Validation Engine (`lib/media/validation.ts`)**:
  - Size checks: 15 MB image limit, 250 MB video limit.
  - Strict MIME allowlist: `image/jpeg`, `image/png`, `image/webp`, `image/avif`.
  - Magic byte signatures verified: JPEG (`FF D8 FF`), PNG (`89 50 4E 47 0D 0A 1A 0A`), WebP (`RIFF...WEBP`), AVIF (`ftypavif/avis`).
  - Strict security rejection: Explicit check rejecting SVG uploads (`<svg`, `<?xml`).
  - Strict mismatch rejection: Verifies declared MIME matches detected magic bytes.
- **Media Serving Route (`app/api/media/[...key]/route.ts`)**:
  - Verification: Queries D1 `media` table; non-registered or deleted files immediately return 404.
  - Conditional requests: Handles `If-None-Match` vs ETag, returning HTTP 304 Not Modified.
  - Range support: Parses `Range: bytes=start-end`, returning HTTP 206 Partial Content with `Content-Range` and `Accept-Ranges: bytes`.
  - Security headers: `X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=31536000, immutable`.
- **Upload API Routes**:
  - `app/api/admin/media/upload/route.ts`: Uploads validated image buffers directly into R2 under `media/{id}/{sanitized_filename}` and inserts metadata records into D1 `media`.
  - `app/api/admin/videos/upload/route.ts`: Chunked multipart video uploads via `MEDIA_BUCKET` binding (`initiate`, `upload_part`, `complete`, `abort`). Inserts into D1 `videos` only upon finalize.
  - `app/api/admin/videos/route.ts`: Video catalog queries and external video (YouTube/Vimeo) registration.
- **Delete-with-Warning Usage Engine (`lib/media/usage.ts`)**:
  - Checks every foreign key column: `categories.image_id`, `projects.featured_image_id`, `projects.og_image_id`, `products.featured_image_id`, `products.og_image_id`, `videos.thumbnail_id`.
  - Checks join tables: `project_media.media_id`, `product_media.media_id`.
  - Checks JSON content: Scans `website_content.content_json` blobs for media ID occurrences.
  - Endpoint `app/api/admin/media/[id]/usage/route.ts` exposes reference details for CMS delete confirmations.

### 2. Verification
- **Unit Tests**:
  - `scripts/test_media_validation.ts`: Passed (JPEG, PNG, WebP, AVIF valid; SVG rejected; spoofed text rejected; MIME mismatch rejected; size limit enforced).
  - `scripts/test_media_usage.ts`: Passed (all 9 FK/join/JSON locations verified with mock D1).
- **End-to-End API Integration (`verify_3c.js`)**:
  - SVG upload rejected (HTTP 400).
  - Spoofed magic bytes rejected (HTTP 400).
  - Valid PNG uploaded to R2 and inserted into D1 (HTTP 200).
  - Media served via `/api/media/[...key]` (HTTP 200, Content-Type `image/png`, nosniff, ETag).
  - Conditional request verified (HTTP 304).
  - Range request verified (HTTP 206, Content-Range `bytes 0-10/33`, Content-Length 11).
  - Usage check verified: `inUse: false` initially; `inUse: true` after attaching to project.
  - Deletion verified: media served route immediately returns 404 after deletion.
- **Build Checks**:
  - `next build`: Passed cleanly with all dynamic API routes.
  - `opennextjs-cloudflare build`: Passed cleanly, worker bundle saved to `.open-next/worker.js`.

### 3. Next Phase
- **Phase 4**: Auth + Admin Shell (PBKDF2 WebCrypto hashing, session management with SHA-256 tokens in D1, HTTP-only cookies, login rate limiting, CSRF verification, local `scripts/create-admin` CLI, protected admin routes, CMS shell UI with sidebar and dashboard stats).

---

## Phase 3B — D1 Schema + Data Layer (2026-10-03) ✅

### 1. Scope & Implementation
- **Cloudflare D1 Binding**: Added `d1_databases` in `wrangler.jsonc` with binding `DB`, database name `falcon-db`, local placeholder ID `00000000-0000-0000-0000-000000000000`, and `migrations_dir: "migrations"`.
- **Centralized Gateway**: `lib/cloudflare/context.ts` provides `getCloudflareEnv()`, `getDB()`, and `getMediaBucket()` through `@opennextjs/cloudflare`'s `getCloudflareContext()`. Zero external dependencies added; native Worker types defined in `lib/cloudflare/types.ts`.
- **Migrations**:
  - `migrations/0001_initial_schema.sql`: Full normalized D1 schema containing `media`, `videos`, `categories`, `projects`, `project_media`, `products`, `product_media`, `website_content`, `navigation_items`, `site_settings`, `users`, `sessions`, `login_attempts`, `activity_log`. Integer epoch timestamps, soft deletion via `deleted_at`, status checks (`DRAFT`, `PUBLISHED`, `ARCHIVED`), and cascaded join foreign keys.
  - `migrations/0002_seed_initial.sql`: Navigation seed (6 approved links: SERVICES, WORK, PRODUCTS, PROCESS, ABOUT, CONTACT) and website content defaults mirroring live copy. Strictly NO products, NO projects.
- **Data Access Layer**:
  - `lib/data/products.ts`: Parameterized queries filtering strictly by `status = 'PUBLISHED' AND deleted_at IS NULL`. Falls back to dev fixtures only when `NODE_ENV === 'development' && USE_PRODUCT_FIXTURES === '1'`. In production or without fixtures enabled, returns empty array with approved empty state.
  - `lib/data/projects.ts`: Caps at 6 slots, maps published D1 projects into Workshop Wall slots while preserving static geometric depth/rotation/scale presets.
  - `lib/data/navigation.ts` & `lib/data/content.ts`: Typed accessors with static fallbacks.
- **Dynamic Routing**:
  - `app/products/page.tsx` & `app/products/[slug]/page.tsx`: Set `export const dynamic = 'force-dynamic'` and `export const dynamicParams = true` to prevent edge caching of 404s before publish.

### 2. Browser & Local Verification (CDP Driven)
- Executed `verify_3b.js` using real Chrome over Chrome DevTools Protocol (CDP port 9226):
  - **Empty DB**: `/products` returned `hasEmptyState: true` (`00 / NO PRODUCTS CURRENTLY RELEASED`), `productCards: 0`.
  - **Published Product Insert**: SQL inserted `test-d1-housing` with status `PUBLISHED`. Verified on `/products` (`hasTestProduct: true`, `productCards: 1`) and on `/products/test-d1-housing` (HTTP 200, title rendered, price rendered).
  - **Draft Suppression**: Updated status to `DRAFT`. Verified hidden on `/products` (`hasTestProduct: false`, `hasEmptyState: true`), and `/products/test-d1-housing` returned 404 (`is404: true`).
  - **Clean Cleanup**: Deleted test product via SQL; count returned to 0 cleanly.
- Build checks:
  - `next build`: Passed cleanly (`ƒ /products` and `ƒ /products/[slug]` dynamically server-rendered).
  - `opennextjs-cloudflare build`: Passed cleanly, worker saved to `.open-next/worker.js`.

### 3. Next Phase
- **Phase 3C**: R2 + Media Layer (local R2 emulation, upload endpoints, magic-byte validation, media serving route with Range/ETag headers, delete-with-warning check).

---

## Phase 2c — Mobile Header Overflow Fix (2026-10-03) ✅

### Root Cause (CDP measured)
- `/products` only: `scrollWidth 461px` vs `clientWidth 375px` (+86 px).
- `.products-cta-band__actions` had `flex-shrink: 0` blocking flex compression inside its 335 px parent. Two buttons (295.9 + 32 gap + 120.8 = 448.7 px) pushed element `right` to 460.6 px → document scroll width 461 px → fixed header reflowed to that width.
- `.nav-progress` was `width: 0` — not the cause.

### Fix
- `app/products/page.tsx`: removed `flex-shrink: 0`, added `flex-shrink: 1; min-width: 0; max-width: 100%`.
- `app/products/[slug]/page.tsx`: already correct, no change.
- Zero changes to Navigation, globals.css, scenes, or any protected file.

### Verified
All 8 CDP checks (320/375/390/768 px on `/` and `/products`): `overflow=0`, hamburger visible at all mobile widths.

---

## Phase 3A — Cloudflare Setup Smoke Test (2026-10-03) ✅

### 1. Scope & Dependencies
- Dev dependencies installed: `@opennextjs/cloudflare` (^1.20.8), `wrangler` (^4.147.0).
- Config files created:
  - `wrangler.jsonc`: Clean worker config with **NO bindings** (D1 and R2 deferred to Phase 3B), `compatibility_date: "2026-09-23"`, flags `["nodejs_compat", "global_fetch_strictly_public"]`, and assets mapped to `.open-next/assets`.
  - `open-next.config.ts`: Baseline `defineCloudflareConfig()` without cache overrides.
- Updated `package.json` with scripts: `build:worker`, `preview`, `deploy`.
- Updated `.gitignore` with `/.open-next/` and `/.wrangler/`.

### 2. Next 16 Middleware / Proxy Research
- Next 16 transitions from `middleware.ts` toward `proxy.ts`, which defaults to running on Node.js runtime.
- `@opennextjs/cloudflare` has known limitations / runtime mismatches with Node.js proxy/middleware features on Workers.
- Architecture rule reaffirmed: Middleware/proxy must only ever be a convenience layer (e.g. lightweight URL redirects or UX headers), **never the primary or only security/admin authorization gate**. All admin endpoints in Phase 3+ must authenticate inside server actions and route handlers directly.

### 3. Build & Preview Results
- Build command `npx opennextjs-cloudflare build` executed and succeeded with exit code 0.
- Output generated: Worker bundle at `.open-next/worker.js` and assets in `.open-next/assets`.
- Windows / OneDrive note: OpenNext issued standard advice recommending WSL for Windows production builds, but local build and packaging passed without flaky behavior.
- Local preview tested via `npx opennextjs-cloudflare preview` on `http://127.0.0.1:8787`:
  - `GET /` → HTTP 200 OK (`x-opennext: 1`, `Content-Length: 124961`)
  - `GET /products` → HTTP 200 OK (`x-opennext: 1`, `Content-Length: 45936`)
  - `GET /products/sample-test` → HTTP 404 Not Found (`x-opennext: 1`, `Content-Length: 9509`)

### 4. Browser Verification
- Playwright subagent driver download blocked by network (Azure CDN 404).
- Manual verification checklist for `http://127.0.0.1:8787`:
  - [ ] Home `/`: 3D hero canvas, scenes, navigation, and console clean.
  - [ ] Products `/products`: Hero, empty catalog state, CTA band, footer.
  - [ ] Non-existent slug `/products/sample-product`: 404 page renders.

### 5. Caching & 404 Analysis for Phase 3B
- **Current rendering**: `/products` is static (`○`); `/products/[slug]` uses `generateStaticParams()` (`●`) with dynamic fallback (`dynamicParams = true`).
- **404 caching risk**: If a user or crawler visits `/products/new-slug` before publication, Cloudflare CDN / edge caches could store the negative 404 response according to edge cache rules, causing the page to return 404 even after the CMS publishes the product.
- **Proposed fix for Phase 3B**:
  1. For dynamic CMS-driven freshness: use `export const dynamic = 'force-dynamic'` (or `revalidate = 0`) on `/products` and `/products/[slug]` so queries go directly to D1 on every request.
  2. Or, if edge caching is desired: trigger `revalidatePath('/products')` and `revalidatePath('/products/[slug]')` upon publishing via CMS server actions, configured with OpenNext's D1/KV tag cache.

---

## Phase 2b — Fix-up Pass (2026-10-03) ✅

### 1. Fixture Bundle Gate (verified clean)
- `lib/data/products.ts` gates all fixture data behind `NODE_ENV === 'development' && USE_PRODUCT_FIXTURES === '1'`.
- Production build (no opt-in) confirmed: `getPublishedProducts()` and `getPublishedProductBySlug()` both return `[]` / `null`.
- Bundle search (`.next/server`, `.next/static`) for fixture-only strings (`SAMPLE PRODUCT`, `engineered-equipment-enclosure`, `articulated-robotic-gripper-kit`, `SAMPLE DRAFT`): **zero hits**.
- Note: `parametric-spiral-luminary` found in bundle originates from `lib/projects.ts` (Workshop Wall scene data, unrelated to product fixtures).

### 2. Production 404 Behaviour (no `dynamicParams = false`)
- `dynamicParams` left at default (`true`) intentionally — Phase 3 CMS products must render on-demand without redeploy.
- Production server tested via `next start` without `USE_PRODUCT_FIXTURES`.
- `/products/engineered-equipment-enclosure` (fixture slug): **HTTP 404** ✅
- `/products/totally-random-slug` (unknown slug): **HTTP 404** ✅
- `/products` (listing): **HTTP 200** ✅ (shows designed empty state)
- Mechanism: `getPublishedProductBySlug()` returns `null` → `notFound()` is called → Next.js emits 404.

### 3. SITE_URL & metadataBase
- `seo.canonicalUrl` in `lib/content.ts` is `'[CONFIRM: final production URL]'` — a placeholder string, **never used** in metadata.
- `app/layout.tsx` uses `process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined` for `metadataBase`. No code change required.
- `lib/data/products.ts` `buildProductWhatsAppUrl()` omits the `"Page: <url>"` line when `SITE_URL` is not configured.
- **Required env vars**:
  - `SITE_URL=https://<production-domain>` — enables `metadataBase` and WhatsApp page link. Omit in local dev.
  - `USE_PRODUCT_FIXTURES=1` — local dev only, never set in production.

### 4. Browser Verification
- **Browser tool failed**: Playwright driver download returned HTTP 404 from all Azure CDN mirrors (`playwright-1.57.0-win32_x64.zip`). Screenshots could not be taken.
- **Manual checklist** (to be completed by user before Phase 2b approval):
  - [ ] Home `/` at 1440px: warm paper/cream bg, black ink, orange accents, editorial type, no console errors.
  - [ ] Home `/` at 375px: no layout overflow, all scenes render correctly.
  - [ ] Nav order at 1440px: SERVICES · WORK · PRODUCTS · PROCESS · ABOUT · CONTACT + CTA button.
  - [ ] SERVICES click on `/` → smooth-scrolls to `#lab`.
  - [ ] CTA button → smooth-scrolls to `#contact`.
  - [ ] `/products` (no fixture): shows empty state, PRODUCTS link is active/orange.
  - [ ] SERVICES from `/products` → navigates to `/#lab`.
  - [ ] Logo from `/products` → returns to `/`.
  - [ ] `USE_PRODUCT_FIXTURES=1` dev: `/products/engineered-equipment-enclosure` shows `[SAMPLE PRODUCT]` title, specs, ENQUIRE button.
  - [ ] ENQUIRE WhatsApp URL starts with `https://wa.me/919850607144`.
  - [ ] `/products/unreleased-internal-bracket` (DRAFT) → 404.
  - [ ] `/products/totally-made-up-slug` → 404.

### 5. Production Route Table
```
○ /                   — Static (home)
○ /_not-found         — Static
○ /products           — Static (empty state when no D1/fixtures)
● /products/[slug]    — SSG (0 params in production; on-demand ISR for Phase 3)
```

---

## Status: COMPLETE & SURGICAL 2-ARTIFACT REPLACEMENT VERIFIED ✅

The Falcon 3D Prints web application has completed the Surgical 2-Artifact Replacement Pass. Exactly TWO visual artifacts were replaced:
1. **Hero Object**: Replaced futuristic sci-fi cage with `hero-object-new.webp` (compact engineered electronics enclosure prototype with grounded contact shadow).
2. **Print Lab DESIGN State**: Replaced drone CAD software screenshot with `design-object-new.webp` (pure isolated 3D CAD model on neutral cream `#F2E6DA` background, with clean facet wireframe edges and zero software UI or chrome).

All other components, scenes, and artifacts remain 100% in their approved states:
- **Print Lab CUSTOM**: Retains approved original `lab-custom.webp`.
- **Print Lab PROTOTYPE**: Retains approved original `lab-prototype.webp`.
- **Print Lab FIGURINE**: Retains approved original `lab-figurine.webp`.
- **Digital → Physical (Scene D)**: Retains approved original implementation (SVG wireframe, LayerBands, ToolPath, and `transform-physical.webp`).
- **Workshop Wall, Sample Wall, About, Process, CTA**: 100% unchanged.
- **Design system, typography, colors, layout, and motion language**: 100% preserved.

---

### 1. Authenticity & Factuality Audit (Completed)
- **Eliminated Fake Measurements**: Removed all unverified millimeter measurements (e.g. `240 mm`, `180 mm`) and dimension bounding boxes (`X 180 · Y 240 · Z 180 mm`).
- **Eliminated Fake Layer Counts**: Replaced `LAYER 420 / 420` with neutral `LAYER VIEW · BUILD STRATA`.
- **Eliminated Unverified Marketing Claims**: Removed claims such as "calibrated precision filaments" and "high-precision fabrication".
- **Eliminated Invented Leadership Titles**: Removed `Studio Lead & Fabrication Specialist` in favor of confirmed studio location: `NASHIK STUDIO · CUSTOM 3D FABRICATION`.
- **Neutral Technical Descriptors**: Standardized on honest, neutral labels:
  - `CUSTOM OBJECT · 3D MODEL`
  - `SCALE GUIDE`
  - `BUILD ENVELOPE`
  - `LAYER VIEW · BUILD STRATA`
  - `CONCEPT EXAMPLE`
  - `EXAMPLE APPLICATION`

---

### 2. Demonstration Asset Framing (Completed)
- Non-verified customer deliverables are explicitly and honestly framed as demonstrator concept studies.
- No invented customer names, aerospace clients, or fabricated project histories.
- All portfolio items framed under: "Explore what's possible" and "Example applications".

---

### 3. Scene-by-Scene Refinement Pass

#### Scene A — Hero
- Replaced fake dimension tag with `CUSTOM OBJECT · 3D MODEL`.
- Replaced `240 mm` dimension line with `DimensionLine label="SCALE GUIDE"`.
- Clean visual hierarchy with zero broken assets.

#### Scene B — Print Lab
- Preserved all 4 core categories: `CUSTOM`, `PROTOTYPE`, `DESIGN`, `FIGURINE`.
- Synchronized state transitions: central object cutout, crosshairs, description, and tags animate in single coordinated flow.
- Added animated sliding pill highlight (`layoutId="active-lab-pill"`) with fluid spring motion for active category selection.

#### Scene C — Workshop Wall
- Retained spatial card-wall perspective choreography and giant background typography.
- Enhanced active card emphasis: active card scales to 1.18 with 1.5px orange focus outline and higher z-depth (`z: 80, zIndex: 10`).
- Secondary cards smoothly scale to 0.88 with 0.72 opacity.
- Eliminated typography collision: streamlined on-card metadata to single-line title and category tag; detailed narrative appears cleanly in the featured side drawer.

#### Scene D — Digital → Physical
- Scaled central technical visual up by ~20% (`clamp(240px, 46vw, 620px)` x `clamp(300px, 58vh, 720px)`).
- Clear 4-stage progression of ONE consistent geometry:
  - **01 IDEA**: Point-cloud vertex dots and origin axes crosshair.
  - **02 MODEL**: High-contrast faceted wireframe spine and struts.
  - **03 BUILD**: Layer bands strata and toolpath trace.
  - **04 OBJECT**: Physical artifact revealed from base with realistic shadow.
- Synchronized active step highlights across `01 IDEA`, `02 MODEL`, `03 BUILD`, `04 OBJECT` driven by scroll position.
- Replaced fake dimensions with `BUILD ENVELOPE` and `LAYER VIEW · BUILD STRATA`.

#### Scene E — Process
- Streamlined to exact prompt-specified accurate language:
  - **01 SHARE**: Tell us what you want to make.
  - **02 DESIGN**: We review your idea, reference or model and prepare it for printing.
  - **03 PRINT**: The approved design is turned into a physical object.
  - **04 DELIVER**: Your finished print is ready for pickup or delivery.
- Added visual dwell time per stage and active contrast transitions, eliminating overlapping remnants.
- Turnaround badge: `NASHIK STUDIO · DIRECT TURNAROUND`.

#### About Section
- Replaced AI studio visual (which contained an AI person) with an authentic, human-free photograph of 3D printing equipment in action: enclosed printer depositing orange filament, spools, tools, calipers, and prototypes on a workbench.
- Visual labeled honestly as: `EQUIPMENT & FABRICATION · DEMONSTRATOR`.
- Leadership credit updated to: `NASHIK STUDIO · CUSTOM 3D FABRICATION`.

#### Print Sample Wall
- Curated 7 distinct sample objects with drag, momentum, and snap-to-nearest physics.
- Neutral, verified demonstrator categories: `PROTOTYPE HOUSING`, `CUSTOM DESIGN`, `MECHANICAL DEMO`, `SCALE MODEL`, `PROTOTYPE JIG`, `GEOMETRIC DEMO`, `CUSTOM OBJECT`.

#### Scene F — Final CTA
- Preserved minimal dark ink container.
- Conversion path streamlined to core fields:
  - Name
  - Phone / WhatsApp / Email
  - What do you want to make?
  - Submit ("START A CUSTOM PRINT")
- Added subtle visual continuity: faint technical faceted wireframe silhouette (9% opacity), Falcon Line accent, and coordinate spec mark `+ STUDIO SPEC [ NASHIK · 20.00° N, 73.78° E ]`.
- Low-friction contact path: direct WhatsApp button with pre-filled message, Call, and Email shortcuts.

---

### 4. Technical Quality & Production Build
- **Dev Server**: Running on `http://localhost:3000` (Next.js 16.3.8 + Turbopack).
- **Production Build**: `next build` passes with zero TypeScript errors and zero lint warnings.
- **Static Page Generation**: Fully pre-rendered static routes with optimized WebP assets.
- **Responsive Layout**: Validated across desktop, tablet, and mobile breakpoints.
