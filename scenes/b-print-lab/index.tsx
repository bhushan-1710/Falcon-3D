/**
 * Scene B — Print Lab (What do you want to make?)
 * Design source: design.md §10.3, §18.1
 * Motion registry: M09–M11
 * Artifacts: A13, A14, A15, A16, A17, A18, A19, A20
 *
 * "A perspective-floor print lab where a single, large object floats at centre.
 * Surrounded by 2–3 receding printed objects. An oversized state word is in
 * the background. A giant faint grid plane recedes in perspective under the
 * central object."
 *
 * - CUSTOM: custom object, paper bg
 * - PROTOTYPE: prototype part, night bg
 * - DESIGN: isolated CAD 3D model & wireframe topology, warm paper bg
 * - FIGURINE: figurine/statue, stone-light bg
 *
 * State transitions (M10): bg wipe, giant word swap, object transform,
 * artifacts retract then enter, description crossfade.
 */

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { GiantWord } from '@/components/GiantWord'
import { ArtifactLabel } from '@/components/ArtifactLabel'
import { Crosshair } from '@/components/Crosshair'
import { GridPlane } from '@/components/GridPlane'
import { printLab } from '@/lib/content'

type LabStateId = 'CUSTOM' | 'PROTOTYPE' | 'DESIGN' | 'FIGURINE'

const stateIndex: Record<LabStateId, number> = {
  CUSTOM: 0,
  PROTOTYPE: 1,
  DESIGN: 2,
  FIGURINE: 3,
}

const bgColorMap: Record<LabStateId, string> = {
  CUSTOM: '#F5F1E9',
  PROTOTYPE: '#0B0B0B',
  DESIGN: '#F2E6DA',
  FIGURINE: '#DDD6CB',
}

const surfaceMap: Record<LabStateId, 'paper' | 'night'> = {
  CUSTOM: 'paper',
  PROTOTYPE: 'night',
  DESIGN: 'paper',
  FIGURINE: 'paper',
}

