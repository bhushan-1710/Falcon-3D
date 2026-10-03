import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentAuth } from '@/lib/auth/guard'
import { getDB } from '@/lib/cloudflare/context'

export const dynamic = 'force-dynamic'

interface Counts {
  projectsTotal: number
  projectsPublished: number
  projectsDraft: number
  productsTotal: number
  productsPublished: number
  productsDraft: number
  mediaTotal: number
  videosTotal: number
}

interface ActivityItem {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  createdAt: number
}

export default async function AdminDashboardPage() {
  const auth = await getCurrentAuth()
  if (!auth) redirect('/admin/login')

  const db = await getDB()
  let counts: Counts = {
    projectsTotal: 0, projectsPublished: 0, projectsDraft: 0,
    productsTotal: 0, productsPublished: 0, productsDraft: 0,
    mediaTotal: 0, videosTotal: 0,
  }
  let recentActivity: ActivityItem[] = []

  if (db) {
    try {
      const projRow = await db.prepare(`
        SELECT count(*) as total,
               sum(case when status = 'PUBLISHED' then 1 else 0 end) as published,
               sum(case when status = 'DRAFT' then 1 else 0 end) as draft
        FROM projects WHERE deleted_at IS NULL
      `).first<{ total: number; published: number; draft: number }>()

      const prodRow = await db.prepare(`
        SELECT count(*) as total,
               sum(case when status = 'PUBLISHED' then 1 else 0 end) as published,
               sum(case when status = 'DRAFT' then 1 else 0 end) as draft
        FROM products WHERE deleted_at IS NULL
      `).first<{ total: number; published: number; draft: number }>()

      const mediaRow = await db.prepare(
        'SELECT count(*) as total FROM media WHERE deleted_at IS NULL'
      ).first<{ total: number }>()

      const videoRow = await db.prepare(
        'SELECT count(*) as total FROM videos WHERE deleted_at IS NULL'
      ).first<{ total: number }>()

      counts = {
        projectsTotal: projRow?.total ?? 0,
        projectsPublished: projRow?.published ?? 0,
        projectsDraft: projRow?.draft ?? 0,
        productsTotal: prodRow?.total ?? 0,
        productsPublished: prodRow?.published ?? 0,
        productsDraft: prodRow?.draft ?? 0,
        mediaTotal: mediaRow?.total ?? 0,
        videosTotal: videoRow?.total ?? 0,
      }

      const actRes = await db.prepare(`
        SELECT id, action, entity_type, entity_id, created_at
        FROM activity_log
        ORDER BY created_at DESC
        LIMIT 8
      `).all<{ id: string; action: string; entity_type: string | null; entity_id: string | null; created_at: number }>()

      if (actRes.results) {
        recentActivity = actRes.results.map((r: any) => ({
          id: r.id, action: r.action, entityType: r.entity_type,
          entityId: r.entity_id, createdAt: r.created_at,
        }))
      }
    } catch {}
  }

  const METRICS = [
    {
      label: 'Products',
      value: counts.productsTotal,
      sub: [
        { label: 'Published', val: counts.productsPublished, cls: 'ag-badge-green' },
        { label: 'Draft', val: counts.productsDraft, cls: 'ag-badge-yellow' },
      ],
    },
    {
      label: 'Projects',
      value: counts.projectsTotal,
      sub: [
        { label: 'Published', val: counts.projectsPublished, cls: 'ag-badge-green' },
        { label: 'Draft', val: counts.projectsDraft, cls: 'ag-badge-yellow' },
      ],
    },
    {
      label: 'Media Assets',
      value: counts.mediaTotal,
      sub: [{ label: 'Stored in Supabase', val: null, cls: '' }],
    },
    {
      label: 'Videos',
      value: counts.videosTotal,
      sub: [{ label: 'Hosted & external', val: null, cls: '' }],
    },
  ]

  const QUICK_ACTIONS = [
    { label: '+ Create New Product', href: '/admin/products?action=new' },
    { label: '+ Create Workshop Project', href: '/admin/projects?action=new' },
    { label: 'Upload Media to Supabase', href: '/admin/media' },
    { label: 'Edit Website Copy & CTAs', href: '/admin/content' },
    { label: 'Manage Navigation Links', href: '/admin/navigation' },
    { label: 'Studio Settings & System', href: '/admin/settings' },
  ]

  return (
    <>
      {/* Page header */}
      <div className="ag-page-header">
        <div>
          <h1 className="ag-page-title">Dashboard</h1>
          <p className="ag-page-sub">Overview · Turso DB + Supabase Storage</p>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {METRICS.map((m) => (
          <div key={m.label} className="ag-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#52525b', marginBottom: '10px' }}>
              {m.label}
            </div>
            <div style={{ fontSize: '36px', fontWeight: 700, color: '#f4f4f5', lineHeight: 1, marginBottom: '10px' }}>
              {m.value}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {m.sub.map((s, i) =>
                s.val !== null ? (
                  <span key={i} className={`ag-badge ${s.cls}`}>
                    {s.val} {s.label}
                  </span>
                ) : (
                  <span key={i} style={{ fontSize: '11px', color: '#3f3f46' }}>{s.label}</span>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom 2-col */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Quick actions */}
        <div className="ag-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>
            Quick Actions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: '#d4d4d8',
                  textDecoration: 'none',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'background 0.13s, border-color 0.13s',
                }}
                className="ag-quick-link"
              >
                <span>{a.label}</span>
                <span style={{ color: '#3f3f46', fontSize: '16px' }}>›</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="ag-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>
            Recent Activity
          </div>
          {recentActivity.length === 0 ? (
            <div className="ag-empty" style={{ padding: '24px 0' }}>No recorded activity yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recentActivity.map((act, i) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 0',
                    borderBottom: i < recentActivity.length - 1 ? '1px solid #18181b' : 'none',
                    gap: '12px',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '13px', color: '#d4d4d8', fontWeight: 500 }}>{act.action}</span>
                    {act.entityType && (
                      <span style={{ fontSize: '11px', color: '#3f3f46', marginLeft: '6px' }}>({act.entityType})</span>
                    )}
                  </div>
                  <span style={{ fontSize: '11px', color: '#3f3f46', flexShrink: 0 }}>
                    {new Date(act.createdAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ag-quick-link:hover {
          background: #222226 !important;
          border-color: #3f3f46 !important;
          color: #f4f4f5 !important;
        }
      `}</style>
    </>
  )
}
