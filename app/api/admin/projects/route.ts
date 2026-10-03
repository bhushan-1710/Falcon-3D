import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { logActivity } from '@/lib/auth'
import { getPublicUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

function generateId(): string {
  return 'proj_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const categoryId = searchParams.get('category_id')
    const q = searchParams.get('q')

    let query = `
      SELECT p.id, p.slug, p.title, p.subtitle, p.status, p.is_featured,
             p.sort_order, p.category_id, p.featured_image_id, p.created_at, p.updated_at,
             c.name as category_name,
             m.key as image_key, m.storage_path as image_storage_path, m.public_url as image_public_url,
             m.alt_text as image_alt
      FROM projects p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN media m ON p.featured_image_id = m.id AND m.deleted_at IS NULL
      WHERE p.deleted_at IS NULL
    `
    const params: any[] = []

    if (status) {
      query += ' AND p.status = ?'
      params.push(status)
    }
    if (categoryId) {
      query += ' AND p.category_id = ?'
      params.push(categoryId)
    }
    if (q) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.slug LIKE ?)'
      params.push(`%${q}%`, `%${q}%`, `%${q}%`)
    }

    query += ' ORDER BY p.sort_order ASC, p.created_at DESC'

    const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query)
    const res = await stmt.all()

    const projects = (res.results || []).map((row: any) => ({
      ...row,
      imageUrl: row.image_public_url || (row.image_storage_path ? getPublicUrl(row.image_storage_path) : (row.image_key ? getPublicUrl(row.image_key) : null)),
      isFeatured: Boolean(row.is_featured),
    }))

    return NextResponse.json({ projects })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const body = await request.json()
    const {
      title,
      subtitle,
      description,
      category_id,
      status = 'DRAFT',
      is_featured = false,
      sort_order = 0,
      featured_image_id,
      og_image_id,
      seo_title,
      seo_description,
      gallery = [],
    } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    let slug = body.slug ? slugify(body.slug) : slugify(title)
    if (!slug) slug = 'project-' + Date.now()

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    let finalSlug = slug
    let count = 1
    while (true) {
      const existing = await db.prepare('SELECT id FROM projects WHERE slug = ?').bind(finalSlug).first()
      if (!existing) break
      count++
      finalSlug = `${slug}-${count}`
    }

    const projectId = generateId()

    const statements: any[] = [
      db.prepare(`
        INSERT INTO projects (
          id, slug, title, subtitle, description, category_id,
          status, is_featured, sort_order, featured_image_id,
          og_image_id, seo_title, seo_description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        projectId,
        finalSlug,
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
        seo_description || null
      ),
    ]

    if (Array.isArray(gallery)) {
      gallery.forEach((mediaId: string, idx: number) => {
        statements.push(
          db.prepare('INSERT INTO project_media (project_id, media_id, sort_order) VALUES (?, ?, ?)').bind(projectId, mediaId, idx)
        )
      })
    }

    await db.batch(statements)
    await logActivity(authCheck.user.id, 'project.create', 'project', projectId, { title, slug: finalSlug, status })

    return NextResponse.json({
      success: true,
      project: { id: projectId, slug: finalSlug, title: title.trim(), status },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project' },
      { status: 500 }
    )
  }
}
