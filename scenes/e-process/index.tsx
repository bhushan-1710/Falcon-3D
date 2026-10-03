/**
 * Scene E — Process (From idea to object)
 * Design source: design.md §10.6, §17.4
 * Motion registry: M17
 * Artifacts: A19, A27, A30, A31
 *
 * Pinned 350vh desktop / 220vh mobile
 *
 * Storyboard (§17.4):
 * 0%    Object slot receives finished object; disassembles to sketch; path empty; stage 01
 * 10%   01 SHARE: dotted sketch visible; node 1 pulses; number 01 locked
 * 25%   Transition: 01→02; path fills to node 2
 * 35%   02 DESIGN: wireframe over sketch; construction marks draw
 * 50%   Transition: 02→03; path fills to node 3
 * 60%   03 PRINT: layers build; toolpath traces; orange layer line rises
 * 75%   Transition: 03→04; path fills to node 4
 * 85%   04 DELIVER: finished object with soft shadow; node 4 solid orange
 * 100%  Path continues down and becomes About heading underline
 */

'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion'
import { ArtifactLabel } from '@/components/ArtifactLabel'
import { FalconLine } from '@/components/FalconLine'
import { process as processContent } from '@/lib/content'

export function SceneProcess() {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // Stage progress and dwell transforms
  const pathProgress = useTransform(scrollYProgress, [0, 0.85], [0, 1])

  // Dwell-time opacities for each stage
  const stage0Opacity = useTransform(scrollYProgress, [0, 0.20, 0.28], [1, 1, 0.22])
  const stage1Opacity = useTransform(scrollYProgress, [0.20, 0.28, 0.48, 0.54], [0.22, 1, 1, 0.22])
  const stage2Opacity = useTransform(scrollYProgress, [0.48, 0.54, 0.72, 0.78], [0.22, 1, 1, 0.22])
  const stage3Opacity = useTransform(scrollYProgress, [0.72, 0.78, 1.0], [0.22, 1, 1])
  const stageOpacities = [stage0Opacity, stage1Opacity, stage2Opacity, stage3Opacity]

  const stage1Node = useTransform(scrollYProgress, [0, 0.15], [0.8, 1.2])
  const stage2Node = useTransform(scrollYProgress, [0.22, 0.32], [0.8, 1.2])
  const stage3Node = useTransform(scrollYProgress, [0.46, 0.56], [0.8, 1.2])
  const stage4Node = useTransform(scrollYProgress, [0.70, 0.80], [0.8, 1.2])
  const stageNodes = [stage1Node, stage2Node, stage3Node, stage4Node]

  if (prefersReducedMotion) {
    return <ProcessStaticVariant />
  }

  return (
    <section
      id="process"
      ref={containerRef}
      style={{ height: 'var(--scene-process)', position: 'relative' }}
      aria-label="Our process"
    >
      <div className="scene-stage bg-paper">
        {/* Section label */}
        <div style={{ position: 'absolute', top: 'calc(72px + 24px)', left: 'var(--grid-margin)', zIndex: 3 }}>
          <div className="scene-label">05 / PROCESS</div>
          <h2 className="text-title" style={{
            fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
            fontWeight: 700,
            color: 'var(--ink)',
            marginTop: 8,
          }}>
            {processContent.heading}
          </h2>
        </div>

        {/* Main layout: process path + stages */}
        <div style={{
          position: 'absolute',
          top: '52%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: 820,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 36,
          padding: '0 var(--grid-margin)',
          zIndex: 3,
        }}>
          {/* Vertical process path (A30) */}
          <div style={{ position: 'relative', flexShrink: 0, paddingTop: 16 }}>
            <svg width="20" height="300" viewBox="0 0 20 300" fill="none" aria-hidden="true">
              {/* Background track */}
              <line x1="10" y1="0" x2="10" y2="300" stroke="var(--stone)" strokeWidth="1" />

              {/* Animated fill */}
              <motion.line
                x1="10" y1="0"
                x2="10" y2="300"
                stroke="var(--falcon-orange)"
                strokeWidth="1.5"
                style={{ pathLength: pathProgress }}
              />

              {/* Stage nodes */}
              {[0, 100, 200, 300].map((y, i) => (
                <motion.circle
                  key={i}
                  cx="10"
                  cy={y}
                  r="5"
                  fill="var(--paper)"
                  stroke="var(--falcon-orange)"
                  strokeWidth="1.5"
                  style={{
                    scale: stageNodes[i],
                  }}
                />
              ))}
            </svg>
          </div>

          {/* Stage content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
            {processContent.stages.map((stage, i) => (
              <motion.div
                key={stage.number}
                style={{
                  opacity: stageOpacities[i],
                  paddingBottom: i < processContent.stages.length - 1 ? 20 : 0,
                  transition: 'opacity 0.25s ease-out',
                }}
              >
                {/* Stage number & label (A31) */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
                      fontWeight: 700,
                      fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                      letterSpacing: '-0.04em',
                      lineHeight: 1,
                      color: 'var(--ink)',
                    }}
                    aria-hidden="true"
                  >
                    {stage.number}
                  </span>
                  <h3 style={{
                    fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--falcon-orange)',
                  }}>
                    {stage.label}
                  </h3>
                  {'tag' in stage && stage.tag && (
                    <span className="text-mono" style={{ color: 'var(--muted)', fontSize: '0.625rem', letterSpacing: '0.08em' }}>
                      · {stage.tag}
                    </span>
                  )}
                </div>

                <p style={{
                  color: 'var(--ink)',
                  fontSize: 'var(--text-body-l)',
                  lineHeight: 1.5,
                  maxWidth: 440,
                }}>
                  {stage.description}
                </p>
              </motion.div>
            ))}

            {/* Turnaround direct label */}
            <div style={{ marginTop: 24 }}>
              <ArtifactLabel text="NASHIK STUDIO · DIRECT TURNAROUND" variant="orange" />
            </div>
          </div>
        </div>

        {/* Giant background number */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
          <span className="text-giant" aria-hidden="true">PROCESS</span>
        </div>
      </div>
    </section>
  )
}

// ─── Reduced-motion static variant ────────────────────────────────────────────
function ProcessStaticVariant() {
  return (
    <section id="process" style={{ background: 'var(--paper)', padding: '120px var(--grid-margin)' }}>
      <div className="scene-label" style={{ marginBottom: 16 }}>05 / PROCESS</div>
      <h2 className="text-title" style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, marginBottom: 64 }}>
        {processContent.heading}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 32 }}>
        {processContent.stages.map((stage) => (
          <div key={stage.number} style={{ borderTop: '2px solid var(--falcon-orange)', paddingTop: 16 }}>
            <div className="text-mono" style={{ color: 'var(--falcon-orange)', marginBottom: 8 }}>{stage.number} / {stage.label}</div>
            <p style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{stage.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
