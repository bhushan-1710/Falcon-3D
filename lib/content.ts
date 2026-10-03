/**
 * Falcon 3D Prints — Content Registry
 * Design source: design.md §23, CONTENT.md
 *
 * All copy, placeholders and status annotations live here.
 * Statuses: CONFIRMED | DRAFT | BUSINESS_INPUT_REQUIRED | ASSET_REQUIRED | TBD
 *
 * RULE ZERO (design.md): Never invent materials, machine brands, turnaround
 * times, prices, certifications, client logos, testimonials, statistics or
 * capabilities. Unknowns are visible placeholders.
 *
 * Production gate: grep for [INSERT, [ASSET REQUIRED, [CONFIRM, [TBD in this
 * file must return empty before production deploy.
 */

// ─── SEO ──────────────────────────────────────────────────────────────────────
export const seo = {
  title: 'Falcon 3D Prints — Custom 3D Printing, Prototyping & Design in Nashik', // DRAFT
  description: 'Custom 3D printing, prototyping and design from Nashik.', // DRAFT
  ogTitle: 'Make it physical. — Falcon 3D Prints', // DRAFT
  canonicalUrl: '[CONFIRM: final production URL]',
  address: '[BUSINESS INPUT REQUIRED: street address or service area]',
} as const

// ─── Brand facts (confirmed from design source) ───────────────────────────────
export const brand = {
  name: 'Falcon 3D Prints',
  tagline: '3D PRINTING • PROTOTYPING • CUSTOM DESIGNS',
  location: 'Nashik, Maharashtra', // CONFIRMED
  country: 'India',
  email: 'myfalcon3dprint@gmail.com', // CONFIRMED
  phone: '9850607144', // CONFIRMED
  phoneE164: '+919850607144', // CONFIRMED
  whatsappUrl: 'https://wa.me/919850607144?text=Hi%20Falcon%203D%20Prints%2C%20I%20have%20an%20idea%E2%80%A6', // CONFIRMED
  instagramHandle: '@falcon_3d_prints', // CONFIRMED
  instagramUrl: 'https://www.instagram.com/falcon_3d_prints/', // CONFIRMED
  whatsappConfirmed: '[CONFIRM: WhatsApp enabled on 9850607144]',
} as const

// ─── Navigation ───────────────────────────────────────────────────────────────
export const nav = {
  links: [
    { label: 'SERVICES', href: '#lab' },
    { label: 'WORK', href: '#wall' },
    { label: 'PRODUCTS', href: '/products' },
    { label: 'PROCESS', href: '#process' },
    { label: 'ABOUT', href: '#about' },
    { label: 'CONTACT', href: '#contact' },
  ],
  cta: 'START A CUSTOM PRINT', // DRAFT / PRIMARY CTA
} as const

// ─── Products Page (Public) ──────────────────────────────────────────────────
export const productsPage = {
  heroEyebrow: '05 / FABRICATION CATALOG',
  heroHeadline: 'Objects made to exist.',
  heroSubline: 'Engineered housings, parametric geometries, and precision demonstrators manufactured by Falcon in Nashik.',
  ctaEnquire: 'ENQUIRE ABOUT A PRODUCT',
  ctaCustom: 'REQUEST A CUSTOM PRINT',
  emptyTitle: '00 / NO PRODUCTS CURRENTLY RELEASED',
  emptyText: 'Studio production runs and limited editions are prepared in batches. Inquire for custom fabrication.',
} as const

// ─── Hero (Scene A) ───────────────────────────────────────────────────────────
export const hero = {
  h1: 'Make it physical.', // DRAFT — pending Falcon approval
  scrollWords: ['IDEA', 'OBJECT', 'PHYSICAL.'], // DRAFT (aria-hidden decorative)
  supportLine: 'Custom 3D printing, prototyping & design from Nashik.', // DRAFT
  secondaryLine: 'From digital concept to tangible object.', // DRAFT
  ctaPrimary: 'START A CUSTOM PRINT', // DRAFT
  ctaSecondary: 'VIEW OUR WORK', // DRAFT
  scrollAffordance: 'SCROLL TO BUILD', // DRAFT
  // Asset placeholder — never ship fake product
  heroObjectPlaceholder: '[ASSET REQUIRED: transparent PNG/WebP cut-out of best Falcon print, ≥2400px tall]',
  fragmentsPlaceholder: '[ASSET REQUIRED: 2–3 small-print cut-outs for hero fragments]',
} as const

