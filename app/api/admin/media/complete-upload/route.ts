import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { getDB } from '@/lib/db'
import { getPublicUrl, deleteObject, verifyStoredObject } from '@/lib/storage'
import { logActivity } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const body = await request.json()
    const { id, storagePath, filename, mime_type, size_bytes, width, height, duration_secs, alt_text, title, is_video } = body

    if (!id || !storagePath || !filename || !mime_type) {
      return NextResponse.json({ error: 'Missing required upload completion metadata' }, { status: 400 })
    }

    // Verify declared mime type is safe
    if (mime_type.toLowerCase().includes('svg')) {
      await deleteObject(storagePath)
      return NextResponse.json({ error: 'SVG uploads are strictly disallowed' }, { status: 400 })
    }

    // Verify stored object directly (checks magic bytes and removes object if verification fails)
    const verification = await verifyStoredObject(storagePath, Boolean(is_video))
    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || 'Stored object validation failed and file was removed' },
        { status: 400 }
      )
    }

    const db = await getDB()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const publicUrl = getPublicUrl(storagePath)

    if (is_video) {
      // Record in videos table
      await db.prepare(`
        INSERT INTO videos (id, title, description, mime_type, size_bytes, duration_secs, storage_path, public_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())
      `).bind(
        id,
        title || filename,
        alt_text || null,
        mime_type,
        size_bytes || null,
        duration_secs || null,
        storagePath,
        publicUrl
      ).run()

      await logActivity(authCheck.user.id, 'video.upload', 'video', id, { filename, publicUrl })

      return NextResponse.json({
        success: true,
        video: {
          id,
          title: title || filename,
          url: publicUrl,
          storagePath,
          mimeType: mime_type,
          sizeBytes: size_bytes,
        },
      })
    }

    // Record in media table
    await db.prepare(`
      INSERT INTO media (id, key, filename, mime_type, size_bytes, width, height, alt_text, caption, storage_path, public_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())
    `).bind(
      id,
      storagePath, // key for compatibility
      filename,
      mime_type,
      size_bytes || 0,
      width || null,
      height || null,
      alt_text || null,
      null,
      storagePath,
      publicUrl
    ).run()

    await logActivity(authCheck.user.id, 'media.direct_upload', 'media', id, { filename, publicUrl })

    return NextResponse.json({
      success: true,
      media: {
        id,
        filename,
        url: publicUrl,
        storagePath,
        mimeType: mime_type,
        sizeBytes: size_bytes,
        width,
        height,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Complete upload failed' },
      { status: 500 }
    )
  }
}
