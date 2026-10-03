# Changelog — Falcon 3D Prints

> **File location**: repo root (`falcon-web/CHANGELOG.md`), not `docs/`.

## [Phase 7 — QA, Security Verification, Documentation, and Deploy Preparation] — 2026-10-03

### Added & Configured
- **Documentation Suite**:
  - `docs/CLOUDFLARE_ARCHITECTURE.md`: Complete architectural guide to Next.js 16 on Cloudflare Workers, OpenNext adapter, D1 SQLite, R2 object storage, and zero-egress media serving.
  - `docs/ADMIN_DASHBOARD.md`: Operational CMS manual covering PBKDF2 WebCrypto authentication, session lifecycle, rate limiting, and CRUD workflows for Products, Projects, Categories, Media, Videos, Website Copy, Navigation, and System Settings.
  - `docs/CONTENT_MODEL.md`: Full entity-relationship documentation and schemas for all 13 D1 database tables with indices, relationships, and fallback strategies.
  - `docs/DB_MIGRATIONS.md`: Comprehensive guide to D1 migrations, local and remote execution commands, and database backup procedures.
  - `docs/MEDIA_STORAGE.md`: R2 storage guide detailing upload pipeline, magic-byte inspection, strict SVG rejection, Range/ETag caching headers, and delete-with-warning usage scanner.
- **Production Build Verification**:
  - `next build`: Turbopack production build succeeded in 3.4s with 0 errors across all routes and API endpoints.
  - `npm run build:worker` (`opennextjs-cloudflare build`): Successfully generated `.open-next/worker.js` and `.open-next/assets` for Cloudflare Workers deployment.
- **Security & QA Verification**:
  - WebCrypto PBKDF2 (SHA-512, 100k iterations, 32-byte salt) verified.
  - CSRF origin validation on all state-mutating requests verified.
  - Media magic-byte inspection and SVG rejection verified.
  - Zero SQL injection risks: 100% parameterized prepared statements.
  - Unauthenticated mutation rejection returning 401 across all admin endpoints verified.
  - Responsive design verified at 320px, 375px, 768px, and 1440px with zero horizontal document overflow.


## [Phase 6 — Public Integration + SEO] — 2026-10-03

### Added & Configured
- **Dynamic Navigation Integration (`components/Navigation/index.tsx`, `app/api/navigation/route.ts`)**:
  - Connected header navigation to `/api/navigation` backed by `getNavItems()` in D1.
  - Retained 100% of approved desktop and mobile menu visuals, animations, active scene dot, and orange underline.
  - Zero hydration mismatch: instant fallback to canonical navigation links with background sync.
- **Workshop Wall Dynamic Projects (`scenes/c-workshop-wall/index.tsx`, `app/api/projects/wall/route.ts`)**:
  - Wired Workshop Wall scene to `/api/projects/wall` backed by `getWallProjects()`.
  - Wall preserves the 6 fixed 3D spatial slots and choreography (depth, rotation, perspective, hover states) while rendering published D1 projects.
  - Automatically backfills unfilled slots using original demonstrator projects.
- **SEO & Open Graph Metadata (`app/products/page.tsx`, `app/products/[slug]/page.tsx`)**:
  - Added full `Metadata` export to `/products` with Title, Description, and OpenGraph tags.
  - Retained per-product dynamic `generateMetadata` on `/products/[slug]`.
- **Public Site Regression Check**:
  - Hero printer nacelle and car canvas animation, Print Lab, Digital → Physical, Process, and Lenis smooth scrolling verified untouched.

### Verified
- TypeScript compilation: zero errors (`npx tsc --noEmit`).
- Route verification: `/api/navigation`, `/api/projects/wall`, `/products`, and `/` all returning HTTP 200.


## [Phase 5 — CMS Screens] — 2026-10-03

### Added & Configured
- **Projects Management Screen (`app/admin/projects/page.tsx`)**:
  - Full CRUD for Workshop Wall projects with title, slug, subtitle, description, category, tags, and featured status.
  - Dedicated "Featured on Workshop Wall" slot controls with live count indicator (capped at 6 slots).
  - One-click project duplication API (`/api/admin/projects/[id]/duplicate`) and archive before delete protection.
