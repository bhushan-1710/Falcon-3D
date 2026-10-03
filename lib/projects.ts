/**
 * Falcon 3D Prints — Projects Registry
 * Design source: design.md §10.4, PRD §8.4
 *
 * Curated showcase of fabrication capabilities and illustrative objects
 * demonstrating what Falcon 3D Prints can produce:
 * IDEA → DISCUSS → DESIGN → PRINT → OBJECT
 */

export interface Project {
  id: string
  slug: string
  sectionLabel: string // e.g. "01 / RAPID PROTOTYPING"
  name: string
  category: string
  description: string
  finish?: string
  imageSrc: string
  imageAlt: string
  depth: 0 | 1 | 2 | 3  // Z-layer (0=background, 3=foreground)
  rotation: number        // rest rotation in degrees (±4°)
  scale: number           // base scale (0.8–1.15)
}

// ─── Curated Capabilities & Demonstration Portfolio ───────────────────────────

export const projects: Project[] = [
  {
    id: 'project-01',
    slug: 'functional-enclosure-study',
    sectionLabel: '01 / CONCEPT EXAMPLE',
    name: 'Electronics Enclosure',
    category: 'FUNCTIONAL HOUSING',
    description: 'Demonstrating snap-fit tolerances, internal mounting bosses, and ventilation geometry for custom hardware.',
    finish: 'Matte Black',
    imageSrc: '/assets/workshop-wall/wall-01.webp',
    imageAlt: 'Functional 3D-printed black electronics enclosure demonstrator',
    depth: 2,
    rotation: -2.5,
    scale: 1.0,
  },
  {
    id: 'project-02',
    slug: 'parametric-spiral-luminary',
    sectionLabel: '02 / CONCEPT EXAMPLE',
    name: 'Parametric Spiral Luminary',
    category: 'CUSTOM DESIGN',
    description: 'Continuous spiral toolpath structure demonstrating light diffusion and decorative geometric forms.',
    finish: 'Warm Cream',
    imageSrc: '/assets/workshop-wall/wall-02.webp',
    imageAlt: 'Parametric 3D-printed warm cream spiral lamp diffuser',
    depth: 1,
    rotation: 3.0,
    scale: 0.9,
  },
  {
    id: 'project-03',
    slug: 'articulated-robotic-gripper',
    sectionLabel: '03 / CONCEPT EXAMPLE',
    name: 'Articulated Robotic Gripper',
    category: 'MECHANICAL DEMO',
    description: 'Multi-part functional linkage demonstrating mechanical assembly, interlocking joints, and moving parts.',
    finish: 'Dual-Color',
    imageSrc: '/assets/workshop-wall/wall-03.webp',
    imageAlt: 'Articulated 3D printed mechanical gripper mechanism demonstrator',
    depth: 3,
    rotation: -1.5,
    scale: 1.1,
  },
  {
    id: 'project-04',
    slug: 'architectural-canopy-study',
    sectionLabel: '04 / CONCEPT EXAMPLE',
    name: 'Architectural Canopy Study',
    category: 'SCALE MODEL',
    description: 'Complex grid-shell canopy demonstrating geometric bridging overhangs and scale topography.',
    finish: 'Matte White',
    imageSrc: '/assets/workshop-wall/wall-04.webp',
    imageAlt: 'Architectural scale model study of a parametric canopy roof',
    depth: 2,
    rotation: 2.0,
    scale: 0.95,
  },
  {
    id: 'project-05',
    slug: 'camera-bracket-assembly',
    sectionLabel: '05 / CONCEPT EXAMPLE',
    name: '2-Axis Mounting Bracket',
    category: 'PROTOTYPE DEMO',
    description: 'Multi-axis mounting bracket demonstrating functional prototype fit and captive hardware slots.',
    finish: 'Dark Graphite',
    imageSrc: '/assets/workshop-wall/wall-05.webp',
    imageAlt: '3D-printed 2-axis mounting bracket prototype demonstrator',
    depth: 1,
    rotation: -3.5,
    scale: 0.85,
  },
  {
    id: 'project-06',
    slug: 'falcon-guardian-bust',
    sectionLabel: '06 / CONCEPT EXAMPLE',
    name: 'Geometric Character Bust',
    category: 'FIGURINE DEMO',
    description: 'Geometric falcon guardian sculpture demonstrating surface detail resolution and fine layer definition.',
    finish: 'Graphite & Ivory',
    imageSrc: '/assets/workshop-wall/wall-06.webp',
    imageAlt: '3D printed geometric character bust sculpture demonstrator',
    depth: 3,
    rotation: 1.5,
    scale: 1.05,
  },
]
