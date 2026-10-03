import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import {
  checkRateLimit,
  recordLoginAttempt,
  verifyPassword,
  createSession,
  logActivity,
} from '@/lib/auth'
import { getSessionCookieName } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    // 1. Rate limiting check
    const rateLimit = await checkRateLimit(email)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many failed login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      )
    }

    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || null

    // 2. Fetch user
    const db = await getDB()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const userRow = await db.prepare(`
      SELECT id, email, password_hash, password_salt, pbkdf2_iters, is_active
      FROM users
      WHERE email = ?
    `).bind(email.toLowerCase()).first<{
      id: string
      email: string
      password_hash: string
      password_salt: string
      pbkdf2_iters: number
      is_active: number
    }>()

    // 3. Verify user and password
    if (!userRow || !userRow.is_active) {
      await recordLoginAttempt(email, false, ip)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(
      password,
      userRow.password_hash,
      userRow.password_salt,
      userRow.pbkdf2_iters
    )

    if (!valid) {
      await recordLoginAttempt(email, false, ip)
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // 4. Successful login
    await recordLoginAttempt(email, true, ip)
    const { token, expiresAt } = await createSession(userRow.id)
    await logActivity(userRow.id, 'auth.login', 'user', userRow.id)

    const response = NextResponse.json({
      success: true,
      user: {
        id: userRow.id,
        email: userRow.email,
      },
    })

    const isProd = process.env.NODE_ENV === 'production'
    response.cookies.set(getSessionCookieName(), token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: expiresAt - Math.floor(Date.now() / 1000),
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    )
  }
}