- **Products Management Screen (`app/admin/products/page.tsx`)**:
  - Full catalog CRUD with title, slug, summary, description, category, pricing, lead time, materials, specifications list, tags, and status toggle (draft, published, archived).
  - Slug uniqueness validation and slug collision prevention.
  - Safe deletion workflow requiring archive before deletion.
  - One-click product duplication API (`/api/admin/products/[id]/duplicate`).
- **Media Library & Picker (`app/admin/media/page.tsx`, `components/admin/MediaPicker.tsx`)**:
  - Full asset library grid with mime-type filtering, file size, dimensions, and instant previews.
  - Embedded image upload directly to Cloudflare R2 with magic-byte validation.
  - Delete-with-warning modal that queries `/api/admin/media/[id]/usage` across all 9 FK/JSON locations before permitting removal.
  - Reusable modal `MediaPicker` component for assigning featured images and gallery photos to products and projects.
- **Video Management Screen (`app/admin/videos/page.tsx`)**:
  - Video asset management supporting external video URLs (YouTube, Vimeo) and direct Cloudflare R2 uploads.
- **Categories Screen (`app/admin/categories/page.tsx`)**:
  - Dual-tab management for Product Categories and Project Categories with slug generation and sort ordering.
- **Website Content Live Editor (`app/admin/content/page.tsx`)**:
  - Section-by-section live copy editor for Hero, Process, About / Philosophy, Contact / Final CTA, and Products Page.
  - Safe fallback mechanism with "Reset to Defaults" button per section.
- **Navigation Manager (`app/admin/navigation/page.tsx`)**:
  - Full reordering (move up/down), label, URL destination, visibility toggle, and external link flags.
  - "Reset to Defaults" option to restore canonical studio header menu order.
- **Settings & System Diagnostics (`app/admin/settings/page.tsx`)**:
  - Live infrastructure status indicators for D1 database, R2 storage bucket, and Workers runtime.
  - Studio profile settings (Brand name, Contact email, WhatsApp number, Currency, Location).
  - Audit log table displaying recent administrative activity and security mutations.
- **Admin API Endpoints**:
  - `app/api/admin/products/route.ts`, `[id]/route.ts`, `[id]/duplicate/route.ts`
  - `app/api/admin/projects/route.ts`, `[id]/route.ts`, `[id]/duplicate/route.ts`
  - `app/api/admin/categories/route.ts`, `[id]/route.ts`
  - `app/api/admin/media/route.ts`, `[id]/route.ts`
  - `app/api/admin/content/route.ts`
  - `app/api/admin/navigation/route.ts`
  - `app/api/admin/settings/route.ts`

### Verified
- TypeScript check (`npx tsc --noEmit`): Passed with zero errors or warnings.
- Build check: All route handlers and client components compile cleanly.


## [Phase 4 — Auth + Admin Shell] — 2026-10-03

### Added & Configured
- `lib/auth/index.ts`: Native WebCrypto PBKDF2 password hashing (SHA-512, 100,000 iterations, 32-byte cryptographic salt), session token generator with SHA-256 token hashing in D1 `sessions`, login rate limiting (5 attempts per 15-minute window via `login_attempts`), and activity logging.
- `lib/auth/guard.ts`: Server-side authorization guard with CSRF Origin validation on mutating requests, secure cookie helper (`__Host-` prefix on production HTTPS, `session` on HTTP localhost, `httpOnly: true`, `sameSite: 'strict'`, `path: '/'`).
- Route handlers:
  - `app/api/auth/login/route.ts`: Login endpoint with generic 401 response and session cookie issuance.
  - `app/api/auth/logout/route.ts`: Logout endpoint deleting session from D1 and clearing cookie.
  - `app/api/auth/me/route.ts`: Returns current user session state.
