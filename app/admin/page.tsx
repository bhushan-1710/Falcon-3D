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
  if (!auth) {
    redirect('/admin/login')
  }

  const db = await getDB()
  let counts: Counts = {
    projectsTotal: 0,
    projectsPublished: 0,
    projectsDraft: 0,
    productsTotal: 0,
    productsPublished: 0,
    productsDraft: 0,
    mediaTotal: 0,
    videosTotal: 0,
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
          id: r.id,
          action: r.action,
          entityType: r.entity_type,
          entityId: r.entity_id,
          createdAt: r.created_at,
        }))
      }
    } catch {}
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', margin: '0 0 6px 0' }}>
          Dashboard Overview
        </h1>
        <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
          Real-time metrics from Cloudflare D1 & R2
        </p>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        {/* Products Card */}
        <div style={{
          backgroundColor: '#141418',
          border: '1px solid #27272a',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Products
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', margin: '10px 0 6px 0' }}>
            {counts.productsTotal}
          </div>
          <div style={{ fontSize: '12px', color: '#71717a', display: 'flex', gap: '12px' }}>
            <span><strong style={{ color: '#4ade80' }}>{counts.productsPublished}</strong> Published</span>
            <span><strong style={{ color: '#facc15' }}>{counts.productsDraft}</strong> Draft</span>
          </div>
        </div>

        {/* Projects Card */}
        <div style={{
          backgroundColor: '#141418',
          border: '1px solid #27272a',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Workshop Projects
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', margin: '10px 0 6px 0' }}>
            {counts.projectsTotal}
          </div>
          <div style={{ fontSize: '12px', color: '#71717a', display: 'flex', gap: '12px' }}>
            <span><strong style={{ color: '#4ade80' }}>{counts.projectsPublished}</strong> Published</span>
            <span><strong style={{ color: '#facc15' }}>{counts.projectsDraft}</strong> Draft</span>
          </div>
        </div>

        {/* Media Card */}
        <div style={{
          backgroundColor: '#141418',
          border: '1px solid #27272a',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Media Library
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', margin: '10px 0 6px 0' }}>
            {counts.mediaTotal}
          </div>
          <div style={{ fontSize: '12px', color: '#71717a' }}>
            Objects stored in R2 Bucket
          </div>
        </div>

        {/* Videos Card */}
        <div style={{
          backgroundColor: '#141418',
          border: '1px solid #27272a',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Video Demonstrations
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#fff', margin: '10px 0 6px 0' }}>
            {counts.videosTotal}
          </div>
          <div style={{ fontSize: '12px', color: '#71717a' }}>
            R2 Hosted & External URLs
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px',
      }}>
        {/* Quick Actions */}
        <div style={{
          backgroundColor: '#141418',
          border: '1px solid #27272a',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 16px 0' }}>
            Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href="/admin/products?action=new"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#1e1e24',
                border: '1px solid #2e2e36',
                borderRadius: '6px',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <span>+ Create New Product</span>
              <span style={{ color: '#71717a' }}>→</span>
            </Link>
            <Link
              href="/admin/projects?action=new"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#1e1e24',
                border: '1px solid #2e2e36',
                borderRadius: '6px',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <span>+ Create Workshop Project</span>
              <span style={{ color: '#71717a' }}>→</span>
            </Link>
            <Link
              href="/admin/media"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#1e1e24',
                border: '1px solid #2e2e36',
                borderRadius: '6px',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <span>🖼️ Upload Media to R2</span>
              <span style={{ color: '#71717a' }}>→</span>
            </Link>
            <Link
              href="/admin/content"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                backgroundColor: '#1e1e24',
                border: '1px solid #2e2e36',
                borderRadius: '6px',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <span>📝 Edit Website Copy & CTAs</span>
              <span style={{ color: '#71717a' }}>→</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{
          backgroundColor: '#141418',
          border: '1px solid #27272a',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 16px 0' }}>
            Recent Activity
          </h2>
          {recentActivity.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
              No recorded activity yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivity.map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: '1px solid #27272a',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <span style={{ color: '#e4e4e7', fontWeight: 500 }}>{act.action}</span>
                    {act.entityType && (
                      <span style={{ color: '#71717a', marginLeft: '6px' }}>({act.entityType})</span>
                    )}
                  </div>
                  <div style={{ color: '#52525b', fontSize: '11px' }}>
                    {new Date(act.createdAt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
