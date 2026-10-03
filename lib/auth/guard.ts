import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSessionToken, User, Session } from './index'

export function getSessionCookieName(): string {
  // Browsers strictly reject __Host- cookies on insecure (HTTP) localhost
  return process.env.NODE_ENV === 'production' ? '__Host-session' : 'session'
}

export async function getCurrentAuth(): Promise<{ user: User; session: Session } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(getSessionCookieName())?.value
  if (!token) return null
  return validateSessionToken(token)
}

/**
 * Server guard for admin API routes.
 * Verifies active session and CSRF Origin.
 */
export async function verifyAdminRequest(request?: NextRequest): Promise<
  | { success: true; user: User; session: Session }
  | { success: false; response: NextResponse }
> {
  // 1. Verify CSRF for mutating requests
  if (request && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')
    if (origin && host) {
      try {
        const originUrl = new URL(origin)
        if (originUrl.host !== host) {
          return {
            success: false,
            response: NextResponse.json({ error: 'CSRF verification failed: Origin mismatch' }, { status: 403 }),
          }
        }
      } catch {
        return {
          success: false,
          response: NextResponse.json({ error: 'CSRF verification failed: Invalid Origin' }, { status: 403 }),
        }
      }
    }
  }

  // 2. Verify Session
  let token: string | undefined
  if (request) {
    token = request.cookies.get(getSessionCookieName())?.value
  } else {
    const cookieStore = await cookies()
    token = cookieStore.get(getSessionCookieName())?.value
  }

  if (!token) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized: No active session' }, { status: 401 }),
    }
  }

  const auth = await validateSessionToken(token)
  if (!auth) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized: Invalid or expired session' }, { status: 401 }),
    }
  }

  return { success: true, user: auth.user, session: auth.session }
}
