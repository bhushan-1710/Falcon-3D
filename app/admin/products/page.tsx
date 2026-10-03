'use client'

import { useState, useEffect } from 'react'
import { MediaPicker } from '@/components/admin/MediaPicker'

interface Product {
  id: string
  slug: string
  title: string
  subtitle?: string
  price?: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isFeatured: boolean
  sort_order: number
  category_id?: string
  category_name?: string
  imageUrl?: string
  featured_image_id?: string
  created_at: number
}

interface Category {
  id: string
  name: string
}

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'ag-badge-green',
  DRAFT: 'ag-badge-yellow',
  ARCHIVED: 'ag-badge-zinc',
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [statusFilter, categoryFilter, search])

  async function fetchProducts() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (categoryFilter !== 'ALL') params.set('category_id', categoryFilter)
      if (search.trim()) params.set('q', search.trim())
      const res = await fetch(`/api/admin/products?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch {}
    setLoading(false)
  }

  async function fetchCategories() {
    try {
      const res = await fetch('/api/admin/categories?type=product')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch {}
  }

  function handleCreate() {
    setEditingProduct({
      title: '', slug: '', subtitle: '', short_description: '', description: '',
      price: '', dimensions: '', material: '', customization: '', availability: '',
      category_id: categories[0]?.id || '', status: 'DRAFT', is_featured: false,
      sort_order: 0, featured_image_id: null, featured_image_url: null,
    })
    setErrorMsg(null)
    setIsEditorOpen(true)
  }

  async function handleEdit(id: string) {
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/admin/products/${id}`)
      if (res.ok) {
        const data = await res.json()
        setEditingProduct(data.product)
        setIsEditorOpen(true)
      }
    } catch (err: any) { alert('Error loading product: ' + err.message) }
  }

  async function handleDuplicate(id: string) {
    if (!confirm('Duplicate this product?')) return
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' })
      if (res.ok) { fetchProducts() }
      else { const d = await res.json(); alert(d.error || 'Duplicate failed') }
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  async function handleStatusToggle(p: Product, newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, status: newStatus }),
      })
      if (res.ok) fetchProducts()
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  async function handleDelete(p: Product) {
    if (p.status !== 'ARCHIVED') {
      alert('Only ARCHIVED products can be deleted. Please archive this product first.')
      return
    }
    if (!confirm(`Permanently delete "${p.title}"?`)) return
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' })
      if (res.ok) { fetchProducts() }
      else { const d = await res.json(); alert(d.error || 'Delete failed') }
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    try {
      const isNew = !editingProduct.id
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${editingProduct.id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProduct),
      })
      const data = await res.json()
      if (res.ok) { setIsEditorOpen(false); fetchProducts() }
      else { setErrorMsg(data.error || 'Failed to save product') }
    } catch (err: any) {
      setErrorMsg('Error: ' + err.message)
    } finally { setSaving(false) }
  }

  return (
    <>
      {/* Header */}
      <div className="ag-page-header">
        <div>
          <h1 className="ag-page-title">Products Catalog</h1>
          <p className="ag-page-sub">Manage fabrication objects, pricing, and availability.</p>
        </div>
        <button onClick={handleCreate} className="ag-btn ag-btn-primary">+ Add Product</button>
      </div>

      {/* Filter bar */}
      <div className="ag-filter-bar">
        <input
          type="text"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ag-input"
          style={{ flex: '1 1 200px', minWidth: '140px' }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ag-input"
          style={{ flex: '0 0 auto', width: 'auto' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="ag-input"
          style={{ flex: '0 0 auto', width: 'auto' }}
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="ag-table-wrap">
        <div className="ag-table-scroll">
          <table className="ag-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}>
                  <div className="ag-loading"><span className="ag-spin" />Loading products…</div>
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={5}>
                  <div className="ag-empty">No products found. Click "+ Add Product" to create one.</div>
                </td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 6, overflow: 'hidden',
                          background: '#18181b', flexShrink: 0, border: '1px solid #27272a',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 16, opacity: 0.3 }}>◈</span>
                          }
                        </div>
                        <div>
                          <div className="cell-primary" style={{ fontSize: 13 }}>{p.title}</div>
                          <div className="cell-mono">/{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.category_name || <span style={{ color: '#3f3f46' }}>—</span>}</td>
                    <td style={{ fontWeight: 600, color: '#d4d4d8' }}>{p.price || <span style={{ color: '#3f3f46' }}>—</span>}</td>
                    <td>
                      <span className={`ag-badge ${STATUS_BADGE[p.status] || 'ag-badge-zinc'}`}>{p.status}</span>
                    </td>
                    <td className="cell-actions">
                      <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'nowrap' }}>
                        <button onClick={() => handleEdit(p.id)} className="ag-btn ag-btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }}>Edit</button>
                        <button onClick={() => handleDuplicate(p.id)} className="ag-btn ag-btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }}>Dupe</button>
                        {p.status === 'PUBLISHED' && (
                          <button onClick={() => handleStatusToggle(p, 'DRAFT')} className="ag-btn ag-btn-ghost" style={{ padding: '4px 10px', fontSize: '12px', color: '#facc15', borderColor: 'rgba(250,204,21,0.3)' }}>Unpublish</button>
                        )}
                        {p.status === 'DRAFT' && (
                          <button onClick={() => handleStatusToggle(p, 'PUBLISHED')} className="ag-btn ag-btn-ghost" style={{ padding: '4px 10px', fontSize: '12px', color: '#4ade80', borderColor: 'rgba(74,222,128,0.3)' }}>Publish</button>
                        )}
                        {p.status !== 'ARCHIVED' ? (
                          <button onClick={() => handleStatusToggle(p, 'ARCHIVED')} className="ag-btn ag-btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }}>Archive</button>
                        ) : (
                          <button onClick={() => handleDelete(p)} className="ag-btn ag-btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && editingProduct && (
        <div className="ag-modal-bg">
          <div className="ag-modal" style={{ maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="ag-modal-header">
              <h2 className="ag-modal-title">{editingProduct.id ? 'Edit Product' : 'Create New Product'}</h2>
              <button type="button" onClick={() => setIsEditorOpen(false)} className="ag-modal-close">✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div className="ag-modal-body" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {errorMsg && <div className="ag-alert ag-alert-error">{errorMsg}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' }}>
                  <div>
                    <label className="ag-label">Title *</label>
                    <input type="text" required value={editingProduct.title || ''} onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })} className="ag-input" placeholder="Product name" />
                  </div>
                  <div>
                    <label className="ag-label">Slug (auto-generated if empty)</label>
                    <input type="text" value={editingProduct.slug || ''} onChange={(e) => setEditingProduct({ ...editingProduct, slug: e.target.value })} className="ag-input" placeholder="product-slug" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <label className="ag-label">Category</label>
                    <select value={editingProduct.category_id || ''} onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })} className="ag-input">
                      <option value="">No Category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="ag-label">Status</label>
                    <select value={editingProduct.status || 'DRAFT'} onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })} className="ag-input">
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>
                  </div>
                  <div>
                    <label className="ag-label">Price</label>
                    <input type="text" placeholder="₹1,200" value={editingProduct.price || ''} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} className="ag-input" />
                  </div>
                </div>

                <MediaPicker
                  value={editingProduct.featured_image_id}
                  initialUrl={editingProduct.imageUrl || editingProduct.featured_image_url}
                  onChange={(mediaId, mediaUrl) => setEditingProduct({ ...editingProduct, featured_image_id: mediaId, featured_image_url: mediaUrl })}
                />

                <div>
                  <label className="ag-label">Short Description</label>
                  <textarea rows={2} value={editingProduct.short_description || ''} onChange={(e) => setEditingProduct({ ...editingProduct, short_description: e.target.value })} className="ag-input" style={{ resize: 'vertical' }} />
                </div>

                <div>
                  <label className="ag-label">Full Description</label>
                  <textarea rows={4} value={editingProduct.description || ''} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} className="ag-input" style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <label className="ag-label">Dimensions</label>
                    <input type="text" placeholder="120 × 80 × 40 mm" value={editingProduct.dimensions || ''} onChange={(e) => setEditingProduct({ ...editingProduct, dimensions: e.target.value })} className="ag-input" />
                  </div>
                  <div>
                    <label className="ag-label">Material</label>
                    <input type="text" placeholder="PLA / PETG" value={editingProduct.material || ''} onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })} className="ag-input" />
                  </div>
                </div>
              </div>

              <div className="ag-modal-footer">
                <button type="button" onClick={() => setIsEditorOpen(false)} className="ag-btn ag-btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="ag-btn ag-btn-primary">
                  {saving ? 'Saving…' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
