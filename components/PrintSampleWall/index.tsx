/**
 * Print Sample Wall (M19, M20)
 * Design source: design.md §10.9
 *
 * "A horizontal drag strip of curated print images.
 * Items have depth (different sizes/rotations) and snap to nearest on release.
 * Ruler ticks (A32) translate with drag.
 * DRAG TO EXPLORE affordance fades on first interaction."
 *
 * Mobile: native swipe + scroll-snap, same scale effect.
 */

'use client'

import { useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, animate } from 'framer-motion'
import { ArtifactLabel } from '@/components/ArtifactLabel'
import { sampleWall, brand } from '@/lib/content'

interface SampleItem {
  id: string
  src: string
  alt: string
  title: string
  category: string
  width: number
  height: number
  rotation: number
}

const sampleItems: SampleItem[] = [
  {
    id: 'sample-1',
    src: '/assets/samples/sample-1.webp',
    alt: 'Functional 3D-printed electronics casing demonstrator',
    title: 'ENCLOSURE DEMO',
    category: 'PROTOTYPE HOUSING',
    width: 260,
    height: 300,
    rotation: -4,
  },
  {
    id: 'sample-2',
    src: '/assets/samples/sample-2.webp',
    alt: 'Parametric spiral ambient luminary demonstrator',
    title: 'SPIRAL LUMINARY',
    category: 'CUSTOM DESIGN',
    width: 230,
    height: 330,
    rotation: 2.5,
  },
  {
    id: 'sample-3',
    src: '/assets/samples/sample-3.webp',
    alt: 'Articulated robotic gripper mechanism demonstrator',
    title: 'ROBOTIC GRIPPER',
    category: 'MECHANICAL DEMO',
    width: 290,
    height: 270,
    rotation: -2,
  },
  {
    id: 'sample-4',
    src: '/assets/samples/sample-4.webp',
    alt: 'Cantilevered pavilion roof concept model study',
    title: 'PAVILION STUDY',
    category: 'SCALE MODEL',
    width: 270,
    height: 320,
    rotation: 3.5,
  },
  {
    id: 'sample-5',
    src: '/assets/samples/sample-5.webp',
    alt: '2-axis mounting bracket prototype demonstrator',
    title: 'MOUNTING BRACKET',
    category: 'PROTOTYPE JIG',
    width: 240,
    height: 290,
    rotation: -5,
  },
  {
    id: 'sample-6',
    src: '/assets/samples/sample-6.webp',
    alt: 'Geometric test artifact node demonstrator',
    title: 'TEST GEOMETRY',
    category: 'GEOMETRIC DEMO',
    width: 250,
    height: 290,
    rotation: 1.5,
  },
  {
    id: 'sample-7',
    src: '/assets/samples/sample-7.webp',
    alt: 'Parametric acoustic wave vessel demonstrator in warm cream',
    title: 'ACOUSTIC VESSEL',
    category: 'CUSTOM OBJECT',
    width: 240,
    height: 320,
    rotation: -3,
  },
]

const CARD_GAP = 32
const totalWidth = sampleItems.reduce((sum, item) => sum + item.width + CARD_GAP, 0)

