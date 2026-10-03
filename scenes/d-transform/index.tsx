/**
 * Scene D — Digital → Physical (Transform)
 * Design source: design.md §10.5, §17.3
 * Motion registry: M16
 * Artifacts: A18, A25, A26, A27, A28, A29
 *
 * Pinned 450vh desktop / 250vh mobile
 *
 * ONE OBJECT — four representations of the master electronics enclosure:
 * 01 IDEA   (0–20%)   Thin sketch wireframe outline of the enclosure
 * 02 MODEL  (20–45%)  Full CAD wireframe — same geometry, structured
 * 03 BUILD  (45–75%)  Layer contours slicing the actual enclosure shape
 * 04 OBJECT (75–100%) Physical render — same enclosure, finished print
 *
 * All four states share the same SVG viewBox (0 0 300 340) and centroid
 * so the object never teleports or changes scale.
 */

'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, useReducedMotion, MotionValue } from 'framer-motion'
import { ArtifactLabel } from '@/components/ArtifactLabel'
import { transform as transformContent } from '@/lib/content'

// ─── Master geometry — shared across all 4 states ────────────────────────────
// Isometric electronics enclosure, three-quarter front-left view.
// ViewBox: 0 0 300 340
// Apex of lid at (150,52); left (44,108); bottom of lid-face (150,164); right (256,108)
// Lid body height: 28px (136); Base body: 44,136→44,226 left; 256,136→256,226 right
// Base floor: 44,226→150,282→256,226

const TOP_FACE = '150,52 256,108 150,164 44,108'
const TOP_INNER = '150,66 238,108 150,150 62,108'
const TOP_PLATEAU = '150,80 218,108 150,136 82,108'

