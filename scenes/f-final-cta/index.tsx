/**
 * Scene F — Final CTA (Have something in mind?)
 * Design source: design.md §10.8, §17.5, §24
 * Motion registry: M21, M22
 * Artifacts: A05, A07, A09
 *
 * Storyboard (§17.5):
 * 0%    Sample wall exits (shear upward)
 * 20%   Items converge; toolpath traces under headline
 * 40%   Headline "Have something in mind?" assembles word by word
 * 60%   Ink block rises (y 100vh→0); fields stagger in
 * 75%   Toolpath resolves into underline beneath START A CUSTOM PRINT
 * 100%  Form visible; WhatsApp/call/email alongside
 */

'use client'

import { useRef, useState } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion'
import { RegMarks } from '@/components/RegMarks'
import { ArtifactLabel } from '@/components/ArtifactLabel'
import { FalconLine } from '@/components/FalconLine'
import { finalCta, brand, microcopy } from '@/lib/content'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export function SceneFinalCTA() {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')
  const [formStarted, setFormStarted] = useState(false)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const inkBlockY = useTransform(scrollYProgress, [0.2, 0.5], ['100vh', '0vh'])
  const headlineOpacity = useTransform(scrollYProgress, [0.1, 0.35], [0, 1])
  const toolpathProgress = useTransform(scrollYProgress, [0.3, 0.6], [0, 1])

  const handleFormStart = () => {
    if (!formStarted) {
      setFormStarted(true)
      // Analytics: form_start
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormStatus('submitting')

    // TODO: [CONFIRM FORM DELIVERY] — integrate with form backend
    // Currently shows success state after simulated delay
    setTimeout(() => {
      setFormStatus('success')
    }, 1200)
  }

  if (prefersReducedMotion) {
    return <FinalCTAStaticVariant />
  }

  return (
    <section
      id="contact"
      ref={containerRef}
      aria-label="Contact: Have something in mind?"
      style={{ position: 'relative', background: 'var(--paper)', overflow: 'hidden' }}
    >
      {/* ── Top half: headline + toolpath ──────────────────────────── */}
      <div
        style={{
          padding: '140px var(--grid-margin) 80px',
          position: 'relative',
          minHeight: '50vh',
        }}
      >
        {/* Registration marks (A07) */}
        <RegMarks armLength={14} inset={20} animated delay={0.3} />

        {/* Section label */}
        <div className="scene-label" style={{ marginBottom: 24 }}>06 / START A PRINT</div>

        {/* Headline — assembles word by word */}
        <motion.div style={{ opacity: headlineOpacity }}>
          <h2
            style={{
              fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
              fontWeight: 700,
              fontSize: 'var(--text-display-section)',
              letterSpacing: '-0.04em',
              lineHeight: 0.95,
              color: 'var(--ink)',
              marginBottom: 32,
              maxWidth: '16ch',
            }}
          >
            {finalCta.heading}
          </h2>
        </motion.div>

        {/* Supporting copy */}
        <motion.p
          style={{
            color: 'var(--muted)',
            fontSize: 'var(--text-body-l)',
            lineHeight: 1.6,
            maxWidth: 460,
            marginBottom: 40,
          }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {finalCta.supportingCopy}
        </motion.p>

        {/* WhatsApp + call + email — low friction channels */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 40 }}>
          <motion.a
            href={brand.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
            onClick={() => {/* analytics: whatsapp_click */}}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            aria-label="Chat on WhatsApp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            {finalCta.ctaWhatsapp}
          </motion.a>

          <motion.a
            href={`tel:${brand.phoneE164}`}
            className="btn-whatsapp"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            aria-label={`Call ${brand.phone}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            CALL US
          </motion.a>

          <motion.a
            href={`mailto:${brand.email}`}
            className="btn-whatsapp"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 8l9 6 9-6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            EMAIL
          </motion.a>
        </div>

        {/* Toolpath into underline (A05) */}
        <div style={{ marginBottom: 8 }} aria-hidden="true">
          <FalconLine role="underline" width={280} height={4} progress={1} />
        </div>
        <ArtifactLabel text={microcopy.readyToPrint} variant="orange" />
      </div>

      {/* ── Ink block + form ──────────────────────────────────────── */}
      <motion.div
        style={{
          background: 'var(--ink)',
          padding: '80px var(--grid-margin)',
          y: prefersReducedMotion ? 0 : inkBlockY,
          position: 'relative',
          overflow: 'hidden',
        }}
        aria-label="Contact form"
      >
        {/* Registration marks (A07) — dark surface */}
        <RegMarks armLength={14} inset={20} color="rgba(245,241,233,0.2)" />

        {/* Subtle technical wireframe silhouette & coordinate continuity */}
        <div
          style={{
            position: 'absolute',
            right: 'var(--grid-margin)',
            bottom: 40,
            opacity: 0.09,
            pointerEvents: 'none',
            zIndex: 0,
          }}
          aria-hidden="true"
        >
          <svg width="220" height="240" viewBox="0 0 180 200" fill="none">
            <polygon points="90,10 160,100 90,190 20,100" stroke="var(--falcon-orange)" strokeWidth="1" />
            <line x1="90" y1="10" x2="90" y2="190" stroke="var(--falcon-orange)" strokeWidth="1" />
            <line x1="20" y1="100" x2="160" y2="100" stroke="rgba(243,107,22,0.6)" strokeWidth="0.75" />
            <polygon points="90,60 125,100 90,140 55,100" stroke="var(--falcon-orange)" strokeWidth="0.75" />
          </svg>
        </div>

        <div style={{ maxWidth: 560, position: 'relative', zIndex: 1 }}>
          {/* Subtle FalconLine accent */}
          <div style={{ marginBottom: 16 }} aria-hidden="true">
            <FalconLine role="accent" width={160} height={2} progress={1} color="var(--falcon-orange)" />
          </div>

          {/* Coordinate mark */}
          <div className="text-mono" style={{ color: 'var(--falcon-orange)', fontSize: '0.625rem', letterSpacing: '0.12em', opacity: 0.8, marginBottom: 12 }}>
            + STUDIO SPEC [ NASHIK · 20.00° N, 73.78° E ]
          </div>

          <h3 style={{
            fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
            fontWeight: 700,
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            letterSpacing: '-0.03em',
            color: 'var(--paper)',
            marginBottom: 36,
          }}>
            Start a custom print.
          </h3>

          <AnimatePresence mode="wait">
            {formStatus === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: 'center', paddingBlock: 40 }}
              >
                <div style={{ marginBottom: 16 }}>
                  <ArtifactLabel text={microcopy.received} variant="orange" />
                </div>
                <p style={{ color: 'var(--paper)', fontSize: 'var(--text-body-l)', lineHeight: 1.6 }}>
                  {finalCta.successMessage}
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                noValidate
                aria-label="Custom print enquiry form"
              >
                {/* Direct inquiry note */}
                <div className="artifact-label" style={{ marginBottom: 32, opacity: 0.7, fontSize: '0.55rem' }}>
                  DIRECT STUDIO INQUIRY · NASHIK
                </div>

                {[
                  { label: 'Name', required: true, type: 'text' },
                  { label: 'Phone / WhatsApp / Email', required: true, type: 'text' },
                  { label: 'What do you want to make?', required: true, type: 'textarea' },
                ].map((field, i) => {
                  const fieldId = `cta-${field.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                  return (
                    <motion.div
                      key={field.label}
                      className="form-field"
                      style={{ marginBottom: 28 }}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <label
                        className="form-label"
                        htmlFor={fieldId}
                        style={{ color: 'rgba(245,241,233,0.5)' }}
                      >
                        {field.label}
                        {field.required && <span aria-label="required"> *</span>}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          id={fieldId}
                          rows={3}
                          required={field.required}
                          onFocus={handleFormStart}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid rgba(245,241,233,0.25)',
                            color: 'var(--paper)',
                            fontFamily: 'var(--font-manrope, "Manrope", sans-serif)',
                            fontSize: '1rem',
                            padding: '12px 0',
                            width: '100%',
                            outline: 'none',
                            resize: 'none',
                          }}
                          aria-required={field.required}
                        />
                      ) : (
                        <input
                          id={fieldId}
                          type="text"
                          required={field.required}
                          onFocus={handleFormStart}
                          className="form-input"
                          style={{
                            color: 'var(--paper)',
                            borderBottomColor: 'rgba(245,241,233,0.25)',
                          }}
                          aria-required={field.required}
                        />
                      )}
                    </motion.div>
                  )
                })}

                {/* Submit */}
                <motion.button
                  type="submit"
                  className="btn-primary"
                  disabled={formStatus === 'submitting'}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    marginTop: 16,
                    opacity: formStatus === 'submitting' ? 0.7 : 1,
                  }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {formStatus === 'submitting' ? 'SENDING...' : finalCta.submitLabel}
                  {formStatus !== 'submitting' && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  )
}

