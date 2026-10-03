'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import type { Product, ProductMedia } from '@/lib/types/products'

interface ProductGalleryProps {
  product: Product
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const images: ProductMedia[] =
    product.gallery && product.gallery.length > 0
      ? product.gallery
      : product.featuredImage
      ? [product.featuredImage]
      : []

  const [activeIndex, setActiveIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({})

  if (images.length === 0) {
    return (
      <div className="pd-gallery__placeholder" aria-label="Product image coming soon">
        <span className="pd-gallery__placeholder-text">
          ASSET REQUIRED
        </span>
      </div>
    )
  }

  const activeImage = images[activeIndex] || images[0]
  const isFailed = failedImages[activeImage.id || String(activeIndex)]

  return (
    <div className="pd-gallery">
      {/* Primary image */}
      <div className="pd-gallery__primary">
        {!isFailed ? (
          <Image
            src={activeImage.url}
            alt={activeImage.altText ?? product.title}
            fill
            sizes="(max-width: 767px) 100vw, 55vw"
            style={{ objectFit: 'cover', transition: 'opacity 200ms ease' }}
            priority
            onError={() => {
              setFailedImages((prev) => ({
                ...prev,
                [activeImage.id || String(activeIndex)]: true,
              }))
            }}
          />
        ) : (
          <div className="pd-gallery__placeholder" aria-label="Image unavailable">
            <span className="pd-gallery__placeholder-text">
              PRECISION FABRICATION
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="pd-gallery__thumbs" role="tablist" aria-label="Additional views">
          {images.map((img, i) => {
            const isSelected = i === activeIndex
            return (
              <button
                key={img.id || i}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`pd-gallery__thumb ${isSelected ? 'pd-gallery__thumb--active' : ''}`}
                onClick={() => setActiveIndex(i)}
                style={{
                  padding: 0,
                  outline: isSelected ? '2px solid var(--falcon-orange, #ff5c00)' : 'none',
                  outlineOffset: '2px',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--ink)' : '1px solid var(--stone)',
                }}
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? `${product.title} view ${i + 1}`}
                  fill
                  sizes="80px"
                  style={{ objectFit: 'cover' }}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
