/**
 * /products/[slug] — Product Detail
 *
 * Phase 2: Static fixture data with typed fallback.
 * Phase 3 will replace getPublishedProductBySlug with D1.
 *
 * Enquiry flow (Phase 2):
 * ENQUIRE = WhatsApp prefilled link (product name + this page URL) + link to /#contact.
 * No form storage; D1 enquiry table is a later phase.
 */

import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { getPublishedProductBySlug, getPublishedProducts, buildProductWhatsAppUrl } from '@/lib/data/products'
import { brand } from '@/lib/content'
import type { Product } from '@/lib/types/products'

// ─── Static params (pre-render all published slugs) ──────────────────────────

export async function generateStaticParams() {
  const products = await getPublishedProducts()
  return products.map((p) => ({ slug: p.slug }))
}

// ─── Per-product metadata ────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const product = await getPublishedProductBySlug(slug)
  if (!product) return {}

  return {
    title: product.seoTitle ?? `${product.title} — Falcon 3D Prints`,
    description: product.seoDescription ?? product.shortDescription,
    openGraph: {
      title: product.seoTitle ?? product.title,
      description: product.seoDescription ?? product.shortDescription,
      images: product.featuredImage ? [product.featuredImage.url] : [],
      type: 'website',
      locale: 'en_IN',
    },
  }
}

// ─── Gallery component ───────────────────────────────────────────────────────

