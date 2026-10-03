import { getDB } from '@/lib/cloudflare/context'
import { nav as defaultNav } from '@/lib/content'

export interface NavItem {
  id: string
  label: string
  url: string
  isExternal: boolean
  openNewTab: boolean
}

export async function getNavItems(): Promise<NavItem[]> {
  try {
    const db = await getDB()
    if (db) {
      const stmt = db.prepare(`
        SELECT id, label, url, is_external, open_new_tab
        FROM navigation_items
        WHERE is_visible = 1
        ORDER BY sort_order ASC
      `)
      const res = await stmt.all<{
        id: string
        label: string
        url: string
        is_external: number
        open_new_tab: number
      }>()
      if (res.results && res.results.length > 0) {
        return res.results.map((row) => ({
          id: row.id,
          label: row.label,
          url: row.url,
          isExternal: Boolean(row.is_external),
          openNewTab: Boolean(row.open_new_tab),
        }))
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Navigation DAL] getNavItems query failed, falling back:', error)
    }
  }

  // Fallback to static nav links
  return defaultNav.links.map((link, idx) => ({
    id: `static-${idx}`,
    label: link.label,
    url: link.href,
    isExternal: link.href.startsWith('http'),
    openNewTab: false,
  }))
}
