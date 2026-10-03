/**
 * FalconLine (A05) — Continuity motif across all scenes
 * Design source: design.md §15.8, §3
 *
 * A single 1–2px orange SVG line that changes role through the page:
 * nav progress → hero accent → toolpath → connector → active layer →
 * process path → CTA underline → footer underline
 *
 * Implementation: SVG path with stroke-dasharray/dashoffset driven by progress
 */

'use client'

import { useRef, useEffect } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'

interface FalconLineProps {
  /** Visual role determines the path shape */
  role: 'accent' | 'toolpath' | 'connector' | 'underline' | 'progress' | 'process-path'
  /** Animation progress 0–1 (for scroll-driven roles) */
  progress?: number
  /** Width of the SVG container */
  width?: number
  /** Height of the SVG container */
  height?: number
  /** Custom path data (for toolpath and connector roles) */
  pathData?: string
  /** Color override (defaults to --falcon-orange) */
  color?: string
  /** Line weight */
  strokeWidth?: number
  className?: string
  'aria-hidden'?: boolean
}

export function FalconLine({
  role,
  progress = 1,
  width = 200,
  height = 4,
  pathData,
  color = 'var(--falcon-orange)',
  strokeWidth = 1.5,
  className = '',
  'aria-hidden': ariaHidden = true,
}: FalconLineProps) {
  const pathRef = useRef<SVGPathElement>(null)

  // Generate path based on role
  const getPath = () => {
    switch (role) {
      case 'accent':
        // Short horizontal accent line at object base
        return `M 0 ${height / 2} L ${width} ${height / 2}`

      case 'underline':
        // CTA / heading underline — full width
        return `M 0 ${height / 2} L ${width} ${height / 2}`

      case 'progress':
        // Nav progress — grows from left to right
        return `M 0 ${height / 2} L ${width} ${height / 2}`

      case 'connector':
        // Object to label connector — L-shape
        return pathData || `M 0 0 L ${width * 0.6} 0 L ${width} ${height}`

      case 'toolpath':
        // Fabrication-like toolpath — serpentine
        return pathData || generateToolpath(width, height)

      case 'process-path':
        // Vertical process path with nodes
        return pathData || `M ${width / 2} 0 L ${width / 2} ${height}`

      default:
        return `M 0 ${height / 2} L ${width} ${height / 2}`
    }
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={`falcon-line falcon-line--${role} ${className}`}
      aria-hidden={ariaHidden}
      style={{ overflow: 'visible' }}
    >
      <motion.path
        ref={pathRef}
        d={getPath()}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: progress }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  )
}

// ─── Toolpath generator ───────────────────────────────────────────────────────
// Generates a fabrication-realistic serpentine toolpath
// "Looks like real fabrication motion: parallel infill passes and outline loops"
// design.md §15.6

function generateToolpath(w: number, h: number): string {
  const passes = Math.floor(h / 6)
  let path = `M 8 8`

  // Outline loop
  path += ` L ${w - 8} 8 L ${w - 8} ${h - 8} L 8 ${h - 8} Z`

  // Infill serpentine passes
  const step = (h - 24) / Math.max(passes - 1, 1)
  for (let i = 0; i < passes; i++) {
    const y = 16 + i * step
    const xStart = i % 2 === 0 ? 16 : w - 16
    const xEnd = i % 2 === 0 ? w - 16 : 16
    path += ` M ${xStart} ${y} L ${xEnd} ${y}`
  }

  return path
}

// ─── Scroll-progress version (for nav) ───────────────────────────────────────
interface NavProgressLineProps {
  progress: number // 0–1 scroll progress
}

export function NavProgressLine({ progress }: NavProgressLineProps) {
  return (
    <div
      className="nav-progress"
      style={{
        transform: `scaleX(${progress})`,
        transition: 'transform 0.1s linear',
      }}
      aria-hidden="true"
    />
  )
}
