/**
 * DimensionLine (A10) — Technical dimension annotation
 * Design source: design.md §15.7, §15.11 A10
 *
 * RULE: Uses neutral technical labels (e.g. SCALE GUIDE, BOUNDING ENVELOPE)
 * unless real verified manufacturing measurements are provided. Never show fake numbers.
 */

'use client'

import { motion } from 'framer-motion'

interface DimensionLineProps {
  /** Optional actual measurement */
  value?: string | null
  unit?: string
  /** Neutral label when no measurement is confirmed */
  label?: string
  /** Orientation */
  orientation?: 'horizontal' | 'vertical'
  /** Length of the dimension line in px */
  length?: number
  color?: string
  animated?: boolean
  delay?: number
  className?: string
  style?: React.CSSProperties
}

export function DimensionLine({
  value,
  unit = 'MM',
  label,
  orientation = 'horizontal',
  length = 80,
  color = 'var(--muted)',
  animated = false,
  delay = 0,
  className = '',
  style,
}: DimensionLineProps) {
  const displayValue = label ? label : value ? `${value} ${unit}` : 'SCALE GUIDE'

  const tickSize = 4

  if (orientation === 'horizontal') {
    return (
      <div
        className={`dimension-line dimension-line--horizontal ${className}`}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          ...style,
        }}
        aria-hidden="true"
      >
        <svg
          width={length}
          height={tickSize * 2 + 2}
          viewBox={`0 0 ${length} ${tickSize * 2 + 2}`}
          fill="none"
        >
          {/* Left tick */}
          <motion.line x1={0} y1={0} x2={0} y2={tickSize * 2 + 2} stroke={color} strokeWidth={1}
            initial={animated ? { pathLength: 0 } : undefined}
            animate={animated ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.4, delay }}
          />
          {/* Main line */}
          <motion.line x1={0} y1={tickSize + 1} x2={length} y2={tickSize + 1} stroke={color} strokeWidth={1}
            initial={animated ? { pathLength: 0 } : undefined}
            animate={animated ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.4, delay: delay + 0.1 }}
          />
          {/* Right tick */}
          <motion.line x1={length} y1={0} x2={length} y2={tickSize * 2 + 2} stroke={color} strokeWidth={1}
            initial={animated ? { pathLength: 0 } : undefined}
            animate={animated ? { pathLength: 1 } : undefined}
            transition={{ duration: 0.4, delay: delay + 0.05 }}
          />
        </svg>
        {/* Value label */}
        <span
          style={{
            fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
            fontSize: '0.5625rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: color,
            marginTop: 2,
            opacity: 0.85,
          }}
        >
          {displayValue}
        </span>
      </div>
    )
  }

  // Vertical orientation
  return (
    <div
      className={`dimension-line dimension-line--vertical ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      <svg
        width={tickSize * 2 + 2}
        height={length}
        viewBox={`0 0 ${tickSize * 2 + 2} ${length}`}
        fill="none"
      >
        {/* Top tick */}
        <motion.line x1={0} y1={0} x2={tickSize * 2 + 2} y2={0} stroke={color} strokeWidth={1}
          initial={animated ? { pathLength: 0 } : undefined}
          animate={animated ? { pathLength: 1 } : undefined}
          transition={{ duration: 0.4, delay }}
        />
        {/* Main line */}
        <motion.line x1={tickSize + 1} y1={0} x2={tickSize + 1} y2={length} stroke={color} strokeWidth={1}
          initial={animated ? { pathLength: 0 } : undefined}
          animate={animated ? { pathLength: 1 } : undefined}
          transition={{ duration: 0.4, delay: delay + 0.1 }}
        />
        {/* Bottom tick */}
        <motion.line x1={0} y1={length} x2={tickSize * 2 + 2} y2={length} stroke={color} strokeWidth={1}
          initial={animated ? { pathLength: 0 } : undefined}
          animate={animated ? { pathLength: 1 } : undefined}
          transition={{ duration: 0.4, delay: delay + 0.05 }}
        />
      </svg>
      <span
        style={{
          fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
          fontSize: '0.5625rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: color,
          marginLeft: 4,
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          opacity: 0.85,
        }}
      >
        {displayValue}
      </span>
    </div>
  )
}