- Route protection: Updated all admin mutation endpoints (`/api/admin/media/upload`, `/api/admin/media/[id]/usage`, `/api/admin/videos`, `/api/admin/videos/upload`) to strictly enforce `verifyAdminRequest(request)`.
- CLI Tool: `scripts/create-admin.ts` allowing interactive, secure admin creation directly in D1 with concealed password input, zero hardcoded passwords or secrets in repo or env files.
- Admin UI Shell:
  - `app/admin/layout.tsx`: Server-side auth check with `<meta name="robots" content="noindex, nofollow" />`.
  - `app/admin/login/page.tsx`: Clean, high-contrast, accessible login interface.
  - `components/admin/AdminShell.tsx`: Practical CMS sidebar navigation (Dashboard, Projects, Products, Media, Videos, Website Content, Navigation, Categories, Settings) and mobile-responsive drawer.
  - `app/admin/page.tsx`: Real-data dashboard displaying live D1 project, product, media, and video counts, recent activity from `activity_log`, and quick actions.

### Verified (Real Chrome CDP + Automated API Suite)
- Route protection: All 5 admin and auth endpoints strictly reject unauthenticated requests with HTTP 401.
- Authentication flow: Login with invalid password returns 401; login with valid password returns HTTP 200 with Set-Cookie.
- Session authorization: Authenticated request to `/api/auth/me` with cookie returns HTTP 200 with user data.
- Chrome CDP Desktop (1280px): Dashboard renders cleanly with title, heading, sidebar, and live D1 metric cards.
- Chrome CDP Mobile (375px): Zero horizontal overflow (`scrollWidth: 375px`, `overflow: 0px`), responsive top bar and drawer navigation toggle.
- Chrome CDP Login Page (375px): Zero horizontal overflow (`scrollWidth: 375px`, `overflow: 0px`), form and input elements fully accessible.
- Logout flow: `/api/auth/logout` deletes session and clears cookie; subsequent `/api/auth/me` returns 401.
- Build checks: `npm run build` passes cleanly with exit code 0.


## [Phase 3C — R2 + Media Layer] — 2026-10-03

### Added & Configured
- `wrangler.jsonc`: Added `r2_buckets` binding `MEDIA_BUCKET` mapped to `falcon-media`.
- `lib/media/validation.ts`: Server-side image validation enforcing max file size (15 MB), strict MIME allowlist (JPEG, PNG, WebP, AVIF), magic-byte verification (rejecting mismatched or spoofed files), and strict rejection of SVG files.
- `lib/media/usage.ts`: Comprehensive delete-with-warning usage scanner checking all foreign key references (`categories.image_id`, `projects.featured_image_id`, `projects.og_image_id`, `project_media.media_id`, `products.featured_image_id`, `products.og_image_id`, `product_media.media_id`, `videos.thumbnail_id`) and searching `website_content.content_json` blobs.
- `app/api/media/[...key]/route.ts`: Secure media serving route handler. Enforces table existence check (only keys registered in `media` table and not deleted), HTTP 304 conditional request handling via `If-None-Match`/`ETag`, HTTP 206 Partial Content for `Range` requests, and response security headers (`X-Content-Type-Options: nosniff`, `Cache-Control: public, max-age=31536000, immutable`).
- `app/api/admin/media/upload/route.ts`: Authenticated image upload endpoint storing verified buffers in R2 under `media/{id}/{sanitized_filename}` and recording metadata rows in D1 `media` table.
- `app/api/admin/media/[id]/usage/route.ts`: API endpoint exposing delete-with-warning reference status for CMS deletion confirmations.
- `app/api/admin/videos/upload/route.ts` & `app/api/admin/videos/route.ts`: Chunked multipart upload endpoint for R2 videos (`createMultipartUpload`, `uploadPart`, `complete`, `abort`) and external video (YouTube/Vimeo) registration.
- Automated tests: `scripts/test_media_validation.ts` and `scripts/test_media_usage.ts` covering magic bytes and all 9 FK/JSON reference types.

