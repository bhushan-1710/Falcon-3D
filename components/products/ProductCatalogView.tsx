'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { Product, ProductCategory } from '@/lib/types/products'
import { buildProductWhatsAppUrl } from '@/lib/products-utils'
import { productsPage, brand } from '@/lib/content'

// ─── Product Card ────────────────────────────────────────────────────────────

function ProductCard({ product, siteUrl }: { product: Product; siteUrl?: string | null }) {
  const [imgError, setImgError] = useState(false)
  const waUrl = buildProductWhatsAppUrl(product, siteUrl)

  return (
    <article className="product-card" aria-label={product.title}>
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="product-card__image-link" tabIndex={-1} aria-hidden="true">
        <div className="product-card__image-wrap">
          {product.featuredImage && !imgError ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="product-card__placeholder" aria-label="Image coming soon">
              <span style={{
                fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)',
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                color: 'var(--muted)',
                textTransform: 'uppercase',
              }}>
                FALCON 3D
              </span>
            </div>
          )}
          {product.isFeatured && (
            <span className="product-card__badge">FEATURED</span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="product-card__body">
        {product.category && (
          <span className="product-card__category">{product.category.name}</span>
        )}
        <h2 className="product-card__title">
          <Link href={`/products/${product.slug}`} className="product-card__title-link">
            {product.title}
          </Link>
        </h2>
        {product.shortDescription && (
          <p className="product-card__desc">{product.shortDescription}</p>
        )}

        {/* Specs row */}
        <dl className="product-card__specs">
          {product.material && (
            <>
              <dt>Material</dt>
              <dd>{product.material}</dd>
            </>
          )}
          {product.dimensions && (
            <>
              <dt>Dimensions</dt>
              <dd>{product.dimensions}</dd>
            </>
          )}
          {product.availability && (
            <>
              <dt>Availability</dt>
              <dd>{product.availability}</dd>
            </>
          )}
        </dl>

        {/* Enquiry actions */}
        <div className="product-card__actions">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary product-card__btn-enquire"
            aria-label={`Enquire about ${product.title} on WhatsApp`}
            id={`enquire-whatsapp-${product.id}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            ENQUIRE
          </a>
          <Link
            href={`/products/${product.slug}`}
            className="btn-secondary product-card__btn-view"
            aria-label={`View details for ${product.title}`}
          >
            VIEW DETAILS →
          </Link>
        </div>
      </div>
    </article>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ customMessage }: { customMessage?: string }) {
  return (
    <div className="products-empty">
      <div className="products-empty__eyebrow">{productsPage.emptyTitle}</div>
      <p className="products-empty__text">
        {customMessage || productsPage.emptyText}
      </p>
      <a
        href={brand.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
        id="enquire-custom-empty"
      >
        INQUIRE FOR CUSTOM FABRICATION
      </a>
    </div>
  )
}

// ─── Main Catalog View Component ─────────────────────────────────────────────

interface ProductCatalogViewProps {
  products: Product[]
  categories: ProductCategory[]
  siteUrl?: string | null
}

export function ProductCatalogView({ products, categories, siteUrl }: ProductCatalogViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'ALL') return products
    return products.filter(
      (p) =>
        p.categoryId === selectedCategory ||
        p.category?.id === selectedCategory ||
        p.category?.slug === selectedCategory
    )
  }, [products, selectedCategory])

  return (
    <>
      {/* ── Category filter row ── */}
      {categories.length > 0 && products.length > 0 && (
        <nav className="products-filter" aria-label="Filter by category">
          <div className="container">
            <div className="products-filter__inner">
              <span className="products-filter__label">FILTER</span>
              <div className="products-filter__chips" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === 'ALL'}
                  className={`products-filter__chip ${selectedCategory === 'ALL' ? 'products-filter__chip--active' : ''}`}
                  onClick={() => setSelectedCategory('ALL')}
                >
                  ALL
                </button>
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.id || selectedCategory === cat.slug
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`products-filter__chip ${isActive ? 'products-filter__chip--active' : ''}`}
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* ── Grid ── */}
      <section className="products-grid-section" aria-label="Products">
        <div className="container">
          {filteredProducts.length === 0 ? (
            <div className="products-empty">
              <div className="products-empty__eyebrow">NO PRODUCTS IN THIS CATEGORY</div>
              <p className="products-empty__text">
                No items currently listed under this category filter.
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSelectedCategory('ALL')}
                style={{ cursor: 'pointer' }}
              >
                VIEW ALL FABRICATION PRODUCTS
              </button>
            </div>
          ) : (
            <div className="products-grid" role="list">
              {filteredProducts.map((product) => (
                <div key={product.id} role="listitem">
                  <ProductCard product={product} siteUrl={siteUrl} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
