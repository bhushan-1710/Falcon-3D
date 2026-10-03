import { NextRequest, NextResponse } from 'next/server'
import { checkMediaUsage } from '@/lib/media/usage'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Missing media ID' }, { status: 400 })
  }

  const result = await checkMediaUsage(id)
  return NextResponse.json(result)
}