// ─── Print Lab (Scene B) ──────────────────────────────────────────────────────
// IMPORTANT: Only confirmed categories ship. States listed here are DRAFT.
// Categories (1–4) each require confirmation and real photography.
export const printLab = {
  heading: 'What do you want to make?',
  states: [
    {
      id: 'CUSTOM',
      giantWord: 'CUSTOM',
      description: 'Objects made from your idea, reference or 3D model.',
      background: '#F5F1E9',
      imageSrc: '/assets/print-lab/lab-custom.webp',
      alt: 'Custom 3D printed parametric acoustic diffuser',
      tag: 'BESPOKE FABRICATION',
    },
    {
      id: 'PROTOTYPE',
      giantWord: 'PROTOTYPE',
      description: 'A physical version to test, hold, stress-test and improve.',
      background: '#0B0B0B',
      imageSrc: '/assets/print-lab/lab-prototype.webp',
      alt: 'Precision drone gimbal mount in carbon-fiber PETG',
      tag: 'FUNCTIONAL ENGINEERING',
    },
    {
      id: 'DESIGN',
      giantWord: 'DESIGN',
      description: 'Turning rough sketches into production-ready 3D files.',
      background: '#F2E6DA',
      imageSrc: '/assets/falcon/artifacts/design-object-new.webp',
      alt: 'Clean isolated CAD model and wireframe of custom electronics enclosure',
      tag: 'CAD & 3D MODELING',
    },
    {
      id: 'FIGURINE',
      giantWord: 'FIGURINE',
      description: 'Detailed character sculptures, collectibles and custom miniatures.',
      background: '#DDD6CB',
      imageSrc: '/assets/print-lab/lab-figurine.webp',
      alt: 'Falcon Guardian Sentinel collectible sculpture bust',
      tag: 'RESIN & ULTRA-FINE FDM',
    },
  ],
} as const

// ─── Workshop Wall (Scene C) ──────────────────────────────────────────────────
export const workshopWall = {
  heading: "Explore what's possible.",
  sectionLabel: '03 / WHAT WE MAKE',
} as const

// ─── Digital → Physical (Scene D) ────────────────────────────────────────────
export const transform = {
  headline: 'Digital in. Physical out.', // DRAFT
  stateLabels: [
    { id: '01', label: 'IDEA' },     // DRAFT
    { id: '02', label: 'MODEL' },    // DRAFT / ILLUSTRATION label where needed
    { id: '03', label: 'BUILD' },    // DRAFT
    { id: '04', label: 'OBJECT' },   // DRAFT
  ],
  giantWords: ['DIGITAL', 'PHYSICAL'],
  // Technical labels — illustrative only, not real data
  technicalLabels: {
    xyz: 'X / Y / Z',
    dimension: 'BUILD ENVELOPE',
    layer: 'LAYER VIEW',
    layerNote: 'BUILD STRATA',
  },
  objectPlaceholder: '[ASSET REQUIRED: photo of the object used in Scene D]',
  stlPlaceholder: '[ASSET REQUIRED: STL/OBJ of transform object, optional but valuable]',
} as const

// ─── Process (Scene E) ────────────────────────────────────────────────────────
// Accurate, confirmed workflow language (design.md §10.6, prompt §6)
export const process = {
  heading: 'From idea to object.',
  stages: [
    {
      number: '01',
      label: 'SHARE',
      description: 'Tell us what you want to make.',
      tag: 'DIRECT INQUIRY',
    },
    {
      number: '02',
      label: 'DESIGN',
      description: 'We review your idea, reference or model and prepare it for printing.',
      tag: '3D PREPARATION',
    },
    {
      number: '03',
      label: 'PRINT',
      description: 'The approved design is turned into a physical object.',
      tag: 'ADDITIVE PRINT',
    },
    {
      number: '04',
      label: 'DELIVER',
      description: 'Your finished print is ready for pickup or delivery.',
      tag: 'PICKUP & DELIVERY',
    },
  ],
  turnaround: 'DIRECT TURNAROUND FROM NASHIK',
  printerPhoto: '/assets/about/workshop-studio.webp',
} as const