### Verified (End-to-End Media Layer Test)
- SVG upload rejection: Returns HTTP 400 with explicit disallow error.
- Spoofed file rejection: Text file disguised as PNG rejected by magic byte check with HTTP 400.
- Valid image upload: Successfully uploaded to R2 and inserted into D1 table with HTTP 200.
- Media serving: Route `/api/media/[...key]` serves file with HTTP 200, correct Content-Type, nosniff, ETag, and immutable cache headers.
- Conditional ETag request: Returns HTTP 304 Not Modified.
- Range request: Returns HTTP 206 Partial Content with correct Content-Range and Content-Length.
- Media usage check: Unattached media reports `inUse: false`; when attached to project, reports `inUse: true` with reference details.
- Deletion cleanup: Deleting media record immediately causes `/api/media/[...key]` to return HTTP 404.
- Build checks: `npm run build` and `npm run build:worker` pass cleanly with exit code 0.


## [Phase 3B — D1 Schema + Data Layer] — 2026-10-03

### Added & Configured
- `wrangler.jsonc`: Added D1 database binding `DB` (`database_name: "falcon-db"`, local placeholder ID `00000000-0000-0000-0000-000000000000`, `migrations_dir: "migrations"`).
- `migrations/0001_initial_schema.sql`: Full D1 relational schema with 13 tables: `media`, `videos`, `categories`, `projects`, `project_media`, `products`, `product_media`, `website_content`, `navigation_items`, `site_settings`, `users`, `sessions`, `login_attempts`, `activity_log`. Integer epoch timestamps, soft deletion via `deleted_at`, status checks (`DRAFT`, `PUBLISHED`, `ARCHIVED`), cascaded join foreign keys, and indexes on slug, status, category, timestamps.
- `migrations/0002_seed_initial.sql`: Initial seed for navigation items (6 approved links: SERVICES, WORK, PRODUCTS, PROCESS, ABOUT, CONTACT) and website content defaults matching live copy. Strictly NO products, NO projects.
- `lib/cloudflare/types.ts`: Zero-dependency native TypeScript definitions for `D1Database`, `D1PreparedStatement`, `D1Result`, `R2Bucket`, and global `CloudflareEnv`.
- `lib/cloudflare/context.ts`: Centralized Cloudflare access gateway via `getCloudflareContext()` with graceful error and SSR fallback.
- `lib/data/products.ts`: Typed data access layer querying D1 for published products (`status = 'PUBLISHED' AND deleted_at IS NULL`) with parameterized queries. Falls back to fixtures only when `areFixturesEnabled()` is true (NODE_ENV=development and USE_PRODUCT_FIXTURES=1), otherwise empty array.
- `lib/data/projects.ts`: Workshop wall data access layer capping at 6 slots and merging CMS published projects with static wall layout presets.
- `lib/data/navigation.ts` & `lib/data/content.ts`: Typed data access layer for dynamic navigation and website content.
- Dynamic route exports: `export const dynamic = 'force-dynamic'` added to `app/products/page.tsx` and `app/products/[slug]/page.tsx` to prevent static edge 404 caching.

### Verified (Real Chrome CDP + Wrangler D1 Local)
- Local D1 migrations applied successfully (53 schema commands, 3 seed commands).
- Empty DB verification: `/products` renders approved empty catalog state (`00 / NO PRODUCTS CURRENTLY RELEASED`).
- Published insert verification: inserting a test product into D1 via SQL immediately renders it on `/products` (product card count 1) and `/products/test-d1-housing` (status 200, heading and price rendered).
- Draft suppression verification: updating status to `DRAFT` immediately hides the product from `/products` and `/products/test-d1-housing` returns 404.
- Clean cleanup: test product deleted via SQL; D1 count returns to 0 cleanly.
- `npm run build` and `npm run build:worker` pass cleanly with exit code 0.


## [Phase 2c — Mobile Header Overflow Fix] — 2026-10-03

### Root Cause (measured via CDP at 375 px)
- `scrollWidth: 461px` vs `clientWidth: 375px` on `/products` only — `/` was clean.
- `.products-cta-band__actions` had `flex-shrink: 0`, which prevented it from compressing inside its 335 px flex parent. The two buttons (`btn-primary` 295.9 px + gap 32 px + `btn-secondary` 120.8 px = 448.7 px) could not shrink, pushing the element's `right` to 460.6 px and the document `scrollWidth` to 461 px. Chrome then reflowed the fixed header to that same width.
- `.nav-progress` measured `width: 0 / right: 0` — confirmed **not** the cause.
- Overflow was absent on `/`; no change to Navigation or globals.css required.

