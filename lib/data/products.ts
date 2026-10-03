import { Product, ProductCategory, ProductMedia } from '@/lib/types/products'
import { fixtureProducts, fixtureCategories } from '@/lib/fixtures/products'
import { brand } from '@/lib/content'
import { getDB } from '@/lib/cloudflare/context'

/**
 * Gate for local development fixtures.
 * Fixtures must NEVER ship or be reachable in production builds.
 * Enabled ONLY when NODE_ENV === 'development' AND USE_PRODUCT_FIXTURES === '1'.
 */
export function areFixturesEnabled(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.USE_PRODUCT_FIXTURES?.trim() === '1'
  )
}

/**
 * Configured Site URL helper.
 * Reads strictly from SITE_URL or NEXT_PUBLIC_SITE_URL.
 * Returns null if not configured or if placeholder text is detected.
 */
export function getConfiguredSiteUrl(): string | null {
  const url = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL
  if (url && url.startsWith('http') && !url.includes('[CONFIRM')) {
    return url.replace(/\/+$/, '')
  }
  return null
}

/**
 * WhatsApp Enquiry URL Generator.
 * Relative-aware: includes "Page: <url>" only when a live site URL is configured.
 * Does not invent domain names.
 */
export function buildProductWhatsAppUrl(product: Pick<Product, 'title' | 'slug'>): string {
  const siteUrl = getConfiguredSiteUrl()
  const lines: string[] = [
    `Hi Falcon 3D Prints, I'm interested in the *${product.title}*.`,
  ]
  if (siteUrl) {
    lines.push(`Page: ${siteUrl}/products/${product.slug}`)
  }
  const text = lines.join('\n')
  const phone = brand.phoneE164.replace('+', '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

/**
 * Helper to resolve media key/URL.
 */
export function resolveMediaUrl(keyOrUrl: string | null | undefined): string {
  if (!keyOrUrl) return ''
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://') || keyOrUrl.startsWith('/')) {
    return keyOrUrl
  }
  return `/api/media/${keyOrUrl}`
}

interface ProductDbRow {
  id: string
  slug: string
  title: string
  subtitle: string | null
  categoryId: string
  shortDescription: string | null
  description: string | null
  price: string | null
  dimensions: string | null
  material: string | null
  customization: string | null
  availability: string | null
  isFeatured: number
  sortOrder: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  videoId: string | null
  seoTitle: string | null
  seoDescription: string | null
  createdAt: number
  updatedAt: number
  cat_id: string | null
  cat_name: string | null
  cat_slug: string | null
  cat_desc: string | null
  cat_sort: number | null
  cat_active: number | null
  feat_id: string | null
  feat_key: string | null
  feat_alt: string | null
  feat_cap: string | null
  feat_w: number | null
  feat_h: number | null
  video_url: string | null
  video_r2_key: string | null
}

function mapProductRow(row: ProductDbRow, gallery: ProductMedia[] = []): Product {
  const category: ProductCategory | undefined = row.cat_id
    ? {
        id: row.cat_id,
        name: row.cat_name ?? '',
        slug: row.cat_slug ?? '',
        description: row.cat_desc ?? undefined,
        sortOrder: Number(row.cat_sort ?? 0),
        isActive: Boolean(row.cat_active),
      }
    : undefined

  const featuredImage: ProductMedia | undefined = row.feat_id && row.feat_key
    ? {
        id: row.feat_id,
        url: resolveMediaUrl(row.feat_key),
        altText: row.feat_alt ?? undefined,
        caption: row.feat_cap ?? undefined,
        width: row.feat_w ?? undefined,
        height: row.feat_h ?? undefined,
      }
    : undefined

  const videoUrl = row.video_url || (row.video_r2_key ? resolveMediaUrl(row.video_r2_key) : undefined)

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    categoryId: row.categoryId,
    category,
    shortDescription: row.shortDescription ?? undefined,
    description: row.description ?? undefined,
    price: row.price ?? undefined,
    dimensions: row.dimensions ?? undefined,
    material: row.material ?? undefined,
    customization: row.customization ?? undefined,
    availability: row.availability ?? undefined,
    isFeatured: Boolean(row.isFeatured),
    sortOrder: Number(row.sortOrder),
    status: row.status,
    featuredImage,
    gallery,
    videoUrl,
    seoTitle: row.seoTitle ?? undefined,
    seoDescription: row.seoDescription ?? undefined,
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  }
}

/**
 * Data Access Layer for Products
 * Queries Cloudflare D1 with fallback to dev fixtures or empty default.
 */
