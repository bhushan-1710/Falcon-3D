import { getDB } from '@/lib/cloudflare/context'

export const PBKDF2_ITERATIONS = 100000
export const SESSION_DURATION_SECS = 7 * 24 * 60 * 60 // 7 days
export const MAX_LOGIN_ATTEMPTS = 5
export const LOCKOUT_WINDOW_SECS = 15 * 60 // 15 minutes

export interface User {
  id: string
  email: string
  isActive: boolean
  createdAt: number
}

export interface Session {
  id: string
  userId: string
  expiresAt: number
}

// ─── WebCrypto Helpers ────────────────────────────────────────────────────────

function toBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function generateSalt(length = 32): string {
  const salt = new Uint8Array(length)
  crypto.getRandomValues(salt)
  return toBase64(salt)
}

export function generateToken(length = 32): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function hashPassword(
  password: string,
  saltBase64: string,
  iterations = PBKDF2_ITERATIONS
): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const salt = fromBase64(saltBase64)
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations,
      hash: 'SHA-512',
    },
    keyMaterial,
    512
  )

  return toBase64(derivedBits)
}

export async function verifyPassword(
  password: string,
  storedHash: string,
  saltBase64: string,
  iterations = PBKDF2_ITERATIONS
): Promise<boolean> {
  const computedHash = await hashPassword(password, saltBase64, iterations)
  // Constant-time comparison
  if (computedHash.length !== storedHash.length) return false
  let result = 0
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ storedHash.charCodeAt(i)
  }
  return result === 0
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

export async function checkRateLimit(email: string): Promise<{ allowed: boolean; remainingAttempts: number }> {
  const db = await getDB()
  if (!db) return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS }

  const emailHash = await sha256Hex(email.trim().toLowerCase())
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - LOCKOUT_WINDOW_SECS

  const res = await db.prepare(`
    SELECT count(*) as failed_count
    FROM login_attempts
    WHERE email_hash = ? AND success = 0 AND attempted_at > ?
  `).bind(emailHash, windowStart).first<{ failed_count: number }>()

  const failedCount = res?.failed_count ?? 0
  if (failedCount >= MAX_LOGIN_ATTEMPTS) {
    return { allowed: false, remainingAttempts: 0 }
  }

  return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - failedCount }
}

export async function recordLoginAttempt(email: string, success: boolean, ip?: string | null): Promise<void> {
  const db = await getDB()
  if (!db) return

  const emailHash = await sha256Hex(email.trim().toLowerCase())
  const ipHash = ip ? await sha256Hex(ip) : null
  const id = 'att_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)

  await db.prepare(`
    INSERT INTO login_attempts (id, email_hash, attempted_at, success, ip_hash)
    VALUES (?, ?, unixepoch(), ?, ?)
  `).bind(id, emailHash, success ? 1 : 0, ipHash).run()
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(userId: string): Promise<{ token: string; expiresAt: number }> {
  const db = await getDB()
  if (!db) throw new Error('Database unavailable')

  // Rotate / clean up any old sessions for this user
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run()

  const rawToken = generateToken(32)
  const tokenHash = await sha256Hex(rawToken)
  const sessionId = 'ses_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECS

  await db.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_used_at)
    VALUES (?, ?, ?, ?, unixepoch(), unixepoch())
  `).bind(sessionId, userId, tokenHash, expiresAt).run()

  return { token: rawToken, expiresAt }
}

export async function validateSessionToken(rawToken: string): Promise<{ user: User; session: Session } | null> {
  if (!rawToken) return null

  const db = await getDB()
  if (!db) return null

  const tokenHash = await sha256Hex(rawToken)
  const now = Math.floor(Date.now() / 1000)

  const res = await db.prepare(`
    SELECT s.id as session_id, s.user_id, s.expires_at,
           u.id as u_id, u.email, u.is_active, u.created_at as u_created
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.is_active = 1
  `).bind(tokenHash, now).first<{
    session_id: string
    user_id: string
    expires_at: number
    u_id: string
    email: string
    is_active: number
    u_created: number
  }>()

  if (!res) return null

  // Touch last_used_at non-blockingly
  db.prepare('UPDATE sessions SET last_used_at = unixepoch() WHERE id = ?').bind(res.session_id).run().catch(() => {})

  return {
    user: {
      id: res.u_id,
      email: res.email,
      isActive: Boolean(res.is_active),
      createdAt: res.u_created,
    },
    session: {
      id: res.session_id,
      userId: res.user_id,
      expiresAt: res.expires_at,
    },
  }
}

export async function deleteSession(rawToken: string): Promise<void> {
  const db = await getDB()
  if (!db) return

  const tokenHash = await sha256Hex(rawToken)
  await db.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(tokenHash).run()
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export async function logActivity(
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  const db = await getDB()
  if (!db) return

  const id = 'act_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  await db.prepare(`
    INSERT INTO activity_log (id, user_id, action, entity_type, entity_id, detail_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, unixepoch())
  `).bind(id, userId, action, entityType || null, entityId || null, JSON.stringify(details)).run()
}
