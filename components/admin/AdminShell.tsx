'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface AdminShellProps {
  userEmail: string
  children: React.ReactNode
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Projects', href: '/admin/projects', icon: '🛠️' },
  { label: 'Products', href: '/admin/products', icon: '📦' },
  { label: 'Media', href: '/admin/media', icon: '🖼️' },
  { label: 'Videos', href: '/admin/videos', icon: '🎬' },
  { label: 'Website Content', href: '/admin/content', icon: '📝' },
  { label: 'Navigation', href: '/admin/navigation', icon: '🧭' },
  { label: 'Categories', href: '/admin/categories', icon: '🏷️' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
]

export function AdminShell({ userEmail, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#0c0c0e',
      color: '#f4f4f5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Mobile Top Header (<= 768px) */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        backgroundColor: '#141418',
        borderBottom: '1px solid #27272a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 50,
      }} className="admin-mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '1px' }}>FALCON CMS</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation"
          style={{
            background: 'none',
            border: '1px solid #3f3f46',
            color: '#fff',
            borderRadius: '4px',
            padding: '6px 10px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Sidebar (Desktop permanent / Mobile drawer) */}
      <aside
        style={{
          width: '240px',
          backgroundColor: '#111114',
          borderRight: '1px solid #27272a',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
          transition: 'transform 0.2s ease-in-out',
        }}
        className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}
      >
        {/* Brand */}
        <div style={{
          padding: '20px 20px',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            backgroundColor: '#fff',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 800,
            fontSize: '12px',
          }}>
            F
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.5px' }}>FALCON STUDIO</div>
            <div style={{ fontSize: '10px', color: '#71717a', letterSpacing: '1px' }}>CMS CONSOLE</div>
          </div>
        </div>

        {/* Navigation list */}
        <nav style={{ flex: 1, padding: '16px 10px', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#fff' : '#a1a1aa',
                  backgroundColor: isActive ? '#27272a' : 'transparent',
                  textDecoration: 'none',
                  marginBottom: '2px',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User & Logout Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid #27272a',
          backgroundColor: '#0d0d10',
        }}>
          <div style={{
            fontSize: '12px',
            color: '#e4e4e7',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '8px',
          }}>
            {userEmail}
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: '100%',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid #3f3f46',
              borderRadius: '4px',
              color: '#d4d4d8',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            {loggingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        marginLeft: '240px',
        padding: '32px',
        minWidth: 0,
      }} className="admin-main">
        {children}
      </main>

      <style jsx global>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            transform: translateX(-100%);
            top: calc(56px + env(safe-area-inset-top, 0px)) !important;
          }
          .admin-sidebar.open {
            transform: translateX(0);
          }
          .admin-main {
            margin-left: 0 !important;
            padding: calc(72px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right)) 24px max(16px, env(safe-area-inset-left)) !important;
          }
          .admin-mobile-header {
            display: flex !important;
            height: calc(56px + env(safe-area-inset-top, 0px)) !important;
            padding-top: env(safe-area-inset-top, 0px) !important;
            padding-left: max(16px, env(safe-area-inset-left)) !important;
            padding-right: max(16px, env(safe-area-inset-right)) !important;
          }
        }
        @media (min-width: 769px) {
          .admin-mobile-header {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
