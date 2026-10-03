import { NextRequest, NextResponse } from 'next/server'
import { getDB, getMediaBucket } from '@/lib/cloudflare/context'
import { validateImageUpload } from '@/lib/media/validation'

export const dynamic = 'force-dynamic'

function generateId(): string {
  return 'med_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const altText = formData.get('alt_text') as string | null
    const caption = formData.get('caption') as string | null
    const widthRaw = formData.get('width') as string | null
    const heightRaw = formData.get('height') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    const declaredMime = file.type
    const declaredSize = file.size

    // 1. Strict validation: Size, MIME allowlist, and magic bytes
    const validation = validateImageUpload(buffer, declaredMime, declaredSize)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 2. Prepare bindings
    const db = await getDB()
    const bucket = await getMediaBucket()

    if (!db || !bucket) {
      return NextResponse.json({ error: 'Storage or Database unavailable' }, { status: 503 })
    }

    // 3. Generate key and upload to R2
    const mediaId = generateId()
    const safeName = sanitizeFilename(file.name || 'image.webp')
    const r2Key = `media/${mediaId}/${safeName}`

    await bucket.put(r2Key, buffer, {
      httpMetadata: {
        contentType: validation.detectedMime,
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: {
        originalFilename: file.name,
        uploadedAt: new Date().toISOString(),
      },
    })

    // 4. Record in D1
    const width = widthRaw ? parseInt(widthRaw, 10) : null
    const height = heightRaw ? parseInt(heightRaw, 10) : null

    await db.prepare(`
      INSERT INTO media (id, key, filename, mime_type, size_bytes, width, height, alt_text, caption)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      mediaId,
      r2Key,
      file.name,
      validation.detectedMime,
      buffer.length,
      isNaN(width as number) ? null : width,
      isNaN(height as number) ? null : height,
      altText || null,
      caption || null
    ).run()

    return NextResponse.json({
      success: true,
      media: {
        id: mediaId,
        key: r2Key,
        url: `/api/media/${r2Key}`,
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
