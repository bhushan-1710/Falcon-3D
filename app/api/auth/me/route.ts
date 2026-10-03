import { NextResponse } from 'next/server'
import { getCurrentAuth } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await getCurrentAuth()
  if (!auth) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: auth.user.id,
      email: auth.user.email,
    },
  })
}
