import { NextRequest, NextResponse } from 'next/server'
import { getDB, getMediaBucket } from '@/lib/cloudflare/context'

export const dynamic = 'force-dynamic'

interface MediaRow {
  id: string
  key: string
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

  // 1. Verify existence in media table
  const db = await getDB()
  if (!db) {
    return new NextResponse('Database Unavailable', { status: 503 })
  }

  const stmt = db.prepare(
    'SELECT id, key, mime_type, size_bytes, updated_at FROM media WHERE key = ? AND deleted_at IS NULL'
  ).bind(key)
  const mediaRow = await stmt.first<MediaRow>()

  if (!mediaRow) {
    return new NextResponse('Not Found', { status: 404 })
  }

  const bucket = await getMediaBucket()
  if (!bucket) {
    return new NextResponse('Storage Unavailable', { status: 503 })
  }

  // 2. Conditional request / ETag check
  const ifNoneMatch = request.headers.get('if-none-match')
  const etag = `"${mediaRow.id}-${mediaRow.updated_at}"`

  if (ifNoneMatch && ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        'ETag': etag,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  // 3. Handle Range Requests
  const rangeHeader = request.headers.get('range')
  let rangeOption: { offset?: number; length?: number } | undefined

  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : mediaRow.size_bytes - 1

    if (!isNaN(start) && start < mediaRow.size_bytes) {
      const length = end - start + 1
      rangeOption = { offset: start, length }

      const object = await bucket.get(key, { range: rangeOption })
      if (!object) {
        return new NextResponse('Object Not Found in Storage', { status: 404 })
      }

      return new NextResponse(object.body as unknown as BodyInit, {
        status: 206,
        headers: {
          'Content-Type': mediaRow.mime_type,
          'Content-Length': length.toString(),
          'Content-Range': `bytes ${start}-${end}/${mediaRow.size_bytes}`,
          'Accept-Ranges': 'bytes',
          'ETag': etag,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    }
  }

  // 4. Standard Full Response
  const object = await bucket.get(key)
  if (!object) {
    return new NextResponse('Object Not Found in Storage', { status: 404 })
  }

  return new NextResponse(object.body as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': mediaRow.mime_type,
      'Content-Length': mediaRow.size_bytes.toString(),
      'Accept-Ranges': 'bytes',
      'ETag': etag,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
