import { Product, ProductCategory } from '@/lib/types/products'

/**
 * DEV FIXTURES ONLY
 * Gated behind NODE_ENV === 'development' && USE_PRODUCT_FIXTURES === '1'.
 * MUST NEVER SHIP TO PRODUCTION.
 * All product entries are explicitly marked as [SAMPLE PRODUCT] dummy demonstrators.
 */

export const fixtureCategories: ProductCategory[] = [
  {
    id: 'cat-01',
    name: 'Functional Enclosures',
    slug: 'functional-enclosures',
    description: 'Technical housings, mounting chassis, and hardware enclosures',
    sortOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-02',
    name: 'Lighting & Acoustic',
    slug: 'lighting-acoustic',
    description: 'Diffusers, acoustic geometry, and architectural fixtures',
    sortOrder: 2,
    isActive: true,
  },
  {
    id: 'cat-03',
    name: 'Mechanism Prototypes',
    slug: 'mechanism-prototypes',
    description: 'Articulated assemblies and kinematic demonstrator prints',
    sortOrder: 3,
    isActive: true,
  },
]

export const fixtureProducts: Product[] = [
  {
    id: 'prod-01',
    slug: 'engineered-equipment-enclosure',
    title: '[SAMPLE PRODUCT] Engineered Equipment Enclosure',
    subtitle: 'Sample dual-compartment electronics casing demonstrator with brass inserts',
    categoryId: 'cat-01',
    category: fixtureCategories[0],
    shortDescription: 'Sample demonstrator housing for testing product listing and catalogue layout.',
    description: 'Development sample object used to verify layout rendering and typography. Demonstrates technical housing geometry with brass heat-set hardware placement.',
    dimensions: '120 × 95 × 48 mm',
    material: 'Technical PETG / Brass Inserts',
    customization: 'Mounting grid spacing, port cutouts',
    availability: 'Development Sample',
    isFeatured: true,
    sortOrder: 1,
    status: 'PUBLISHED',
    featuredImage: {
      id: 'med-01',
      url: '/assets/workshop-wall/wall-01.webp',
      altText: 'Sample engineered equipment enclosure demonstrator',
    },
    gallery: [
      {
        id: 'med-01',
        url: '/assets/workshop-wall/wall-01.webp',
        altText: 'Sample enclosure view 1',
      },
      {
        id: 'med-02',
        url: '/assets/transform/transform-physical.webp',
        altText: 'Sample enclosure view 2',
      },
    ],
    seoTitle: '[SAMPLE] Engineered Equipment Enclosure — Falcon 3D Prints',
    seoDescription: 'Development sample product for Falcon 3D Prints catalogue testing.',
    createdAt: 1727950000000,
    updatedAt: 1727950000000,
  },
  {
    id: 'prod-02',
    slug: 'parametric-spiral-luminary',
    title: '[SAMPLE PRODUCT] Parametric Spiral Luminary',
    subtitle: 'Sample continuous toolpath lighting diffuser demonstrator',
    categoryId: 'cat-02',
    category: fixtureCategories[1],
    shortDescription: 'Sample lighting diffuser demonstrator showcasing organic geometric contours.',
    description: 'Development sample object illustrating spiral toolpath diffusion and wall calibration for catalogue layout testing.',
    dimensions: '160 × 160 × 240 mm',
    material: 'Warm Ivory Polymer',
    customization: 'Aperture diameter',
    availability: 'Development Sample',
    isFeatured: false,
    sortOrder: 2,
    status: 'PUBLISHED',
    featuredImage: {
      id: 'med-03',
      url: '/assets/workshop-wall/wall-02.webp',
      altText: 'Sample parametric spiral luminary diffuser',
    },
    gallery: [
      {
        id: 'med-03',
        url: '/assets/workshop-wall/wall-02.webp',
        altText: 'Sample spiral luminary diffuser',
      },
    ],
    seoTitle: '[SAMPLE] Parametric Spiral Luminary — Falcon 3D Prints',
    seoDescription: 'Development sample product for Falcon 3D Prints catalogue testing.',
    createdAt: 1727951000000,
    updatedAt: 1727951000000,
  },
  {
    id: 'prod-03',
    slug: 'articulated-robotic-gripper-kit',
    title: '[SAMPLE PRODUCT] Articulated Gripper Assembly',
    subtitle: 'Sample kinematic linkage demonstrator with print-in-place articulation',
    categoryId: 'cat-03',
    category: fixtureCategories[2],
    shortDescription: 'Sample mechanical demonstrator print with interlocking joint articulation.',
    description: 'Development sample object used to verify mechanism photography, specification cards, and mobile viewports.',
    dimensions: '210 × 130 × 55 mm',
    material: 'Tough Composite Polymer',
    customization: 'Jaw interface geometry',
    availability: 'Development Sample',
    isFeatured: false,
    sortOrder: 3,
    status: 'PUBLISHED',
    featuredImage: {
      id: 'med-04',
      url: '/assets/workshop-wall/wall-03.webp',
      altText: 'Sample articulated robotic gripper assembly',
    },
    gallery: [
      {
        id: 'med-04',
        url: '/assets/workshop-wall/wall-03.webp',
        altText: 'Sample articulated gripper mechanism',
      },
    ],
    seoTitle: '[SAMPLE] Articulated Gripper Assembly — Falcon 3D Prints',
    seoDescription: 'Development sample product for Falcon 3D Prints catalogue testing.',
    createdAt: 1727952000000,
    updatedAt: 1727952000000,
  },
  {
    id: 'prod-04-draft',
    slug: 'unreleased-internal-bracket',
    title: '[SAMPLE DRAFT] Unreleased Internal Bracket',
    subtitle: 'Draft test object — must 404',
    categoryId: 'cat-01',
    isFeatured: false,
    sortOrder: 99,
    status: 'DRAFT', // MUST NEVER APPEAR PUBLICLY
    gallery: [],
    createdAt: 1727953000000,
    updatedAt: 1727953000000,
  },
]
