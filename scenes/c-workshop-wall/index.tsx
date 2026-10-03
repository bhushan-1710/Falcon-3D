/**
 * Scene C — Workshop Wall (Real work. Real objects.)
 * Design source: design.md §10.4, §17.2
 * Motion registry: M12–M15
 * Artifacts: A21, A22, A23, A24, A33
 *
 * Pinned 400vh desktop / 260vh mobile
 *
 * Storyboard (§17.2):
 * 0%    Fan of 5–7 prints rises from bottom; shelf line draws left→right
 * 15%   Fan spreads to wall positions; rotations settle to ±1.5–4°; world pans
 * 30%   Camera moves: cards at different Z-speeds; world rotateY +6°→0°
 * 50%   One card approaches centre, scale 1.15; crosshair locks on
 * 65%   Featured object enlarges; bounding box draws; metadata slides in
 * 80%   Camera pans to next card; metadata swaps by mask
 * 100%  Selected project large; others scatter
 *
 * IMPORTANT: No invented project data. All slots are [BUSINESS INPUT REQUIRED].
 */

'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useScroll, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion'
import { ArtifactCard } from '@/components/ArtifactCard'
import { ArtifactLabel } from '@/components/ArtifactLabel'
import { FalconLine } from '@/components/FalconLine'
import { workshopWall } from '@/lib/content'
import { projects as fallbackProjects, type Project } from '@/lib/projects'