// ─── Reduced-motion static variant ────────────────────────────────────────────
function FinalCTAStaticVariant() {
  const [formStatus, setFormStatus] = useState<FormStatus>('idle')

  return (
    <section id="contact" style={{ background: 'var(--paper)' }}>
      <div style={{ padding: '120px var(--grid-margin) 80px' }}>
        <div className="scene-label" style={{ marginBottom: 24 }}>06 / START A PRINT</div>
        <h2 style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, fontSize: 'var(--text-display-section)', letterSpacing: '-0.04em', lineHeight: 0.95, marginBottom: 24 }}>
          {finalCta.heading}
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 'var(--text-body-l)', marginBottom: 32 }}>
          {finalCta.supportingCopy}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <a href={brand.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">CHAT ON WHATSAPP</a>
          <a href={`tel:${brand.phoneE164}`} className="btn-whatsapp">CALL US</a>
        </div>
      </div>
      <div style={{ background: 'var(--ink)', padding: '80px var(--grid-margin)' }}>
        <form aria-label="Contact form" noValidate>
          <div className="form-field" style={{ marginBottom: 28 }}>
            <label className="form-label" htmlFor="rm-name" style={{ color: 'rgba(245,241,233,0.5)' }}>Name *</label>
            <input id="rm-name" type="text" className="form-input" style={{ color: 'var(--paper)', borderBottomColor: 'rgba(245,241,233,0.25)' }} />
          </div>
          <div className="form-field" style={{ marginBottom: 28 }}>
            <label className="form-label" htmlFor="rm-contact" style={{ color: 'rgba(245,241,233,0.5)' }}>Phone or Email *</label>
            <input id="rm-contact" type="text" className="form-input" style={{ color: 'var(--paper)', borderBottomColor: 'rgba(245,241,233,0.25)' }} />
          </div>
          <div className="form-field" style={{ marginBottom: 28 }}>
            <label className="form-label" htmlFor="rm-idea" style={{ color: 'rgba(245,241,233,0.5)' }}>What do you want to make? *</label>
            <textarea id="rm-idea" rows={3} style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(245,241,233,0.25)', color: 'var(--paper)', fontSize: '1rem', padding: '12px 0', width: '100%', outline: 'none' }} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            {finalCta.submitLabel}
          </button>
        </form>
      </div>
    </section>
  )
}
