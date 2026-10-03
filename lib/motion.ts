/**
 * Falcon 3D Prints — Motion Registry
 * All animation tokens, spring configs, and timing functions.
 * Design source: design.md §16, motion registry M01–M24.
 *
 * RULE: Every major animation is declared once here by registry ID.
 * Components import from this file; they do not define their own durations/springs.
 */

// ─── Duration tokens ──────────────────────────────────────────────────────────
export const duration = {
  fast: 0.22,        // 180–280ms: hover, tags, buttons
  standard: 0.5,     // 400–650ms: reveals, menu, image swaps
  editorial: 0.9,    // 700–1200ms: hero, giant type, state swaps
  cinematic: 1.6,    // 1200–2000ms: Transform scene only
} as const

// ─── Easing tokens ────────────────────────────────────────────────────────────
export const ease = {
  default: [0.22, 1, 0.36, 1] as [number, number, number, number],
  easeOut: [0, 0, 0.36, 1] as [number, number, number, number],
  linear: [0, 0, 1, 1] as [number, number, number, number],
} as const

// ─── Spring presets ───────────────────────────────────────────────────────────
// Physical objects use momentum, inertia, spring, and settle (overshoot ≤4%)
export const spring = {
  // Hero object arrival & pointer
  heroObject: { type: 'spring' as const, stiffness: 150, damping: 18, mass: 1 },
  // Hero pointer response
  heroPointer: { type: 'spring' as const, stiffness: 120, damping: 18, mass: 1 },
  // Hero fragments
  heroFragments: { type: 'spring' as const, stiffness: 110, damping: 16, mass: 1 },
  // Print Lab entry
  labEntry: { type: 'spring' as const, stiffness: 150, damping: 18, mass: 1 },
  // Print Lab state change (object interpolation)
  labState: { type: 'spring' as const, stiffness: 140, damping: 20, mass: 1 },
  // Print Lab pointer camera drift
  labPointer: { type: 'spring' as const, stiffness: 100, damping: 16, mass: 1 },
  // Wall fan entry
  wallFan: { type: 'spring' as const, stiffness: 130, damping: 18, mass: 1 },
  // Wall card select
  wallSelect: { type: 'spring' as const, stiffness: 140, damping: 20, mass: 1 },
  // Sample wall drag/snap
  sampleSnap: { type: 'spring' as const, stiffness: 170, damping: 22, mass: 1 },
  // About section
  about: { type: 'spring' as const, stiffness: 120, damping: 18, mass: 1 },
  // Sample wall items
  sampleEntry: { type: 'spring' as const, stiffness: 120, damping: 18, mass: 1 },
  // General UI (buttons, small interactions)
  ui: { type: 'spring' as const, stiffness: 260, damping: 26, mass: 1 },
} as const

// ─── Stagger values (seconds between elements) ────────────────────────────────
export const stagger = {
  xsm: 0.06,   // 60ms: artifacts, Lab artifacts, footer
  sm: 0.07,    // 70ms: wall fan, sample entry
  md: 0.08,    // 80ms: Lab entry items
  default: 0.09, // 90ms: hero type, about reveal
  lg: 0.10,    // 100ms: hero annotations, menu items, footer
  xl: 0.12,    // 120ms: hero fragments
} as const

// ─── GSAP scrub settings ──────────────────────────────────────────────────────
export const scrub = {
  default: 0.6,   // Pinned scenes: smooth scrub factor
  light: 0.3,     // Lighter scenes
} as const

// ─── Motion registry (M01–M24) ────────────────────────────────────────────────
// Each entry documents: trigger, properties, duration, easing, stagger,
// scrubbed, interruptible, mobile behavior, reduced-motion fallback.

