import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { logActivity } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function generateId(): string {
  return 'proj_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const { id } = await params
    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const original = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first<any>()
    if (!original) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const newId = generateId()
    const newTitle = `${original.title} (Copy)`
    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`

    const statements: any[] = [
      db.prepare(`
        INSERT INTO projects (
          id, slug, title, subtitle, description, category_id,
          status, is_featured, sort_order, featured_image_id,
          og_image_id, seo_title, seo_description
        ) VALUES (?, ?, ?, ?, ?, ?, 'DRAFT', 0, ?, ?, ?, ?, ?)
      `).bind(
        newId,
        newSlug,
        newTitle,
        original.subtitle,
        original.description,
        original.category_id,
        original.sort_order + 1,
        original.featured_image_id,
        original.og_image_id,
        original.seo_title,
        original.seo_description
      ),
    ]

    const galleryRes = await db.prepare('SELECT media_id, sort_order FROM project_media WHERE project_id = ?').bind(id).all<any>()
    if (galleryRes.results) {
      galleryRes.results.forEach((g: any) => {
        statements.push(
          db.prepare('INSERT INTO project_media (project_id, media_id, sort_order) VALUES (?, ?, ?)').bind(newId, g.media_id, g.sort_order)
        )
      })
    }

    await db.batch(statements)
    await logActivity(authCheck.user.id, 'project.duplicate', 'project', newId, { title: newTitle, originalId: id })

    return NextResponse.json({ success: true, project: { id: newId, slug: newSlug, title: newTitle } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate project' },
      { status: 500 }
    )
  }
}
