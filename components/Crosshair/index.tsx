/**
 * Crosshair (A09) — Tracks selected/active object
 * Design source: design.md §15.11 A09
 *
 * SVG crosshair that follows the active object in:
 * Scene A (hero), Scene B (Print Lab), Scene C (Workshop Wall), Scene E (Process)
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface CrosshairProps {
  /** Size of the crosshair (total diameter) */
  size?: number
  /** Gap in the center (where the object sits) */
  gapSize?: number
  color?: string
  visible?: boolean
  animated?: boolean
  className?: string
  style?: React.CSSProperties
}

export function Crosshair({
  size = 48,
  gapSize = 16,
  color = 'var(--falcon-orange)',
  visible = true,
  animated = true,
  className = '',
  style,
}: CrosshairProps) {
  const half = size / 2
  const halfGap = gapSize / 2

  return (
    <AnimatePresence>
      {visible && (
        <motion.svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          className={`crosshair ${className}`}
          aria-hidden="true"
          style={{ pointerEvents: 'none', ...style }}
          initial={animated ? { opacity: 0, scale: 1.3 } : undefined}
          animate={animated ? { opacity: 1, scale: 1 } : undefined}
          exit={animated ? { opacity: 0, scale: 0.7 } : undefined}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Top line */}
          <motion.line
            x1={half} y1={0}
            x2={half} y2={half - halfGap}
            stroke={color}
            strokeWidth={1}
            strokeLinecap="round"
            initial={animated ? { pathLength: 0 } : undefined}
            animate={animated ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.4, delay: 0.1 }}
          />
          {/* Bottom line */}
          <motion.line
            x1={half} y1={half + halfGap}
            x2={half} y2={size}
            stroke={color}
            strokeWidth={1}
            strokeLinecap="round"
            initial={animated ? { pathLength: 0 } : undefined}
            animate={animated ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.4, delay: 0.1 }}
          />
          {/* Left line */}
          <motion.line
            x1={0} y1={half}
            x2={half - halfGap} y2={half}
            stroke={color}
            strokeWidth={1}
            strokeLinecap="round"
            initial={animated ? { pathLength: 0 } : undefined}
            animate={animated ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.4, delay: 0.15 }}
          />
          {/* Right line */}
          <motion.line
            x1={half + halfGap} y1={half}
            x2={size} y2={half}
            stroke={color}
            strokeWidth={1}
            strokeLinecap="round"
            initial={animated ? { pathLength: 0 } : undefined}
            animate={animated ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.4, delay: 0.15 }}
          />

          {/* Center dot */}
          <motion.circle
            cx={half}
            cy={half}
            r={1.5}
            fill={color}
            initial={animated ? { scale: 0 } : undefined}
            animate={animated ? { scale: 1 } : undefined}
            transition={{ duration: 0.3, delay: 0.3 }}
          />
        </motion.svg>
      )}
    </AnimatePresence>
  )
}
