import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { logActivity } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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
    const { name, description, image_id, sort_order, is_active } = body
    let { slug } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const current = await db.prepare('SELECT id, type, slug FROM categories WHERE id = ?').bind(id).first<{ id: string; type: string; slug: string }>()
    if (!current) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    slug = slug ? slugify(slug) : slugify(name)
    const duplicate = await db.prepare(
      'SELECT id FROM categories WHERE type = ? AND slug = ? AND id != ?'
    ).bind(current.type, slug, id).first()
    if (duplicate) {
      return NextResponse.json({ error: `A ${current.type} category with slug '${slug}' already exists` }, { status: 400 })
    }

    await db.prepare(`
      UPDATE categories
      SET name = ?, slug = ?, description = ?, image_id = ?, sort_order = ?, is_active = ?, updated_at = unixepoch()
      WHERE id = ?
    `).bind(
      name.trim(),
      slug,
      description || null,
      image_id || null,
      Number(sort_order ?? 0),
      is_active === false ? 0 : 1,
      id
    ).run()

    await logActivity(authCheck.user.id, 'category.update', 'category', id, { name, slug })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update category' },
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

    // Check if category has associated products or projects
    const hasProducts = await db.prepare('SELECT count(*) as count FROM products WHERE category_id = ?').bind(id).first<{ count: number }>()
    const hasProjects = await db.prepare('SELECT count(*) as count FROM projects WHERE category_id = ?').bind(id).first<{ count: number }>()

    if ((hasProducts?.count ?? 0) > 0 || (hasProjects?.count ?? 0) > 0) {
      return NextResponse.json(
        { error: `Cannot delete category: in use by ${(hasProducts?.count ?? 0) + (hasProjects?.count ?? 0)} item(s)` },
        { status: 400 }
      )
    }

    await db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run()
    await logActivity(authCheck.user.id, 'category.delete', 'category', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete category' },
      { status: 500 }
    )
  }
}
