/**
 * Navigation
 * Design source: design.md §10.1
 *
 * "72px → 56px on scroll; transparent over hero; hairline border only when
 * content passes beneath. Orange animated underline on links; CTA has magnetic
 * pull ≤6px. Active scene dot. Scroll-progress hairline (first Falcon Line)."
 *
 * Mobile: full-screen ink menu, large Space Grotesk items (44–56px), 60ms stagger.
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { nav, brand } from '@/lib/content'

interface NavProps {
  /** Currently active scene ID */
  activeScene?: string
  /** Currently active route */
  activeRoute?: string
}

const SCENES = ['hero', 'lab', 'wall', 'transform', 'process', 'about', 'samples', 'contact']

export function Navigation({ activeScene = 'hero', activeRoute }: NavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const { scrollYProgress } = useScroll()

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setScrollProgress(v)
    setScrolled(window.scrollY > 60)
  })

  // Close menu on Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
        openButtonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  // Trap focus in menu
  useEffect(() => {
    if (menuOpen) {
      closeButtonRef.current?.focus()
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleNavClick = useCallback((href: string, e?: React.MouseEvent) => {
    setMenuOpen(false)
    if (href.startsWith('#')) {
      if (pathname === '/') {
        e?.preventDefault()
        const id = href.replace('#', '')
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
      // If pathname !== '/', allow native navigation to /#anchor
    } else {
      e?.preventDefault()
      router.push(href)
    }
  }, [pathname, router])

  const handleCtaClick = useCallback(() => {
    setMenuOpen(false)
    if (pathname === '/') {
      const el = document.getElementById('contact')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      router.push('/#contact')
    }
  }, [pathname, router])

  return (
    <>
      {/* ── Main nav bar ────────────────────────────────────────────────────── */}
      <header
        className={`nav ${scrolled ? 'nav--scrolled' : ''}`}
        role="banner"
      >
        {/* Scroll-progress hairline (A05 — first Falcon Line appearance) */}
        <motion.div
          className="nav-progress"
          style={{ scaleX: scrollProgress, transformOrigin: 'left' }}
          aria-hidden="true"
        />

        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {/* Logo / Brand */}
          <Link
            href="/"
            aria-label={`${brand.name} — home`}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            {/* Falcon brand mark SVG */}
            <div
              style={{
                width: 30,
                height: 30,
                position: 'relative',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                src="/assets/brand/falcon-logo.svg"
                alt="Falcon 3D Prints mark"
                width={28}
                height={28}
              />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
                fontWeight: 700,
                fontSize: '0.875rem',
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}
            >
              {brand.name}
            </span>
          </Link>

          {/* Desktop navigation links */}
          <nav
            aria-label="Main navigation"
            style={{ display: 'flex', alignItems: 'center', gap: 40 }}
            className="desktop-nav"
          >
            {nav.links.map((link) => {
              // Route links: active when pathname matches
              // Anchor links: active when scene is visible
              const isRoute = link.href.startsWith('/')
              const isActive = isRoute
                ? pathname.startsWith(link.href)
                : activeScene === link.href.replace('#', '')
              const resolvedHref = isRoute
                ? link.href
                : pathname === '/'
                  ? link.href
                  : '/' + link.href
              return (
                <NavLink
                  key={link.href}
                  href={resolvedHref}
                  active={isActive}
                  onClick={(e) => handleNavClick(link.href, e)}
                >
                  {link.label}
                </NavLink>
              )
            })}
          </nav>

          {/* Desktop CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a
              href="/#contact"
              className="btn-primary desktop-cta"
              onClick={(e) => { e.preventDefault(); handleCtaClick() }}
              style={{ fontSize: '0.75rem', height: 40, padding: '0 20px' }}
            >
              {nav.cta}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>

            {/* Mobile hamburger */}
            <button
              ref={openButtonRef}
              className="mobile-menu-trigger"
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                display: 'none',
                flexDirection: 'column',
                gap: 5,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ display: 'block', width: 22, height: 1.5, background: 'var(--ink)', borderRadius: 1 }} />
              <span style={{ display: 'block', width: 16, height: 1.5, background: 'var(--ink)', borderRadius: 1 }} />
              <span style={{ display: 'block', width: 22, height: 1.5, background: 'var(--ink)', borderRadius: 1 }} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen menu ─────────────────────────────────────────── */}
      {/* design.md §10.1: "full-screen ink menu, large Space Grotesk items (44–56px), 60ms stagger" */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            className="mobile-menu"
            role="dialog"
            aria-label="Navigation menu"
            aria-modal="true"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Close button */}
            <button
              ref={closeButtonRef}
              aria-label="Close navigation menu"
              onClick={() => { setMenuOpen(false); openButtonRef.current?.focus() }}
              style={{
                position: 'absolute',
                top: 24,
                right: 'var(--grid-margin)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--paper)',
                padding: 8,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 5L19 19M5 19L19 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* Scene label */}
            <div className="scene-label" style={{ color: 'var(--muted)', marginBottom: 48 }}>
              FALCON 3D PRINTS
            </div>

            {/* Nav items */}
            <nav aria-label="Mobile navigation">
              {nav.links.map((link, i) => {
                const isRoute = link.href.startsWith('/')
                const resolvedHref = isRoute
                  ? link.href
                  : pathname === '/'
                    ? link.href
                    : '/' + link.href
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <a
                      href={resolvedHref}
                      className="mobile-menu-item"
                      onClick={(e) => handleNavClick(link.href, e)}
                    >
                      {link.label}
                    </a>
                  </motion.div>
                )
              })}
            </nav>

            {/* Contact info at bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              style={{ marginTop: 64 }}
            >
              <a
                href="/#contact"
                className="btn-primary"
                onClick={(e) => { if (pathname === '/') { e.preventDefault(); handleCtaClick() } }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {nav.cta}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS for responsive nav display */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-cta { display: inline-flex !important; }
          .mobile-menu-trigger { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
          .desktop-cta { display: none !important; }
          .mobile-menu-trigger { display: flex !important; }
        }
      `}</style>
    </>
  )
}

// ─── NavLink — animated underline + active dot ────────────────────────────────
interface NavLinkProps {
  href: string
  active?: boolean
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
}

function NavLink({ href, active, children, onClick }: NavLinkProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={href}
      className={active ? 'nav-link--active' : undefined}
      onClick={(e) => onClick?.(e)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
        fontSize: '0.6875rem',
        fontWeight: 500,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: active ? 'var(--falcon-orange)' : 'var(--ink)',
        textDecoration: 'none',
        padding: '4px 0',
        transition: 'color 0.22s ease-out',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}
      aria-current={active ? 'page' : undefined}
    >
      {/* Active scene dot */}
      {active && (
        <motion.span
          layoutId="nav-active-dot"
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--falcon-orange)',
            flexShrink: 0,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          aria-hidden="true"
        />
      )}

      {children}

      {/* Animated underline */}
      <motion.span
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 1,
          background: 'var(--falcon-orange)',
          scaleX: hovered || active ? 1 : 0,
          transformOrigin: 'left',
        }}
        animate={{ scaleX: hovered || active ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        aria-hidden="true"
      />
    </a>
  )
}