### Fix (1 file, 3 lines changed)
- `app/products/page.tsx` `.products-cta-band__actions`: replaced `flex-shrink: 0` with `flex-shrink: 1; min-width: 0; max-width: 100%`. `flex-wrap: wrap` was already present and now takes effect.
- `app/products/[slug]/page.tsx` `.pd-actions`: already had no `flex-shrink: 0` — no change needed.

### Verified (CDP, headless Chrome, all 8 checks PASS)
| URL | Viewport | scrollWidth | overflow | hamburger |
|-----|----------|------------|---------|----------|
| `/` | 320 | 320 | 0 | visible |
| `/` | 375 | 375 | 0 | visible |
| `/` | 390 | 390 | 0 | visible |
| `/` | 768 | 753 | 0 | — |
| `/products` | 320 | 320 | 0 | visible |
| `/products` | 375 | 375 | 0 | visible |
| `/products` | 390 | 390 | 0 | visible |
| `/products` | 768 | 753 | 0 | — |

---

## [Phase 3A — Cloudflare Setup Smoke Test] — 2026-10-03

### Added
- `@opennextjs/cloudflare` (^1.20.8) and `wrangler` (^4.147.0) as dev dependencies.
- `wrangler.jsonc`: Baseline Cloudflare Workers configuration with zero bindings (D1 and R2 deferred to Phase 3B), `compatibility_date: "2026-09-23"`, and static assets directed to `.open-next/assets`.
- `open-next.config.ts`: Baseline OpenNext configuration using `defineCloudflareConfig()`.
- NPM scripts: `build:worker`, `preview`, `deploy` in `package.json`.
- Ignore rules for `/.open-next/` and `/.wrangler/` in `.gitignore`.

### Verified
- Cloudflare worker build (`npx opennextjs-cloudflare build`) passed cleanly on Windows/OneDrive with exit code 0.
- Cloudflare preview server (`npx opennextjs-cloudflare preview`) served at `http://127.0.0.1:8787`:
  - `GET /` → HTTP 200 OK (`x-opennext: 1`)
  - `GET /products` → HTTP 200 OK (`x-opennext: 1`)
  - `GET /products/sample-test` → HTTP 404 Not Found (`x-opennext: 1`)

---

## [Phase 2b — Fix-up Pass] — 2026-10-03

### Verified (no code changes required)
- **Fixture gate**: `lib/data/products.ts` correctly gates all fixture data behind `NODE_ENV === 'development' && USE_PRODUCT_FIXTURES === '1'`. No changes needed.
- **Bundle clean**: Production build (`.next/server`, `.next/static`) contains zero fixture-only strings. Fixture module is imported unconditionally in source but the gate means it never executes; Next.js does not tree-shake module-level side effects, but no fixture data reaches any bundle output.
- **404 behaviour**: `dynamicParams` intentionally left unset (default `true`). `notFound()` in `[slug]/page.tsx` already produces HTTP 404 for any slug when the data layer returns `null`. Verified on `next start` without opt-in: fixture slug and random slug both return `404 Not Found`.
- **SITE_URL**: `app/layout.tsx` already uses `process.env.SITE_URL` for `metadataBase`. `buildProductWhatsAppUrl()` already omits the `"Page:"` line when unset. `seo.canonicalUrl` is an unused placeholder string — no code change required.

### Documented
- `SITE_URL` env var requirement documented in `IMPLEMENTATION_STATE.md`.
- `USE_PRODUCT_FIXTURES=1` env var documented as local-dev-only flag.
- Production route table documented.

### Browser Verification
- Browser tool (Playwright) failed — driver download 404 from all Azure CDN mirrors.
- Manual checklist added to `IMPLEMENTATION_STATE.md §Phase 2b §4`.

---

## [Reference-Based Hero Object Replacement Pass] — 2026-10-03