export function SceneWorkshopWall({ initialProjects }: { initialProjects?: Project[] } = {}) {
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [wallProjects, setWallProjects] = useState<Project[]>(() => {
    if (initialProjects && initialProjects.length > 0) return initialProjects
    return fallbackProjects
  })
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    if (initialProjects && initialProjects.length > 0) {
      setWallProjects(initialProjects)
      return
    }
    fetch('/api/projects/wall')
      .then(res => res.json())
      .then(data => {
        if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
          setWallProjects(data.projects)
        }
      })
      .catch(() => {})
  }, [initialProjects])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  // World container transforms (M13)
  const worldX = useTransform(scrollYProgress, [0, 1], ['0%', '-40%'])
  const worldRotateY = useTransform(scrollYProgress, [0, 0.3, 1], [6, 0, -6])

  // Active card driven by scroll if no manual selection
  const scrollIndex = useTransform(scrollYProgress, [0, 1], [0, wallProjects.length - 1])

  const handleCardClick = useCallback((index: number) => {
    setActiveIndex(index === activeIndex ? null : index)
    setHasInteracted(true)
  }, [activeIndex])

  const handleCardKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick(index)
    }
  }, [handleCardClick])

  if (prefersReducedMotion) {
    return <WorkshopWallStaticVariant />
  }

  return (
    <section
      id="wall"
      ref={containerRef}
      style={{ height: 'var(--scene-wall)', position: 'relative' }}
      aria-label="Workshop Wall: Our work"
    >
      {/* ── Sticky stage ──────────────────────────────────────────────── */}
      <div className="scene-stage bg-paper">

        {/* Shelf line (A21) — draws left→right on entry */}
        <div style={{ position: 'absolute', bottom: '30%', left: 0, right: 0, zIndex: 1 }}>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'left' }}
            viewport={{ once: true }}
          >
            <div style={{
              height: 1,
              background: 'var(--stone)',
              width: '100%',
              opacity: 0.4,
            }} aria-hidden="true" />
          </motion.div>
        </div>

        {/* Section label */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(72px + 24px)',
            left: 'var(--grid-margin)',
            zIndex: 4,
          }}
        >
          <div className="scene-label">03 / WORK</div>
          <h2
            className="text-title"
            style={{
              fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
              fontWeight: 700,
              marginTop: 8,
              color: 'var(--ink)',
            }}
          >
            {workshopWall.heading}
          </h2>
        </div>

        {/* Giant background word */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 0, overflow: 'hidden' }}>
          <span className="text-giant" aria-hidden="true">WORK</span>
        </div>

        {/* ── World container — lateral pan + rotateY ──────────────── */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            x: worldX,
            rotateY: worldRotateY,
            transformStyle: 'preserve-3d',
            zIndex: 2,
          }}
        >
          {/* Fan of cards (A22, A24) */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '10%',
              right: '10%',
              transform: 'translateY(-50%)',
              display: 'flex',
              gap: 48,
              alignItems: 'center',
              justifyContent: 'center',
              perspective: 1200,
            }}
          >
            {wallProjects.map((project, i) => {
              const isActive = activeIndex === i
              const isOther = activeIndex !== null && !isActive

              return (
                <motion.div
                  key={project.id}
                  initial={{ y: '100vh', rotate: project.rotation, opacity: 0 }}
                  whileInView={{
                    y: 0,
                    rotate: isActive ? 0 : project.rotation,
                    opacity: 1,
                  }}
                  viewport={{ once: true, amount: 0.3 }}
                  animate={{
                    scale: isActive ? 1.18 : isOther ? 0.88 : project.scale,
                    opacity: isOther ? 0.72 : 1,
                    rotate: isActive ? 0 : project.rotation,
                    z: isActive ? 80 : 0,
                    y: 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 140,
                    damping: 20,
                    delay: i * 0.05,
                  }}
                  style={{
                    flexShrink: 0,
                    zIndex: isActive ? 10 : project.depth,
                  }}
                >
                  <ArtifactCard
                    variant="photo"
                    depth={project.depth as 0 | 1 | 2 | 3}
                    rotation={project.rotation}
                    scale={project.scale}
                    imageSrc={project.imageSrc}
                    imageAlt={project.imageAlt}
                    label={project.sectionLabel}
                    metadata={{
                      number: project.sectionLabel.split(' / ')[0],
                      category: project.category,
                      title: project.name,
                      description: project.description,
                    }}
                    active={isActive}
                    interactive
                    tilt={!isActive}
                    width={240}
                    height={300}
                    onClick={() => handleCardClick(i)}
                    onKeyDown={(e) => handleCardKeyDown(e, i)}
                    aria-label={`View project ${i + 1}: ${project.name}`}
                  />
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* ── Featured metadata (A23) ──────────────────────────────── */}
        <AnimatePresence>
          {activeIndex !== null && wallProjects[activeIndex] && (
            <motion.div
              style={{
                position: 'absolute',
                right: 'var(--grid-margin)',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 5,
                maxWidth: 300,
              }}
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="scene-label" style={{ marginBottom: 8 }}>
                {wallProjects[activeIndex].sectionLabel}
              </div>
              <h3 style={{
                fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
                fontWeight: 700,
                fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
                color: 'var(--ink)',
                marginBottom: 12,
                letterSpacing: '-0.02em',
              }}>
                {wallProjects[activeIndex].name}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: 'var(--text-body)', lineHeight: 1.6 }}>
                {wallProjects[activeIndex].description}
              </p>

              {/* VIEW label */}
              <div style={{ marginTop: 20 }}>
                <ArtifactLabel text="VIEW OBJECT →" variant="orange" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drag/interaction affordance */}
        {!hasInteracted && (
          <motion.div
            style={{
              position: 'absolute',
              bottom: 48,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 5,
            }}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          >
            <span className="text-mono" style={{ color: 'var(--muted)' }}>TAP A PRINT TO VIEW</span>
          </motion.div>
        )}

        {/* Studio verification note */}
        <div style={{ position: 'absolute', bottom: 20, left: 'var(--grid-margin)', zIndex: 5 }}>
          <span className="artifact-label" style={{ opacity: 0.6, fontSize: '0.55rem' }}>
            DEMONSTRATION CAPABILITIES · NASHIK STUDIO
          </span>
        </div>
      </div>
    </section>
  )
}

// ─── Reduced-motion static variant ────────────────────────────────────────────
function WorkshopWallStaticVariant() {
  return (
    <section id="wall" style={{ minHeight: '80vh', background: 'var(--paper)', padding: '120px var(--grid-margin) 80px' }}>
      <div className="scene-label" style={{ marginBottom: 16 }}>03 / WORK</div>
      <h2 className="text-title" style={{ fontFamily: 'var(--font-space-grotesk)', fontWeight: 700, marginBottom: 48 }}>
        {workshopWall.heading}
      </h2>
      <p className="artifact-label" style={{ opacity: 0.7 }}>
        EXPLORE WHAT&apos;S POSSIBLE · FABRICATION DEMONSTRATORS
      </p>
    </section>
  )
}
