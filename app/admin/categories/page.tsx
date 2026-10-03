'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  type: 'project' | 'product'
  name: string
  slug: string
  description?: string
  sort_order: number
  is_active: number
}

export default function AdminCategoriesPage() {
  const [activeTab, setActiveTab] = useState<'product' | 'project'>('product')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => { fetchCategories() }, [activeTab])

  async function fetchCategories() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/categories?type=${activeTab}`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch {}
    setLoading(false)
  }

  function handleCreate() {
    setEditingCategory({ type: activeTab, name: '', slug: '', description: '', sort_order: categories.length + 1, is_active: true })
    setErrorMsg(null)
    setIsOpen(true)
  }

  function handleEdit(c: Category) {
    setEditingCategory({ ...c, is_active: Boolean(c.is_active) })
    setErrorMsg(null)
    setIsOpen(true)
  }

  async function handleDelete(c: Category) {
    if (!confirm(`Delete category "${c.name}"?`)) return
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' })
      if (res.ok) { fetchCategories() }
      else { const d = await res.json(); alert(d.error || 'Delete failed') }
    } catch (err: any) { alert('Error: ' + err.message) }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    try {
      const isNew = !editingCategory.id
      const url = isNew ? '/api/admin/categories' : `/api/admin/categories/${editingCategory.id}`
      const method = isNew ? 'POST' : 'PUT'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory),
      })
      const data = await res.json()
      if (res.ok) { setIsOpen(false); fetchCategories() }
      else { setErrorMsg(data.error || 'Failed to save category') }
    } catch (err: any) {
      setErrorMsg('Error: ' + err.message)
    } finally { setSaving(false) }
  }

  return (
    <>
      {/* Header */}
      <div className="ag-page-header">
        <div>
          <h1 className="ag-page-title">Categories</h1>
          <p className="ag-page-sub">Categorization namespaces for products and workshop projects.</p>
        </div>
        <button onClick={handleCreate} className="ag-btn ag-btn-primary">+ Add Category</button>
      </div>

      {/* Tabs */}
      <div className="ag-tabs">
        <button className={`ag-tab ${activeTab === 'product' ? 'active' : ''}`} onClick={() => setActiveTab('product')}>
          Product Categories
        </button>
        <button className={`ag-tab ${activeTab === 'project' ? 'active' : ''}`} onClick={() => setActiveTab('project')}>
          Project Categories
        </button>
      </div>

      {/* Table */}
      <div className="ag-table-wrap">
        <div className="ag-table-scroll">
          <table className="ag-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Order</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5}><div className="ag-loading"><span className="ag-spin" />Loading categories…</div></td></tr>
              ) : categories.length === 0 ? (
                <tr><td colSpan={5}><div className="ag-empty">No {activeTab} categories found.</div></td></tr>
              ) : (
                categories.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-primary">{c.name}</td>
                    <td className="cell-mono">{c.slug}</td>
                    <td style={{ fontSize: '13px' }}>{c.sort_order}</td>
                    <td>
                      <span className={`ag-badge ${c.is_active ? 'ag-badge-green' : 'ag-badge-red'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="cell-actions">
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button onClick={() => handleEdit(c)} className="ag-btn ag-btn-ghost" style={{ padding: '4px 10px', fontSize: '12px' }}>Edit</button>
                        <button onClick={() => handleDelete(c)} className="ag-btn ag-btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isOpen && editingCategory && (
        <div className="ag-modal-bg">
          <div className="ag-modal" style={{ maxWidth: '480px' }}>
            <div className="ag-modal-header">
              <h2 className="ag-modal-title">
                {editingCategory.id ? 'Edit Category' : `Create ${activeTab === 'product' ? 'Product' : 'Project'} Category`}
              </h2>
              <button className="ag-modal-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="ag-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {errorMsg && <div className="ag-alert ag-alert-error">{errorMsg}</div>}

                <div>
                  <label className="ag-label">Name *</label>
                  <input type="text" required value={editingCategory.name || ''} onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })} className="ag-input" placeholder="Category name" />
                </div>
                <div>
                  <label className="ag-label">Slug (auto-generated if empty)</label>
                  <input type="text" value={editingCategory.slug || ''} onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })} className="ag-input" placeholder="category-slug" />
                </div>
                <div>
                  <label className="ag-label">Description</label>
                  <textarea rows={2} value={editingCategory.description || ''} onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })} className="ag-input" style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', alignItems: 'end' }}>
                  <div>
                    <label className="ag-label">Sort Order</label>
                    <input type="number" value={editingCategory.sort_order || 0} onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value, 10) || 0 })} className="ag-input" />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#a1a1aa', cursor: 'pointer', paddingBottom: '1px' }}>
                    <input type="checkbox" checked={editingCategory.is_active} onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.checked })} style={{ accentColor: '#f59e0b', width: '14px', height: '14px' }} />
                    Active
                  </label>
                </div>
              </div>

              <div className="ag-modal-footer">
                <button type="button" onClick={() => setIsOpen(false)} className="ag-btn ag-btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="ag-btn ag-btn-primary">
                  {saving ? 'Saving…' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
