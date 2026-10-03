import { NextRequest, NextResponse } from 'next/server'
import { putObject } from '@/lib/storage'

export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storagePath = searchParams.get('path') || `uploads/mock_${Date.now()}.bin`
    const contentType = request.headers.get('content-type') || 'application/octet-stream'

    const buffer = Buffer.from(await request.arrayBuffer())
    const res = await putObject(storagePath, buffer, contentType)

    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, path: storagePath, url: res.publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return PUT(request)
}
