/**
 * ArtifactCard (A22, A20, A24) — Physical floating card
 * Design source: design.md §14, §15.3, §15.11 A22
 *
 * "Look: tangible sample, not a screenshot: layered shadow, 1px inner edge
 * highlight, occasional paper-white border, varied sizes (never identical),
 * depth-based blur only for distant cards."
 *
 * Variants:
 * - photo: real product photography
 * - cutout: transparent background product
 * - note: reference card / design fragment
 * - spec: technical specification card
 */

'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useRef, useCallback } from 'react'

interface ArtifactCardProps {
  variant: 'photo' | 'cutout' | 'note' | 'spec'
  /** Z-depth layer (0=background, 3=foreground) */
  depth?: 0 | 1 | 2 | 3
  /** Rest rotation in degrees */
  rotation?: number
  /** Base scale */
  scale?: number
  /** Image source */
  imageSrc?: string
  imageAlt?: string
  /** Card label (mono) */
  label?: string
  /** Project metadata */
  metadata?: {
    number: string
    category: string
    title: string
    description?: string
  }
  /** Whether card is the active/featured item */
  active?: boolean
  /** Whether card can be interacted with */
  interactive?: boolean
  /** Pointer tilt on hover (desktop only) */
  tilt?: boolean
  width?: number | string
  height?: number | string
  onClick?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  className?: string
  style?: React.CSSProperties
  'aria-label'?: string
}

export function ArtifactCard({
  variant = 'photo',
  depth = 2,
  rotation = 0,
  scale = 1,
  imageSrc,
  imageAlt = '',
  label,
  metadata,
  active = false,
  interactive = false,
  tilt = false,
  width = 280,
  height = 340,
  onClick,
  onKeyDown,
  className = '',
  style,
  'aria-label': ariaLabel,
}: ArtifactCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  // Pointer tilt — design.md §18.2: "≤4°, CSS transform from rAF-throttled pointer"
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), { stiffness: 260, damping: 26 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 260, damping: 26 })

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tilt || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }, [tilt, mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
  }, [mouseX, mouseY])

  // Depth-based blur for distant cards only
  const blurAmount = depth === 0 ? '2px' : depth === 1 ? '1px' : '0px'

  const cardStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative',
    borderRadius: 0, // "Many blocks stay square"
    overflow: 'hidden',
    boxShadow: active
      ? '0 12px 32px rgba(17,17,17,0.18), 0 0 0 1.5px var(--falcon-orange), 0 36px 64px -20px rgba(17,17,17,0.45)'
      : '0 2px 4px rgba(17,17,17,0.10), 0 18px 36px -18px rgba(17,17,17,0.35)',
    filter: depth <= 1 && !active ? `blur(${blurAmount})` : 'none',
    cursor: interactive ? 'pointer' : 'default',
    ...style,
  }

  const motionStyle = tilt ? {
    ...cardStyle,
    transformStyle: 'preserve-3d' as const,
    rotateX,
    rotateY,
  } : cardStyle

  return (
    <motion.div
      ref={cardRef}
      className={`artifact-card artifact-card--${variant} ${active ? 'artifact-card--active' : ''} ${className}`}
      style={motionStyle}
      initial={{ rotate: rotation, scale }}
      animate={{
        rotate: active ? 0 : rotation,
        scale: active ? 1 : scale,
      }}
      whileHover={interactive ? { scale: scale * 1.03, rotate: 0 } : undefined}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      aria-pressed={interactive ? active : undefined}
    >
      {/* Inner edge highlight — 1px paper at 60% */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: active ? '1px solid var(--falcon-orange)' : '1px solid rgba(245, 241, 233, 0.6)',
          zIndex: 10,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />

      {/* Image area */}
      {imageSrc ? (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
          <Image
            src={imageSrc}
            alt={imageAlt || label || 'Falcon 3D print portfolio artifact'}
            fill
            sizes="(max-width: 768px) 50vw, 360px"
            style={{
              objectFit: variant === 'cutout' ? 'contain' : 'cover',
            }}
          />
        </div>
      ) : (
        <div
          className="asset-placeholder"
          style={{ width: '100%', height: '100%' }}
        />
      )}

      {/* Label overlay */}
      {label && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 11,
          }}
        >
          <span className="artifact-label">{label}</span>
        </div>
      )}

      {/* Metadata — slides in on active */}
      {metadata && (
        <motion.div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(245, 241, 233, 0.96)',
            backdropFilter: 'blur(8px)',
            padding: '8px 12px',
            borderTop: '1px solid rgba(17,17,17,0.08)',
            zIndex: 12,
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: active ? 0 : 50, opacity: active ? 1 : 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden={!active}
        >
          <div className="text-mono-label" style={{ color: 'var(--falcon-orange)', marginBottom: 2, fontSize: '0.625rem' }}>
            {metadata.number} · {metadata.category}
          </div>
          <div style={{
            fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'var(--ink)',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {metadata.title}
          </div>
        </motion.div>
      )}

      {/* Contact shadow */}
      <div
        className="contact-shadow"
        style={{
          position: 'absolute',
          bottom: -16,
          left: '10%',
          right: '10%',
          height: 16,
          background: 'radial-gradient(ellipse at center, rgba(17,17,17,0.25) 0%, transparent 70%)',
          filter: 'blur(4px)',
          zIndex: -1,
          pointerEvents: 'none',
          transform: active ? 'scaleX(1.1) translateY(4px)' : 'scaleX(0.8)',
          transition: 'transform 0.5s ease-out',
        }}
        aria-hidden="true"
      />
    </motion.div>
  )
}
