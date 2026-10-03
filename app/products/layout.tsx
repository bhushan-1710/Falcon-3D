/**
 * /products — Route Layout
 * Provides metadata for the products catalogue.
 * Navigation is rendered in each page; no home-scene code is mounted here.
 */

import type { Metadata } from 'next'
import { productsPage, seo } from '@/lib/content'

export const metadata: Metadata = {
  title: `Products — ${seo.title.split('—')[1]?.trim() ?? 'Falcon 3D Prints'}`,
  description: productsPage.heroSubline,
  openGraph: {
    title: `Falcon 3D Prints — Fabrication Catalog`,
    description: productsPage.heroSubline,
    type: 'website',
    locale: 'en_IN',
  },
}

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
