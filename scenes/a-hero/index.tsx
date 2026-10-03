/**
 * Scene A — Idea to Object (Hero)
 * Design source: design.md §9, §10.2, §17.1
 * Motion registry: M01–M08
 * Artifacts: A01, A02, A03, A04, A05, A06, A07, A08, A09, A10, A11, A15, A16
 *
 * Pinned 250vh desktop / 170vh mobile
 *
 * Storyboard (§17.1):
 * 0%    MAKE / IT / PHYSICAL. visible; object small-ish, rotated -4°
 * 15%   Object approaches; PHYSICAL. begins sliding left
 * 30%   PHYSICAL. passes behind object; IDEA enters from right
 * 45%   IDEA scales to 1.8 across viewport; object rotateY
 * 60%   IDEA collapses into OBJECT; bg shifts to warm paper
 * 80%   OBJECT clips upward; object moves -12vh; orange line extends
 * 100%  Print Lab grid drawn in; object lands as Lab centrepiece
 */

'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from 'framer-motion'
import { GiantWord } from '@/components/GiantWord'
import { ArtifactLabel } from '@/components/ArtifactLabel'
import { RegMarks } from '@/components/RegMarks'
import { Crosshair } from '@/components/Crosshair'
import { DimensionLine } from '@/components/DimensionLine'
import { FalconLine } from '@/components/FalconLine'
import { LayerLineStrip } from '@/components/GridPlane'
import { hero, brand } from '@/lib/content'

// ─── Load animation state ─────────────────────────────────────────────────────
type LoadPhase = 'idle' | 'bg' | 'type' | 'object' | 'fragments' | 'annotations' | 'ctas'

// ─── Scroll word state ────────────────────────────────────────────────────────
type ScrollWord = 'PHYSICAL' | 'IDEA' | 'OBJECT'

