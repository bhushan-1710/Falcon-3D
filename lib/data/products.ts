import { Product, ProductCategory } from '@/lib/types/products'
import { fixtureProducts, fixtureCategories } from '@/lib/fixtures/products'
import { brand } from '@/lib/content'

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
 * Data Access Layer for Products
 * In Phase 2: Uses typed fixtures gated behind development-only opt-in.
 * In Phase 3: Single-switch replacement with Cloudflare D1 query functions.
 */
export async function getPublishedProducts(): Promise<Product[]> {
  if (!areFixturesEnabled()) {
    return []
  }
  return fixtureProducts
    .filter((p) => p.status === 'PUBLISHED')
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function getPublishedProductBySlug(slug: string): Promise<Product | null> {
  if (!areFixturesEnabled()) {
    return null
  }
  const product = fixtureProducts.find(
    (p) => p.slug === slug && p.status === 'PUBLISHED'
  )
  return product || null
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  if (!areFixturesEnabled()) {
    return []
  }
  return fixtureCategories
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}
