import { getDB } from '@/lib/cloudflare/context'
import { projects as fallbackProjects, type Project } from '@/lib/projects'
import { getPublicUrl } from '@/lib/storage'
import { resolveMediaUrl } from './products'

interface ProjectDbRow {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  category_name: string | null
  feat_key: string | null
  feat_storage_path: string | null
  feat_public_url: string | null
  feat_alt: string | null
  sort_order: number
}

/**
 * Get projects for the Workshop Wall.
 * Published D1 / Turso projects fill the Wall's fixed slots in sort order.
 * Any unfilled slots (up to 6) are populated by fallbackProjects from lib/projects.ts.
 * Wall never exceeds fixed slot count (6 slots).
 * Extra published projects beyond slot count are capped (not displayed on Wall, as designed).
 */
export async function getWallProjects(): Promise<Project[]> {
  try {
    const db = await getDB()
    if (db) {
      const stmt = db.prepare(`
        SELECT 
          p.id, p.slug, p.title, p.subtitle, p.description,
          c.name as category_name,
          m.key as feat_key, m.storage_path as feat_storage_path, m.public_url as feat_public_url,
          m.alt_text as feat_alt,
          p.sort_order
        FROM projects p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN media m ON p.featured_image_id = m.id AND m.deleted_at IS NULL
        WHERE p.status = 'PUBLISHED' AND p.deleted_at IS NULL
        ORDER BY p.sort_order ASC, p.created_at ASC
        LIMIT 6
      `)
      const res = await stmt.all<ProjectDbRow>()
      if (res.results && res.results.length > 0) {
        // Merge with static layout attributes for each slot
        const merged: Project[] = fallbackProjects.map((slot, index) => {
          const cmsItem = res.results[index]
          if (!cmsItem) {
            return slot // Fallback project fills remaining slot
          }
          const featSrc = cmsItem.feat_public_url || (cmsItem.feat_storage_path ? getPublicUrl(cmsItem.feat_storage_path) : (cmsItem.feat_key ? resolveMediaUrl(cmsItem.feat_key) : slot.imageSrc))
          return {
            id: cmsItem.id,
            slug: cmsItem.slug,
            sectionLabel: slot.sectionLabel, // Preserve slot visual label
            name: cmsItem.title,
            category: cmsItem.category_name ?? slot.category,
            description: cmsItem.description ?? slot.description,
            finish: cmsItem.subtitle ?? slot.finish,
            imageSrc: featSrc,
            imageAlt: cmsItem.feat_alt ?? cmsItem.title,
            depth: slot.depth,
            rotation: slot.rotation,
            scale: slot.scale,
          }
        })
        return merged
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Projects DAL] getWallProjects query failed, falling back:', error)
    }
  }

  return fallbackProjects
}