export const registry = {
  M01: {
    id: 'M01',
    name: 'Hero background',
    trigger: 'Load',
    duration: { start: 0, end: 0.3 },
    props: { gridOpacity: [0, 0.05], grainOpacity: [0, 1] },
    rm: 'instant',
  },
  M02: {
    id: 'M02',
    name: 'Hero type unmask',
    trigger: 'Load',
    duration: { start: 0.2, end: 0.9 },
    stagger: stagger.default,
    props: { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'], y: [24, 0] },
    rm: 'instant',
  },
  M03: {
    id: 'M03',
    name: 'Hero object arrival',
    trigger: 'Load',
    duration: { start: 0.3, end: 1.2 },
    spring: spring.heroObject,
    props: { y: [80, 0], rotateY: [-8, 0], opacity: [0, 1] },
    mobile: { y: [40, 0], rotateY: [0, 0] },
    rm: 'opacity 250ms',
  },
  M04: {
    id: 'M04',
    name: 'Hero fragments',
    trigger: 'Load',
    duration: { start: 0.5, end: 1.1 },
    stagger: stagger.xl,
    spring: spring.heroFragments,
    props: { x: ['±140px', 0], rotateZ: ['±12°', 'rest'] },
    mobile: { x: ['±60px', 0], count: 1 },
    rm: 'instant',
  },
  M05: {
    id: 'M05',
    name: 'Hero annotations',
    trigger: 'Load',
    duration: { start: 0.7, end: 1.4 },
    stagger: stagger.default,
    props: { lineDraw: [0, 1], dotScale: [0, 1], labelY: [8, 0] },
    mobile: { count: 2 },
    rm: 'instant',
  },
  M06: {
    id: 'M06',
    name: 'Hero CTAs',
    trigger: 'Load',
    duration: { start: 0.9, end: 1.5 },
    stagger: stagger.md,
    props: { y: [24, 0], opacity: [0, 1] },
    mobile: { y: [12, 0] },
    rm: 'instant',
  },
  M07: {
    id: 'M07',
    name: 'Hero pointer',
    trigger: 'Pointermove',
    spring: spring.heroPointer,
    props: { objectXY: '±8–20px', objectRotate: '±3–5°', labelsMultiplier: '0.4–1.4×' },
    mobile: 'autonomous float ±6px 6s',
    rm: 'none',
  },
  M08: {
    id: 'M08',
    name: 'Hero scroll (Scene A)',
    trigger: 'Pinned scroll 0–100%',
    scrub: scrub.default,
    totalVh: 250,
    mobileVh: 170,
    props: {
      physicalExit: 'x 0→−120vw',
      ideaScale: '0.6→1.8',
      ideaCollapse: '→OBJECT',
      objectScale: '1→1.15→0.9',
      objectRotateY: '0→+24°',
      objectY: '0→−12vh',
      bgShift: '#F5F1E9→#F2E6DA',
    },
    rm: 'static final state',
  },
  M09: {
    id: 'M09',
    name: 'Print Lab entry',
    trigger: 'Scene B in view',
    duration: 0.9,
    stagger: stagger.md,
    spring: spring.labEntry,
    props: { objectY: ['-80vh', 0], gridDraw: true, linesDraw: true },
    mobile: { y: ['-40vh', 0] },
    rm: 'crossfade 250ms',
  },
  M10: {
    id: 'M10',
    name: 'Print Lab state change',
    trigger: 'Click / swipe / arrow / pill',
    duration: { transition: 0.8, description: 0.4 },
    stagger: stagger.xsm,
    spring: spring.labState,
    interruptible: true,
    props: {
      bgWipe: 'clip-path from travel direction',
      giantWordX: '±40vw→0 with fade',
      objectTransform: 'interpolate to state values',
      artifactsRetract: 'opacity→0, 24–60px',
      artifactsEnter: 'draw/slide',
      descriptionCrossfade: '400ms',
    },
    rm: '200ms crossfade',
  },
  M11: {
    id: 'M11',
    name: 'Print Lab pointer',
    trigger: 'Pointermove',
    spring: spring.labPointer,
    props: { cameraRotateY: '±3°', depthObjects: '±6–14px', hoveredRotate: '4°' },
    mobile: 'autonomous drift ±4px',
    rm: 'none',
  },
  M12: {
    id: 'M12',
    name: 'Wall fan entry',
    trigger: 'Scene C in view',
    duration: 1.0,
    stagger: stagger.sm,
    spring: spring.wallFan,
    props: { cardsY: ['100vh', 0], cardsRotateZ: ['-14°…+14°', 'rest'] },
    mobile: { count: 4 },
    rm: 'cards at rest',
  },
  M13: {
    id: 'M13',
    name: 'Wall camera',
    trigger: 'Pinned scroll 0–100%',
    scrub: scrub.default,
    totalVh: 400,
    mobileVh: 260,
    props: {
      worldX: '0→−N·card',
      worldRotateY: '+6°→−6°',
      cardTranslateZ: 'per depth',
      cardScale: '0.8–1.15',
      metadataX: [40, 0],
    },
    rm: 'vertical list',
  },
  M14: {
    id: 'M14',
    name: 'Wall select',
    trigger: 'Click/Enter on card',
    duration: 0.7,
    stagger: 0.05,
    spring: spring.wallSelect,
    interruptible: true,
    props: {
      selectedScale: 1.5,
      selectedRotate: 0,
      selectedZ: '+120px',
      othersScale: 0.85,
      othersOpacity: 0.6,
      connectorDraw: true,
      metadataSlide: true,
    },
    rm: 'instant swap',
  },
  M15: {
    id: 'M15',
    name: 'Wall hover',
    trigger: 'Pointer over card',
    duration: duration.fast,
    props: { scale: 1.03, rotate: 0, shadowY: '+8px', metadataFade: true },
    rm: 'scale only 120ms',
  },
  M16: {
    id: 'M16',
    name: 'Transform phases',
    trigger: 'Pinned scroll 0–100%',
    scrub: scrub.default,
    totalVh: 450,
    mobileVh: 250,
    props: 'see storyboard §17.3',
    rm: 'static 4 panels',
  },
  M17: {
    id: 'M17',
    name: 'Process',
    trigger: 'Pinned scroll 0–100%',
    scrub: scrub.default,
    totalVh: 350,
    mobileVh: 220,
    props: { pathScaleY: [0, 1], stageNumberSwap: 'mask', objectRepresentation: 'changes', nodePulse: true },
    rm: '4 static blocks',
  },
  M18: {
    id: 'M18',
    name: 'About reveal',
    trigger: 'Enter viewport',
    duration: 0.8,
    stagger: stagger.default,
    props: { realWordX: ['-24vw', 0], imageRotate: [-3, 0], imageY: [40, 0], lineMasks: true },
    mobile: { realWordX: ['-12vw', 0] },
    rm: 'opacity 250ms',
  },
  M19: {
    id: 'M19',
    name: 'Sample wall entry',
    trigger: 'Enter viewport',
    duration: 0.9,
    stagger: stagger.sm,
    spring: spring.sampleEntry,
    props: { itemsX: ['60vw', 'rest'], itemsRotate: ['±10°', 'rest'] },
    mobile: { x: '40vw' },
    rm: 'instant',
  },
  M20: {
    id: 'M20',
    name: 'Sample wall drag',
    trigger: 'Pointerdown/drag',
    spring: spring.sampleSnap,
    props: { stripX: 'follows pointer', scaleByDistance: true, snap: 'nearest ~600ms' },
    mobile: 'native swipe + scroll-snap',
    rm: 'simple scroll no scale',
  },
  M21: {
    id: 'M21',
    name: 'Final CTA resolve',
    trigger: 'Scroll 0–100%',
    scrub: scrub.default,
    totalVh: 160,
    mobileVh: 120,
    stagger: 0.07,
    props: {
      itemsConverge: true,
      toolpathDashoffset: '→0 into underline',
      inkBlockY: ['100vh', 0],
      formFieldsY: [24, 0],
    },
    rm: 'final state',
  },
  M22: {
    id: 'M22',
    name: 'CTA button',
    trigger: 'Pointer near',
    duration: duration.fast,
    props: { magneticXY: '≤6px', arrowX: '+4px', underlineScaleX: [0, 1] },
    rm: 'color change only',
  },
  M23: {
    id: 'M23',
    name: 'Footer',
    trigger: 'Enter',
    duration: 0.7,
    stagger: stagger.default,
    props: { maskReveal: true, falconLineDraw: true },
    rm: 'instant',
  },
  M24: {
    id: 'M24',
    name: 'Menu',
    trigger: 'Toggle',
    duration: 0.5,
    stagger: stagger.xsm,
    props: { panelClipPath: true, itemsY: [40, 0] },
    rm: 'fade 200ms',
  },
} as const

// ─── Framer Motion variant helpers ───────────────────────────────────────────
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.standard, ease: ease.default } },
}

export const maskReveal = {
  hidden: { clipPath: 'inset(0 0 100% 0)' },
  visible: { clipPath: 'inset(0 0 0% 0)', transition: { duration: duration.editorial, ease: ease.default } },
}

export const drawLine = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: duration.editorial, ease: ease.default } },
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0 },
  visible: { opacity: 1, scale: 1, transition: { ...spring.ui } },
}
