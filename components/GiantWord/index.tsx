/**
 * GiantWord (A03, A14, A31) — Oversized decorative background typography
 * Design source: design.md §11, §15.4
 *
 * - Always aria-hidden (never duplicates accessible content)
 * - Low opacity (8–14% on paper; ≤22% on night)
 * - Participates in scroll/state transitions
 * - Never competes with the product
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface GiantWordProps {
  word: string
  /** On paper background or night */
  surface?: 'paper' | 'night'
  /** Custom opacity override */
  opacity?: number
  className?: string
  /** Animate in from a direction */
  animateFrom?: 'left' | 'right' | 'none'
  /** Whether word is currently visible */
  visible?: boolean
  /** Clip at viewport edge */
  clipped?: boolean
  style?: React.CSSProperties
}

export function GiantWord({
  word,
  surface = 'paper',
  opacity,
  className = '',
  animateFrom = 'none',
  visible = true,
  clipped = false,
  style,
}: GiantWordProps) {
  const defaultOpacity = surface === 'night' ? 0.18 : 0.10
  const finalOpacity = opacity ?? defaultOpacity

  const color = surface === 'night'
    ? `rgba(245, 241, 233, ${finalOpacity})`
    : `rgba(17, 17, 17, ${finalOpacity})`

  const xStart = animateFrom === 'left' ? '-40vw' :
                 animateFrom === 'right' ? '40vw' : '0vw'

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={word}
          className={`text-giant ${className}`}
          style={{
            color,
            opacity: 1, // Opacity is baked into the color for CSS
            pointerEvents: 'none',
            userSelect: 'none',
            overflow: clipped ? 'hidden' : 'visible',
            ...style,
          }}
          aria-hidden="true"
          initial={animateFrom !== 'none' ? { x: xStart, opacity: 0 } : { opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={animateFrom !== 'none' ? { x: animateFrom === 'left' ? '40vw' : '-40vw', opacity: 0 } : { opacity: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Split type variant for IDEA→OBJECT collapse ──────────────────────────────
// design.md §11: "letters split only for the one IDEA → OBJECT collapse (≤12 letters)"
interface SplitWordProps {
  word: string
  phase: 'idea' | 'object' | 'physical'
  surface?: 'paper' | 'night'
  className?: string
}

export function ScrollWord({ word, phase, surface = 'paper', className = '' }: SplitWordProps) {
  const opacity = surface === 'night' ? 0.18 : 0.10
  const color = surface === 'night'
    ? `rgba(245, 241, 233, ${opacity})`
    : `rgba(17, 17, 17, ${opacity})`

  return (
    <motion.div
      key={`${word}-${phase}`}
      className={`text-giant ${className}`}
      style={{ color, pointerEvents: 'none', userSelect: 'none' }}
      aria-hidden="true"
      layout
    >
      {word}
    </motion.div>
  )
}
