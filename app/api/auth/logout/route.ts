import { NextRequest, NextResponse } from 'next/server'
import { deleteSession, logActivity } from '@/lib/auth'
import { getSessionCookieName, getCurrentAuth } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const cookieName = getSessionCookieName()
    const token = request.cookies.get(cookieName)?.value
    const current = await getCurrentAuth()

    if (token) {
      await deleteSession(token)
    }

    if (current) {
      await logActivity(current.user.id, 'auth.logout', 'user', current.user.id)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete(cookieName)
    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Logout failed' },
      { status: 500 }
    )
  }
}