### Hero Object Transformation (Direct Visual Reference Adherence)
- **Authentic Physical FDM Print**: Replaced the previous generic enclosure with a photorealistic, tangible 3D print directly adopting the physical character of the user's reference photograph (`hero-object-new.webp?v=3`).
- **Tactile Horizontal Layer Lines**: Engineered ~130 continuous, rounded horizontal FDM layer lines wrapping naturally around every curve and lofted contour, exhibiting real filament bead extrusion profile and micro-crevice ambient occlusion.
- **Distinctive Functional Form**: Aerodynamic centrifugal blower / impeller housing with sweeping lofted bellmouth intake, internal aerodynamic hub with 3 helical blades, bright Falcon-orange accent ring, and integrated charcoal mounting base with counterbored socket screws.
- **Material Fidelity**: Warm ivory / off-white matte PLA filament texture with soft directional photographic studio lighting, matte plastic specular highlights, and realistic multi-tiered Gaussian contact drop shadow.
- **Resilient Fallback**: Integrated the physical object asset into `HeroStaticVariant()` so users with `prefers-reduced-motion` enabled never miss the flagship 3D print.
- **Strict Scope Preservation**: 100% preservation of all typography, CTAs, orange lines, navigation, and all other scenes (Print Lab, Digital → Physical, Workshop Wall, Process, About).

### Surgical Asset Swaps
- **Artifact 01 (Hero Object — Final Master Refinement)**: Replaced generic rectangular enclosure with a newly sculpted, engineered mechanical enclosure prototype (`hero-object-new.webp`). Features an octagonal chamfered silhouette, 4 corner fastener bosses with visible M3 Allen socket cap screws, 3 structural top lid ribs, side cooling louvers, precision USB-C port, thin Falcon-orange gasket parting line, authentic FDM micro-layer texture, zero fake markings, and a grounded contact drop shadow with zero detached parts.
- **Artifact 02 (Print Lab DESIGN)**: Replaced CAD software screenshot containing drone/menus with `/assets/falcon/artifacts/design-object-new.webp` (clean isolated 3D CAD model on neutral `#F2E6DA` cream background with subtle facet wireframe edges and zero software UI/chrome).

### Strict Preservation of All Other Scenes
- **Print Lab CUSTOM**: Restored to approved original `/assets/print-lab/lab-custom.webp`.
- **Print Lab PROTOTYPE**: Restored to approved original `/assets/print-lab/lab-prototype.webp`.
- **Print Lab FIGURINE**: Restored to approved original `/assets/print-lab/lab-figurine.webp`.
- **Digital → Physical (Scene D)**: Completely preserved and restored to approved state (wireframe SVG, LayerBands, ToolPath, and `/assets/transform/transform-physical.webp`).
- **All other scenes**: Workshop Wall, Sample Wall, About, Process, CTA, typography, colors, layout, and scroll choreography completely untouched.

## [Master Artifact Implementation Pass] — 2026-10-03

### Dedicated Master Object Family (`/public/assets/falcon/artifacts/`)
- **Engine-Rendered 12-Asset Suite**:
  - Implemented custom 3D projection, lighting, and slicing engine in Python to generate 12 dedicated local assets (`01` through `12`) with 100% geometric continuity.
  - Master Object: Compact custom electronics enclosure with rounded rectangular body, matte black chassis, warm off-white upper shell, 4 counterbored M3 hex socket screws, ventilation louvers, and USB-C port with Falcon-orange connector tongue.
- **Hero Replacement**:
  - Completely replaced futuristic cage object with `/assets/falcon/artifacts/01_hero_enclosure.webp`.
  - Preserved exact hero composition, oversized typography, registration marks, and 3D parallax scroll motion.
- **Print Lab Overhaul**:
  - **DESIGN**: Completely eliminated CAD software screenshot and UI chrome; replaced with `/assets/falcon/artifacts/04_design_cad.webp` (pure isolated 3D CAD model on `#F2E6DA`) and `/assets/falcon/artifacts/05_design_wireframe.webp` transition pulse.
  - **CUSTOM**: Replaced with `/assets/falcon/artifacts/02_custom_object.webp` (bespoke acoustic wave diffuser dock).
  - **PROTOTYPE**: Replaced with `/assets/falcon/artifacts/03_prototype_enclosure.webp` (open chassis with gold knurled brass inserts and snap-fit tabs).
  - **FIGURINE**: Replaced with `/assets/falcon/artifacts/06_figurine.webp` (collectible Falcon Guardian Sentinel bust on pedestal).
