import { NextRequest, NextResponse } from 'next/server'
import { getDB, getMediaBucket } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { logActivity } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const db = await getDB()
    const bucket = await getMediaBucket()

    let d1Status = 'disconnected'
    let userCount = 0
    let auditLogs: any[] = []

    if (db) {
      try {
        const u = await db.prepare('SELECT count(*) as count FROM users').first<any>()
        userCount = u?.count ?? 0
        d1Status = 'connected'

        const logs = await db.prepare(`
          SELECT a.id, a.action, a.target_type, a.target_id, a.details, a.created_at, u.email as user_email
          FROM audit_logs a
          LEFT JOIN users u ON a.user_id = u.id
          ORDER BY a.created_at DESC
          LIMIT 25
        `).all<any>()
        auditLogs = logs.results || []
      } catch (err) {
        d1Status = 'error: ' + (err instanceof Error ? err.message : String(err))
      }
    }

    const r2Status = bucket ? 'connected' : 'unbound (local dev / simulated)'

    // Fetch studio_settings from website_content if any
    let studioSettings: any = {
      studioName: 'Falcon 3D Prints',
      contactEmail: 'contact@falcon3dprints.com',
      whatsappNumber: '+91 98765 43210',
      currency: 'INR (₹)',
      location: 'Bangalore, India',
    }

    if (db && d1Status === 'connected') {
      try {
        const s = await db.prepare("SELECT content_json FROM website_content WHERE section_key = 'studio_settings'").first<any>()
        if (s && s.content_json) {
          studioSettings = { ...studioSettings, ...JSON.parse(s.content_json) }
        }
      } catch {}
    }

    return NextResponse.json({
      system: {
        d1: d1Status,
        r2: r2Status,
        users: userCount,
        framework: 'Next.js 16 (React 19) on Cloudflare Workers',
        adapter: '@opennextjs/cloudflare',
      },
      settings: studioSettings,
      auditLogs,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const body = await request.json()
    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const validatedJson = JSON.stringify(body)

    await db.prepare(`
      INSERT INTO website_content (section_key, content_json, updated_at)
      VALUES ('studio_settings', ?, unixepoch())
      ON CONFLICT(section_key) DO UPDATE SET
        content_json = excluded.content_json,
        updated_at = unixepoch()
    `).bind(validatedJson).run()

    await logActivity(authCheck.user.id, 'settings.update', 'studio_settings', 'global', body)

    return NextResponse.json({ success: true, settings: body })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    )
  }
}
