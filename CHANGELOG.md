# Changelog — Falcon 3D Prints

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