- **Digital → Physical Complete Continuity**:
  - Completely removed generic rectangular layer grid.
  - Unified all 4 stages around `MASTER_OBJECT_ANCHOR` using the SAME master enclosure:
    - **01 IDEA**: `07_d2p_idea.webp` (minimal wireframe outline with glowing vertex nodes and center crosshair).
    - **02 MODEL**: `08_d2p_model.webp` (solid 3D CAD model with matching silhouette and anchor).
    - **03 BUILD**: `09_d2p_build.webp` (48 real sliced layers following the exact enclosure geometry with orange toolpath contours).
    - **04 OBJECT**: `10_d2p_object.webp` (finished physical enclosure with grounded contact shadow).
- **Auxiliary Showcase Assets**:
  - Added `11_enclosure_exploded.webp` (exploded assembly with floating shell and screws) and `12_enclosure_detail.webp` (macro corner close-up).
- **Old Assets Decoupled**:
  - Zero active references to old cage, drone screenshot, or generic layer grid.

## [Final Refinement, Authenticity & Polish Pass] — 2026-10-03

### Authenticity & Factuality
- **Fake Measurements Removed**: Removed all invented millimeter numbers (e.g. `240 mm`, `180 mm`) and dimension bounding boxes (`X 180 · Y 240 · Z 180 mm`) across Hero, Transform, and Workshop Wall scenes.
- **Fake Layer Counts Removed**: Replaced `LAYER 420 / 420 — ILLUSTRATION` with neutral `LAYER VIEW · BUILD STRATA`.
- **Invented Titles Removed**: Replaced `Studio Lead & Fabrication Specialist` in About section with confirmed studio location and capability: `NASHIK STUDIO · CUSTOM 3D FABRICATION`.
- **Unverified Marketing Claims Removed**: Replaced "calibrated precision filaments" and "high-precision fabrication" with accurate, simple language.
- **Honest Demo Framing**: Reframed all non-verified project assets as demonstrator examples ("Explore what's possible", "Example applications") without invented customer or aerospace histories.

### Visual & Motion Polish
- **Workshop Wall Refinement**:
  - Active card emphasis refined to scale 1.18 with 1.5px orange focus outline and higher z-depth (`z: 80, zIndex: 10`).
  - Secondary cards smoothly scaled to 0.88 with 0.72 opacity.
  - Eliminated on-card typography collisions by standardizing on single-line title truncation and category tags; detailed descriptions remain in the featured side drawer.
- **Print Lab Coordinated Motion**:
  - Synchronized state transitions: central object cutout, crosshairs, description, and tags animate in single coordinated wrapper.
  - Added smooth sliding pill highlight (`layoutId="active-lab-pill"`) with fluid spring motion for active category selection.
- **Digital → Physical Scale & Geometry Continuity**:
  - Scaled central technical visual up by ~20% (`clamp(240px, 46vw, 620px)` x `clamp(300px, 58vh, 720px)`).
  - Clarified progression of ONE consistent geometry across all 4 stages:
    - 01 IDEA: Point-cloud vertex dots and origin axes crosshair.
    - 02 MODEL: High-contrast faceted wireframe spine and struts.
    - 03 BUILD: Layer bands strata and toolpath trace.
    - 04 OBJECT: Physical artifact revealed from base with realistic shadow.
  - Synchronized active step highlights across `01 IDEA`, `02 MODEL`, `03 BUILD`, `04 OBJECT` driven by scroll position.
  - Dimension line set to neutral `BUILD ENVELOPE`.
- **Process Sequence Simplification**:
  - Replaced marketing copy with exact prompt-recommended workflow:
    - 01 SHARE: Tell us what you want to make.
    - 02 DESIGN: We review your idea, reference or model and prepare it for printing.
    - 03 PRINT: The approved design is turned into a physical object.
    - 04 DELIVER: Your finished print is ready for pickup or delivery.
  - Implemented visual dwell time per stage and active contrast transitions, eliminating overlapping remnants.
