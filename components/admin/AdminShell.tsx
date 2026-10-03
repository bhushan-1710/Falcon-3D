'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface AdminShellProps {
  userEmail: string
  children: React.ReactNode
}

const NAV_ITEMS = [
  { label: 'Dashboard',      href: '/admin',            icon: '▣', exact: true },
  { label: 'Projects',       href: '/admin/projects',   icon: '⬡' },
  { label: 'Products',       href: '/admin/products',   icon: '◈' },
  { label: 'Media',          href: '/admin/media',      icon: '⊞' },
  { label: 'Videos',         href: '/admin/videos',     icon: '▶' },
  { label: 'Website Content',href: '/admin/content',    icon: '✎' },
  { label: 'Navigation',     href: '/admin/navigation', icon: '⊶' },
  { label: 'Categories',     href: '/admin/categories', icon: '⊟' },
  { label: 'Settings',       href: '/admin/settings',   icon: '⚙' },
]

export function AdminShell({ userEmail, children }: AdminShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .ag-shell {
          display: flex;
          min-height: 100vh;
          background: #09090b;
          color: #e4e4e7;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 14px;
          line-height: 1.5;
        }

        /* ── Sidebar ─────────────────────────────── */
        .ag-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 232px;
          background: #111113;
          border-right: 1px solid #1f1f23;
          display: flex;
          flex-direction: column;
          z-index: 40;
          transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
        }

        .ag-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 18px 16px 16px;
          border-bottom: 1px solid #1f1f23;
          flex-shrink: 0;
        }
        .ag-brand-icon {
          width: 28px;
          height: 28px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 13px;
          color: #000;
          flex-shrink: 0;
        }
        .ag-brand-title {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: #f4f4f5;
        }
        .ag-brand-sub {
          font-size: 10px;
          color: #52525b;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .ag-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
          scrollbar-width: none;
        }
        .ag-nav::-webkit-scrollbar { display: none; }

        .ag-nav-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #3f3f46;
          padding: 8px 8px 4px;
        }

        .ag-nav-link {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 10px;
          border-radius: 7px;
          font-size: 13px;
          font-weight: 500;
          color: #71717a;
          text-decoration: none;
          transition: background 0.13s, color 0.13s;
          margin-bottom: 1px;
          cursor: pointer;
        }
        .ag-nav-link:hover {
          background: #1c1c21;
          color: #d4d4d8;
        }
        .ag-nav-link.active {
          background: #1f1c14;
          color: #f59e0b;
          font-weight: 600;
        }
        .ag-nav-link .icon {
          font-size: 14px;
          width: 18px;
          text-align: center;
          flex-shrink: 0;
          opacity: 0.8;
        }
        .ag-nav-link.active .icon {
          opacity: 1;
        }

        .ag-user {
          padding: 12px 14px;
          border-top: 1px solid #1f1f23;
          flex-shrink: 0;
        }
        .ag-user-email {
          font-size: 11.5px;
          color: #52525b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 8px;
          padding: 0 2px;
        }
        .ag-logout-btn {
          width: 100%;
          padding: 7px 12px;
          background: transparent;
          border: 1px solid #27272a;
          border-radius: 6px;
          color: #71717a;
          font-family: inherit;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.13s, color 0.13s;
          text-align: center;
        }
        .ag-logout-btn:hover {
          border-color: #3f3f46;
          color: #d4d4d8;
        }

        /* ── Mobile top bar ──────────────────────── */
        .ag-topbar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 52px;
          background: #111113;
          border-bottom: 1px solid #1f1f23;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          z-index: 50;
        }
        .ag-topbar-brand {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #f4f4f5;
        }
        .ag-hamburger {
          background: none;
          border: 1px solid #27272a;
          border-radius: 5px;
          color: #a1a1aa;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 16px;
          transition: border-color 0.13s, color 0.13s;
        }
        .ag-hamburger:hover { border-color: #3f3f46; color: #fff; }

        /* ── Overlay ─────────────────────────────── */
        .ag-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 35;
          backdrop-filter: blur(2px);
        }

        /* ── Main ────────────────────────────────── */
        .ag-main {
          flex: 1;
          min-width: 0;
          margin-left: 232px;
          padding: 32px 36px;
          max-width: 100%;
        }
        .ag-main-inner {
          max-width: 1180px;
          margin: 0 auto;
        }

        /* ── Responsive ──────────────────────────── */
        @media (max-width: 768px) {
          .ag-topbar { display: flex !important; }
          .ag-sidebar {
            transform: translateX(-100%);
            top: 52px;
            z-index: 45;
          }
          .ag-sidebar.open {
            transform: translateX(0);
          }
          .ag-overlay.open { display: block !important; }
          .ag-main {
            margin-left: 0 !important;
            padding: 80px 16px 32px !important;
          }
        }

        /* ── Shared page tokens ──────────────────── */
        .ag-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          margin-bottom: 28px;
        }
        .ag-page-title {
          font-size: 22px;
          font-weight: 700;
          color: #f4f4f5;
          margin: 0 0 4px 0;
          letter-spacing: -0.01em;
        }
        .ag-page-sub {
          font-size: 13px;
          color: #52525b;
          margin: 0;
        }

        .ag-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 7px;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.13s, color 0.13s, border-color 0.13s;
          white-space: nowrap;
          text-decoration: none;
        }
        .ag-btn-primary {
          background: #f59e0b;
          color: #000;
          border: none;
        }
        .ag-btn-primary:hover { background: #fbbf24; }
        .ag-btn-ghost {
          background: transparent;
          color: #71717a;
          border: 1px solid #27272a;
        }
        .ag-btn-ghost:hover { color: #d4d4d8; border-color: #3f3f46; background: #18181b; }
        .ag-btn-white {
          background: #f4f4f5;
          color: #09090b;
          border: none;
        }
        .ag-btn-white:hover { background: #fff; }
        .ag-btn-danger {
          background: rgba(239,68,68,0.1);
          color: #f87171;
          border: 1px solid rgba(239,68,68,0.4);
        }
        .ag-btn-danger:hover { background: rgba(239,68,68,0.18); }
        .ag-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .ag-card {
          background: #111113;
          border: 1px solid #1f1f23;
          border-radius: 10px;
        }
        .ag-card-lg {
          background: #111113;
          border: 1px solid #1f1f23;
          border-radius: 12px;
        }

        .ag-table-wrap {
          background: #111113;
          border: 1px solid #1f1f23;
          border-radius: 10px;
          overflow: hidden;
        }
        .ag-table-scroll { overflow-x: auto; }
        .ag-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
        }
        .ag-table thead tr {
          background: #0d0d10;
          border-bottom: 1px solid #1f1f23;
        }
        .ag-table th {
          padding: 11px 16px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #52525b;
          white-space: nowrap;
        }
        .ag-table td {
          padding: 11px 16px;
          color: #a1a1aa;
          border-bottom: 1px solid #18181b;
        }
        .ag-table tbody tr:last-child td { border-bottom: none; }
        .ag-table tbody tr:hover td { background: #131316; }
        .ag-table .cell-primary { color: #e4e4e7; font-weight: 600; }
        .ag-table .cell-mono { font-family: 'SF Mono', 'Fira Code', monospace; font-size: 11.5px; color: #71717a; }
        .ag-table .cell-actions { text-align: right; white-space: nowrap; }

        .ag-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.03em;
        }
        .ag-badge-green { background: rgba(74,222,128,0.1); color: #4ade80; }
        .ag-badge-yellow { background: rgba(250,204,21,0.1); color: #facc15; }
        .ag-badge-zinc { background: rgba(113,113,122,0.15); color: #71717a; }
        .ag-badge-red { background: rgba(239,68,68,0.1); color: #f87171; }
        .ag-badge-blue { background: rgba(56,189,248,0.1); color: #38bdf8; }

        .ag-input {
          width: 100%;
          padding: 8px 12px;
          background: #0d0d10;
          border: 1px solid #27272a;
          border-radius: 7px;
          color: #e4e4e7;
          font-family: inherit;
          font-size: 13px;
          outline: none;
          transition: border-color 0.13s;
          box-sizing: border-box;
        }
        .ag-input:focus { border-color: #f59e0b; }
        .ag-input::placeholder { color: #3f3f46; }

        .ag-label {
          display: block;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: #52525b;
          margin-bottom: 6px;
        }

        .ag-modal-bg {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.72);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 100;
        }
        .ag-modal {
          width: 100%;
          background: #111113;
          border: 1px solid #27272a;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.6);
        }
        .ag-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #1f1f23;
        }
        .ag-modal-title {
          font-size: 15px;
          font-weight: 700;
          color: #f4f4f5;
          margin: 0;
        }
        .ag-modal-close {
          background: none;
          border: none;
          color: #71717a;
          font-size: 20px;
          cursor: pointer;
          line-height: 1;
          padding: 2px 4px;
          border-radius: 4px;
          transition: color 0.13s, background 0.13s;
        }
        .ag-modal-close:hover { color: #f4f4f5; background: #27272a; }
        .ag-modal-body { padding: 20px; overflow-y: auto; }
        .ag-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px 20px;
          border-top: 1px solid #1f1f23;
        }

        .ag-status-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .ag-status-dot.green { background: #4ade80; box-shadow: 0 0 0 3px rgba(74,222,128,0.2); }
        .ag-status-dot.yellow { background: #facc15; box-shadow: 0 0 0 3px rgba(250,204,21,0.2); }
        .ag-status-dot.blue { background: #38bdf8; box-shadow: 0 0 0 3px rgba(56,189,248,0.2); }

        .ag-alert {
          padding: 11px 14px;
          border-radius: 8px;
          font-size: 13px;
          margin-bottom: 16px;
        }
        .ag-alert-success { background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.25); color: #4ade80; }
        .ag-alert-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }

        .ag-filter-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 12px 14px;
          background: #111113;
          border: 1px solid #1f1f23;
          border-radius: 10px;
          margin-bottom: 18px;
        }

        .ag-tabs {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #1f1f23;
          margin-bottom: 20px;
        }
        .ag-tab {
          padding: 9px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          color: #52525b;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.13s, border-color 0.13s;
        }
        .ag-tab:hover { color: #a1a1aa; }
        .ag-tab.active {
          color: #f59e0b;
          border-bottom-color: #f59e0b;
        }

        .ag-empty {
          padding: 48px 24px;
          text-align: center;
          color: #3f3f46;
          font-size: 13px;
        }

        .ag-spin {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid #27272a;
          border-top-color: #f59e0b;
          border-radius: 50%;
          animation: ag-spin 0.7s linear infinite;
        }
        @keyframes ag-spin { to { transform: rotate(360deg); } }

        .ag-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 48px;
          color: #52525b;
          font-size: 13px;
        }
      `}</style>

      <div className="ag-shell">
        {/* Mobile top bar */}
        <header className="ag-topbar">
          <span className="ag-topbar-brand">FALCON CMS</span>
          <button
            className="ag-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </header>

        {/* Overlay for mobile */}
        <div
          className={`ag-overlay ${mobileOpen ? 'open' : ''}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`ag-sidebar ${mobileOpen ? 'open' : ''}`}>
          {/* Brand */}
          <div className="ag-brand">
            <div className="ag-brand-icon">F</div>
            <div>
              <div className="ag-brand-title">FALCON STUDIO</div>
              <div className="ag-brand-sub">CMS Console</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="ag-nav">
            <div className="ag-nav-label">Workspace</div>
            {NAV_ITEMS.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`ag-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Footer */}
          <div className="ag-user">
            <div className="ag-user-email">{userEmail}</div>
            <button
              className="ag-logout-btn"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Signing out…' : 'Sign Out'}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="ag-main">
          <div className="ag-main-inner">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
