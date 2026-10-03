/**
 * Falcon 3D Prints — Artifact Inventory
 * Design source: design.md §15.11, artifact families A01–A36
 *
 * This module exports the artifact inventory and type definitions.
 * Scene modules import these to compose their visual systems.
 *
 * RULE: Artifacts are part of the design system, not decorative filler.
 * Every artifact has: visual purpose, compositional role, depth level,
 * motion behavior, relationship to content, responsive behavior.
 * No blobs, random circles, glowing spheres or generic 3D shapes.
 */

export type ArtifactFamily =
  | 'physical-environment'
  | 'floating-card'
  | 'oversized-type'
  | 'product-cutout'
  | 'fragment'
  | 'label-tag'
  | 'connector'
  | 'technical-drawing'
  | 'stl-state'
  | 'layer-effect'
  | 'toolpath'
  | 'material'
  | 'micro-ui'

export interface ArtifactDefinition {
  id: string           // A01–A36
  name: string
  family: ArtifactFamily
  purpose: string
  scenes: string[]     // Scene IDs where used
  layer: 'Z-0' | 'Z-1' | 'Z-2' | 'Z-3' | 'Z-1/Z-3' | 'overlay'
  implementation: string
  responsive: string
  reducedMotion: string
}

// ─── Artifact inventory (design.md §15.11) ────────────────────────────────────
export const artifactInventory: ArtifactDefinition[] = [
  { id: 'A01', name: 'Product cut-out (hero)', family: 'product-cutout', purpose: 'Hero focus', scenes: ['A'], layer: 'Z-2', implementation: 'DOM + img + Framer Motion + GSAP', responsive: 'Scale 55–65vh tall; 50vh mobile', reducedMotion: 'Static, no parallax' },
  { id: 'A02', name: 'Hero fragments (2–3)', family: 'fragment', purpose: 'Scale, depth', scenes: ['A'], layer: 'Z-3', implementation: 'Framer Motion', responsive: '1 fragment on mobile; drop on tablet', reducedMotion: 'Static position' },
  { id: 'A03', name: 'Giant statement', family: 'oversized-type', purpose: 'Typographic set', scenes: ['A'], layer: 'Z-0', implementation: 'DOM + clip-path + GSAP', responsive: '42–58px mobile', reducedMotion: 'Static text' },
  { id: 'A04', name: 'Print-bed grid', family: 'technical-drawing', purpose: 'Texture → print-bed', scenes: ['A', 'B', 'D', 'E'], layer: 'Z-0', implementation: 'CSS background + transform', responsive: 'Same; grid cell size adapts', reducedMotion: 'Static' },
  { id: 'A05', name: 'Falcon Line', family: 'connector', purpose: 'Continuity motif', scenes: ['all'], layer: 'Z-1/Z-3', implementation: 'SVG + GSAP', responsive: 'Same', reducedMotion: 'Fully drawn, static' },
  { id: 'A06', name: 'Contact shadow', family: 'physical-environment', purpose: 'Suspension realism', scenes: ['A', 'B', 'C', 'D', 'F'], layer: 'Z-1', implementation: 'CSS radial gradient + Framer Motion', responsive: 'Smaller on mobile', reducedMotion: 'Static shadow' },
  { id: 'A07', name: 'Registration marks', family: 'technical-drawing', purpose: 'Industrial detail', scenes: ['A', 'F', 'lightbox'], layer: 'Z-1', implementation: 'SVG', responsive: 'Same', reducedMotion: 'Static' },
  { id: 'A08', name: 'Layer-line strip', family: 'layer-effect', purpose: 'Additive cue', scenes: ['A', 'footer'], layer: 'Z-1', implementation: 'SVG/CSS', responsive: 'Same', reducedMotion: 'Fully visible, static' },
  { id: 'A09', name: 'Crosshair', family: 'technical-drawing', purpose: 'Tracks selected object', scenes: ['A', 'B', 'C', 'E'], layer: 'Z-3', implementation: 'SVG + Framer Motion', responsive: 'Same', reducedMotion: 'Static on object' },
  { id: 'A10', name: 'Dimension line + label', family: 'technical-drawing', purpose: 'Technical detail', scenes: ['A', 'B', 'C', 'D'], layer: 'Z-3', implementation: 'SVG', responsive: 'Simplified mobile', reducedMotion: 'Static' },
  { id: 'A11', name: 'XYZ axes', family: 'technical-drawing', purpose: 'Orientation', scenes: ['A', 'D'], layer: 'Z-1', implementation: 'SVG + mono', responsive: 'Simplified mobile', reducedMotion: 'Static' },
  { id: 'A12', name: 'Bounding box', family: 'technical-drawing', purpose: 'Selection/scale', scenes: ['B', 'C', 'D'], layer: 'Z-1', implementation: 'SVG + Framer Motion', responsive: 'Same', reducedMotion: 'Static drawn' },
  { id: 'A13', name: 'Grid plane (perspective)', family: 'physical-environment', purpose: 'Print Lab floor', scenes: ['B'], layer: 'Z-0', implementation: 'CSS 3D', responsive: '2.5D on mobile', reducedMotion: 'Static' },
  { id: 'A14', name: 'Giant state word', family: 'oversized-type', purpose: 'State identity', scenes: ['B'], layer: 'Z-0', implementation: 'Framer Motion', responsive: 'Smaller text', reducedMotion: 'Static crossfade' },
  { id: 'A15', name: 'Label/pill', family: 'label-tag', purpose: 'Annotation', scenes: ['A', 'B', 'C', 'F'], layer: 'Z-3', implementation: 'DOM + SVG', responsive: 'Simplified', reducedMotion: 'Static' },
  { id: 'A16', name: 'Connector line', family: 'connector', purpose: 'Link object↔label', scenes: ['A', 'B', 'C'], layer: 'Z-1', implementation: 'SVG + Framer Motion', responsive: 'Simplified', reducedMotion: 'Fully drawn' },
  { id: 'A17', name: 'Surrounding print objects', family: 'product-cutout', purpose: 'Spatial lab', scenes: ['B'], layer: 'Z-1/Z-3', implementation: 'CSS 3D + Framer Motion', responsive: '2 on mobile', reducedMotion: 'Static positions' },
  { id: 'A18', name: 'Wireframe overlay', family: 'stl-state', purpose: 'Prototype/digital', scenes: ['B', 'D', 'E'], layer: 'Z-1', implementation: 'SVG', responsive: 'Same', reducedMotion: 'Static drawn' },
  { id: 'A19', name: 'Sketch/construction lines', family: 'technical-drawing', purpose: 'Design state', scenes: ['B', 'E'], layer: 'Z-1', implementation: 'SVG', responsive: 'Same', reducedMotion: 'Static drawn' },
  { id: 'A20', name: 'Reference cards (design)', family: 'floating-card', purpose: 'Design state', scenes: ['B'], layer: 'Z-1', implementation: 'Framer Motion', responsive: 'Simplified', reducedMotion: 'Static' },
  { id: 'A21', name: 'Workshop shelf line', family: 'physical-environment', purpose: 'Environment', scenes: ['C', 'samples'], layer: 'Z-0', implementation: 'SVG', responsive: 'Same', reducedMotion: 'Fully drawn' },
  { id: 'A22', name: 'Sample cards (6–9)', family: 'floating-card', purpose: 'Portfolio', scenes: ['C'], layer: 'Z-1/Z-3', implementation: 'CSS 3D + GSAP + Framer Motion', responsive: 'Vertical pile mobile', reducedMotion: 'Vertical list' },
  { id: 'A23', name: 'Featured-project metadata', family: 'label-tag', purpose: 'Context', scenes: ['C'], layer: 'Z-3', implementation: 'GSAP', responsive: 'Below object mobile', reducedMotion: 'Static visible' },
  { id: 'A24', name: 'Fan of prints', family: 'floating-card', purpose: 'Wall entrance', scenes: ['C'], layer: 'Z-2', implementation: 'GSAP', responsive: '4 cards mobile', reducedMotion: 'Cards at rest' },
  { id: 'A25', name: 'Vertices', family: 'stl-state', purpose: 'Digital state', scenes: ['D'], layer: 'Z-1', implementation: 'Canvas 2D (>80) / SVG', responsive: '≤60 mobile', reducedMotion: 'Static panel' },
  { id: 'A26', name: 'Toolpath', family: 'toolpath', purpose: 'Slice/build', scenes: ['D'], layer: 'Z-2', implementation: 'SVG + GSAP', responsive: 'Same', reducedMotion: 'Static drawn' },
  { id: 'A27', name: 'Layer bands', family: 'layer-effect', purpose: 'Additive process', scenes: ['D', 'E'], layer: 'Z-2', implementation: 'CSS/SVG + GSAP', responsive: 'Same', reducedMotion: 'Static visible' },
  { id: 'A28', name: 'Layer indicator', family: 'micro-ui', purpose: 'Progress', scenes: ['D'], layer: 'Z-3', implementation: 'DOM text (ILLUSTRATION)', responsive: 'Hidden mobile', reducedMotion: 'Static text' },
  { id: 'A29', name: 'Support-structure fragments', family: 'technical-drawing', purpose: 'Build realism', scenes: ['D'], layer: 'Z-1', implementation: 'SVG', responsive: 'Drop on tablet/mobile', reducedMotion: 'Optional static' },
  { id: 'A30', name: 'Process path + nodes', family: 'toolpath', purpose: 'Stage progress', scenes: ['E'], layer: 'Z-1', implementation: 'SVG + GSAP', responsive: 'Same', reducedMotion: 'Fully drawn' },
  { id: 'A31', name: 'Stage number', family: 'oversized-type', purpose: 'Stage identity', scenes: ['E'], layer: 'Z-0', implementation: 'GSAP mask swap', responsive: '72px mobile', reducedMotion: 'Static number' },
  { id: 'A32', name: 'Ruler ticks', family: 'micro-ui', purpose: 'Scale on strip', scenes: ['samples'], layer: 'Z-0', implementation: 'SVG + Framer Motion', responsive: 'Same', reducedMotion: 'Static' },
  { id: 'A33', name: 'Workshop props (generic)', family: 'physical-environment', purpose: 'Environment', scenes: ['C', 'D'], layer: 'Z-0', implementation: 'WebP/SVG', responsive: 'Drop on tablet/mobile', reducedMotion: 'Static' },
  { id: 'A34', name: 'Micro-UI affordances', family: 'micro-ui', purpose: 'Affordance', scenes: ['various'], layer: 'Z-3', implementation: 'DOM', responsive: 'Same', reducedMotion: 'Fade 250ms on first interaction' },
  { id: 'A35', name: 'Grain', family: 'physical-environment', purpose: 'Warmth', scenes: ['global'], layer: 'overlay', implementation: 'CSS tile PNG', responsive: 'Same', reducedMotion: 'Same' },
  { id: 'A36', name: 'Phoenix fragment', family: 'oversized-type', purpose: 'Brand', scenes: ['preload', 'footer'], layer: 'Z-0', implementation: 'SVG', responsive: 'Same', reducedMotion: 'Static' },
]

// ─── Lookup helper ────────────────────────────────────────────────────────────
export function getArtifact(id: string): ArtifactDefinition | undefined {
  return artifactInventory.find(a => a.id === id)
}

export function getArtifactsForScene(sceneId: string): ArtifactDefinition[] {
  return artifactInventory.filter(a => a.scenes.includes(sceneId))
}
