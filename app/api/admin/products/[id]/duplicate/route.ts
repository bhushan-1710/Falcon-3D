import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { logActivity } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function generateId(): string {
  return 'prod_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
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

    const original = await db.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<any>()
    if (!original) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const newId = generateId()
    const newTitle = `${original.title} (Copy)`
    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`

    const statements: any[] = [
      db.prepare(`
        INSERT INTO products (
          id, slug, title, subtitle, short_description, description,
          price, dimensions, material, customization, availability,
          category_id, status, is_featured, sort_order,
          featured_image_id, video_id, seo_title, seo_description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 0, ?, ?, ?, ?, ?)
      `).bind(
        newId,
        newSlug,
        newTitle,
        original.subtitle,
        original.short_description,
        original.description,
        original.price,
        original.dimensions,
        original.material,
        original.customization,
        original.availability,
        original.category_id,
        original.sort_order + 1,
        original.featured_image_id,
        original.video_id,
        original.seo_title,
        original.seo_description
      ),
    ]

    // Duplicate gallery references
    const galleryRes = await db.prepare('SELECT media_id, sort_order FROM product_media WHERE product_id = ?').bind(id).all<any>()
    if (galleryRes.results) {
      galleryRes.results.forEach((g: any) => {
        statements.push(
          db.prepare('INSERT INTO product_media (product_id, media_id, sort_order) VALUES (?, ?, ?)').bind(newId, g.media_id, g.sort_order)
        )
      })
    }

    await db.batch(statements)
    await logActivity(authCheck.user.id, 'product.duplicate', 'product', newId, { title: newTitle, originalId: id })

    return NextResponse.json({ success: true, product: { id: newId, slug: newSlug, title: newTitle } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate product' },
      { status: 500 }
    )
  }
}
