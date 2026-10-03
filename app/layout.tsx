/**
 * Falcon 3D Prints — Root Layout
 * Design source: design.md §11 (typography), §25 (tech implementation)
 *
 * Responsibilities:
 * - Load fonts via next/font (Space Grotesk, Manrope, DM Mono)
 * - Provide grain overlay
 * - Inject SEO metadata and JSON-LD
 * - Mount global providers (Lenis, cursor, reduced-motion detection)
 */

import type { Metadata } from 'next'
import { Space_Grotesk, Manrope, DM_Mono } from 'next/font/google'
import './globals.css'
import { seo, brand } from '@/lib/content'

// ─── Font loading ─────────────────────────────────────────────────────────────
// design.md §11: 3 families, subset, display: swap. Preload Space Grotesk 700 only.

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-space-grotesk',
  preload: true, // Preload only the display font (hero type)
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-manrope',
  preload: false,
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-dm-mono',
  preload: false,
})

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined,
  title: seo.title,
  description: seo.description,
  openGraph: {
    title: seo.ogTitle,
    description: seo.description,
    type: 'website',
    locale: 'en_IN',
  },
  // Instagram sameAs link for LocalBusiness JSON-LD
  // Full JSON-LD is injected in the body below
  robots: {
    index: true,
    follow: true,
  },
  // Viewport handled by Next.js default
}

// ─── LocalBusiness JSON-LD ────────────────────────────────────────────────────
// design.md §25: LocalBusiness JSON-LD with confirmed data only
// Address is [BUSINESS INPUT REQUIRED] — omitted until confirmed
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: brand.name,
  description: seo.description,
  email: brand.email,
  telephone: brand.phoneE164,
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Nashik',
    addressRegion: 'Maharashtra',
    addressCountry: 'IN',
    // streetAddress: '[BUSINESS INPUT REQUIRED]' — omitted
  },
  sameAs: [brand.instagramUrl],
  // No unverified claims in metadata
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const fontVars = [
    spaceGrotesk.variable,
    manrope.variable,
    dmMono.variable,
  ].join(' ')

  return (
    <html lang="en" className={fontVars}>
      <head>
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        {/* Skip link — accessibility first */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        {/* Main content */}
        {children}
      </body>
    </html>
  )
}
