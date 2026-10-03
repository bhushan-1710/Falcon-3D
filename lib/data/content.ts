import { getDB } from '@/lib/cloudflare/context'

/**
 * Get dynamic section content from D1 website_content table.
 * If D1 is unavailable or section not found, returns fallback.
 */
export async function getSectionContent<T>(sectionKey: string, fallback: T): Promise<T> {
  try {
    const db = await getDB()
    if (db) {
      const stmt = db.prepare(`
        SELECT content_json FROM website_content WHERE section_key = ?
      `).bind(sectionKey)
      const row = await stmt.first<{ content_json: string }>()
      if (row && row.content_json) {
        const parsed = JSON.parse(row.content_json)
        return { ...fallback, ...parsed }
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Content DAL] getSectionContent('${sectionKey}') failed, falling back:`, error)
    }
  }

  return fallback
}
