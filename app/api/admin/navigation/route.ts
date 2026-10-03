import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { logActivity } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function generateId(): string {
  return 'nav_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const res = await db.prepare(`
      SELECT id, label, url, is_external, open_new_tab, is_visible, sort_order
      FROM navigation_items
      ORDER BY sort_order ASC
    `).all()

    return NextResponse.json({ items: res.results || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch navigation items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const body = await request.json()
    const { id, label, url, is_external, open_new_tab, is_visible, sort_order } = body

    if (!label || !url) {
      return NextResponse.json({ error: 'Label and URL are required' }, { status: 400 })
    }

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const navId = id || generateId()

    await db.prepare(`
      INSERT INTO navigation_items (id, label, url, is_external, open_new_tab, is_visible, sort_order, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
      ON CONFLICT(id) DO UPDATE SET
        label = excluded.label,
        url = excluded.url,
        is_external = excluded.is_external,
        open_new_tab = excluded.open_new_tab,
        is_visible = excluded.is_visible,
        sort_order = excluded.sort_order,
        updated_at = unixepoch()
    `).bind(
      navId,
      label.trim(),
      url.trim(),
      is_external ? 1 : 0,
      open_new_tab ? 1 : 0,
      is_visible !== false ? 1 : 0,
      Number(sort_order || 0)
    ).run()

    await logActivity(authCheck.user.id, 'navigation.save', 'navigation_item', navId, { label, url })

    return NextResponse.json({ success: true, item: { id: navId, label, url } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save navigation item' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    await db.prepare('DELETE FROM navigation_items WHERE id = ?').bind(id).run()
    await logActivity(authCheck.user.id, 'navigation.delete', 'navigation_item', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete navigation item' },
      { status: 500 }
    )
  }
}
