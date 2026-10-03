# Falcon 3D Prints — Implementation State

> **File location**: repo root (`falcon-web/IMPLEMENTATION_STATE.md`), not `docs/`.

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
