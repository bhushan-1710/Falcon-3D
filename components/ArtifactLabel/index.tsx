/**
 * ArtifactLabel / Pill (A15)
 * Design source: design.md §14, §15.11
 *
 * Technical/annotation label. Mono 11px, thin 1px border or orange/ink block.
 * Optional connector line and dot endpoint.
 *
 * RULE: Decorative labels are never presented as factual claims.
 * Any label showing a dimension must use [DIMENSION] unless real.
 */

'use client'

import { motion } from 'framer-motion'

interface ArtifactLabelProps {
  text: string
  variant?: 'default' | 'orange' | 'ink' | 'night'
  /** Whether to show an endpoint dot (start of connector) */
  dot?: boolean
  /** Direction of connector line if shown */
  connector?: 'left' | 'right' | 'up' | 'down' | null
  connectorLength?: number
  className?: string
  animated?: boolean
  delay?: number
}

export function ArtifactLabel({
  text,
  variant = 'default',
  dot = false,
  connector = null,
  connectorLength = 40,
  className = '',
  animated = false,
  delay = 0,
}: ArtifactLabelProps) {
  const variantClass = {
    default: 'artifact-label',
    orange: 'artifact-label artifact-label--orange',
    ink: 'artifact-label',
    night: 'artifact-label artifact-label--night',
  }[variant]

  const content = (
    <div
      className={`artifact-label-wrapper ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 0 }}
      aria-hidden="true"
    >
      {/* Left connector */}
      {connector === 'left' && (
        <ConnectorLine
          length={connectorLength}
          orientation="horizontal"
          variant={variant}
          dotAtStart
        />
      )}

      <span className={variantClass}>{text}</span>

      {/* Right connector */}
      {connector === 'right' && (
        <ConnectorLine
          length={connectorLength}
          orientation="horizontal"
          variant={variant}
          dotAtEnd
        />
      )}
    </div>
  )

  if (!animated) return content

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {content}
    </motion.div>
  )
}

// ─── Inline connector line ─────────────────────────────────────────────────────
interface ConnectorLineProps {
  length: number
  orientation: 'horizontal' | 'vertical'
  variant: 'default' | 'orange' | 'ink' | 'night'
  dotAtStart?: boolean
  dotAtEnd?: boolean
  animated?: boolean
}

function ConnectorLine({
  length,
  orientation,
  variant,
  dotAtStart = false,
  dotAtEnd = false,
  animated = false,
}: ConnectorLineProps) {
  const color =
    variant === 'orange' ? 'var(--falcon-orange)' :
    variant === 'night' ? 'rgba(245,241,233,0.4)' :
    'var(--stone)'

  if (orientation === 'horizontal') {
    return (
      <svg
        width={length}
        height={4}
        viewBox={`0 0 ${length} 4`}
        style={{ overflow: 'visible', flexShrink: 0 }}
      >
        {dotAtStart && <circle cx={2} cy={2} r={1.5} fill={color} />}
        <motion.line
          x1={dotAtStart ? 4 : 0}
          y1={2}
          x2={dotAtEnd ? length - 4 : length}
          y2={2}
          stroke={color}
          strokeWidth={1}
          initial={animated ? { pathLength: 0 } : undefined}
          animate={animated ? { pathLength: 1 } : undefined}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
        {dotAtEnd && <circle cx={length - 2} cy={2} r={1.5} fill={color} />}
      </svg>
    )
  }

  return (
    <svg
      width={4}
      height={length}
      viewBox={`0 0 4 ${length}`}
      style={{ overflow: 'visible', flexShrink: 0 }}
    >
      {dotAtStart && <circle cx={2} cy={2} r={1.5} fill={color} />}
      <motion.line
        x1={2}
        y1={dotAtStart ? 4 : 0}
        x2={2}
        y2={dotAtEnd ? length - 4 : length}
        stroke={color}
        strokeWidth={1}
        initial={animated ? { pathLength: 0 } : undefined}
        animate={animated ? { pathLength: 1 } : undefined}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
      {dotAtEnd && <circle cx={2} cy={length - 2} r={1.5} fill={color} />}
    </svg>
  )
}
