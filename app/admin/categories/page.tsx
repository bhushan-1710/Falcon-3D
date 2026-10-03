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

  // Edit/Create Modal
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [activeTab])

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
    setEditingCategory({
      type: activeTab,
      name: '',
      slug: '',
      description: '',
      sort_order: categories.length + 1,
      is_active: true,
    })
    setErrorMsg(null)
    setIsOpen(true)
  }

  function handleEdit(c: Category) {
    setEditingCategory({
      ...c,
      is_active: Boolean(c.is_active),
    })
    setErrorMsg(null)
    setIsOpen(true)
  }

  async function handleDelete(c: Category) {
    if (!confirm(`Delete category "${c.name}"?`)) return
    try {
      const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchCategories()
      } else {
        const d = await res.json()
        alert(d.error || 'Delete failed')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
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
      if (res.ok) {
        setIsOpen(false)
        fetchCategories()
      } else {
        setErrorMsg(data.error || 'Failed to save category')
      }
    } catch (err: any) {
      setErrorMsg('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#fff', margin: '0 0 6px 0' }}>
            Categories
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
            Categorization namespaces for commercial products and workshop showcase projects
          </p>
        </div>

        <button
          onClick={handleCreate}
          style={{
            padding: '10px 18px',
            backgroundColor: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          + Add Category
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #27272a',
        marginBottom: '20px',
      }}>
        <button
          onClick={() => setActiveTab('product')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'product' ? '2px solid #fff' : '2px solid transparent',
            color: activeTab === 'product' ? '#fff' : '#71717a',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Product Categories
        </button>
        <button
          onClick={() => setActiveTab('project')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'project' ? '2px solid #fff' : '2px solid transparent',
            color: activeTab === 'project' ? '#fff' : '#71717a',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Project Categories
        </button>
      </div>

      {/* Table */}
      <div style={{
        backgroundColor: '#141418',
        border: '1px solid #27272a',
        borderRadius: '8px',
        overflowX: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #27272a', color: '#a1a1aa', backgroundColor: '#101014' }}>
              <th style={{ padding: '12px 16px' }}>Category Name</th>
              <th style={{ padding: '12px 16px' }}>Slug</th>
              <th style={{ padding: '12px 16px' }}>Order</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>Loading categories…</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>No categories found for {activeTab}.</td></tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #222226' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>{c.name}</td>
                  <td style={{ padding: '12px 16px', color: '#71717a', fontFamily: 'monospace' }}>{c.slug}</td>
                  <td style={{ padding: '12px 16px', color: '#a1a1aa' }}>{c.sort_order}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: c.is_active ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: c.is_active ? '#4ade80' : '#ef4444',
                    }}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(c)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#27272a',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid #ef4444',
                          borderRadius: '4px',
                          color: '#f87171',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {isOpen && editingCategory && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '16px',
        }}>
          <div style={{
            width: '100%', maxWidth: '500px',
            backgroundColor: '#141418', border: '1px solid #27272a',
            borderRadius: '8px', padding: '24px',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 16px 0' }}>
              {editingCategory.id ? 'Edit Category' : `Create ${activeTab.toUpperCase()} Category`}
            </h2>

            {errorMsg && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '6px',
                color: '#fca5a5',
                fontSize: '13px',
                marginBottom: '16px',
              }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#d4d4d8', marginBottom: '6px' }}>Name *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 12px',
                    backgroundColor: '#0a0a0c', border: '1px solid #3f3f46',
                    borderRadius: '4px', color: '#fff', fontSize: '13px', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#d4d4d8', marginBottom: '6px' }}>Slug</label>
                <input
                  type="text"
                  value={editingCategory.slug || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 12px',
                    backgroundColor: '#0a0a0c', border: '1px solid #3f3f46',
                    borderRadius: '4px', color: '#fff', fontSize: '13px', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#d4d4d8', marginBottom: '6px' }}>Description</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 12px',
                    backgroundColor: '#0a0a0c', border: '1px solid #3f3f46',
                    borderRadius: '4px', color: '#fff', fontSize: '13px', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#d4d4d8', marginBottom: '6px' }}>Sort Order</label>
                  <input
                    type="number"
                    value={editingCategory.sort_order || 0}
                    onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: parseInt(e.target.value, 10) || 0 })}
                    style={{
                      width: '100%', padding: '8px 12px',
                      backgroundColor: '#0a0a0c', border: '1px solid #3f3f46',
                      borderRadius: '4px', color: '#fff', fontSize: '13px', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#fff', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editingCategory.is_active}
                      onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{
                    padding: '8px 16px', backgroundColor: 'transparent',
                    border: '1px solid #3f3f46', borderRadius: '4px', color: '#fff', fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 18px', backgroundColor: '#fff', color: '#000',
                    border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
