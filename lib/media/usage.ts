import { getDB } from '../cloudflare/context'
import type { D1Database } from '../cloudflare/types'

export interface MediaUsageReference {
  type: string
  id: string
  name: string
  field: string
}

export interface MediaUsageCheckResult {
  mediaId: string
  inUse: boolean
  totalReferences: number
  references: MediaUsageReference[]
}

/**
 * Checks all possible references to a media item across the database:
 * 1. categories.image_id
 * 2. projects.featured_image_id
 * 3. projects.og_image_id
 * 4. project_media.media_id (join table)
 * 5. products.featured_image_id
 * 6. products.og_image_id
 * 7. product_media.media_id (join table)
 * 8. videos.thumbnail_id
 * 9. website_content.content_json (any JSON blob containing the media ID)
 */
export async function checkMediaUsage(
  mediaId: string,
  customDb?: D1Database | null
): Promise<MediaUsageCheckResult> {
  const references: MediaUsageReference[] = []
  const db = customDb !== undefined ? customDb : await getDB()

  if (!db) {
    return {
      mediaId,
      inUse: false,
      totalReferences: 0,
      references: [],
    }
  }

  // 1. categories.image_id
  try {
    const res = await db.prepare(
      'SELECT id, name FROM categories WHERE image_id = ?'
    ).bind(mediaId).all<{ id: string; name: string }>()
    if (res.results) {
      for (const row of res.results) {
        references.push({
          type: 'category',
          id: row.id,
          name: row.name,
          field: 'image_id',
        })
      }
    }
  } catch {}

  // 2. projects.featured_image_id & og_image_id
  try {
    const res = await db.prepare(
      'SELECT id, title, featured_image_id, og_image_id FROM projects WHERE featured_image_id = ? OR og_image_id = ?'
    ).bind(mediaId, mediaId).all<{ id: string; title: string; featured_image_id: string | null; og_image_id: string | null }>()
    if (res.results) {
      for (const row of res.results) {
        if (row.featured_image_id === mediaId) {
          references.push({
            type: 'project',
            id: row.id,
            name: row.title,
            field: 'featured_image_id',
          })
        }
        if (row.og_image_id === mediaId) {
          references.push({
            type: 'project',
            id: row.id,
            name: row.title,
            field: 'og_image_id',
          })
        }
      }
    }
  } catch {}

  // 3. project_media join table
  try {
    const res = await db.prepare(
      `SELECT p.id, p.title FROM project_media pm
       JOIN projects p ON pm.project_id = p.id
       WHERE pm.media_id = ?`
    ).bind(mediaId).all<{ id: string; title: string }>()
    if (res.results) {
      for (const row of res.results) {
        references.push({
          type: 'project_gallery',
          id: row.id,
          name: row.title,
          field: 'project_media.media_id',
        })
      }
    }
  } catch {}

  // 4. products.featured_image_id & og_image_id
  try {
    const res = await db.prepare(
      'SELECT id, title, featured_image_id, og_image_id FROM products WHERE featured_image_id = ? OR og_image_id = ?'
    ).bind(mediaId, mediaId).all<{ id: string; title: string; featured_image_id: string | null; og_image_id: string | null }>()
    if (res.results) {
      for (const row of res.results) {
        if (row.featured_image_id === mediaId) {
          references.push({
            type: 'product',
            id: row.id,
            name: row.title,
            field: 'featured_image_id',
          })
        }
        if (row.og_image_id === mediaId) {
          references.push({
            type: 'product',
            id: row.id,
            name: row.title,
            field: 'og_image_id',
          })
        }
      }
    }
  } catch {}

  // 5. product_media join table
  try {
    const res = await db.prepare(
      `SELECT p.id, p.title FROM product_media pm
       JOIN products p ON pm.product_id = p.id
       WHERE pm.media_id = ?`
    ).bind(mediaId).all<{ id: string; title: string }>()
    if (res.results) {
      for (const row of res.results) {
        references.push({
          type: 'product_gallery',
          id: row.id,
          name: row.title,
          field: 'product_media.media_id',
        })
      }
    }
  } catch {}

  // 6. videos.thumbnail_id
  try {
    const res = await db.prepare(
      'SELECT id, title FROM videos WHERE thumbnail_id = ?'
    ).bind(mediaId).all<{ id: string; title: string }>()
    if (res.results) {
      for (const row of res.results) {
        references.push({
          type: 'video',
          id: row.id,
          name: row.title,
          field: 'thumbnail_id',
        })
      }
    }
  } catch {}

  // 7. website_content.content_json
  try {
    const res = await db.prepare(
      'SELECT section_key, content_json FROM website_content'
    ).all<{ section_key: string; content_json: string }>()
    if (res.results) {
      for (const row of res.results) {
        if (row.content_json && row.content_json.includes(mediaId)) {
          references.push({
            type: 'website_content',
            id: row.section_key,
            name: `Section: ${row.section_key}`,
            field: 'content_json',
          })
        }
      }
    }
  } catch {}

  return {
    mediaId,
    inUse: references.length > 0,
    totalReferences: references.length,
    references,
  }
}
