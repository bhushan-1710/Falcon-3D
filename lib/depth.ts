/**
 * Falcon 3D Prints — Depth System
 * Design source: design.md §13, §15.10
 *
 * The depth system governs every spatial scene. All Z-layer values,
 * parallax multipliers and CSS perspective settings live here.
 */

// ─── Z-depth values (CSS translateZ) ─────────────────────────────────────────
export const zDepth = {
  Z0: -300,   // Background: wall/grid/texture, giant type
  Z1: -120,   // Midground: technical diagrams, background cards
  Z2: 0,      // Primary: featured product/card
  Z3: 120,    // Foreground: small objects, labels, interaction indicators
} as const

// ─── Scroll parallax multipliers per depth group ──────────────────────────────
// design.md §15.10 — artifact motion groups
export const parallax = {
  environment: 0.10,   // Group A: wall, shelf, props
  typography: 0.20,    // Group B: giant words
  cards: 0.35,         // Group C: floating cards
  product: 0.50,       // Group D: primary object
  foreground: 0.65,    // Group E: fragments, labels
} as const

// ─── CSS 3D scene wrapper settings ────────────────────────────────────────────
export const perspective = {
  scene: 1200,    // Main scene wrapper perspective (px)
  lab: 1200,      // Print Lab grid plane
  wall: 1200,     // Workshop Wall camera
} as const

// ─── Workshop Wall — depth configuration for card layers ─────────────────────
export const wallDepth = {
  background: { translateZ: zDepth.Z1, scale: 0.80, opacity: 0.6, speed: parallax.cards },
  mid: { translateZ: zDepth.Z2, scale: 1.00, opacity: 1.0, speed: parallax.product },
  foreground: { translateZ: zDepth.Z3, scale: 1.15, opacity: 1.0, speed: parallax.foreground },
  active: { translateZ: zDepth.Z3 + 120, scale: 1.50, opacity: 1.0, speed: parallax.product },
} as const

// ─── Print Lab — object depth positions by role ───────────────────────────────
export const labDepth = {
  receding: { translateZ: zDepth.Z1, scale: 0.82, opacity: 0.55, blur: 2 },
  mid: { translateZ: zDepth.Z1, scale: 0.92, opacity: 0.70, blur: 1 },
  featured: { translateZ: zDepth.Z2, scale: 1.00, opacity: 1.00, blur: 0 },
} as const

// ─── Depth-based blur (for distant objects only) ──────────────────────────────
// design: "depth-based blur only for distant cards" — 0–2px range
export const depthBlur = (depth: 0 | 1 | 2 | 3): string => {
  const map = { 0: '2px', 1: '1px', 2: '0px', 3: '0px' }
  return `blur(${map[depth]})`
}

// ─── Depth-based shadow ───────────────────────────────────────────────────────
// design.md §14: "layered shadow: 0 2px 4px rgba(17,17,17,.10), 0 18px 36px -18px rgba(17,17,17,.35)"
export const depthShadow = {
  base: '0 2px 4px rgba(17,17,17,0.10), 0 18px 36px -18px rgba(17,17,17,0.35)',
  hover: '0 4px 8px rgba(17,17,17,0.12), 0 26px 48px -18px rgba(17,17,17,0.45)',
  active: '0 8px 24px rgba(17,17,17,0.15), 0 40px 64px -24px rgba(17,17,17,0.50)',
  contact: '0 24px 48px -12px rgba(17,17,17,0.30)', // Object contact shadow
} as const

// ─── Mobile depth: 2.5D (no translateZ, use scale + y only) ──────────────────
export const mobileDepth = {
  background: { scale: 0.85, y: 24, opacity: 0.6 },
  mid: { scale: 0.95, y: 12, opacity: 0.8 },
  featured: { scale: 1.00, y: 0, opacity: 1.0 },
} as const

// ─── Breakpoint constants ─────────────────────────────────────────────────────
export const breakpoint = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1440,
} as const

// ─── Scene scroll lengths (vh) — CSS custom properties drive these ────────────
// These can be tuned visually; they map to CSS custom properties in globals.css
export const sceneLengths = {
  heroDesktop: 250,
  heroMobile: 170,
  wallDesktop: 400,
  wallMobile: 260,
  transformDesktop: 450,
  transformMobile: 250,
  processDesktop: 350,
  processMobile: 220,
  ctaDesktop: 160,
  ctaMobile: 120,
} as const
