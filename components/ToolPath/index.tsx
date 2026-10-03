/**
 * ToolPath (A26) — Fabrication toolpath SVG
 * Design source: design.md §15.6, §15.11 A26
 *
 * "Serpentine/contour SVG path tracing around the model.
 * stroke-dasharray + stroke-dashoffset bound to scroll progress,
 * small endpoint marker (orange dot) that follows the head position,
 * subtle trailing segment at 40% opacity.
 * Looks like real fabrication motion: parallel infill passes and outline loops,
 * not a random curve."
 */

'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useRef, useEffect } from 'react'

interface ToolPathProps {
  width?: number
  height?: number
  /** Progress 0–1 (can be scroll-linked) */
  progress?: number
  color?: string
  strokeWidth?: number
  /** Show the active head dot */
  showDot?: boolean
  className?: string
  style?: React.CSSProperties
}

export function ToolPath({
  width = 200,
  height = 200,
  progress = 1,
  color = 'var(--falcon-orange)',
  strokeWidth = 1,
  showDot = true,
  className = '',
  style,
}: ToolPathProps) {
  const pathRef = useRef<SVGPathElement>(null)

  // Generate a realistic-looking toolpath
  const pathData = generateFabricationPath(width, height)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={`toolpath ${className}`}
      aria-hidden="true"
      style={{ pointerEvents: 'none', overflow: 'visible', ...style }}
    >
      {/* Full path — very faint (trail) */}
      <path
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.12}
        fill="none"
      />

      {/* Animated portion */}
      <motion.path
        ref={pathRef}
        d={pathData}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: progress }}
        transition={{ duration: 0.1, ease: 'linear' }}
      />

      {/* Active head dot */}
      {showDot && (
        <motion.circle
          r={2.5}
          fill={color}
          opacity={0.9}
          // Position follows the path end — approximated
          cx={width * 0.5}
          cy={height * 0.5}
          animate={{
            cx: getPointOnPath(progress, width, height).x,
            cy: getPointOnPath(progress, width, height).y,
          }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      )}
    </svg>
  )
}

// ─── Path generators ───────────────────────────────────────────────────────────

function generateFabricationPath(w: number, h: number): string {
  const margin = 12
  const innerW = w - margin * 2
  const innerH = h - margin * 2
  const passes = Math.floor(innerH / 8)
  const step = innerH / passes

  // Outer outline pass
  let path = `M ${margin} ${margin}`
  path += ` L ${w - margin} ${margin}`
  path += ` L ${w - margin} ${h - margin}`
  path += ` L ${margin} ${h - margin}`
  path += ` L ${margin} ${margin}`

  // Inner infill serpentine
  for (let i = 1; i < passes; i++) {
    const y = margin + i * step
    if (i % 2 === 1) {
      path += ` M ${margin + 6} ${y} L ${w - margin - 6} ${y}`
    } else {
      path += ` M ${w - margin - 6} ${y} L ${margin + 6} ${y}`
    }
  }

  return path
}

function getPointOnPath(progress: number, w: number, h: number): { x: number; y: number } {
  // Approximate position along the path for the dot
  const margin = 12
  const t = progress

  if (t <= 0.25) {
    // Top edge: left to right
    return { x: margin + (w - margin * 2) * (t / 0.25), y: margin }
  } else if (t <= 0.5) {
    // Right edge: top to bottom
    return { x: w - margin, y: margin + (h - margin * 2) * ((t - 0.25) / 0.25) }
  } else if (t <= 0.75) {
    // Bottom edge: right to left
    return { x: (w - margin) - (w - margin * 2) * ((t - 0.5) / 0.25), y: h - margin }
  } else {
    // Infill passes
    const passT = (t - 0.75) / 0.25
    const passes = Math.floor((h - margin * 2) / 8)
    const passIndex = Math.floor(passT * passes)
    const passProgress = (passT * passes) % 1
    const y = margin + passIndex * 8 + 8
    const x = passIndex % 2 === 0
      ? margin + 6 + (w - margin * 2 - 12) * passProgress
      : (w - margin - 6) - (w - margin * 2 - 12) * passProgress
    return { x, y }
  }
}

// ─── LayerBands (A27) — Additive manufacturing layer visualization ─────────────
interface LayerBandsProps {
  width?: number
  height?: number
  /** How many layers are visible (0–totalLayers) */
  visibleLayers?: number
  totalLayers?: number
  /** Whether to show the active (orange) layer line */
  showActiveLine?: boolean
  activeLayerColor?: string
  bandColor?: string
  className?: string
  style?: React.CSSProperties
}

export function LayerBands({
  width = 200,
  height = 200,
  visibleLayers = 0,
  totalLayers = 32,
  showActiveLine = true,
  activeLayerColor = 'var(--falcon-orange)',
  bandColor = 'var(--stone)',
  className = '',
  style,
}: LayerBandsProps) {
  const bandHeight = height / totalLayers
  const visibleHeight = (visibleLayers / totalLayers) * height

  return (
    <div
      className={`layer-bands ${className}`}
      style={{
        width,
        height,
        position: 'relative',
        pointerEvents: 'none',
        overflow: 'hidden',
        ...style,
      }}
      aria-hidden="true"
    >
      {/* Layer bands — revealed from bottom via clip */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${visibleHeight}px`,
          background: `repeating-linear-gradient(
            to top,
            transparent 0px,
            transparent ${bandHeight - 0.5}px,
            ${bandColor}40 ${bandHeight - 0.5}px,
            ${bandColor}40 ${bandHeight}px
          )`,
          transition: 'height 0.05s linear',
        }}
      />

      {/* Active layer line (orange) */}
      {showActiveLine && visibleLayers > 0 && (
        <motion.div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 1.5,
            background: activeLayerColor,
            bottom: visibleHeight - 1,
          }}
          animate={{ bottom: visibleHeight - 1 }}
          transition={{ duration: 0.05 }}
        />
      )}
    </div>
  )
}
