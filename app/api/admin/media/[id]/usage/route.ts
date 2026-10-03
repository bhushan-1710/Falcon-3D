import { NextRequest, NextResponse } from 'next/server'
import { checkMediaUsage } from '@/lib/media/usage'
import { verifyAdminRequest } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await verifyAdminRequest(request)
  if (!authCheck.success) {
    return authCheck.response
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Missing media ID' }, { status: 400 })
  }

  const result = await checkMediaUsage(id)
  return NextResponse.json(result)
}
