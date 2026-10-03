import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { logActivity } from '@/lib/auth'

import { getPublicUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const { id } = await params
    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const project = await db.prepare(`
      SELECT p.*, c.name as category_name,
             m.key as image_key, m.storage_path as image_storage_path, m.public_url as image_public_url
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN media m ON p.featured_image_id = m.id AND m.deleted_at IS NULL
      WHERE p.id = ?
    `).bind(id).first<any>()

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const galleryRes = await db.prepare(`
      SELECT pm.media_id, pm.sort_order, m.key, m.storage_path, m.public_url
      FROM project_media pm
      LEFT JOIN media m ON pm.media_id = m.id AND m.deleted_at IS NULL
      WHERE pm.project_id = ?
      ORDER BY pm.sort_order ASC
    `).bind(id).all<any>()

    const gallery = (galleryRes.results || []).map((g: any) => ({
      ...g,
      url: g.public_url || (g.storage_path ? getPublicUrl(g.storage_path) : (g.key ? getPublicUrl(g.key) : null)),
    }))

    const imageUrl = project.image_public_url || (project.image_storage_path ? getPublicUrl(project.image_storage_path) : (project.image_key ? getPublicUrl(project.image_key) : null))

    return NextResponse.json({
      project: {
        ...project,
        imageUrl,
        is_featured: Boolean(project.is_featured),
        gallery,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const { id } = await params
    const body = await request.json()
    const {
      title,
      subtitle,
      description,
      category_id,
      status,
      is_featured,
      sort_order,
      featured_image_id,
      og_image_id,
      seo_title,
      seo_description,
      gallery,
    } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    let slug = body.slug ? slugify(body.slug) : slugify(title)
    const collision = await db.prepare(
      'SELECT id FROM projects WHERE slug = ? AND id != ?'
    ).bind(slug, id).first()
    if (collision) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    const statements: any[] = [
      db.prepare(`
        UPDATE projects SET
          slug = ?, title = ?, subtitle = ?, description = ?, category_id = ?,
          status = ?, is_featured = ?, sort_order = ?, featured_image_id = ?,
          og_image_id = ?, seo_title = ?, seo_description = ?, updated_at = unixepoch()
        WHERE id = ?
      `).bind(
        slug,
        title.trim(),
        subtitle || null,
        description || null,
        category_id || null,
        ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status) ? status : 'DRAFT',
        is_featured ? 1 : 0,
        Number(sort_order || 0),
        featured_image_id || null,
        og_image_id || null,
        seo_title || null,
        seo_description || null,
        id
      ),
    ]

    if (Array.isArray(gallery)) {
      statements.push(db.prepare('DELETE FROM project_media WHERE project_id = ?').bind(id))
      gallery.forEach((mediaId: string, idx: number) => {
        statements.push(
          db.prepare('INSERT INTO project_media (project_id, media_id, sort_order) VALUES (?, ?, ?)').bind(id, mediaId, idx)
        )
      })
    }

    await db.batch(statements)
    await logActivity(authCheck.user.id, 'project.update', 'project', id, { title, slug, status })

    return NextResponse.json({ success: true, slug })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const { id } = await params
    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const project = await db.prepare('SELECT id, title, status FROM projects WHERE id = ?').bind(id).first<{ id: string; title: string; status: string }>()
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // STRICT RULE: Delete only for archived items with confirmation
    if (project.status !== 'ARCHIVED') {
      return NextResponse.json(
        { error: `Cannot delete project with status '${project.status}'. You must archive it first before deleting.` },
        { status: 400 }
      )
    }

    await db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run()
    await logActivity(authCheck.user.id, 'project.delete', 'project', id, { title: project.title })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete project' },
      { status: 500 }
    )
  }
}
