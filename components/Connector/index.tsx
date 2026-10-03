/**
 * Connector (A16) — SVG path between object and label/metadata
 * Design source: design.md §14, §15.11 A16
 *
 * "1px muted or orange; optional endpoint dot/arrow; draws 0→100% then
 * endpoint appears; retracts on exit"
 */

'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ConnectorProps {
  /** SVG path data */
  path: string
  /** Bounding box for the SVG viewBox */
  width: number
  height: number
  color?: 'muted' | 'orange' | 'paper'
  strokeWidth?: number
  /** Show endpoint dot at end of path */
  endDot?: boolean
  /** Show arrow at end */
  endArrow?: boolean
  /** Coordinates of the endpoint dot */
  endX?: number
  endY?: number
  /** Whether to animate the path draw */
  visible?: boolean
  delay?: number
  className?: string
}

export function Connector({
  path,
  width,
  height,
  color = 'muted',
  strokeWidth = 1,
  endDot = true,
  endArrow = false,
  endX = width,
  endY = height / 2,
  visible = true,
  delay = 0,
  className = '',
}: ConnectorProps) {
  const strokeColor =
    color === 'orange' ? 'var(--falcon-orange)' :
    color === 'paper' ? 'rgba(245,241,233,0.5)' :
    'var(--stone)'

  return (
    <AnimatePresence>
      {visible && (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
          className={`connector ${className}`}
          aria-hidden="true"
          style={{ overflow: 'visible', pointerEvents: 'none' }}
        >
          {/* Arrow marker definition */}
          {endArrow && (
            <defs>
              <marker
                id="connector-arrow"
                viewBox="0 0 6 6"
                refX="5"
                refY="3"
                markerWidth="4"
                markerHeight="4"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 6 3 L 0 6 z" fill={strokeColor} />
              </marker>
            </defs>
          )}

          {/* Main connector path */}
          <motion.path
            d={path}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            markerEnd={endArrow ? 'url(#connector-arrow)' : undefined}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ pathLength: 0, opacity: 0 }}
            transition={{
              pathLength: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.2, delay },
            }}
          />

          {/* Endpoint dot */}
          {endDot && (
            <motion.circle
              cx={endX}
              cy={endY}
              r={2}
              fill={strokeColor}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3, delay: delay + 0.6 }}
            />
          )}
        </svg>
      )}
    </AnimatePresence>
  )
}

// ─── Simple L-shaped connector helper ─────────────────────────────────────────
interface LConnectorProps {
  fromX: number
  fromY: number
  toX: number
  toY: number
  width: number
  height: number
  color?: 'muted' | 'orange' | 'paper'
  visible?: boolean
  delay?: number
}

export function LConnector({
  fromX, fromY, toX, toY,
  width, height,
  color = 'muted',
  visible = true,
  delay = 0,
}: LConnectorProps) {
  // Create L-path: vertical then horizontal
  const midY = fromY
  const path = `M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${toY}`

  return (
    <Connector
      path={path}
      width={width}
      height={height}
      color={color}
      endDot={true}
      endX={toX}
      endY={toY}
      visible={visible}
      delay={delay}
    />
  )
}
