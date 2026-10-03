/**
 * /products — Fabrication Catalog
 *
 * Phase 2: Static fixture data. Phase 3 will swap in D1.
 *
 * Navigation rules (Phase 2):
 * - SERVICES, WORK, PROCESS, ABOUT, CONTACT → link to /#<anchor>
 * - PRODUCTS → /products (active on this route)
 * - CTA → /#contact
 * No home-scene code is mounted on this route.
 *
 * Enquiry flow (Phase 2 spec):
 * ENQUIRE = WhatsApp prefilled link + link to /#contact
 * No form storage; D1 enquiry table proposed as a later phase.
 */

import Link from 'next/link'
import Image from 'next/image'
import { Navigation } from '@/components/Navigation'
import { Footer } from '@/components/Footer'
import { getPublishedProducts, getProductCategories, buildProductWhatsAppUrl } from '@/lib/data/products'
import { productsPage, brand } from '@/lib/content'
import type { Product } from '@/lib/types/products'

// ─── Product card ────────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const waUrl = buildProductWhatsAppUrl(product)

  return (
    <article
      className="product-card"
      aria-label={product.title}
    >
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="product-card__image-link" tabIndex={-1} aria-hidden="true">
        <div className="product-card__image-wrap">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="product-card__placeholder" aria-label="Image coming soon" />
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

        {/* Enquiry actions — Phase 2: WhatsApp + /#contact, no form */}
        <div className="product-card__actions">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary product-card__btn-enquire"
            aria-label={`Enquire about ${product.title} on WhatsApp`}
            id={`enquire-whatsapp-${product.id}`}
          >
            {/* WhatsApp icon */}
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

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="products-empty">
      <div className="products-empty__eyebrow">{productsPage.emptyTitle}</div>
      <p className="products-empty__text">{productsPage.emptyText}</p>
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

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getPublishedProducts(),
    getProductCategories(),
  ])

  return (
    <>
      <Navigation />

      <main id="main-content" tabIndex={-1} className="products-page">
        {/* ── Hero ── */}
        <section className="products-hero" aria-labelledby="products-heading">
          <div className="container">
            <div className="products-hero__inner">
              <span className="products-hero__eyebrow">{productsPage.heroEyebrow}</span>
              <h1 id="products-heading" className="products-hero__headline">
                {productsPage.heroHeadline}
              </h1>
              <p className="products-hero__subline">{productsPage.heroSubline}</p>
            </div>
          </div>

          {/* Falcon Line rule */}
          <div className="products-hero__rule" aria-hidden="true" />
        </section>

        {/* ── Category filter row ── */}
        {categories.length > 0 && products.length > 0 && (
          <nav className="products-filter" aria-label="Filter by category">
            <div className="container">
              <div className="products-filter__inner">
                <span className="products-filter__label">FILTER</span>
                <div className="products-filter__chips" role="list">
                  <span className="products-filter__chip products-filter__chip--active" role="listitem">
                    ALL
                  </span>
                  {categories.map((cat) => (
                    <span key={cat.id} className="products-filter__chip" role="listitem">
                      {cat.name.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </nav>
        )}

        {/* ── Grid ── */}
        <section className="products-grid-section" aria-label="Products">
          <div className="container">
            {products.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="products-grid" role="list">
                {products.map((product) => (
                  <div key={product.id} role="listitem">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Custom print CTA band ── */}
        <section className="products-cta-band" aria-label="Request custom print">
          <div className="container">
            <div className="products-cta-band__inner">
              <div className="products-cta-band__copy">
                <p className="products-cta-band__eyebrow">DON'T SEE WHAT YOU NEED?</p>
                <p className="products-cta-band__text">
                  Every object in our catalogue started as a custom request.
                  <br />
                  Send us your idea or reference file.
                </p>
              </div>
              <div className="products-cta-band__actions">
                <a
                  href={brand.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  id="enquire-custom-cta-band"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  {productsPage.ctaCustom}
                </a>
                <Link href="/#contact" className="btn-secondary">
                  OR SEND A FILE ↗
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Page-level CSS */}
      <style>{`
        /* ── Products page layout ── */
        .products-page {
          padding-top: 72px; /* nav height */
          min-height: 100vh;
          background: var(--paper);
        }

        /* ── Hero ── */
        .products-hero {
          padding: var(--space-32) 0 var(--space-24);
          position: relative;
        }
        .products-hero__inner {
          max-width: 720px;
        }
        .products-hero__eyebrow {
          display: block;
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: var(--text-mono);
          letter-spacing: var(--tracking-mono);
          color: var(--muted);
          text-transform: uppercase;
          margin-bottom: var(--space-6);
        }
        .products-hero__headline {
          font-family: var(--font-space-grotesk, 'Space Grotesk', sans-serif);
          font-size: var(--text-display-section);
          font-weight: 700;
          letter-spacing: var(--tracking-display);
          line-height: var(--leading-title);
          color: var(--ink);
          margin-bottom: var(--space-6);
        }
        .products-hero__subline {
          font-size: var(--text-body-l);
          color: var(--muted);
          max-width: 560px;
          line-height: var(--leading-body);
        }
        .products-hero__rule {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--stone);
        }

        /* ── Filter bar ── */
        .products-filter {
          padding: var(--space-6) 0;
          border-bottom: 1px solid var(--stone);
          background: var(--paper);
          position: sticky;
          top: 72px;
          z-index: 10;
        }
        .products-filter__inner {
          display: flex;
          align-items: center;
          gap: var(--space-6);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .products-filter__inner::-webkit-scrollbar { display: none; }
        .products-filter__label {
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: 0.625rem;
          letter-spacing: 0.12em;
          color: var(--muted);
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .products-filter__chips {
          display: flex;
          gap: var(--space-2);
          flex-shrink: 0;
        }
        .products-filter__chip {
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: 0.625rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 5px 12px;
          border: 1px solid var(--stone);
          border-radius: 100px;
          color: var(--muted);
          cursor: pointer;
          white-space: nowrap;
          transition: border-color 200ms, color 200ms, background 200ms;
          user-select: none;
        }
        .products-filter__chip:hover {
          border-color: var(--ink);
          color: var(--ink);
        }
        .products-filter__chip--active {
          border-color: var(--ink);
          color: var(--ink);
          background: var(--ink);
          color: var(--paper);
        }

        /* ── Grid ── */
        .products-grid-section {
          padding: var(--space-16) 0 var(--space-32);
        }
        .products-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-8);
        }
        @media (max-width: 1023px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 639px) {
          .products-grid {
            grid-template-columns: 1fr;
            gap: var(--space-6);
          }
        }

        /* ── Product card ── */
        .product-card {
          display: flex;
          flex-direction: column;
          background: var(--paper);
          border: 1px solid var(--stone);
          transition: border-color 220ms var(--ease-out), box-shadow 220ms var(--ease-out);
        }
        .product-card:hover {
          border-color: var(--ink);
          box-shadow: var(--shadow-hover);
        }
        .product-card__image-link {
          display: block;
          text-decoration: none;
        }
        .product-card__image-wrap {
          position: relative;
          aspect-ratio: 4/3;
          background: var(--stone-light);
          overflow: hidden;
        }
        .product-card__image-wrap img {
          transition: transform 600ms var(--ease-out);
        }
        .product-card:hover .product-card__image-wrap img {
          transform: scale(1.04);
        }
        .product-card__placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--stone-light), var(--stone));
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .product-card__badge {
          position: absolute;
          top: var(--space-4);
          left: var(--space-4);
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: 0.5625rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          background: var(--falcon-orange);
          color: var(--paper);
          padding: 3px 8px;
          border-radius: 2px;
        }
        .product-card__body {
          padding: var(--space-6);
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .product-card__category {
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: 0.625rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--falcon-orange);
        }
        .product-card__title {
          font-family: var(--font-space-grotesk, 'Space Grotesk', sans-serif);
          font-size: clamp(1.125rem, 1.5vw, 1.375rem);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.25;
          color: var(--ink);
        }
        .product-card__title-link {
          text-decoration: none;
          color: inherit;
        }
        .product-card__title-link:hover {
          color: var(--falcon-orange);
        }
        .product-card__desc {
          font-size: 0.875rem;
          color: var(--muted);
          line-height: 1.55;
          flex: 1;
        }
        .product-card__specs {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 3px var(--space-4);
          margin-top: var(--space-2);
        }
        .product-card__specs dt {
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: 0.5625rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--muted);
          align-self: center;
        }
        .product-card__specs dd {
          font-size: 0.8125rem;
          color: var(--ink);
        }
        .product-card__actions {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          margin-top: var(--space-4);
          flex-wrap: wrap;
        }
        .product-card__btn-enquire {
          height: 44px;
          font-size: 0.75rem;
          padding: 0 var(--space-6);
          flex-shrink: 0;
        }
        .product-card__btn-view {
          font-size: 0.75rem;
          height: 44px;
          letter-spacing: 0.06em;
          white-space: nowrap;
        }

        /* ── Empty state ── */
        .products-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--space-6);
          padding: var(--space-32) 0;
        }
        .products-empty__eyebrow {
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: var(--text-mono);
          letter-spacing: var(--tracking-mono);
          color: var(--muted);
          text-transform: uppercase;
        }
        .products-empty__text {
          max-width: 480px;
          font-size: var(--text-body-l);
          color: var(--muted);
          line-height: var(--leading-body);
        }

        /* ── CTA band ── */
        .products-cta-band {
          background: var(--ink);
          color: var(--paper);
          padding: var(--space-16) 0;
        }
        .products-cta-band__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-8);
          flex-wrap: wrap;
        }
        .products-cta-band__eyebrow {
          font-family: var(--font-dm-mono, 'DM Mono', monospace);
          font-size: var(--text-mono);
          letter-spacing: var(--tracking-mono);
          color: var(--muted);
          margin-bottom: var(--space-3);
        }
        .products-cta-band__text {
          font-size: var(--text-body-l);
          color: var(--paper);
          line-height: var(--leading-body);
        }
        .products-cta-band__actions {
          display: flex;
          align-items: center;
          gap: var(--space-6);
          flex-shrink: 1;
          min-width: 0;
          max-width: 100%;
          flex-wrap: wrap;
        }
        .products-cta-band .btn-secondary {
          color: var(--paper);
        }
        .products-cta-band .btn-secondary::after {
          background: var(--paper);
        }
      `}</style>
    </>
  )
}