function Gallery({ product }: { product: Product }) {
  const images = product.gallery.length > 0 ? product.gallery : product.featuredImage ? [product.featuredImage] : []

  if (images.length === 0) {
    return (
      <div className="pd-gallery__placeholder" aria-label="Product image coming soon">
        <span className="pd-gallery__placeholder-text">
          ASSET REQUIRED
        </span>
      </div>
    )
  }

  const [primary, ...thumbs] = images

  return (
    <div className="pd-gallery">
      {/* Primary image */}
      <div className="pd-gallery__primary">
        <Image
          src={primary.url}
          alt={primary.altText ?? product.title}
          fill
          sizes="(max-width: 767px) 100vw, 55vw"
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      {/* Thumbnails */}
      {thumbs.length > 0 && (
        <div className="pd-gallery__thumbs" role="list" aria-label="Additional views">
          {thumbs.map((img, i) => (
            <div key={img.id} className="pd-gallery__thumb" role="listitem">
              <Image
                src={img.url}
                alt={img.altText ?? `${product.title} view ${i + 2}`}
                fill
                sizes="180px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProductDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const product = await getPublishedProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const waUrl = buildProductWhatsAppUrl(product)
  const hasSpecs = Boolean(
    product.price ||
    product.dimensions ||
    product.material ||
    product.customization ||
    product.availability
  )

  return (
    <>
      <Navigation />

      <main id="main-content" tabIndex={-1} className="pd-page">
        {/* ── Breadcrumb ── */}
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <div className="container">
            <ol className="pd-breadcrumb__list">
              <li><Link href="/">Home</Link></li>
              <li aria-hidden="true">·</li>
              <li><Link href="/products">Products</Link></li>
              <li aria-hidden="true">·</li>
              <li aria-current="page">{product.title}</li>
            </ol>
          </div>
        </nav>

        {/* ── Falcon Line rule ── */}
        <div className="pd-rule" aria-hidden="true" />

        {/* ── Two-column layout ── */}
        <div className="container">
          <div className="pd-layout">
            {/* Left: Gallery */}
            <div className="pd-layout__media">
              <Gallery product={product} />
            </div>

            {/* Right: Details */}
            <div className="pd-layout__details">
              {/* Category */}
              {product.category && (
                <span className="pd-category">{product.category.name}</span>
              )}

              {/* Title */}
              <h1 className="pd-title">{product.title}</h1>
              {product.subtitle && (
                <p className="pd-subtitle">{product.subtitle}</p>
              )}

              {/* Price (optional, only when filled in) */}
              {product.price && (
                <div className="pd-price-wrap" style={{ marginTop: '0.75rem' }}>
                  <span className="pd-price" style={{ fontFamily: 'var(--font-space-grotesk)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-brand-orange, #ff5c00)' }}>
                    {product.price}
                  </span>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div className="pd-description">
                  <p>{product.description}</p>
                </div>
              )}

              {/* Specs (appear only when filled in) */}
              {hasSpecs && (
                <div className="pd-specs-block">
                  <h2 className="pd-specs-block__heading">SPECIFICATIONS</h2>
                  <dl className="pd-specs">
                    {product.price && (
                      <>
                        <dt>Price</dt>
                        <dd>{product.price}</dd>
                      </>
                    )}
                    {product.dimensions && (
                      <>
                        <dt>Dimensions</dt>
                        <dd>{product.dimensions}</dd>
                      </>
                    )}
                    {product.material && (
                      <>
                        <dt>Material</dt>
                        <dd>{product.material}</dd>
                      </>
                    )}
                    {product.customization && (
                      <>
                        <dt>Customisation</dt>
                        <dd>{product.customization}</dd>
                      </>
                    )}
                    {product.availability && (
                      <>
                        <dt>Availability</dt>
                        <dd>{product.availability}</dd>
                      </>
                    )}
                  </dl>
                </div>
              )}

              {/* ── Enquiry actions — Phase 2 ── */}
              {/* ENQUIRE = WhatsApp prefilled link (name + URL) + link to /#contact */}
              <div className="pd-actions">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary pd-actions__enquire"
                  aria-label={`Enquire about ${product.title} via WhatsApp`}
                  id={`product-enquire-whatsapp-${product.id}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  ENQUIRE VIA WHATSAPP
                </a>

                <Link
                  href="/#contact"
                  className="btn-secondary pd-actions__contact"
                  id={`product-contact-${product.id}`}
                >
                  OR SEND DETAILS ↗
                </Link>
              </div>

              {/* Enquiry note */}
              <p className="pd-enquiry-note">
                We'll respond with pricing, lead time and customisation options.
              </p>
            </div>
          </div>
        </div>

        {/* ── Back link ── */}
        <div className="pd-back">
          <div className="container">
            <Link href="/products" className="pd-back__link">
              ← BACK TO PRODUCTS
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      {/* Page-level CSS */}
      <style>{`
        .pd-page {
          padding-top: 72px;
          min-height: 100vh;
          background: var(--paper);
        }

        /* ── Breadcrumb ── */
        .pd-breadcrumb {
          padding: var(--space-4) 0;
          border-bottom: 1px solid var(--stone);
        }
        .pd-breadcrumb__list {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          list-style: none;
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: 0.625rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
        }
        .pd-breadcrumb__list a {
          color: var(--muted);
          text-decoration: none;
          transition: color 200ms;
        }
        .pd-breadcrumb__list a:hover {
          color: var(--ink);
        }
        .pd-breadcrumb__list [aria-current="page"] {
          color: var(--ink);
        }

        .pd-rule {
          height: 1px;
          background: var(--stone);
        }

        /* ── Layout ── */
        .pd-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-16);
          padding: var(--space-16) 0 var(--space-32);
          align-items: start;
        }
        @media (max-width: 767px) {
          .pd-layout {
            grid-template-columns: 1fr;
            gap: var(--space-8);
            padding: var(--space-8) 0 var(--space-24);
          }
        }

        /* ── Gallery ── */
        .pd-gallery {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          position: sticky;
          top: calc(72px + var(--space-6));
        }
        .pd-gallery__primary {
          position: relative;
          aspect-ratio: 4/3;
          background: var(--stone-light);
          overflow: hidden;
        }
        .pd-gallery__thumbs {
          display: flex;
          gap: var(--space-3);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .pd-gallery__thumbs::-webkit-scrollbar { display: none; }
        .pd-gallery__thumb {
          position: relative;
          width: 80px;
          height: 80px;
          flex-shrink: 0;
          background: var(--stone-light);
          overflow: hidden;
          cursor: pointer;
          border: 1px solid var(--stone);
          transition: border-color 200ms;
        }
        .pd-gallery__thumb:hover {
          border-color: var(--ink);
        }
        .pd-gallery__placeholder {
          aspect-ratio: 4/3;
          background: linear-gradient(135deg, var(--stone-light), var(--stone));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pd-gallery__placeholder-text {
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: 0.625rem;
          letter-spacing: 0.12em;
          color: var(--muted);
          text-transform: uppercase;
        }

        /* ── Details ── */
        .pd-category {
          display: block;
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: 0.625rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--falcon-orange);
          margin-bottom: var(--space-3);
        }
        .pd-title {
          font-family: var(--font-space-grotesk, 'Space Grotesk', sans-serif);
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.15;
          color: var(--ink);
          margin-bottom: var(--space-4);
        }
        .pd-subtitle {
          font-size: var(--text-body-l);
          color: var(--muted);
          line-height: var(--leading-body);
          margin-bottom: var(--space-6);
        }
        .pd-description {
          border-top: 1px solid var(--stone);
          padding-top: var(--space-6);
          margin-top: var(--space-2);
          margin-bottom: var(--space-6);
        }
        .pd-description p {
          font-size: var(--text-body-l);
          color: var(--ink);
          line-height: var(--leading-body);
        }

        /* ── Specs ── */
        .pd-specs-block {
          border-top: 1px solid var(--stone);
          padding-top: var(--space-6);
          margin-bottom: var(--space-8);
        }
        .pd-specs-block__heading {
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: 0.625rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: var(--space-4);
        }
        .pd-specs {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: var(--space-3) var(--space-8);
        }
        .pd-specs dt {
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: 0.625rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          align-self: center;
          white-space: nowrap;
        }
        .pd-specs dd {
          font-size: 0.9375rem;
          color: var(--ink);
        }

        /* ── Actions ── */
        .pd-actions {
          display: flex;
          align-items: center;
          gap: var(--space-6);
          flex-wrap: wrap;
          margin-bottom: var(--space-4);
        }
        .pd-actions__enquire {
          font-size: 0.8125rem;
        }
        .pd-actions__contact {
          font-size: 0.8125rem;
          letter-spacing: 0.06em;
        }
        .pd-enquiry-note {
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: 0.625rem;
          letter-spacing: 0.06em;
          color: var(--muted);
          line-height: 1.5;
        }

        /* ── Back ── */
        .pd-back {
          border-top: 1px solid var(--stone);
          padding: var(--space-8) 0;
        }
        .pd-back__link {
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: var(--text-mono);
          letter-spacing: var(--tracking-mono);
          text-transform: uppercase;
          color: var(--muted);
          text-decoration: none;
          transition: color 200ms;
        }
        .pd-back__link:hover {
          color: var(--ink);
        }
      `}</style>
    </>
  )
}
