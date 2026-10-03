import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { logActivity } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function generateId(): string {
  return 'cat_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
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
    const type = searchParams.get('type')

    let query = `
      SELECT c.id, c.type, c.name, c.slug, c.description, c.image_id,
             c.sort_order, c.is_active, c.created_at, c.updated_at,
             m.key as image_key, m.alt_text as image_alt
      FROM categories c
      LEFT JOIN media m ON c.image_id = m.id
    `
    const params: string[] = []
    if (type) {
      query += ' WHERE c.type = ?'
      params.push(type)
    }
    query += ' ORDER BY c.sort_order ASC, c.name ASC'

    const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query)
    const res = await stmt.all()

    return NextResponse.json({ categories: res.results || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const body = await request.json()
    const { type, name, description, image_id, sort_order, is_active } = body
    let { slug } = body

    if (!type || !['project', 'product'].includes(type)) {
      return NextResponse.json({ error: "Type must be either 'project' or 'product'" }, { status: 400 })
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    slug = slug ? slugify(slug) : slugify(name)
    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    // Check unique (type, slug)
    const existing = await db.prepare(
      'SELECT id FROM categories WHERE type = ? AND slug = ?'
    ).bind(type, slug).first()
    if (existing) {
      return NextResponse.json({ error: `A ${type} category with slug '${slug}' already exists` }, { status: 400 })
    }

    const id = generateId()
    await db.prepare(`
      INSERT INTO categories (id, type, name, slug, description, image_id, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      type,
      name.trim(),
      slug,
      description || null,
      image_id || null,
      Number(sort_order ?? 0),
      is_active === false ? 0 : 1
    ).run()

    await logActivity(authCheck.user.id, 'category.create', 'category', id, { name, type, slug })

    return NextResponse.json({
      success: true,
      category: { id, type, name: name.trim(), slug, description, image_id, sort_order, is_active: is_active !== false },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create category' },
      { status: 500 }
    )
  }
}
