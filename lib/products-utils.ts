import { brand } from '@/lib/content'
import type { Product } from '@/lib/types/products'

/**
 * Configured Site URL helper.
 * Reads strictly from NEXT_PUBLIC_SITE_URL or SITE_URL.
 * Returns null if not configured or if placeholder text is detected.
 */
export function getConfiguredSiteUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
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
export function buildProductWhatsAppUrl(
  product: Pick<Product, 'title' | 'slug'>,
  siteUrl?: string | null
): string {
  const resolvedUrl = siteUrl !== undefined ? siteUrl : getConfiguredSiteUrl()
  const lines: string[] = [
    `Hi Falcon 3D Prints, I'm interested in the *${product.title}*.`,
  ]
  if (resolvedUrl) {
    lines.push(`Page: ${resolvedUrl}/products/${product.slug}`)
  }
  const text = lines.join('\n')
  const phone = brand.phoneE164.replace('+', '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}
