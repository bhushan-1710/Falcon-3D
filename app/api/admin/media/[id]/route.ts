import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { checkMediaUsage } from '@/lib/media/usage'
import { logActivity } from '@/lib/auth'
import { deleteObject } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const mediaRow = await db
      .prepare('SELECT id, key, storage_path, filename FROM media WHERE id = ?')
      .bind(id)
      .first<{ id: string; key: string; storage_path?: string; filename: string }>()
    if (!mediaRow) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Usage check for delete-with-warning
    const usage = await checkMediaUsage(id)
    if (usage.inUse && !force) {
      return NextResponse.json({
        error: 'Media is currently in use',
        warning: true,
        references: usage.references,
        totalReferences: usage.totalReferences,
      }, { status: 409 }) // Conflict status requiring confirmation
    }

    // Delete or soft-delete
    await db.prepare('UPDATE media SET deleted_at = unixepoch() WHERE id = ?').bind(id).run()
    // Also remove from Supabase / file storage
    await deleteObject(mediaRow.storage_path || mediaRow.key)

    await logActivity(authCheck.user.id, 'media.delete', 'media', id, { filename: mediaRow.filename })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete media' },
      { status: 500 }
    )
  }
}