// ─── About ────────────────────────────────────────────────────────────────────
export const about = {
  heading: 'Built to make ideas real.', // DRAFT
  kinetic: 'REAL.', // The word that slides in from behind
  body: 'Falcon 3D Prints is a Nashik-based 3D printing, prototyping and custom-design studio focused on turning ideas and digital concepts into tangible objects.', // DRAFT
  // Owner naming requires explicit confirmation
  ownerName: 'Rekha Pawar', // CONFIRMED in source — public naming [CONFIRM]
  ownerTitle: 'Founder', // [CONFIRM TITLE AND PUBLIC NAMING]
  ownerNameConfirm: '[CONFIRM OWNER NAME/TITLE USAGE]',
  workshopPhotoPlaceholder: '[ASSET REQUIRED: workshop photo, printer in operation]',
  ownerPortraitPlaceholder: '[ASSET REQUIRED: owner portrait, optional]',
} as const

// ─── Print Sample Wall ────────────────────────────────────────────────────────
export const sampleWall = {
  heading: 'See what we\'re printing.', // DRAFT
  dragAffordance: 'DRAG TO EXPLORE', // DRAFT
  instagramCta: 'VIEW INSTAGRAM', // DRAFT
  instagramUrl: brand.instagramUrl,
  // No follower/post counts displayed
  imagesPlaceholder: '[ASSET REQUIRED: 6–9 approved Instagram/workshop images — rights [CONFIRM]]',
} as const

// ─── Final CTA (Scene F) ──────────────────────────────────────────────────────
export const finalCta = {
  heading: 'Have something in mind?', // DRAFT
  supportingCopy: 'Send us the idea, reference or file. We\'ll help turn it into a printable object.', // DRAFT
  supportingCopyAlt: 'Send the reference. We\'ll figure out the rest.', // DRAFT alt
  ctaPrimary: 'START A CUSTOM PRINT', // PRIMARY CTA
  ctaWhatsapp: 'CHAT ON WHATSAPP',
  readyLabel: 'READY TO PRINT',
  receivedLabel: 'RECEIVED',
  // Form fields
  form: {
    name: { label: 'Name', required: true },
    phone: { label: 'Phone', required: true, note: 'Phone or Email required' },
    email: { label: 'Email', required: true, note: 'Phone or Email required' },
    description: { label: 'What do you want to make?', required: true },
    upload: { label: 'Upload reference/file', required: false, acceptedFormats: '[INSERT CONFIRMED FILE FORMATS]' },
    quantity: { label: 'Quantity', required: false },
    notes: { label: 'Notes', required: false },
  },
  // Submit / success / error states
  submitLabel: 'START A CUSTOM PRINT',
  successMessage: 'Got it. We\'ll be in touch.', // No response-time promise until confirmed
  errorMessage: 'Something went wrong. Please try again or contact Falcon directly.', // DRAFT
  // Unconfirmed items — must not be fabricated
  formDelivery: '[CONFIRM FORM DELIVERY]',
  responseTime: '[BUSINESS INPUT REQUIRED: response time promise]',
} as const

// ─── Footer ───────────────────────────────────────────────────────────────────
export const footer = {
  eyebrow: 'GOT AN IDEA?', // DRAFT
  headline: 'LET\'S MAKE IT PHYSICAL.', // DRAFT
  brandline: 'FALCON 3D PRINTS · 3D PRINTING • PROTOTYPING • CUSTOM DESIGNS', // DRAFT
  location: 'Nashik, Maharashtra', // CONFIRMED
  address: '[BUSINESS INPUT REQUIRED: street address]',
  copyright: `© ${new Date().getFullYear()} Falcon 3D Prints`,
} as const

// ─── Microcopy ────────────────────────────────────────────────────────────────
export const microcopy = {
  scrollToBuild: 'SCROLL TO BUILD', // DRAFT
  viewObject: 'VIEW OBJECT →', // DRAFT
  readyToPrint: 'READY TO PRINT', // DRAFT
  received: 'RECEIVED', // DRAFT
  open: 'OPEN', // UI cursor state
  view: 'VIEW', // UI cursor state
  drag: 'DRAG', // UI cursor state
  dragToExplore: 'DRAG TO EXPLORE', // DRAFT
  viewInstagram: 'VIEW INSTAGRAM', // DRAFT
} as const

// ─── Analytics event taxonomy (from design §24) ───────────────────────────────
// Provider: [INSERT ANALYTICS TOOL]
export const analyticsEvents = {
  ctaClick: 'cta_click',
  whatsappClick: 'whatsapp_click',
  formStart: 'form_start',
  formSubmit: 'form_submit',
  labStateChange: 'lab_state_change',
  wallSelect: 'wall_select',
  sampleDrag: 'sample_drag',
  instagramClick: 'instagram_click',
  sceneReached: 'scene_reached',
} as const