export function SceneTransform() {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // ── Phase timings ─────────────────────────────────────────────────────────
  // IDEA   0–20%
  // MODEL  20–45%
  // BUILD  45–75%
  // OBJECT 75–100%
  // Cross-fades overlap ~5% for smooth transitions

  // 01 IDEA: rise 0→4%, hold to 20%, fade out 20→27%
  const ideaOpacity = useTransform(
    scrollYProgress,
    [0, 0.04, 0.20, 0.27],
    [0, 1, 1, 0]
  )

  // 02 MODEL: rise 18→25%, hold to 42%, fade out 45→52%
  const modelOpacity = useTransform(
    scrollYProgress,
    [0.18, 0.25, 0.42, 0.50],
    [0, 1, 1, 0]
  )

  // 03 BUILD: rise 43→50%, hold to 72%, fade out 75→80%
  const buildOpacity = useTransform(
    scrollYProgress,
    [0.43, 0.50, 0.72, 0.80],
    [0, 1, 1, 0]
  )

  // Layer build-up progress
  const layerProgress = useTransform(scrollYProgress, [0.43, 0.72], [0, 1])

  // 04 OBJECT: rise 73→82%, hold to 100%
  const objectOpacity = useTransform(
    scrollYProgress,
    [0.73, 0.82, 1.0],
    [0, 1, 1]
  )

  // Giant words
  const digitalX = useTransform(
    scrollYProgress,
    [0, 0.42, 0.48, 0.55],
    ['0%', '0%', '-120%', '-120%']
  )
  const physicalX = useTransform(
    scrollYProgress,
    [0.65, 0.75, 1.0],
    ['120%', '0%', '0%']
  )

  // Background
  const nightPanelY = useTransform(scrollYProgress, [0, 0.05], ['100%', '0%'])
  const paperWipeY = useTransform(scrollYProgress, [0.95, 1.0], ['100%', '0%'])

  // Step indicators
  const step1Active = useTransform(scrollYProgress, [0, 0.18, 0.25], [1, 1, 0.3])
  const step2Active = useTransform(scrollYProgress, [0.18, 0.25, 0.43, 0.50], [0.3, 1, 1, 0.3])
  const step3Active = useTransform(scrollYProgress, [0.43, 0.50, 0.72, 0.80], [0.3, 1, 1, 0.3])
  const step4Active = useTransform(scrollYProgress, [0.72, 0.80, 1], [0.3, 1, 1])
  const stepActives = [step1Active, step2Active, step3Active, step4Active]

  // Build envelope annotation — visible during BUILD and OBJECT phases
  const envelopeOpacity = useTransform(
    scrollYProgress,
    [0.43, 0.52, 0.92, 0.97],
    [0, 1, 1, 0]
  )

  if (prefersReducedMotion) {
    return <TransformStaticVariant />
  }

  return (
    <section
      id="transform"
      ref={containerRef}
      style={{ height: 'var(--scene-transform)', position: 'relative' }}
      aria-label="Digital to Physical transformation"
    >
      <div className="scene-stage" style={{ background: 'var(--paper)' }}>
        {/* Night background */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--night)',
            y: nightPanelY,
          }}
          aria-hidden="true"
        />

        {/* Paper wipe at scene end */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--paper)',
            y: paperWipeY,
            zIndex: 20,
          }}
          aria-hidden="true"
        />

        {/* Section label */}
        <div style={{ position: 'absolute', top: 'calc(72px + 24px)', left: 'var(--grid-margin)', zIndex: 5 }}>
          <div className="scene-label" style={{ color: 'var(--muted)' }}>04 / DIGITAL → PHYSICAL</div>
          <h2
            className="text-title"
            style={{
              fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
              fontWeight: 700,
              color: 'var(--paper)',
              marginTop: 8,
            }}
          >
            {transformContent.headline}
          </h2>
        </div>

        {/* DIGITAL giant word */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 1 }}>
          <motion.div style={{ x: digitalX }} aria-hidden="true">
            <span className="text-giant" style={{ color: 'rgba(245,241,233,0.18)' }}>DIGITAL</span>
          </motion.div>
        </div>

        {/* PHYSICAL giant word */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 1 }}>
          <motion.div style={{ x: physicalX }} aria-hidden="true">
            <span className="text-giant" style={{ color: 'rgba(245,241,233,0.18)' }}>PHYSICAL</span>
          </motion.div>
        </div>

        {/* ── Master object anchor — all 4 states stacked here ─────────── */}
        {/* Fixed position: centred at 48% from top. Never moves. */}
        <div
          style={{
            position: 'absolute',
            top: '48%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(220px, 40vw, 540px)',
            aspectRatio: '300 / 340',
            zIndex: 3,
          }}
        >
          {/* 01 IDEA */}
          <motion.div style={{ position: 'absolute', inset: 0, opacity: ideaOpacity, zIndex: 2 }}>
            <IdeaSketcher />
          </motion.div>

          {/* 02 MODEL */}
          <motion.div style={{ position: 'absolute', inset: 0, opacity: modelOpacity, zIndex: 3 }}>
            <ModelWireframe />
          </motion.div>

          {/* 03 BUILD */}
          <motion.div style={{ position: 'absolute', inset: 0, opacity: buildOpacity, zIndex: 4 }}>
            <BuildLayers progress={layerProgress} />
          </motion.div>

          {/* 04 OBJECT */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: objectOpacity,
              zIndex: 5,
              filter: 'drop-shadow(0 24px 36px rgba(0,0,0,0.55))',
            }}
          >
            <PhysicalObject />
          </motion.div>

          {/* BUILD STRATA label */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: -40,
              left: 0,
              zIndex: 7,
              opacity: buildOpacity,
            }}
          >
            <ArtifactLabel text="LAYER VIEW · BUILD STRATA" variant="default" />
          </motion.div>

          {/* BUILD ENVELOPE annotation — leader line attached to object */}
          <motion.div
            style={{
              position: 'absolute',
              right: 'clamp(-110px, -20%, -60px)',
              top: '20%',
              zIndex: 7,
              opacity: envelopeOpacity,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 6,
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <svg width={40} height={80} viewBox="0 0 40 80" fill="none" style={{ flexShrink: 0 }}>
              <line x1={0} y1={4} x2={32} y2={4} stroke="rgba(245,241,233,0.35)" strokeWidth={0.75} />
              <line x1={32} y1={0} x2={32} y2={80} stroke="rgba(245,241,233,0.35)" strokeWidth={0.75} />
              <line x1={24} y1={80} x2={32} y2={80} stroke="rgba(245,241,233,0.35)" strokeWidth={0.75} />
              <circle cx={0} cy={4} r={2} fill="var(--falcon-orange)" />
            </svg>
            <div>
              <span style={{
                fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
                fontSize: '0.5rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: 'rgba(245,241,233,0.5)',
                display: 'block',
                lineHeight: 1.4,
              }}>BUILD</span>
              <span style={{
                fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
                fontSize: '0.5rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color: 'rgba(245,241,233,0.5)',
                display: 'block',
                lineHeight: 1.4,
              }}>ENVELOPE</span>
            </div>
          </motion.div>
        </div>

        {/* State labels 01–04 */}
        <div style={{
          position: 'absolute',
          bottom: 44,
          left: 'var(--grid-margin)',
          right: 'var(--grid-margin)',
          display: 'flex',
          gap: 32,
          justifyContent: 'center',
          zIndex: 5,
        }}>
          {transformContent.stateLabels.map((state, i) => (
            <motion.div
              key={state.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                opacity: stepActives[i],
              }}
            >
              <span className="text-mono" style={{ color: 'var(--falcon-orange)', fontSize: '0.625rem', fontWeight: 600 }}>
                {state.id}
              </span>
              <span className="text-mono" style={{ color: 'var(--paper)', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                {state.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── 01 IDEA — thin sketch outline of the master enclosure ───────────────────
function IdeaSketcher() {
  const O = 'var(--falcon-orange)'
  const O45 = 'rgba(243,107,22,0.45)'
  const O22 = 'rgba(243,107,22,0.22)'
  const G12 = 'rgba(245,241,233,0.12)'

  return (
    <svg width="100%" height="100%" viewBox="0 0 300 340" fill="none" aria-hidden="true" style={{ overflow: 'visible' }}>
      {/* Construction bounding box */}
      <rect x={30} y={40} width={240} height={260} stroke={G12} strokeWidth={0.6} strokeDasharray="3 4" />

      {/* Centroid crosshair */}
      <line x1={143} y1={108} x2={157} y2={108} stroke={O} strokeWidth={0.8} />
      <line x1={150} y1={101} x2={150} y2={115} stroke={O} strokeWidth={0.8} />
      <circle cx={150} cy={108} r={1.5} fill={O} />

      {/* Top face lid — primary recognition shape */}
      <polygon points={TOP_FACE} stroke={O} strokeWidth={1.2} fill="none" strokeLinejoin="round" />
      {/* Inner chamfer — dashed construction */}
      <polygon points={TOP_INNER} stroke={O45} strokeWidth={0.7} fill="none" strokeDasharray="3 3" />

      {/* Lid body vertical edges */}
      <line x1={44} y1={108} x2={44} y2={136} stroke={O45} strokeWidth={0.8} />
      <line x1={256} y1={108} x2={256} y2={136} stroke={O45} strokeWidth={0.8} />
      <line x1={150} y1={164} x2={150} y2={192} stroke={O} strokeWidth={1.0} />

      {/* Lid bottom rim */}
      <line x1={44} y1={136} x2={150} y2={192} stroke={O45} strokeWidth={0.8} />
      <line x1={150} y1={192} x2={256} y2={136} stroke={O45} strokeWidth={0.8} />

      {/* Base body */}
      <line x1={44} y1={136} x2={44} y2={226} stroke={O45} strokeWidth={0.9} />
      <line x1={256} y1={136} x2={256} y2={226} stroke={O45} strokeWidth={0.9} />
      <line x1={150} y1={192} x2={150} y2={282} stroke={O} strokeWidth={1.0} />

      {/* Base bottom */}
      <line x1={44} y1={226} x2={150} y2={282} stroke={O45} strokeWidth={0.8} />
      <line x1={150} y1={282} x2={256} y2={226} stroke={O45} strokeWidth={0.8} />

      {/* Left mounting ear */}
      <line x1={44} y1={210} x2={20} y2={198} stroke={O22} strokeWidth={0.7} />
      <line x1={44} y1={225} x2={20} y2={213} stroke={O22} strokeWidth={0.7} />
      <line x1={20} y1={198} x2={20} y2={213} stroke={O22} strokeWidth={0.7} />
      {/* Right mounting ear */}
      <line x1={256} y1={210} x2={280} y2={198} stroke={O22} strokeWidth={0.7} />
      <line x1={256} y1={225} x2={280} y2={213} stroke={O22} strokeWidth={0.7} />
      <line x1={280} y1={198} x2={280} y2={213} stroke={O22} strokeWidth={0.7} />

      {/* Anchor dots at key vertices */}
      {([
        [150, 52], [256, 108], [150, 164], [44, 108],
        [44, 136], [256, 136], [150, 192], [44, 226], [256, 226], [150, 282],
      ] as [number, number][]).map(([cx, cy], idx) => (
        <circle key={idx} cx={cx} cy={cy} r={2.2} fill={O} opacity={0.72} />
      ))}

      {/* Vent detail hints */}
      <line x1={68} y1={178} x2={118} y2={208} stroke={O22} strokeWidth={0.6} />
      <line x1={68} y1={192} x2={118} y2={222} stroke={O22} strokeWidth={0.6} />
    </svg>
  )
}

// ─── 02 MODEL — full CAD wireframe, identical geometry ───────────────────────
function ModelWireframe() {
  const O = 'var(--falcon-orange)'
  const O85 = 'rgba(243,107,22,0.85)'
  const O60 = 'rgba(243,107,22,0.60)'
  const O40 = 'rgba(243,107,22,0.40)'
  const G12 = 'rgba(245,241,233,0.12)'

  return (
    <svg width="100%" height="100%" viewBox="0 0 300 340" fill="none" aria-hidden="true" style={{ overflow: 'visible' }}>
      {/* Bounding box ghost */}
      <rect x={8} y={10} width={284} height={320} stroke={G12} strokeWidth={0.6} strokeDasharray="4 4" />

      {/* Top face */}
      <polygon points={TOP_FACE} stroke={O85} strokeWidth={1.4} fill="none" />
      <polygon points={TOP_INNER} stroke={O60} strokeWidth={1.0} fill="none" />
      <polygon points={TOP_PLATEAU} stroke={O40} strokeWidth={0.85} fill="none" />

      {/* Brass insert boss ellipses */}
      <ellipse cx={150} cy={66} rx={6} ry={3.5} stroke={O} strokeWidth={1.2} />
      <ellipse cx={238} cy={108} rx={6} ry={3.5} stroke={O} strokeWidth={1.2} />
      <ellipse cx={150} cy={150} rx={6} ry={3.5} stroke={O} strokeWidth={1.2} />
      <ellipse cx={62} cy={108} rx={6} ry={3.5} stroke={O} strokeWidth={1.2} />

      {/* Lid body drop */}
      <line x1={44} y1={108} x2={44} y2={136} stroke={O60} strokeWidth={1.2} />
      <line x1={256} y1={108} x2={256} y2={136} stroke={O60} strokeWidth={1.2} />
      <line x1={150} y1={164} x2={150} y2={192} stroke={O} strokeWidth={1.6} />
      <line x1={44} y1={136} x2={150} y2={192} stroke={O60} strokeWidth={1.0} />
      <line x1={150} y1={192} x2={256} y2={136} stroke={O60} strokeWidth={1.0} />

      {/* Base body */}
      <line x1={44} y1={136} x2={44} y2={226} stroke={O85} strokeWidth={1.2} />
      <line x1={256} y1={136} x2={256} y2={226} stroke={O85} strokeWidth={1.2} />
      <line x1={150} y1={192} x2={150} y2={282} stroke={O} strokeWidth={1.8} />
      <line x1={44} y1={226} x2={150} y2={282} stroke={O60} strokeWidth={1.2} />
      <line x1={150} y1={282} x2={256} y2={226} stroke={O60} strokeWidth={1.2} />

      {/* Left flange ear */}
      <polygon points="44,210 20,198 20,214 44,226" stroke={O60} strokeWidth={1.0} fill="none" />
      <ellipse cx={28} cy={206} rx={3.5} ry={2} stroke={O} strokeWidth={1.0} />

      {/* Right flange ear */}
      <polygon points="256,210 280,198 280,214 256,226" stroke={O60} strokeWidth={1.0} fill="none" />
      <ellipse cx={272} cy={206} rx={3.5} ry={2} stroke={O} strokeWidth={1.0} />

      {/* Left face vent louvers */}
      <line x1={70} y1={178} x2={122} y2={208} stroke={O40} strokeWidth={0.9} />
      <line x1={70} y1={192} x2={122} y2={222} stroke={O40} strokeWidth={0.9} />
      <line x1={70} y1={206} x2={122} y2={236} stroke={O40} strokeWidth={0.9} />

      {/* Right face I/O cutout */}
      <polygon points="178,214 228,184 228,204 178,234" stroke={O40} strokeWidth={0.9} fill="none" />

      {/* XYZ axis indicators */}
      <line x1={150} y1={108} x2={170} y2={96} stroke="rgba(243,107,22,0.5)" strokeWidth={0.8} strokeDasharray="2 2" />
      <line x1={150} y1={108} x2={130} y2={96} stroke="rgba(243,107,22,0.3)" strokeWidth={0.8} strokeDasharray="2 2" />
      <line x1={150} y1={108} x2={150} y2={88} stroke="rgba(243,107,22,0.4)" strokeWidth={0.8} strokeDasharray="2 2" />
      <text x={173} y={94} fill={O} fontSize={6} fontFamily="var(--font-dm-mono)" opacity={0.6}>X</text>
      <text x={120} y={94} fill={O} fontSize={6} fontFamily="var(--font-dm-mono)" opacity={0.4}>Y</text>
      <text x={148} y={82} fill={O} fontSize={6} fontFamily="var(--font-dm-mono)" opacity={0.5}>Z</text>
    </svg>
  )
}

// ─── 03 BUILD — enclosure-shaped layer contours ───────────────────────────────
// Each horizontal slice follows the actual cross-section of the enclosure.
// Lid region: rhombus slices that widen then narrow. Base region: wide rectangular slices.
interface BuildLayersProps {
  progress: MotionValue<number>
}

function BuildLayers({ progress: _progress }: BuildLayersProps) {
  // Build layer data at component-definition time (pure geometry)
  const TOTAL_LAYERS = 42
  const layers: { path: string }[] = []

  for (let i = 0; i < TOTAL_LAYERS; i++) {
    const t = i / (TOTAL_LAYERS - 1)          // 0 = bottom, 1 = top
    const y = 282 - t * (282 - 52)            // map to viewBox y

    let path = ''

    if (y >= 52 && y <= 108) {
      // Upper lid: apex (150,52) to mid (44,108)–(256,108)
      const frac = (y - 52) / (108 - 52)
      const hw = frac * 106
      path = `M ${150 - hw} ${y} L ${150 + hw} ${y}`
    } else if (y > 108 && y < 164) {
      // Lower lid: mid to bottom of lid face
      const frac = (y - 108) / (164 - 108)
      const hw = (1 - frac) * 106
      path = `M ${150 - hw} ${y} L ${150 + hw} ${y}`
    } else if (y >= 136 && y <= 282) {
      // Base body: full-width rectangular slices, slight taper toward base floor
      const tBase = (y - 136) / (282 - 136)
      const taper = tBase * 6
      path = `M ${44 + taper} ${y} L ${256 - taper} ${y}`
    }

    if (path) layers.push({ path })
  }

  const O = 'var(--falcon-orange)'
  const O50 = 'rgba(243,107,22,0.5)'
  const O28 = 'rgba(243,107,22,0.28)'

  return (
    <svg width="100%" height="100%" viewBox="0 0 300 340" fill="none" aria-hidden="true" style={{ overflow: 'visible' }}>
      {/* Ghost silhouette */}
      <polygon points={TOP_FACE} stroke="rgba(243,107,22,0.12)" strokeWidth={0.75} fill="none" />
      <line x1={44} y1={136} x2={44} y2={226} stroke="rgba(243,107,22,0.08)" strokeWidth={0.75} />
      <line x1={256} y1={136} x2={256} y2={226} stroke="rgba(243,107,22,0.08)" strokeWidth={0.75} />
      <line x1={44} y1={226} x2={150} y2={282} stroke="rgba(243,107,22,0.08)" strokeWidth={0.75} />
      <line x1={150} y1={282} x2={256} y2={226} stroke="rgba(243,107,22,0.08)" strokeWidth={0.75} />

      {/* Layer contours */}
      {layers.map(({ path }, idx) => {
        const isActive = idx === layers.length - 1
        const isNearTop = idx >= layers.length - 3
        return (
          <path
            key={idx}
            d={path}
            stroke={isActive ? O : isNearTop ? O50 : O28}
            strokeWidth={isActive ? 2.0 : 0.85}
            strokeLinecap="round"
          />
        )
      })}

      {/* Infill detail on mid-section */}
      <path
        d="M 70 200 L 130 200 M 130 207 L 70 207 M 70 214 L 130 214"
        stroke="rgba(243,107,22,0.22)"
        strokeWidth={0.6}
        strokeLinecap="round"
      />

      {/* Layer count */}
      <text
        x={262} y={218}
        fill="rgba(245,241,233,0.35)"
        fontSize={6}
        fontFamily="var(--font-dm-mono, 'DM Mono', monospace)"
        letterSpacing={0.5}
      >{TOTAL_LAYERS}L</text>
    </svg>
  )
}

// ─── 04 OBJECT — finished physical enclosure ─────────────────────────────────
function PhysicalObject() {
  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      role="img"
      aria-label="Finished 3D printed electronics enclosure with brass heat-set inserts"
    >
      <Image
        src="/assets/transform/transform-physical.webp?v=4"
        alt="Finished 3D printed physical electronics enclosure with brass heat-set inserts"
        fill
        sizes="(max-width: 768px) 300px, 560px"
        style={{ objectFit: 'contain', objectPosition: 'center' }}
        unoptimized
      />
    </div>
  )
}

// ─── Reduced-motion: static 4-panel strip ─────────────────────────────────────
function TransformStaticVariant() {
  const panels = [
    { id: '01', label: 'IDEA',   desc: 'Enclosure outline & vertices' },
    { id: '02', label: 'MODEL',  desc: 'CAD wireframe' },
    { id: '03', label: 'BUILD',  desc: 'Layer contours & toolpath' },
    { id: '04', label: 'OBJECT', desc: 'Finished physical print' },
  ]

  return (
    <section id="transform" style={{ background: 'var(--night)', padding: '120px var(--grid-margin)' }}>
      <div className="scene-label" style={{ color: 'rgba(245,241,233,0.5)', marginBottom: 16 }}>04 / DIGITAL → PHYSICAL</div>
      <h2 className="text-title" style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, color: 'var(--paper)', marginBottom: 64 }}>
        Digital in. Physical out.
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 24 }}>
        {panels.map(p => (
          <div key={p.id} style={{ borderTop: '1px solid rgba(245,241,233,0.15)', paddingTop: 16 }}>
            <div className="text-mono" style={{ color: 'var(--falcon-orange)', marginBottom: 8 }}>{p.id}</div>
            <div className="text-mono" style={{ color: 'var(--paper)', marginBottom: 8 }}>{p.label}</div>
            <div style={{ color: 'rgba(245,241,233,0.5)', fontSize: '0.875rem' }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
