/**
 * GridPlane (A13) — Perspective print-bed grid for Print Lab
 * Design source: design.md §14, §10.3, §15.11 A13
 *
 * CSS 3D perspective grid plane. rotateX 62° gives the print-bed effect.
 * "A faint grid plane recedes in perspective under the central object"
 */

'use client'

import { motion } from 'framer-motion'

interface GridPlaneProps {
  /** Whether this is the full 3D CSS perspective version */
  variant?: 'perspective' | 'flat'
  opacity?: number
  color?: string
  cellSize?: number
  animated?: boolean
  className?: string
  style?: React.CSSProperties
}

export function GridPlane({
  variant = 'perspective',
  opacity = 0.05,
  color = 'var(--stone)',
  cellSize = 48,
  animated = false,
  className = '',
  style,
}: GridPlaneProps) {
  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(${color} 1px, transparent 1px),
      linear-gradient(90deg, ${color} 1px, transparent 1px)
    `,
    backgroundSize: `${cellSize}px ${cellSize}px`,
    opacity,
    pointerEvents: 'none',
    ...(variant === 'perspective' ? {
      transform: 'rotateX(62deg)',
      transformOrigin: 'center bottom',
    } : {}),
    ...style,
  }

  if (!animated) {
    return (
      <div
        className={`grid-plane grid-plane--${variant} ${className}`}
        style={gridStyle}
        aria-hidden="true"
      />
    )
  }

  return (
    <motion.div
      className={`grid-plane grid-plane--${variant} ${className}`}
      style={gridStyle}
      aria-hidden="true"
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity, scaleY: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    />
  )
}

// ─── Layer-line strip (A08) ───────────────────────────────────────────────────
// Horizontal rules suggesting additive manufacturing strata
interface LayerLineStripProps {
  lineCount?: number
  width?: number
  height?: number
  color?: string
  animated?: boolean
  className?: string
  style?: React.CSSProperties
}

export function LayerLineStrip({
  lineCount = 8,
  width = 200,
  height = 24,
  color = 'var(--stone)',
  animated = false,
  className = '',
  style,
}: LayerLineStripProps) {
  const spacing = height / (lineCount + 1)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`layer-line-strip ${className}`}
      aria-hidden="true"
      style={{ pointerEvents: 'none', ...style }}
    >
      {Array.from({ length: lineCount }).map((_, i) => {
        const y = spacing * (i + 1)
        const opacity = 0.3 + (i / lineCount) * 0.5 // Vary opacity for depth
        const lineWidth = width - (i % 3) * 12 // Slightly vary widths

        return (
          <motion.line
            key={i}
            x1={(width - lineWidth) / 2}
            y1={y}
            x2={(width + lineWidth) / 2}
            y2={y}
            stroke={color}
            strokeWidth={0.75}
            strokeLinecap="round"
            opacity={opacity}
            initial={animated ? { pathLength: 0, opacity: 0 } : undefined}
            animate={animated ? { pathLength: 1, opacity } : undefined}
            transition={{
              duration: 0.6,
              delay: animated ? i * 0.04 : 0,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        )
      })}
    </svg>
  )
}
