export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  sortOrder: number
  isActive: boolean
}

export interface ProductMedia {
  id: string
  url: string
  altText?: string
  caption?: string
  width?: number
  height?: number
}

export interface Product {
  id: string
  slug: string
  title: string
  subtitle?: string
  categoryId: string
  category?: ProductCategory
  shortDescription?: string
  description?: string
  price?: string
  dimensions?: string
  material?: string
  customization?: string
  availability?: string
  isFeatured: boolean
  sortOrder: number
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  featuredImage?: ProductMedia
  gallery: ProductMedia[]
  videoUrl?: string
  seoTitle?: string
  seoDescription?: string
  ogImageUrl?: string
  createdAt: number
  updatedAt: number
}
