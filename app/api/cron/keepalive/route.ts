import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { pingSupabaseStorage } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET

    // Enforce authorization if CRON_SECRET is configured
    if (cronSecret) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // 1. Trivial Turso query to keep database warm
    let tursoStatus = 'disconnected'
    try {
      const db = await getDB()
      if (db) {
        const ping = await db.prepare('SELECT 1 as ok').first<any>()
        if (ping && ping.ok === 1) {
          tursoStatus = 'active'
        }
      }
    } catch (err: any) {
      tursoStatus = `error: ${err.message}`
    }

    // 2. Lightweight Supabase Storage request to prevent project inactivity pause
    const storagePing = await pingSupabaseStorage()

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      turso: tursoStatus,
      supabaseStorage: storagePing,
      note: 'Keep-alive ping executed successfully. Free tier projects must maintain monthly active logins.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Keepalive execution failed' },
      { status: 500 }
    )
  }
}
