import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { D1Database, R2Bucket } from './types'

/**
 * ONE centralized module for Cloudflare bindings via getCloudflareContext().
 * Everything goes through this module.
 *
 * Gracefully handles missing bindings, SSR/build steps, and errors by
 * returning null, allowing the data layer to cleanly fall back to static defaults.
 */
export async function getCloudflareEnv(): Promise<CloudflareEnv | null> {
  try {
    const ctx = await getCloudflareContext({ async: true })
    return ctx?.env ?? null
  } catch (error) {
    // Expected during certain static build steps or if run outside opennext worker
    if (process.env.NODE_ENV === 'development') {
      // In dev, only log debug info if explicitly investigating
      // console.debug('[CloudflareContext] Context unavailable:', error)
    }
    return null
  }
}

/**
 * Get the D1 Database instance.
 * Returns null if D1 is unavailable.
 */
export async function getDB(): Promise<D1Database | null> {
  const env = await getCloudflareEnv()
  return env?.DB ?? null
}

/**
 * Get the R2 Media Bucket instance.
 * Returns null if R2 is unavailable.
 */
export async function getMediaBucket(): Promise<R2Bucket | null> {
  const env = await getCloudflareEnv()
  return env?.MEDIA_BUCKET ?? null
}
