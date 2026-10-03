'use client'

import React, { useState, useEffect } from 'react'

interface NavItem {
  id: string
  label: string
  url: string
  is_external: number | boolean
  open_new_tab: number | boolean
  is_visible: number | boolean
  sort_order: number
}

const DEFAULT_NAV = [
  { label: 'Studio', url: '/#hero', is_external: false, open_new_tab: false, is_visible: true, sort_order: 1 },
  { label: 'Process', url: '/#process', is_external: false, open_new_tab: false, is_visible: true, sort_order: 2 },
  { label: 'Workshop', url: '/#workshop', is_external: false, open_new_tab: false, is_visible: true, sort_order: 3 },
  { label: 'Print Lab', url: '/#lab', is_external: false, open_new_tab: false, is_visible: true, sort_order: 4 },
  { label: 'About', url: '/#about', is_external: false, open_new_tab: false, is_visible: true, sort_order: 5 },
  { label: 'Products', url: '/products', is_external: false, open_new_tab: false, is_visible: true, sort_order: 6 },
  { label: 'Contact', url: '/#contact', is_external: false, open_new_tab: false, is_visible: true, sort_order: 7 },
]

export default function AdminNavigationPage() {
  const [items, setItems] = useState<NavItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<Partial<NavItem> | null>(null)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/navigation')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem?.label || !editingItem?.url) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem),
      })
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Navigation item saved!' })
        setTimeout(() => setStatusMessage(null), 3000)
        setEditingItem(null)
        await fetchItems()
      } else {
        const data = await res.json()
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save item' })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Save error' })
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this navigation link?')) return
    try {
      const res = await fetch(`/api/admin/navigation?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) await fetchItems()
    } catch (err) { console.error(err) }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return
    const newItems = [...items]
    const current = newItems[index]
    const target = newItems[targetIndex]
    const currentOrder = current.sort_order
    const targetOrder = target.sort_order
    current.sort_order = targetOrder === currentOrder ? currentOrder + (direction === 'up' ? -1 : 1) : targetOrder
    target.sort_order = currentOrder
    newItems[index] = target
    newItems[targetIndex] = current
    setItems(newItems)
    try {
      await Promise.all([
        fetch('/api/admin/navigation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(current) }),
        fetch('/api/admin/navigation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(target) }),
      ])
      await fetchItems()
    } catch (err) { console.error('Reorder save failed', err) }
  }

  async function handleResetToDefaults() {
    if (!confirm('Reset all navigation items to default website layout? This will replace custom links.')) return
    setSaving(true)
    try {
      for (const item of items) {
        await fetch(`/api/admin/navigation?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' })
      }
      for (const def of DEFAULT_NAV) {
        await fetch('/api/admin/navigation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(def) })
      }
      setStatusMessage({ type: 'success', text: 'Navigation restored to defaults!' })
      await fetchItems()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Reset failed' })
    } finally { setSaving(false) }
  }

  return (
    <>
      {/* Page header */}
      <div className="ag-page-header">
        <div>
          <h1 className="ag-page-title">Navigation Links</h1>
          <p className="ag-page-sub">Control the header menu order, visibility, and external destinations.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={handleResetToDefaults}
            disabled={saving}
            className="ag-btn ag-btn-ghost"
          >
            Reset Defaults
          </button>
          <button
            onClick={() => setEditingItem({ label: '', url: '', is_external: 0, open_new_tab: 0, is_visible: 1, sort_order: items.length + 1 })}
            className="ag-btn ag-btn-primary"
          >
            + Add Link
          </button>
        </div>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className={`ag-alert ${statusMessage.type === 'success' ? 'ag-alert-success' : 'ag-alert-error'}`}>
          {statusMessage.text}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="ag-loading"><span className="ag-spin" />Loading navigation…</div>
      ) : (
        <div className="ag-table-wrap">
          <div className="ag-table-scroll">
            <table className="ag-table">
              <thead>
                <tr>
                  <th style={{ width: 48, textAlign: 'center' }}>#</th>
                  <th>Label</th>
                  <th>URL / Anchor</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="ag-empty">
                        No navigation links configured. Click <strong>"Reset Defaults"</strong> to populate default links.
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: '11px' }}>
                        {item.sort_order || idx + 1}
                      </td>
                      <td className="cell-primary">{item.label}</td>
                      <td className="cell-mono">{item.url}</td>
                      <td>
                        {item.is_external || item.open_new_tab ? (
                          <span className="ag-badge ag-badge-blue">External</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#3f3f46' }}>Internal</span>
                        )}
                      </td>
                      <td>
                        <span className={`ag-badge ${item.is_visible ? 'ag-badge-green' : 'ag-badge-zinc'}`}>
                          {item.is_visible ? 'Visible' : 'Hidden'}
                        </span>
                      </td>
                      <td className="cell-actions">
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            title="Move Up"
                            className="ag-icon-btn"
                          >▲</button>
                          <button
                            onClick={() => handleMove(idx, 'down')}
                            disabled={idx === items.length - 1}
                            title="Move Down"
                            className="ag-icon-btn"
                          >▼</button>
                          <button
                            onClick={() => setEditingItem(item)}
                            className="ag-btn ag-btn-ghost"
                            style={{ padding: '4px 12px', fontSize: '12px', color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}
                          >Edit</button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="ag-btn ag-btn-danger"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                          >Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Add Modal */}
      {editingItem && (
        <div className="ag-modal-bg">
          <div className="ag-modal" style={{ maxWidth: '460px' }}>
            <div className="ag-modal-header">
              <h2 className="ag-modal-title">
                {editingItem.id ? 'Edit Navigation Link' : 'Add Navigation Link'}
              </h2>
              <button className="ag-modal-close" onClick={() => setEditingItem(null)}>✕</button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div className="ag-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="ag-label">Label *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.label || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                    placeholder="e.g. Products, Studio, About"
                    className="ag-input"
                  />
                </div>

                <div>
                  <label className="ag-label">URL / Target *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.url || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                    placeholder="e.g. /products, /#workshop, https://..."
                    className="ag-input"
                  />
                </div>

                <div>
                  <label className="ag-label">Sort Order</label>
                  <input
                    type="number"
                    value={editingItem.sort_order ?? 0}
                    onChange={(e) => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) || 0 })}
                    className="ag-input"
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px', borderTop: '1px solid #1f1f23' }}>
                  {[
                    { key: 'is_visible', label: 'Visible in Header' },
                    { key: 'open_new_tab', label: 'Open in New Tab' },
                    { key: 'is_external', label: 'External URL' },
                  ].map(({ key, label }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#a1a1aa', cursor: 'pointer', userSelect: 'none' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(
                          key === 'is_visible'
                            ? editingItem.is_visible !== 0 && editingItem.is_visible !== false
                            : (editingItem as any)[key]
                        )}
                        onChange={(e) => setEditingItem({ ...editingItem, [key]: e.target.checked ? 1 : 0 })}
                        style={{ accentColor: '#f59e0b', width: '14px', height: '14px' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="ag-modal-footer">
                <button type="button" onClick={() => setEditingItem(null)} className="ag-btn ag-btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="ag-btn ag-btn-primary">
                  {saving ? 'Saving…' : 'Save Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .ag-icon-btn {
          padding: 4px 8px;
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 5px;
          color: #71717a;
          font-size: 10px;
          cursor: pointer;
          transition: background 0.13s, color 0.13s;
          font-family: inherit;
        }
        .ag-icon-btn:hover { background: #27272a; color: #d4d4d8; }
        .ag-icon-btn:disabled { opacity: 0.25; cursor: not-allowed; }
      `}</style>
    </>
  )
}