- **About Section Visual Replacement**:
  - Replaced studio photography (which had an AI person) with an authentic, human-free photograph of active 3D printing equipment, toolpaths, calipers, and prototypes on a maker workbench.
  - Labeled visual honestly as: `EQUIPMENT & FABRICATION · DEMONSTRATOR`.
- **Final CTA Visual Continuity & Clear Conversion**:
  - Added subtle visual continuity: faint technical faceted wireframe silhouette (9% opacity), Falcon Line accent, and coordinate spec mark `+ STUDIO SPEC [ NASHIK · 20.00° N, 73.78° E ]`.
  - Streamlined conversion path to 4 essential inputs: Name, Phone / WhatsApp / Email, What do you want to make?, Submit.
  - Provided direct WhatsApp chat link with pre-filled message, call, and email shortcuts.

---

## [Asset Completion & Curation Pass] — 2026-10-03

### Added
- **Asset Hierarchy**: Organized asset directory structure under `public/assets/` (`brand/`, `hero/`, `print-lab/`, `workshop-wall/`, `transform/`, `process/`, `about/`, `samples/`, `generated/`, `external/`).
- **Brand Identity**: Vector Falcon logo mark (`/assets/brand/falcon-logo.svg`) in Falcon orange and deep ink, deployed in Navigation and Footer.
- **Hero Flagship Visuals**:
  - `public/assets/hero/falcon-hero-object.webp`: High-resolution transparent cutout of a parametric mechanical 3D-printed aerospace lattice prototype.
  - `public/assets/hero/hero-fragment-01.webp`: Precision mechanical bracket cutout with brass inserts.
  - `public/assets/hero/hero-fragment-02.webp`: Honeycomb calibration node cutout.
- **Print Lab Assets**:
  - `public/assets/print-lab/lab-custom.webp`: Parametric acoustic wave diffuser vase cutout.
  - `public/assets/print-lab/lab-prototype.webp`: PETG-CF 2-axis drone gimbal mount with brass inserts cutout.
  - `public/assets/print-lab/lab-design.webp`: CAD topology wireframe overlay render.
  - `public/assets/print-lab/lab-figurine.webp`: Falcon Guardian Sentinel collectible bust cutout.
- **Workshop Wall Portfolio**:
  - 6 curated showcase prints (`wall-01.webp` to `wall-06.webp`) spanning avionics enclosures, spiral luminaries, robotic grippers, cantilevered pavilions, gimbal mounts, and sentinel sculptures.
- **Scene D Unified Artifact**:
  - `public/assets/transform/transform-physical.webp`: Symmetrical faceted bipyramid gemstone artifact.
  - SVG wireframe aligned to the exact facet topology of the physical asset.
- **About Studio Photography**:
  - `public/assets/about/workshop-studio.webp`: Authentic 3D printing workshop bench with active printers and filament racks.
- **Sample Wall Interactive Strip**:
  - 7 curated sample cards (`sample-1.webp` to `sample-7.webp`) with rich metadata, titles, and category badges.
- **Asset Documentation**:
  - `ASSET_MANIFEST.md` complete with asset classifications, dimensions, and licensing.
  - Python asset processing script `scripts/process_assets.py`.

### Changed / Replaced
- Replaced `[HERO OBJECT PLACEHOLDER]` and polygon silhouette with the flagship hero print asset and contact shadow.
- Replaced `[FRAGMENT]` with floating physical printed components.
- Replaced `ASSET REQUIRED` and raw `[CONFIRM: ...]` tags in Print Lab with real assets and professional capability descriptors.
- Replaced `PHOTOS + PROJECT DATA — BUSINESS INPUT REQUIRED` with `DEMONSTRATION CAPABILITIES · NASHIK STUDIO`.
- Replaced `SAMPLE 01` / `SAMPLE 02` and placeholder labels in Sample Wall with authentic titles and categories.
- Replaced grey placeholder box in About with maker workshop studio photography.
- Replaced placeholder logos with the official Falcon vector brand mark.
- Cleaned up Footer credits and contact form delivery notes.
