/**
 * Scene D — Digital → Physical (Transform)
 * Design source: design.md §10.5, §17.3
 * Motion registry: M16
 * Artifacts: A18, A25, A26, A27, A28, A29
 *
 * Pinned 450vh desktop / 250vh mobile
 *
 * Storyboard (§17.3):
 * 0%    Ink panel rises; grid appears; DIGITAL giant word; scattered dots
 * 15%   Dots find positions around bounding box; XYZ axes draw
 * 25%   Dots connect into wireframe; dimension line draws
 * 40%   Layer bands sweep; toolpath traces first layer; counter starts
 * 50%   DIGITAL slides out behind object
 * 55%   Layers stack upward; active layer line (orange) rises
 * 75%   Real photo appears through layers (clip-path from bottom)
 * 90%   Photo complete; wireframe/bands fade; shadow lands
 * 100%  Paper wipe rises; finished object shrinks to Process slot
 */

'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'
import { GiantWord } from '@/components/GiantWord'
import { ArtifactLabel } from '@/components/ArtifactLabel'
import { DimensionLine } from '@/components/DimensionLine'
import { ToolPath, LayerBands } from '@/components/ToolPath'
import { transform as transformContent } from '@/lib/content'

export function SceneTransform() {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // Scene phase values derived from scroll progress
  const phase = {
    // Dots scatter (0–15%)
    dotsOpacity: useTransform(scrollYProgress, [0, 0.08, 0.15, 0.25], [0, 1, 1, 0.6]),
    // Wireframe (25–40%)
    wireframeOpacity: useTransform(scrollYProgress, [0.20, 0.30, 0.55, 0.65], [0, 1, 1, 0]),
    // Layer bands (40–75%)
    layerBandsProgress: useTransform(scrollYProgress, [0.40, 0.75], [0, 1]),
    // Toolpath (40–55%)
    toolpathProgress: useTransform(scrollYProgress, [0.40, 0.55], [0, 1]),
    // Layer counter (40–75%)
    layerCount: useTransform(scrollYProgress, [0.40, 0.75], [0, 100]),
    // Photo reveal clip (75–90%)
    photoReveal: useTransform(scrollYProgress, [0.75, 0.90], [100, 0]),
    // Giant words
    digitalX: useTransform(scrollYProgress, [0, 0.45, 0.50, 0.55], ['0%', '0%', '-120%', '-120%']),
    physicalX: useTransform(scrollYProgress, [0.65, 0.75, 0.80], ['120%', '0%', '0%']),
    // Background night ink
    nightPanelY: useTransform(scrollYProgress, [0, 0.05], ['100%', '0%']),
    // Final paper wipe
    paperWipeY: useTransform(scrollYProgress, [0.95, 1.0], ['100%', '0%']),
  }

  // Active state transforms for the 4 stages (01 IDEA, 02 MODEL, 03 BUILD, 04 OBJECT)
  const step1Active = useTransform(scrollYProgress, [0, 0.22, 0.26], [1, 1, 0.35])
  const step2Active = useTransform(scrollYProgress, [0.22, 0.26, 0.48, 0.52], [0.35, 1, 1, 0.35])
  const step3Active = useTransform(scrollYProgress, [0.48, 0.52, 0.72, 0.76], [0.35, 1, 1, 0.35])
  const step4Active = useTransform(scrollYProgress, [0.72, 0.76, 1], [0.35, 1, 1])
  const stepActives = [step1Active, step2Active, step3Active, step4Active]

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
      {/* Night background panel */}
      <div className="scene-stage" style={{ background: 'var(--paper)' }}>
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--night)',
            y: phase.nightPanelY,
          }}
          aria-hidden="true"
        />

        {/* Paper wipe at end */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--paper)',
            y: phase.paperWipeY,
            zIndex: 20,
          }}
          aria-hidden="true"
        />

        {/* Section label */}
        <div style={{ position: 'absolute', top: 'calc(72px + 24px)', left: 'var(--grid-margin)', zIndex: 5 }}>
          <div className="scene-label" style={{ color: 'var(--muted)' }}>04 / DIGITAL → PHYSICAL</div>
          <h2 className="text-title" style={{
            fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
            fontWeight: 700,
            color: 'var(--paper)',
            marginTop: 8,
          }}>
            {transformContent.headline}
          </h2>
        </div>

        {/* Giant words */}
        {/* DIGITAL */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 1 }}>
          <motion.div style={{ x: phase.digitalX }} aria-hidden="true">
            <span className="text-giant" style={{ color: 'rgba(245,241,233,0.18)' }}>DIGITAL</span>
          </motion.div>
        </div>

        {/* PHYSICAL */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 1 }}>
          <motion.div style={{ x: phase.physicalX }} aria-hidden="true">
            <span className="text-giant" style={{ color: 'rgba(245,241,233,0.18)' }}>PHYSICAL</span>
          </motion.div>
        </div>

                {/* ── Central object composition (scaled ~20% larger) ─────── */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(240px, 46vw, 620px)',
          height: 'clamp(300px, 58vh, 720px)',
          zIndex: 3,
        }}>

          {/* 01 IDEA: Coordinate vertices and point-cloud dots matching enclosure mounting points */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: phase.dotsOpacity,
              zIndex: 2,
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 300 360" fill="none" aria-hidden="true">
              {[
                [150, 80], [258, 142], [150, 204], [42, 142],
                [150, 98], [234, 142], [150, 186], [66, 142],
                [42, 224], [150, 286], [258, 224],
                [18, 212], [282, 212]
              ].map(([cx, cy], idx) => (
                <circle key={idx} cx={cx} cy={cy} r="2.5" fill="var(--falcon-orange)" />
              ))}
              {/* Origin crosshair at CAD centroid */}
              <line x1="142" y1="142" x2="158" y2="142" stroke="var(--falcon-orange)" strokeWidth="1" />
              <line x1="150" y1="134" x2="150" y2="150" stroke="var(--falcon-orange)" strokeWidth="1" />
            </svg>
          </motion.div>

          {/* 02 MODEL: Wireframe layer matching master enclosure (A18) */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: phase.wireframeOpacity,
              zIndex: 3,
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 300 360" fill="none" aria-hidden="true">
              {/* Lid perimeter polygon */}
              <polygon
                points="150,80 258,142 150,204 42,142"
                stroke="rgba(243,107,22,0.85)"
                strokeWidth="1.4"
                fill="none"
              />
              {/* Inner lid chamfer */}
              <polygon
                points="150,96 240,142 150,188 60,142"
                stroke="rgba(243,107,22,0.5)"
                strokeWidth="1"
                fill="none"
              />
              {/* Recessed center plateau */}
              <polygon
                points="150,112 215,142 150,172 85,142"
                stroke="rgba(243,107,22,0.4)"
                strokeWidth="1"
                fill="none"
              />
              {/* 4 knurled brass insert bosses on top lid */}
              <ellipse cx="150" cy="98" rx="6" ry="3.5" stroke="var(--falcon-orange)" strokeWidth="1.2" />
              <ellipse cx="234" cy="142" rx="6" ry="3.5" stroke="var(--falcon-orange)" strokeWidth="1.2" />
              <ellipse cx="150" cy="186" rx="6" ry="3.5" stroke="var(--falcon-orange)" strokeWidth="1.2" />
              <ellipse cx="66" cy="142" rx="6" ry="3.5" stroke="var(--falcon-orange)" strokeWidth="1.2" />

              {/* Vertical corner edges */}
              <line x1="42" y1="142" x2="42" y2="224" stroke="rgba(243,107,22,0.7)" strokeWidth="1.2" />
              <line x1="150" y1="204" x2="150" y2="286" stroke="var(--falcon-orange)" strokeWidth="1.8" />
              <line x1="258" y1="142" x2="258" y2="224" stroke="rgba(243,107,22,0.7)" strokeWidth="1.2" />

              {/* Base bottom perimeter */}
              <line x1="42" y1="224" x2="150" y2="286" stroke="rgba(243,107,22,0.75)" strokeWidth="1.2" />
              <line x1="150" y1="286" x2="258" y2="224" stroke="rgba(243,107,22,0.75)" strokeWidth="1.2" />

              {/* Left mounting flange ear */}
              <polygon points="42,218 18,204 18,220 42,234" stroke="rgba(243,107,22,0.6)" strokeWidth="1" fill="none" />
              <ellipse cx="28" cy="212" rx="3" ry="2" stroke="var(--falcon-orange)" strokeWidth="1" />

              {/* Right mounting flange ear */}
              <polygon points="258,218 282,204 282,220 258,234" stroke="rgba(243,107,22,0.6)" strokeWidth="1" fill="none" />
              <ellipse cx="272" cy="212" rx="3" ry="2" stroke="var(--falcon-orange)" strokeWidth="1" />

              {/* Front-left ventilation louvers */}
              <line x1="75" y1="181" x2="125" y2="210" stroke="rgba(243,107,22,0.4)" strokeWidth="1" />
              <line x1="75" y1="195" x2="125" y2="224" stroke="rgba(243,107,22,0.4)" strokeWidth="1" />
              <line x1="75" y1="209" x2="125" y2="238" stroke="rgba(243,107,22,0.4)" strokeWidth="1" />

              {/* Front-right I/O port cutout */}
              <polygon points="175,218 225,189 225,207 175,236" stroke="rgba(243,107,22,0.4)" strokeWidth="1" fill="none" />

              {/* Technical bounding box */}
              <rect x="8" y="10" width="284" height="340" stroke="rgba(245,241,233,0.15)" strokeWidth="0.75" strokeDasharray="4 4" />
            </svg>
          </motion.div>

          {/* 03 BUILD: Layer bands (A27) */}
          <motion.div
            style={{ position: 'absolute', inset: 0, opacity: phase.layerBandsProgress, zIndex: 4 }}
          >
            <LayerBands
              width={300}
              height={360}
              visibleLayers={50}
              totalLayers={100}
              showActiveLine
            />
          </motion.div>

          {/* Toolpath (A26) */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}>
            <ToolPath
              width={300}
              height={360}
              progress={1}
              strokeWidth={0.75}
              showDot={false}
            />
          </div>

          {/* 04 OBJECT: Photo reveal — clip-path reveals from bottom (75–90%) */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: useTransform(phase.photoReveal, v => `inset(${v}% 0 0 0)`),
              zIndex: 6,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))',
              }}
              role="img"
              aria-label="Finished 3D printed physical electronics enclosure"
            >
              <Image
                src="/assets/transform/transform-physical.webp"
                alt="Finished 3D printed physical electronics enclosure with brass heat-set inserts"
                fill
                sizes="(max-width: 768px) 300px, 560px"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </motion.div>


          {/* Technical strata label */}
          <div style={{ position: 'absolute', bottom: -36, left: 0, zIndex: 7 }}>
            <ArtifactLabel text="LAYER VIEW · BUILD STRATA" variant="default" />
          </div>

          {/* Build envelope dimension guide */}
          <div style={{ position: 'absolute', right: -60, top: '50%', transform: 'translateY(-50%)', zIndex: 7 }}>
            <DimensionLine label="BUILD ENVELOPE" orientation="vertical" length={140} />
          </div>
        </div>

        {/* ── State labels (01–04) with active indicators ─────────── */}
        <div style={{ position: 'absolute', bottom: 44, left: 'var(--grid-margin)', right: 'var(--grid-margin)', display: 'flex', gap: 32, justifyContent: 'center', zIndex: 5 }}>
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

// ─── Reduced-motion: static 4-panel strip ─────────────────────────────────────
function TransformStaticVariant() {
  const panels = [
    { id: '01', label: 'DIGITAL', desc: 'Vertices & wireframe' },
    { id: '02', label: 'SLICED', desc: 'Layer bands & toolpath' },
    { id: '03', label: 'BUILD', desc: 'Layers stacking' },
    { id: '04', label: 'PHYSICAL', desc: 'Finished object' },
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
