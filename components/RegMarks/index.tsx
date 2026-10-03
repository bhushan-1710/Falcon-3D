/**
 * RegMarks (A07) — Registration/corner marks
 * Design source: design.md §15.11 A07, §15.7
 *
 * Industrial-style corner registration marks used in:
 * Scene A (hero), Scene F (Final CTA), lightbox
 */

'use client'

import { motion } from 'framer-motion'

interface RegMarksProps {
  /** Size of each corner mark's arms */
  armLength?: number
  /** Gap from the corner */
  inset?: number
  color?: string
  strokeWidth?: number
  animated?: boolean
  delay?: number
  className?: string
  style?: React.CSSProperties
}

export function RegMarks({
  armLength = 16,
  inset = 0,
  color = 'var(--stone)',
  strokeWidth = 1,
  animated = false,
  delay = 0,
  className = '',
  style,
}: RegMarksProps) {
  const size = armLength * 2 + inset

  // Each corner: two lines forming an L
  const corners = [
    {
      id: 'tl',
      lines: [
        { x1: inset, y1: inset + armLength, x2: inset, y2: inset, x3: inset, y3: inset, x4: inset + armLength, y4: inset },
        // vertical then horizontal
      ],
      transform: 'translate(0, 0)',
    },
    {
      id: 'tr',
      transform: `translate(100%, 0) scaleX(-1)`,
    },
    {
      id: 'bl',
      transform: `translate(0, 100%) scaleY(-1)`,
    },
    {
      id: 'br',
      transform: `translate(100%, 100%) scale(-1, -1)`,
    },
  ]

  const CornerMark = ({ transform }: { transform: string }) => (
    <svg
      width={armLength + inset + 2}
      height={armLength + inset + 2}
      viewBox={`0 0 ${armLength + inset + 2} ${armLength + inset + 2}`}
      fill="none"
      style={{ overflow: 'visible' }}
    >
      {/* Vertical arm */}
      <motion.line
        x1={inset + 1}
        y1={inset + armLength}
        x2={inset + 1}
        y2={inset}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Horizontal arm */}
      <motion.line
        x1={inset}
        y1={inset + 1}
        x2={inset + armLength}
        y2={inset + 1}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.5, delay: delay + 0.05, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  )

  return (
    <div
      className={`reg-marks ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Top-left */}
      <div style={{ position: 'absolute', top: inset, left: inset }}>
        <CornerMark transform="" />
      </div>
      {/* Top-right */}
      <div style={{ position: 'absolute', top: inset, right: inset, transform: 'scaleX(-1)' }}>
        <CornerMark transform="" />
      </div>
      {/* Bottom-left */}
      <div style={{ position: 'absolute', bottom: inset, left: inset, transform: 'scaleY(-1)' }}>
        <CornerMark transform="" />
      </div>
      {/* Bottom-right */}
      <div style={{ position: 'absolute', bottom: inset, right: inset, transform: 'scale(-1,-1)' }}>
        <CornerMark transform="" />
      </div>
    </div>
  )
}
