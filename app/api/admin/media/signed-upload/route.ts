import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { createSignedUploadUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'

// Supabase free plan allows up to 50 MB per file
const MAX_DIRECT_UPLOAD_BYTES = 50 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

function generateId(prefix: string = 'up_'): string {
  return prefix + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const body = await request.json()
    const { filename, mime_type, size_bytes, is_video } = body

    if (!filename || !mime_type || typeof size_bytes !== 'number') {
      return NextResponse.json({ error: 'filename, mime_type, and size_bytes are required' }, { status: 400 })
    }

    const normalizedMime = mime_type.toLowerCase()

    // 1. Strict SVG rejection
    if (normalizedMime.includes('svg')) {
      return NextResponse.json({ error: 'SVG uploads are strictly disallowed for security reasons' }, { status: 400 })
    }

    // 2. MIME allowlist check
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      return NextResponse.json(
        { error: `File type ${mime_type} is not allowed. Supported formats: JPEG, PNG, WebP, AVIF, MP4, WebM.` },
        { status: 400 }
      )
    }

    // 3. Max size check (50 MB)
    if (size_bytes > MAX_DIRECT_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File size (${(size_bytes / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed 50 MB on Supabase free plan.` },
        { status: 400 }
      )
    }

    // 4. Generate unique storage path
    const id = generateId(is_video ? 'vid_' : 'med_')
    const safeName = sanitizeFilename(filename)
    const storagePath = `${is_video ? 'videos' : 'media'}/${id}/${safeName}`

    // 5. Create signed upload URL
    const signResult = await createSignedUploadUrl(storagePath, 3600)
    if (!signResult.success) {
      return NextResponse.json({ error: signResult.error || 'Failed to generate signed upload URL' }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      id,
      storagePath,
      signedUrl: signResult.signedUrl,
      token: signResult.token,
      publicUrl: signResult.publicUrl,
      maxSizeBytes: MAX_DIRECT_UPLOAD_BYTES,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Signed upload request failed' },
      { status: 500 }
    )
  }
}