export function PrintSampleWall() {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const x = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 170, damping: 22 })

  // Snap to nearest card on drag end
  const handleDragEnd = useCallback(() => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.offsetWidth
    const currentX = x.get()

    // Find nearest card snap point
    let offset = 0
    let bestDist = Infinity
    let bestIndex = 0

    sampleItems.forEach((item, i) => {
      const cardCenter = offset + item.width / 2
      const snapX = containerWidth / 2 - cardCenter
      const dist = Math.abs(snapX - currentX)
      if (dist < bestDist) {
        bestDist = dist
        bestIndex = i
        offset += item.width + CARD_GAP
      } else {
        offset += item.width + CARD_GAP
      }
    })

    // Calculate snap target
    let snapOffset = 0
    for (let i = 0; i < bestIndex; i++) {
      snapOffset += sampleItems[i].width + CARD_GAP
    }
    const snapX = containerWidth / 2 - snapOffset - sampleItems[bestIndex].width / 2

    // Clamp to bounds
    const maxX = 0
    const minX = containerWidth - totalWidth
    const clampedX = Math.max(minX, Math.min(maxX, snapX))

    animate(x, clampedX, { type: 'spring', stiffness: 170, damping: 22, mass: 1 })
    setActiveIndex(bestIndex)
  }, [x])

  if (prefersReducedMotion) {
    return <SampleWallStaticVariant />
  }

  return (
    <section
      id="samples"
      aria-label="Print samples gallery"
      style={{ background: 'var(--paper-warm)', paddingTop: 80, paddingBottom: 80, overflow: 'hidden', position: 'relative' }}
    >
      {/* Header */}
      <div
        style={{ paddingInline: 'var(--grid-margin)', marginBottom: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}
      >
        <div>
          <div className="scene-label" style={{ marginBottom: 8 }}>EXPLORE SAMPLES</div>
          <h2
            className="text-title"
            style={{ fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)', fontWeight: 700 }}
          >
            {sampleWall.heading}
          </h2>
        </div>

        <a
          href={brand.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          onClick={() => {/* analytics: instagram_click */}}
        >
          {sampleWall.instagramCta}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      {/* Ruler ticks (A32) */}
      <div style={{ paddingInline: 'var(--grid-margin)', marginBottom: 16, overflowX: 'hidden' }}>
        <motion.div style={{ x: useTransform(springX, v => v * 0.5) }} aria-hidden="true">
          <svg height={12} width={2000} viewBox="0 0 2000 12" fill="none">
            {Array.from({ length: 80 }).map((_, i) => (
              <line
                key={i}
                x1={i * 25}
                y1={i % 4 === 0 ? 0 : 4}
                x2={i * 25}
                y2={12}
                stroke="var(--stone)"
                strokeWidth="0.75"
              />
            ))}
          </svg>
        </motion.div>
      </div>

      {/* Drag strip */}
      <div ref={containerRef} style={{ position: 'relative', cursor: 'grab' }}>
        <motion.div
          style={{
            display: 'flex',
            gap: CARD_GAP,
            alignItems: 'flex-end',
            padding: '16px var(--grid-margin) 48px',
            x: springX,
            cursor: 'grab',
          }}
          drag="x"
          dragMomentum={true}
          dragElastic={0.15}
          onDragStart={() => setHasInteracted(true)}
          onDragEnd={handleDragEnd}
          aria-label="Drag to explore samples"
        >
          {sampleItems.map((item, i) => {
            const distFromCenter = Math.abs(i - activeIndex)
            const cardScale = i === activeIndex ? 1.12 : Math.max(0.82, 1 - distFromCenter * 0.09)
            const cardRotation = i === activeIndex ? 0 : item.rotation

            return (
              <motion.div
                key={item.id}
                style={{
                  flexShrink: 0,
                  width: item.width,
                  height: item.height,
                }}
                animate={{
                  scale: cardScale,
                  rotate: cardRotation,
                }}
                transition={{ type: 'spring', stiffness: 170, damping: 22 }}
                initial={{ x: 60, opacity: 0, rotate: item.rotation }}
                whileInView={{ x: 0, opacity: 1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                {/* Physical Card */}
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'var(--stone-light)',
                    border: '1px solid var(--stone)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    position: 'relative',
                    boxShadow: '0 16px 32px rgba(17,17,17,0.12)',
                  }}
                  role="img"
                  aria-label={item.alt}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 768px) 70vw, 300px"
                    style={{ objectFit: 'cover' }}
                  />

                  {/* Gradient shadow for text legibility */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(to top, rgba(17,17,17,0.75) 0%, rgba(17,17,17,0.2) 40%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                    aria-hidden="true"
                  />

                  {/* Metadata overlay */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        color: 'var(--paper)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {item.title}
                    </span>
                    <div>
                      <ArtifactLabel text={item.category} variant="orange" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* DRAG affordance */}
      {!hasInteracted && (
        <motion.div
          style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)' }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          aria-hidden="true"
        >
          <span className="text-mono" style={{ color: 'var(--muted)' }}>
            {sampleWall.dragAffordance}
          </span>
        </motion.div>
      )}
    </section>
  )
}

// ─── Reduced-motion: simple scrollable strip ───────────────────────────────────
function SampleWallStaticVariant() {
  return (
    <section id="samples" style={{ background: 'var(--paper-warm)', padding: '80px 0' }}>
      <div style={{ paddingInline: 'var(--grid-margin)', marginBottom: 32 }}>
        <div className="scene-label" style={{ marginBottom: 8 }}>OUR PRINTS</div>
        <h2 className="text-title" style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700 }}>{sampleWall.heading}</h2>
      </div>
      <div style={{ display: 'flex', overflowX: 'auto', gap: 24, padding: '0 var(--grid-margin) 24px', scrollSnapType: 'x mandatory' }}>
        {sampleItems.map((item) => (
          <div key={item.id} style={{ flexShrink: 0, width: item.width, height: item.height, scrollSnapAlign: 'center', background: 'var(--stone-light)', border: '1px solid var(--stone)', borderRadius: 'var(--radius-md)', overflow: 'hidden', position: 'relative' }}>
            <Image src={item.src} alt={item.alt} fill sizes="300px" style={{ objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </section>
  )
}
