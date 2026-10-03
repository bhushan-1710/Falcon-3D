import { NextRequest, NextResponse } from 'next/server'
import { getDB, getMediaBucket } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

function generateId(): string {
  return 'vid_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
}

/**
 * Chunked multipart video uploads via R2 binding.
 * Actions: 'initiate' | 'upload_part' | 'complete' | 'abort'
 * Max size: 250 MB. Part size recommended: ~8 MB.
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) {
      return authCheck.response
    }

    const contentType = request.headers.get('content-type') || ''
    const bucket = await getMediaBucket()
    const db = await getDB()

    if (!bucket || !db) {
      return NextResponse.json({ error: 'Storage or Database unavailable' }, { status: 503 })
    }

    if (contentType.includes('multipart/form-data')) {
      // Handles upload_part action
      const formData = await request.formData()
      const action = formData.get('action') as string
      const uploadId = formData.get('upload_id') as string
      const key = formData.get('key') as string
      const partNumberStr = formData.get('part_number') as string
      const partFile = formData.get('part') as File | null

      if (action !== 'upload_part' || !uploadId || !key || !partNumberStr || !partFile) {
        return NextResponse.json({ error: 'Invalid upload_part parameters' }, { status: 400 })
      }

      const partNumber = parseInt(partNumberStr, 10)
      const partBuffer = new Uint8Array(await partFile.arrayBuffer())

      const upload = bucket.resumeMultipartUpload(key, uploadId)
      const uploadedPart = await upload.uploadPart(partNumber, partBuffer)

      return NextResponse.json({
        success: true,
        partNumber: uploadedPart.partNumber,
        etag: uploadedPart.etag,
      })
    }

    // JSON actions: initiate | complete | abort
    const body = await request.json()
    const { action } = body

    if (action === 'initiate') {
      const { filename, mime_type } = body
      if (!filename) {
        return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
      }

      const videoId = generateId()
      const safeName = sanitizeFilename(filename)
      const key = `videos/${videoId}/${safeName}`

      const upload = await bucket.createMultipartUpload(key, {
        httpMetadata: {
          contentType: mime_type || 'video/mp4',
          cacheControl: 'public, max-age=31536000, immutable',
        },
      })

      return NextResponse.json({
        success: true,
        videoId,
        uploadId: upload.uploadId,
        key,
      })
    }

    if (action === 'complete') {
      const { uploadId, key, videoId, title, description, parts, duration_secs, thumbnail_id, size_bytes } = body
      if (!uploadId || !key || !videoId || !title || !parts || !Array.isArray(parts)) {
        return NextResponse.json({ error: 'Missing completion parameters' }, { status: 400 })
      }

      const upload = bucket.resumeMultipartUpload(key, uploadId)
      await upload.complete(parts)

      // Only insert into D1 after complete finalize
      await db.prepare(`
        INSERT INTO videos (id, r2_key, title, description, mime_type, size_bytes, duration_secs, thumbnail_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        videoId,
        key,
        title,
        description || null,
        'video/mp4',
        size_bytes || 0,
        duration_secs || null,
        thumbnail_id || null
      ).run()

      return NextResponse.json({
        success: true,
        video: {
          id: videoId,
          r2Key: key,
          url: `/api/media/${key}`,
          title,
          description,
        },
      })
    }

    if (action === 'abort') {
      const { uploadId, key } = body
      if (!uploadId || !key) {
        return NextResponse.json({ error: 'Missing abort parameters' }, { status: 400 })
      }

      const upload = bucket.resumeMultipartUpload(key, uploadId)
      await upload.abort()

      return NextResponse.json({ success: true, aborted: true })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Video upload operation failed' },
      { status: 500 }
    )
  }
}