export function SceneHero() {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const [loadPhase, setLoadPhase] = useState<LoadPhase>('idle')
  const [scrollWord, setScrollWord] = useState<ScrollWord>('PHYSICAL')

  // Pointer spring values (M07)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const objectX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-16, 16]), { stiffness: 120, damping: 18 })
  const objectY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 18 })
  const objectRotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 120, damping: 18 })
  const fragmentsX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-24, 24]), { stiffness: 110, damping: 16 })
  const fragmentsY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-16, 16]), { stiffness: 110, damping: 16 })
  const bgWordX = useSpring(useTransform(mouseX, [-0.5, 0.5], [6, -6]), { stiffness: 80, damping: 20 })

  // Scroll progress for pinned scene (M08)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const bgColor = useTransform(scrollYProgress, [0, 0.6], ['#F5F1E9', '#F2E6DA'])
  const objectScale = useTransform(scrollYProgress, [0, 0.15, 0.6, 0.8], [1, 1.08, 1.15, 0.9])
  const objectRotateYScroll = useTransform(scrollYProgress, [0, 0.45, 0.6, 0.8], [0, 12, 24, 24])
  const objectYScroll = useTransform(scrollYProgress, [0.6, 1.0], ['0vh', '-12vh'])

  // Scroll word transitions
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (v) => {
      if (v < 0.3) setScrollWord('PHYSICAL')
      else if (v < 0.6) setScrollWord('IDEA')
      else setScrollWord('OBJECT')
    })
    return unsubscribe
  }, [scrollYProgress])

  // ── Load choreography (§9.2) ─────────────────────────────────────────────
  useEffect(() => {
    if (prefersReducedMotion) {
      setLoadPhase('ctas')
      return
    }

    const sequence = [
      [0, 'bg'],
      [200, 'type'],
      [300, 'object'],
      [500, 'fragments'],
      [700, 'annotations'],
      [900, 'ctas'],
    ] as [number, LoadPhase][]

    const timers = sequence.map(([delay, phase]) =>
      setTimeout(() => setLoadPhase(phase), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [prefersReducedMotion])

  // ── Pointer tracking (M07) — desktop only ───────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  // ── Reduced motion: show final composition immediately ──────────────────
  if (prefersReducedMotion) {
    return <HeroStaticVariant />
  }

  return (
    <>
      {/* Pinned scene container — 250vh tall */}
      <section
        id="hero"
        ref={containerRef}
        style={{ height: 'var(--scene-hero)', position: 'relative' }}
        aria-label="Hero: Make it physical"
      >
        {/* Sticky stage — stays in view during scroll */}
        <motion.div
          ref={stageRef}
          className="scene-stage bg-paper"
          style={{ backgroundColor: bgColor }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* ── Print-bed grid (A04) ─────────────────────────────────────── */}
          <motion.div
            className="print-bed-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: loadPhase !== 'idle' ? 0.05 : 0 }}
            transition={{ duration: 0.3 }}
            aria-hidden="true"
          />

          {/* ── Giant scroll word (A03) — Z-0, aria-hidden ──────────────── */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 0,
              overflow: 'hidden',
            }}
          >
            <motion.div style={{ x: bgWordX }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={scrollWord}
                  initial={{ opacity: 0, x: scrollWord === 'IDEA' ? '40vw' : scrollWord === 'OBJECT' ? '40vw' : '-120vw' }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: scrollWord === 'PHYSICAL' ? '-120vw' : '-20vw' }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  aria-hidden="true"
                >
                  <span
                    className="text-giant"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      letterSpacing: scrollWord === 'IDEA'
                        ? 'clamp(-0.045em, -0.03em, -0.02em)'
                        : '-0.045em',
                    }}
                  >
                    {scrollWord}
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* ── Main typographic composition (Z-3) ──────────────────────── */}
          {/* design.md §9.1: MAKE / IT / PHYSICAL. (h1 in DOM, scroll words decorative) */}
          <div
            style={{
              position: 'absolute',
              top: '14%',
              left: 'var(--grid-margin)',
              right: 'var(--grid-margin)',
              zIndex: 3,
              maxWidth: 'var(--grid-max)',
              margin: '0 auto',
            }}
          >
            {/* h1 — accessible, single */}
            <h1 className="sr-only">{hero.h1}</h1>

            {/* Visual type — decorative, masks in */}
            {['MAKE', 'IT', 'PHYSICAL.'].map((word, i) => (
              <div key={word} style={{ overflow: 'hidden', lineHeight: 0.95 }}>
                <motion.div
                  className="text-display-hero"
                  style={{
                    fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                    color: 'var(--ink)',
                    display: 'block',
                    // IT is smaller and offset
                    fontSize: word === 'IT'
                      ? 'clamp(2rem, 4vw, 5rem)'
                      : 'var(--text-display-hero)',
                    paddingLeft: word === 'IT' ? '32%' : 0,
                  }}
                  initial={{ clipPath: 'inset(0 0 100% 0)', y: 24 }}
                  animate={{
                    clipPath: loadPhase !== 'idle' && loadPhase !== 'bg'
                      ? 'inset(0 0 0% 0)'
                      : 'inset(0 0 100% 0)',
                    y: loadPhase !== 'idle' && loadPhase !== 'bg' ? 0 : 24,
                  }}
                  transition={{
                    duration: 0.7,
                    delay: 0.2 + i * 0.09,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  aria-hidden="true"
                >
                  {word}
                </motion.div>
              </div>
            ))}
          </div>

          {/* ── Hero object (A01) — Z-2 ─────────────────────────────────── */}
          {/* ASSET REQUIRED: transparent PNG/WebP cut-out of best Falcon print */}
          <motion.div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              translateX: '-50%',
              translateY: '-50%',
              zIndex: 2,
              x: objectX,
              y: objectY,
              scale: objectScale,
              rotateY: prefersReducedMotion ? 0 : objectRotateYScroll,
            }}
            initial={{ y: '80px', rotateY: -8, opacity: 0 }}
            animate={{
              y: loadPhase === 'object' || loadPhase === 'fragments' || loadPhase === 'annotations' || loadPhase === 'ctas'
                ? '0px' : '80px',
              rotateY: loadPhase !== 'idle' && loadPhase !== 'bg' && loadPhase !== 'type' ? 0 : -8,
              opacity: loadPhase !== 'idle' && loadPhase !== 'bg' && loadPhase !== 'type' ? 1 : 0,
            }}
            transition={{ type: 'spring', stiffness: 150, damping: 18, mass: 1 }}
          >
            {/* Hero 3D print flagship object — Master custom electronics enclosure */}
            <div
              style={{
                width: 'clamp(280px, 48vw, 620px)',
                height: 'clamp(240px, 48vh, 520px)',
                position: 'relative',
              }}
              aria-label="Falcon 3D Prints custom electronics enclosure prototype"
              role="img"
            >
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  filter: 'drop-shadow(0 24px 36px rgba(17,17,17,0.18))',
                  transition: 'transform 0.3s ease-out',
                }}
              >
                <Image
                  src="/assets/falcon/artifacts/hero-object-new.webp?v=3"
                  alt="Falcon 3D Prints custom mechanical prototype"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 768px) 320px, 620px"
                  style={{ objectFit: 'contain' }}
                />
              </div>

              {/* Crosshair (A09) */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}>
                <Crosshair size={64} gapSize={24} visible={loadPhase === 'annotations' || loadPhase === 'ctas'} />
              </div>

              {/* Registration marks (A07) */}
              <RegMarks armLength={12} inset={4} animated delay={0.7} />

              {/* Falcon Line accent at base (A05) */}
              <div style={{ position: 'absolute', bottom: -8, left: '20%', right: '20%' }}>
                <FalconLine
                  role="accent"
                  width={200}
                  height={4}
                  progress={loadPhase === 'annotations' || loadPhase === 'ctas' ? 1 : 0}
                />
              </div>

              {/* Contact shadow (A06) */}
              <div
                style={{
                  position: 'absolute',
                  bottom: -20,
                  left: '8%',
                  right: '8%',
                  height: 28,
                  background: 'radial-gradient(ellipse at center, rgba(17,17,17,0.3) 0%, transparent 72%)',
                  filter: 'blur(10px)',
                  zIndex: -1,
                }}
                aria-hidden="true"
              />
            </div>
          </motion.div>

          {/* ── Hero fragments (A02) — Z-3 ──────────────────────────────── */}
          <motion.div
            style={{ x: fragmentsX, y: fragmentsY }}
            animate={{ opacity: loadPhase === 'fragments' || loadPhase === 'annotations' || loadPhase === 'ctas' ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Fragment 1 — top right */}
            <motion.div
              style={{ position: 'absolute', top: '14%', right: '8%', zIndex: 3 }}
              initial={{ x: 140, rotateZ: 12, opacity: 0 }}
              animate={{
                x: loadPhase === 'fragments' || loadPhase === 'annotations' || loadPhase === 'ctas' ? 0 : 140,
                rotateZ: loadPhase === 'fragments' || loadPhase === 'annotations' || loadPhase === 'ctas' ? 3 : 12,
                opacity: loadPhase === 'fragments' || loadPhase === 'annotations' || loadPhase === 'ctas' ? 1 : 0,
              }}
              transition={{ type: 'spring', stiffness: 110, damping: 16, delay: 0 }}
              aria-hidden="true"
            >
              <div
                style={{
                  width: 'clamp(80px, 10vw, 110px)',
                  height: 'clamp(80px, 10vw, 110px)',
                  position: 'relative',
                  filter: 'drop-shadow(0 12px 20px rgba(17,17,17,0.15))',
                }}
              >
                <Image
                  src="/assets/hero/hero-fragment-01.webp"
                  alt="3D printed precision bracket fragment"
                  fill
                  sizes="110px"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </motion.div>

            {/* Fragment 2 — bottom left */}
            <motion.div
              style={{ position: 'absolute', bottom: '20%', left: '6%', zIndex: 3 }}
              initial={{ x: -140, rotateZ: -12, opacity: 0 }}
              animate={{
                x: loadPhase === 'fragments' || loadPhase === 'annotations' || loadPhase === 'ctas' ? 0 : -140,
                rotateZ: loadPhase === 'fragments' || loadPhase === 'annotations' || loadPhase === 'ctas' ? -4 : -12,
                opacity: loadPhase === 'fragments' || loadPhase === 'annotations' || loadPhase === 'ctas' ? 1 : 0,
              }}
              transition={{ type: 'spring', stiffness: 110, damping: 16, delay: 0.12 }}
              aria-hidden="true"
            >
              <div
                style={{
                  width: 'clamp(72px, 9vw, 96px)',
                  height: 'clamp(72px, 9vw, 96px)',
                  position: 'relative',
                  filter: 'drop-shadow(0 12px 20px rgba(17,17,17,0.15))',
                }}
              >
                <Image
                  src="/assets/hero/hero-fragment-02.webp"
                  alt="3D printed honeycomb calibration node fragment"
                  fill
                  sizes="96px"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </motion.div>
          </motion.div>

          {/* ── Technical annotations (A10, A11, A15, A16) — Z-3 ────────── */}
          <motion.div
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}
            animate={{ opacity: loadPhase === 'annotations' || loadPhase === 'ctas' ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Coordinate alignment label (A11) — top right area */}
            <div style={{ position: 'absolute', top: '20%', right: 'calc(var(--grid-margin) + 4px)' }}>
              <ArtifactLabel
                text="CUSTOM OBJECT · 3D MODEL"
                variant="default"
                connector="left"
                connectorLength={32}
              />
            </div>

            {/* Scale guide (A10) — below object */}
            <div style={{ position: 'absolute', bottom: '26%', left: '50%', transform: 'translateX(-50%)' }}>
              <DimensionLine
                label="SCALE GUIDE"
                orientation="horizontal"
                length={120}
                animated
                delay={0.8}
              />
            </div>

            {/* Label pill (A15) — beside object */}
            <div style={{ position: 'absolute', top: '42%', right: '12%' }}>
              <ArtifactLabel text="CUSTOM PRINT" variant="orange" animated delay={0.9} />
            </div>

            {/* Label pill — left side */}
            <div style={{ position: 'absolute', top: '60%', left: '8%' }}>
              <ArtifactLabel text="NASHIK" variant="default" animated delay={1.0} />
            </div>

            {/* Layer-line strip (A08) — at object base */}
            <div style={{ position: 'absolute', bottom: '22%', left: '50%', transform: 'translateX(-50%)' }}>
              <LayerLineStrip lineCount={6} width={180} height={18} color="var(--stone)" animated />
            </div>
          </motion.div>

          {/* ── Hero text content — supporting line and CTAs (Z-3) ─────── */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: '10%',
              left: 'var(--grid-margin)',
              right: 'var(--grid-margin)',
              zIndex: 4,
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{
              opacity: loadPhase === 'ctas' ? 1 : 0,
              y: loadPhase === 'ctas' ? 0 : 24,
            }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Supporting line */}
            <p
              style={{
                fontFamily: 'var(--font-manrope, "Manrope", sans-serif)',
                fontSize: 'var(--text-body-l)',
                color: 'var(--muted)',
                marginBottom: 28,
                maxWidth: 420,
              }}
            >
              {hero.supportLine}
            </p>

            {/* CTA group */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              <a
                href="#contact"
                className="btn-primary"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {hero.ctaPrimary}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>

              <a
                href="#wall"
                className="btn-secondary"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('wall')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {hero.ctaSecondary}
              </a>
            </div>
          </motion.div>

          {/* ── Scroll affordance ────────────────────────────────────────── */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: 32,
              right: 'var(--grid-margin)',
              zIndex: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
            animate={{ opacity: loadPhase === 'ctas' ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            aria-hidden="true"
          >
            <span className="text-mono" style={{ color: 'var(--muted)' }}>
              {hero.scrollAffordance}
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
                <path d="M6 1v14M1 10l5 5 5-5" stroke="var(--falcon-orange)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
    </>
  )
}

// ─── Reduced-motion static variant ────────────────────────────────────────────
// design.md §10.2: "Reduced-motion fallback: final composition shown immediately,
// no pin; PHYSICAL. headline static; next section follows normally."

function HeroStaticVariant() {
  return (
    <section
      id="hero"
      style={{
        minHeight: '100vh',
        background: 'var(--paper)',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '120px 0 60px',
      }}
      aria-label="Hero: Make it physical"
    >
      {/* Print-bed grid */}
      <div className="print-bed-grid" aria-hidden="true" />

      {/* Giant word — final state */}
      <span
        className="text-giant"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        PHYSICAL
      </span>

      <div className="container" style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', alignItems: 'center' }}>
        <div>
          <h1 className="text-display-hero" style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: 32, maxWidth: '10ch' }}>
            Make it physical.
          </h1>
          <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 'var(--text-body-l)', color: 'var(--muted)', marginBottom: 32, maxWidth: 420 }}>
            Custom 3D printing, prototyping &amp; design from Nashik.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <a href="#contact" className="btn-primary">START A CUSTOM PRINT</a>
            <a href="#wall" className="btn-secondary">VIEW OUR WORK</a>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 'clamp(260px, 45vh, 460px)',
            filter: 'drop-shadow(0 24px 36px rgba(17,17,17,0.18))',
          }}
          aria-label="Falcon 3D Prints custom mechanical prototype"
          role="img"
        >
          <Image
            src="/assets/falcon/artifacts/hero-object-new.webp?v=3"
            alt="Falcon 3D Prints custom mechanical prototype"
            fill
            priority
            unoptimized
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>
    </section>
  )
}
