/**
 * Footer
 * Design source: design.md §10.10, §23
 * Motion: M23
 *
 * "Ink block carries through from Scene F. Falcon Line draws.
 * Phoenix fragment (A36) at low opacity. Tagline, contact channels, Instagram."
 */

'use client'

import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { FalconLine } from '@/components/FalconLine'
import { footer, brand } from '@/lib/content'

export function Footer() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <footer
      style={{ background: 'var(--ink)', color: 'var(--paper)', padding: '80px var(--grid-margin) 40px', position: 'relative', overflow: 'hidden' }}
      aria-label="Site footer"
    >
      {/* Phoenix fragment (A36) — brand mark at low opacity */}
      <div
        style={{
          position: 'absolute',
          right: '-5%',
          bottom: '-10%',
          width: '45%',
          opacity: 0.04,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 200 200" fill="none">
          <polygon
            points="100,5 175,30 195,110 155,185 100,200 45,185 5,110 25,30"
            fill="var(--falcon-orange)"
          />
        </svg>
      </div>

      {/* Falcon Line draws on entry (M23) */}
      <motion.div
        style={{ marginBottom: 48 }}
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <FalconLine role="underline" width={80} height={4} progress={1} />
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, marginBottom: 64 }}>
        {/* Brand column */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Image
              src="/assets/brand/falcon-logo.svg"
              alt="Falcon 3D Prints"
              width={24}
              height={24}
            />
            <span style={{
              fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}>
              {brand.name}
            </span>
          </div>

          <p className="text-mono" style={{ color: 'rgba(245,241,233,0.45)', marginBottom: 16 }}>
            3D PRINTING · PROTOTYPING · CUSTOM DESIGNS
          </p>

          <p className="text-mono" style={{ color: 'rgba(245,241,233,0.35)' }}>
            NASHIK, MAHARASHTRA
          </p>
        </motion.div>

        {/* Eyebrow + headline */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-mono" style={{ color: 'rgba(245,241,233,0.45)', marginBottom: 12 }}>
            {footer.eyebrow}
          </p>
          <p style={{
            fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
            fontWeight: 700,
            fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
            letterSpacing: '-0.03em',
            color: 'var(--paper)',
            lineHeight: 1.1,
          }}>
            {footer.headline}
          </p>
        </motion.div>

        {/* Contact column */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-mono" style={{ color: 'rgba(245,241,233,0.45)', marginBottom: 16 }}>CONTACT</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a
              href={brand.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--falcon-orange)', fontFamily: 'var(--font-manrope)', fontSize: '0.875rem', textDecoration: 'none' }}
              aria-label="Chat on WhatsApp"
            >
              WhatsApp →
            </a>
            <a
              href={`tel:${brand.phoneE164}`}
              style={{ color: 'rgba(245,241,233,0.6)', fontFamily: 'var(--font-manrope)', fontSize: '0.875rem', textDecoration: 'none' }}
            >
              {brand.phone}
            </a>
            <a
              href={`mailto:${brand.email}`}
              style={{ color: 'rgba(245,241,233,0.6)', fontFamily: 'var(--font-manrope)', fontSize: '0.875rem', textDecoration: 'none' }}
            >
              {brand.email}
            </a>
            <a
              href={brand.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'rgba(245,241,233,0.6)', fontFamily: 'var(--font-manrope)', fontSize: '0.875rem', textDecoration: 'none' }}
            >
              {brand.instagramHandle}
            </a>
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: '1px solid rgba(245,241,233,0.1)',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <p className="text-mono" style={{ color: 'rgba(245,241,233,0.3)', fontSize: '0.5625rem' }}>
          {footer.copyright}
        </p>
        <p className="text-mono" style={{ color: 'rgba(245,241,233,0.3)', fontSize: '0.5rem' }}>
          FALCON 3D PRINTS · NASHIK, MAHARASHTRA · CRAFTED FOR THE PHYSICAL WORLD
        </p>
      </div>
    </footer>
  )
}
