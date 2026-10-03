import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

function generateId(): string {
  return 'vid_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) {
      return authCheck.response
    }

    const db = await getDB()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const res = await db.prepare(`
      SELECT v.id, v.r2_key, v.external_url, v.title, v.description,
             v.duration_secs, v.thumbnail_id, v.created_at,
             m.key as thumb_key, m.alt_text as thumb_alt
      FROM videos v
      LEFT JOIN media m ON v.thumbnail_id = m.id
      WHERE v.deleted_at IS NULL
      ORDER BY v.created_at DESC
    `).all()

    return NextResponse.json({ videos: res.results || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) {
      return authCheck.response
    }
    const body = await request.json()
    const { title, description, external_url, duration_secs, thumbnail_id } = body

    if (!title || !external_url) {
      return NextResponse.json({ error: 'Title and external URL are required' }, { status: 400 })
    }

    // Validate YouTube / Vimeo or HTTPS URL
    if (!external_url.startsWith('https://')) {
      return NextResponse.json({ error: 'External URL must use HTTPS' }, { status: 400 })
    }

    const db = await getDB()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const id = generateId()
    await db.prepare(`
      INSERT INTO videos (id, external_url, title, description, duration_secs, thumbnail_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      external_url,
      title,
      description || null,
      duration_secs || null,
      thumbnail_id || null
    ).run()

    return NextResponse.json({
      success: true,
      video: {
        id,
        externalUrl: external_url,
        title,
        description,
        durationSecs: duration_secs,
        thumbnailId: thumbnail_id,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create external video' },
      { status: 500 }
    )
  }
}
