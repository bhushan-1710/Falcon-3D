import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { logActivity } from '@/lib/auth'

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

    const product = await db.prepare(`
      SELECT p.*, c.name as category_name,
             m.key as image_key
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN media m ON p.featured_image_id = m.id
      WHERE p.id = ?
    `).bind(id).first()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Fetch gallery media ids
    const galleryRes = await db.prepare(`
      SELECT pm.media_id, pm.sort_order, m.key
      FROM product_media pm
      LEFT JOIN media m ON pm.media_id = m.id
      WHERE pm.product_id = ?
      ORDER BY pm.sort_order ASC
    `).bind(id).all()

    return NextResponse.json({
      product: {
        ...product,
        imageUrl: (product as any).image_key ? `/api/media/${(product as any).image_key}` : null,
        is_featured: Boolean((product as any).is_featured),
        gallery: galleryRes.results || [],
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch product' },
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
      short_description,
      description,
      price,
      dimensions,
      material,
      customization,
      availability,
      category_id,
      status,
      is_featured,
      sort_order,
      featured_image_id,
      video_id,
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
    // Check slug collision with other products
    const collision = await db.prepare(
      'SELECT id FROM products WHERE slug = ? AND id != ?'
    ).bind(slug, id).first()
    if (collision) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`
    }

    const statements: any[] = [
      db.prepare(`
        UPDATE products SET
          slug = ?, title = ?, subtitle = ?, short_description = ?, description = ?,
          price = ?, dimensions = ?, material = ?, customization = ?, availability = ?,
          category_id = ?, status = ?, is_featured = ?, sort_order = ?,
          featured_image_id = ?, video_id = ?, seo_title = ?, seo_description = ?,
          updated_at = unixepoch()
        WHERE id = ?
      `).bind(
        slug,
        title.trim(),
        subtitle || null,
        short_description || null,
        description || null,
        price || null,
        dimensions || null,
        material || null,
        customization || null,
        availability || null,
        category_id || null,
        ['DRAFT', 'PUBLISHED', 'ARCHIVED'].includes(status) ? status : 'DRAFT',
        is_featured ? 1 : 0,
        Number(sort_order || 0),
        featured_image_id || null,
        video_id || null,
        seo_title || null,
        seo_description || null,
        id
      ),
    ]

    // If gallery is provided, replace product_media
    if (Array.isArray(gallery)) {
      statements.push(db.prepare('DELETE FROM product_media WHERE product_id = ?').bind(id))
      gallery.forEach((mediaId: string, idx: number) => {
        statements.push(
          db.prepare('INSERT INTO product_media (product_id, media_id, sort_order) VALUES (?, ?, ?)').bind(id, mediaId, idx)
        )
      })
    }

    await db.batch(statements)
    await logActivity(authCheck.user.id, 'product.update', 'product', id, { title, slug, status })

    return NextResponse.json({ success: true, slug })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update product' },
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

    const product = await db.prepare('SELECT id, title, status FROM products WHERE id = ?').bind(id).first<{ id: string; title: string; status: string }>()
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // STRICT RULE: Delete only for archived items with confirmation
    if (product.status !== 'ARCHIVED') {
      return NextResponse.json(
        { error: `Cannot delete product with status '${product.status}'. You must archive it first before deleting.` },
        { status: 400 }
      )
    }

    // Hard delete or soft delete
    await db.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
    await logActivity(authCheck.user.id, 'product.delete', 'product', id, { title: product.title })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete product' },
      { status: 500 }
    )
  }
}
