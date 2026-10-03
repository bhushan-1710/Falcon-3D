import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    let query = `
      SELECT id, key, filename, mime_type, size_bytes, width, height, alt_text, caption, created_at
      FROM media
      WHERE deleted_at IS NULL
    `
    const params: string[] = []
    if (q) {
      query += ' AND (filename LIKE ? OR alt_text LIKE ?)'
      params.push(`%${q}%`, `%${q}%`)
    }
    query += ' ORDER BY created_at DESC LIMIT 100'

    const stmt = params.length > 0 ? db.prepare(query).bind(...params) : db.prepare(query)
    const res = await stmt.all()

    const media = (res.results || []).map((m: any) => ({
      ...m,
      url: `/api/media/${m.key}`,
    }))

    return NextResponse.json({ media })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch media' },
      { status: 500 }
    )
  }
}
