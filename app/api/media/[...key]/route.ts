import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { getPublicUrl, getStorageConfig } from '@/lib/storage'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

interface MediaRow {
  id: string
  key: string
  storage_path: string | null
  public_url: string | null
  mime_type: string
  size_bytes: number
  updated_at: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keyParts } = await params
  if (!keyParts || keyParts.length === 0) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  const key = keyParts.join('/')

  // 1. Verify existence in media table if available
  const db = await getDB()
  let mediaRow: MediaRow | null = null

  if (db) {
    try {
      const stmt = db.prepare(
        'SELECT id, key, storage_path, public_url, mime_type, size_bytes, updated_at FROM media WHERE (key = ? OR storage_path = ?) AND deleted_at IS NULL'
      ).bind(key, key)
      mediaRow = await stmt.first<MediaRow>()
    } catch {}
  }

  // 2. If public_url is present, redirect to it
  if (mediaRow?.public_url) {
    return NextResponse.redirect(mediaRow.public_url, 307)
  }

  // 3. Build publicUrl via storage config
  const storageConfig = getStorageConfig()
  const storagePath = mediaRow?.storage_path || key
  const publicUrl = getPublicUrl(storagePath)

  if (publicUrl && publicUrl.startsWith('http')) {
    return NextResponse.redirect(publicUrl, 307)
  }

  // 4. Local filesystem fallback if storage is local disk
  try {
    const localDir = path.join(process.cwd(), '.storage', storageConfig.bucket)
    const filePath = path.join(localDir, ...storagePath.split('/'))
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath)
      const fileBuffer = fs.readFileSync(filePath)
      const mime = mediaRow?.mime_type || 'application/octet-stream'

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': mime,
          'Content-Length': stat.size.toString(),
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }
  } catch {}

  return new NextResponse('Object Not Found in Storage', { status: 404 })
}