export async function getPublishedProducts(): Promise<Product[]> {
  try {
    const db = await getDB()
    if (db) {
      const stmt = db.prepare(`
        SELECT 
          p.id, p.slug, p.title, p.subtitle, p.category_id as categoryId,
          p.short_description as shortDescription, p.description,
          p.price, p.dimensions, p.material, p.customization, p.availability,
          p.is_featured as isFeatured, p.sort_order as sortOrder, p.status,
          p.video_id as videoId, p.seo_title as seoTitle, p.seo_description as seoDescription,
          p.created_at as createdAt, p.updated_at as updatedAt,
          c.id as cat_id, c.name as cat_name, c.slug as cat_slug, c.description as cat_desc,
          c.sort_order as cat_sort, c.is_active as cat_active,
          m.id as feat_id, m.key as feat_key, m.alt_text as feat_alt, m.caption as feat_cap,
          m.width as feat_w, m.height as feat_h,
          v.external_url as video_url, v.r2_key as video_r2_key
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN media m ON p.featured_image_id = m.id
        LEFT JOIN videos v ON p.video_id = v.id
        WHERE p.status = 'PUBLISHED' AND p.deleted_at IS NULL
        ORDER BY p.sort_order ASC, p.created_at DESC
      `)
      const res = await stmt.all<ProductDbRow>()
      if (res.results && res.results.length > 0) {
        return res.results.map((row) => mapProductRow(row))
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Products DAL] getPublishedProducts query failed, falling back:', error)
    }
  }

  // Fallback to dev fixtures if enabled, else empty array
  if (areFixturesEnabled()) {
    return fixtureProducts
      .filter((p) => p.status === 'PUBLISHED')
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return []
}

export async function getPublishedProductBySlug(slug: string): Promise<Product | null> {
  try {
    const db = await getDB()
    if (db) {
      const stmt = db.prepare(`
        SELECT 
          p.id, p.slug, p.title, p.subtitle, p.category_id as categoryId,
          p.short_description as shortDescription, p.description,
          p.price, p.dimensions, p.material, p.customization, p.availability,
          p.is_featured as isFeatured, p.sort_order as sortOrder, p.status,
          p.video_id as videoId, p.seo_title as seoTitle, p.seo_description as seoDescription,
          p.created_at as createdAt, p.updated_at as updatedAt,
          c.id as cat_id, c.name as cat_name, c.slug as cat_slug, c.description as cat_desc,
          c.sort_order as cat_sort, c.is_active as cat_active,
          m.id as feat_id, m.key as feat_key, m.alt_text as feat_alt, m.caption as feat_cap,
          m.width as feat_w, m.height as feat_h,
          v.external_url as video_url, v.r2_key as video_r2_key
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN media m ON p.featured_image_id = m.id
        LEFT JOIN videos v ON p.video_id = v.id
        WHERE p.slug = ? AND p.status = 'PUBLISHED' AND p.deleted_at IS NULL
      `).bind(slug)
      
      const productRow = await stmt.first<ProductDbRow>()
      if (productRow) {
        // Fetch gallery
        let gallery: ProductMedia[] = []
        try {
          const galleryStmt = db.prepare(`
            SELECT pm.media_id as id, m.key, m.alt_text as altText, m.caption, m.width, m.height
            FROM product_media pm
            JOIN media m ON pm.media_id = m.id
            WHERE pm.product_id = ? AND m.deleted_at IS NULL
            ORDER BY pm.sort_order ASC
          `).bind(productRow.id)
          const galleryRes = await galleryStmt.all<{
            id: string
            key: string
            altText: string | null
            caption: string | null
            width: number | null
            height: number | null
          }>()
          if (galleryRes.results) {
            gallery = galleryRes.results.map((g) => ({
              id: g.id,
              url: resolveMediaUrl(g.key),
              altText: g.altText ?? undefined,
              caption: g.caption ?? undefined,
              width: g.width ?? undefined,
              height: g.height ?? undefined,
            }))
          }
        } catch {
          // Non-fatal if gallery query fails
        }
        return mapProductRow(productRow, gallery)
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Products DAL] getPublishedProductBySlug query failed, falling back:', error)
    }
  }

  // Fallback to dev fixtures if enabled
  if (areFixturesEnabled()) {
    const product = fixtureProducts.find(
      (p) => p.slug === slug && p.status === 'PUBLISHED'
    )
    return product || null
  }
  return null
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  try {
    const db = await getDB()
    if (db) {
      const stmt = db.prepare(`
        SELECT id, name, slug, description, sort_order as sortOrder, is_active as isActive
        FROM categories
        WHERE type = 'product' AND is_active = 1
        ORDER BY sort_order ASC
      `)
      const res = await stmt.all<{
        id: string
        name: string
        slug: string
        description: string | null
        sortOrder: number
        isActive: number
      }>()
      if (res.results && res.results.length > 0) {
        return res.results.map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description ?? undefined,
          sortOrder: Number(row.sortOrder),
          isActive: Boolean(row.isActive),
        }))
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Products DAL] getProductCategories query failed, falling back:', error)
    }
  }

  if (areFixturesEnabled()) {
    return fixtureCategories
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }
  return []
}
