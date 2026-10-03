import { getDB as getTursoDB } from '@/lib/db'
import type { D1Database, R2Bucket } from './types'

/**
 * Database access gateway.
 * Backed by Turso / libSQL client (with local SQLite file fallback).
 */
export async function getDB(): Promise<D1Database | null> {
  return (await getTursoDB()) as unknown as D1Database
}

/**
 * Legacy R2 binding stub.
 * Media storage is now managed via Supabase Storage in lib/storage.
 */
export async function getMediaBucket(): Promise<R2Bucket | null> {
  return null
}

export async function getCloudflareEnv(): Promise<any> {
  return null
}