export function ScenePrintLab() {
  const prefersReducedMotion = useReducedMotion()
  const [activeState, setActiveState] = useState<LabStateId>('CUSTOM')
  const [prevState, setPrevState] = useState<LabStateId | null>(null)
  const [transitioning, setTransitioning] = useState(false)

  const handleStateChange = useCallback((newState: LabStateId) => {
    if (newState === activeState || transitioning) return
    setPrevState(activeState)
    setActiveState(newState)
  }, [activeState, transitioning])

  // Keyboard arrow navigation (design §18.2)
  useEffect(() => {
    const states: LabStateId[] = ['CUSTOM', 'PROTOTYPE', 'DESIGN', 'FIGURINE']
    const handleKey = (e: KeyboardEvent) => {
      const currentIndex = states.indexOf(activeState)
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const next = states[(currentIndex + 1) % states.length]
        handleStateChange(next)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        const prev = states[(currentIndex - 1 + states.length) % states.length]
        handleStateChange(prev)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [activeState, handleStateChange])

  const surface = surfaceMap[activeState]
  const textColor = surface === 'night' ? 'var(--paper)' : 'var(--ink)'
  const mutedColor = surface === 'night' ? 'rgba(245,241,233,0.5)' : 'var(--muted)'

  const currentState = printLab.states.find(s => s.id === activeState)!

  if (prefersReducedMotion) {
    return <PrintLabStaticVariant />
  }

  return (
    <section
      id="lab"
      aria-label="Print Lab: What do you want to make?"
      style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}
    >
      {/* ── Animated background (state wipe) ──────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${activeState}`}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: bgColorMap[activeState],
            zIndex: 0,
          }}
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      {/* Print-bed grid (perspective) (A13) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', zIndex: 1 }}>
        <GridPlane
          variant="perspective"
          opacity={surface === 'night' ? 0.08 : 0.05}
          color={surface === 'night' ? 'rgba(245,241,233,0.5)' : 'var(--stone)'}
          cellSize={64}
        />
      </div>

      {/* Giant state word (A14) — Z-0 */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, overflow: 'hidden' }}>
        <GiantWord
          key={activeState}
          word={activeState}
          surface={surface}
          animateFrom="right"
          visible
        />
      </div>

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 3,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          padding: '120px var(--grid-margin) 80px',
        }}
      >
        {/* Section label */}
        <div className="scene-label" style={{ marginBottom: 16, color: mutedColor }}>
          02 / WHAT DO YOU WANT TO MAKE?
        </div>

        {/* Heading */}
        <h2
          className="text-title"
          style={{
            fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
            fontWeight: 700,
            color: textColor,
            marginBottom: 48,
            maxWidth: '14ch',
          }}
        >
          {printLab.heading}
        </h2>

        {/* Central composition */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: 400,
          }}
        >
          {/* ── Central object (A01 / A17) ──────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`lab-group-${activeState}`}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Object display */}
              <div
                style={{
                  width: 'clamp(200px, 36vw, 460px)',
                  height: 'clamp(240px, 48vh, 520px)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                role="img"
                aria-label={currentState.alt}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    filter: surface === 'night'
                      ? 'drop-shadow(0 20px 32px rgba(243,107,22,0.18))'
                      : 'drop-shadow(0 20px 32px rgba(17,17,17,0.14))',
                  }}
                >
                  <Image
                    src={currentState.imageSrc}
                    alt={currentState.alt}
                    fill
                    sizes="(max-width: 768px) 320px, 460px"
                    style={{
                      objectFit: 'contain',
                      borderRadius: activeState === 'DESIGN' ? 'var(--radius-md)' : undefined,
                    }}
                  />
                </div>

                {/* Crosshair (A09) */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10, pointerEvents: 'none' }}>
                  <Crosshair
                    size={56}
                    gapSize={20}
                    color="var(--falcon-orange)"
                  />
                </div>
              </div>

              {/* State description & annotation */}
              <div style={{ textAlign: 'center', maxWidth: 420 }}>
                <p style={{
                  fontFamily: 'var(--font-manrope, "Manrope", sans-serif)',
                  fontSize: 'var(--text-body-l)',
                  color: mutedColor,
                  lineHeight: 1.6,
                }}>
                  {currentState.description}
                </p>
                <div style={{ marginTop: 8 }}>
                  <span className="artifact-label" style={{
                    borderColor: 'var(--falcon-orange)',
                    color: 'var(--falcon-orange)',
                    background: surface === 'night' ? 'rgba(243,107,22,0.1)' : 'rgba(243,107,22,0.06)',
                  }}>
                    {currentState.tag}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── State selector pills ────────────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Print type selector"
          aria-orientation="horizontal"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
            paddingBottom: 16,
          }}
        >
          {printLab.states.map((state) => {
            const isActive = state.id === activeState
            return (
              <button
                key={state.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`lab-panel-${state.id}`}
                id={`lab-tab-${state.id}`}
                onClick={() => handleStateChange(state.id as LabStateId)}
                style={{
                  position: 'relative',
                  fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
                  fontSize: '0.6875rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  background: 'transparent',
                  color: isActive ? 'var(--paper)' : mutedColor,
                  border: `1px solid ${isActive ? 'transparent' : surface === 'night' ? 'rgba(245,241,233,0.25)' : 'var(--stone)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 18px',
                  cursor: 'pointer',
                  height: 36,
                  overflow: 'hidden',
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-lab-pill"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'var(--falcon-orange)',
                      borderRadius: 'var(--radius-sm)',
                      zIndex: 0,
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>{state.id}</span>
              </button>
            )
          })}
        </div>

        {/* ARIA live region for state changes */}
        <div role="status" aria-live="polite" className="sr-only">
          {`Showing ${activeState} — ${currentState.description}`}
        </div>
      </div>
    </section>
  )
}

// ─── Reduced-motion static variant ────────────────────────────────────────────
function PrintLabStaticVariant() {
  return (
    <section id="lab" style={{ minHeight: '100vh', background: 'var(--paper)', padding: '120px var(--grid-margin) 80px' }}>
      <div className="scene-label" style={{ marginBottom: 16 }}>02 / WHAT DO YOU WANT TO MAKE?</div>
      <h2 className="text-title" style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, marginBottom: 24 }}>
        {printLab.heading}
      </h2>
      <p style={{ color: 'var(--muted)', maxWidth: 420 }}>
        Custom 3D printing, prototyping and design from Nashik.
      </p>
    </section>
  )
}
