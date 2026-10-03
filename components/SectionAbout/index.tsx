/**
 * About Section
 * Design source: design.md §10.7
 * Motion: M18
 *
 * "REAL." slides from behind the workshop photo.
 * Warm paper, portrait and workshop photos.
 * Owner naming requires confirmation.
 */

'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { ArtifactLabel } from '@/components/ArtifactLabel'
import { about } from '@/lib/content'

export function SectionAbout() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      id="about"
      aria-label="About Falcon 3D Prints"
      style={{ background: 'var(--paper-warm)', padding: '120px var(--grid-margin)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Giant word behind image (M18: REAL. slides from x -24vw → 0) */}
      <motion.div
        aria-hidden="true"
        initial={prefersReducedMotion ? false : { x: '-24vw', opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          right: '-8%',
          top: '15%',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0,
        }}
      >
        <span
          className="text-giant"
          style={{ fontSize: 'clamp(18vw, 22vw, 28vw)', opacity: 0.08 }}
        >
          {about.kinetic}
        </span>
      </motion.div>

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 64,
          alignItems: 'center',
        }}
      >
        {/* Left: text content */}
        <div>
          <div className="scene-label" style={{ marginBottom: 24 }}>ABOUT FALCON</div>

          <motion.h2
            className="text-title"
            style={{ fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)', fontWeight: 700, color: 'var(--ink)', marginBottom: 24 }}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {about.heading}
          </motion.h2>

          <motion.p
            style={{ color: 'var(--muted)', fontSize: 'var(--text-body-l)', lineHeight: 1.7, maxWidth: 460, marginBottom: 24 }}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {about.body}
          </motion.p>

          {/* Studio capability badge */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <ArtifactLabel
              text="NASHIK STUDIO · CUSTOM 3D FABRICATION"
              variant="default"
            />
          </motion.div>

          {/* Location */}
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1C4.8 1 3 2.8 3 5c0 3.3 4 8 4 8s4-4.7 4-8c0-2.2-1.8-4-4-4z" stroke="var(--falcon-orange)" strokeWidth="1.2" fill="none" />
              <circle cx="7" cy="5" r="1.2" fill="var(--falcon-orange)" />
            </svg>
            <span className="text-mono" style={{ color: 'var(--muted)' }}>
              NASHIK, MAHARASHTRA
            </span>
          </div>
        </div>

        {/* Right: workshop photo */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, rotate: -3, y: 40 }}
          whileInView={{ opacity: 1, rotate: 0, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative' }}
        >
          {/* Studio photograph container */}
          <div
            style={{
              aspectRatio: '4/3',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(17,17,17,0.12)',
              border: '1px solid var(--stone)',
              position: 'relative',
              maxWidth: 520,
            }}
            role="img"
            aria-label="3D printing equipment and physical prototype workshop setup"
          >
            <Image
              src="/assets/about/workshop-studio.webp"
              alt="3D printing equipment, toolpaths and physical prototypes"
              fill
              sizes="(max-width: 768px) 100vw, 520px"
              style={{ objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 2 }}>
              <span className="artifact-label" style={{ background: 'rgba(17,17,17,0.7)', color: 'var(--paper)', borderColor: 'rgba(245,241,233,0.2)' }}>
                EQUIPMENT & FABRICATION · DEMONSTRATOR
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
