import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/db'
import { validateImageUpload } from '@/lib/media/validation'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { putObject } from '@/lib/storage'
import { logActivity } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Vercel serverless request body limit is ~4.5 MB
const MAX_SERVER_UPLOAD_BYTES = 4.5 * 1024 * 1024

function generateId(): string {
  return 'med_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) {
      return authCheck.response
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const altText = formData.get('alt_text') as string | null
    const caption = formData.get('caption') as string | null
    const widthRaw = formData.get('width') as string | null
    const heightRaw = formData.get('height') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_SERVER_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 4.5 MB serverless limit. Please use direct upload for larger files.`,
        },
        { status: 413 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    const declaredMime = file.type
    const declaredSize = file.size

    // 1. Strict validation: Size, MIME allowlist, magic bytes, strict SVG rejection
    const validation = validateImageUpload(buffer, declaredMime, declaredSize)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 2. Prepare database
    const db = await getDB()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    // 3. Generate storage path and upload to Supabase Storage
    const mediaId = generateId()
    const safeName = sanitizeFilename(file.name || 'image.webp')
    const storagePath = `media/${mediaId}/${safeName}`

    const mimeType = validation.detectedMime || file.type || 'image/jpeg'
    const uploadRes = await putObject(storagePath, buffer, mimeType)
    if (!uploadRes.success) {
      return NextResponse.json({ error: uploadRes.error || 'Failed to upload to storage' }, { status: 502 })
    }

    // 4. Record in database (storing storage_path and public_url)
    const width = widthRaw ? parseInt(widthRaw, 10) : null
    const height = heightRaw ? parseInt(heightRaw, 10) : null

    await db.prepare(`
      INSERT INTO media (id, key, filename, mime_type, size_bytes, width, height, alt_text, caption, storage_path, public_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      mediaId,
      storagePath, // key stored for backwards compatibility
      file.name,
      validation.detectedMime,
      buffer.length,
      isNaN(width as number) ? null : width,
      isNaN(height as number) ? null : height,
      altText || null,
      caption || null,
      storagePath,
      uploadRes.publicUrl
    ).run()

    await logActivity(authCheck.user.id, 'media.upload', 'media', mediaId, {
      filename: file.name,
      sizeBytes: buffer.length,
      publicUrl: uploadRes.publicUrl,
    })

    return NextResponse.json({
      success: true,
      media: {
        id: mediaId,
        key: storagePath,
        storagePath,
        url: uploadRes.publicUrl,
        filename: file.name,
        mimeType: validation.detectedMime,
        sizeBytes: buffer.length,
        width,
        height,
        altText,
        caption,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload processing failed' },
      { status: 500 }
    )
  }
}
