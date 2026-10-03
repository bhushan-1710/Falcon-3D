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

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/navigation')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this navigation link?')) return
    try {
      const res = await fetch(`/api/admin/navigation?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await fetchItems()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleMove(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return

    const newItems = [...items]
    const current = newItems[index]
    const target = newItems[targetIndex]

    // Swap sort orders
    const currentOrder = current.sort_order
    const targetOrder = target.sort_order

    current.sort_order = targetOrder === currentOrder ? currentOrder + (direction === 'up' ? -1 : 1) : targetOrder
    target.sort_order = currentOrder

    newItems[index] = target
    newItems[targetIndex] = current

    setItems(newItems)

    // Save both
    try {
      await Promise.all([
        fetch('/api/admin/navigation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(current),
        }),
        fetch('/api/admin/navigation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(target),
        }),
      ])
      await fetchItems()
    } catch (err) {
      console.error('Reorder save failed', err)
    }
  }

  async function handleResetToDefaults() {
    if (!confirm('Reset all navigation items to default website layout? This will replace custom links.')) return
    setSaving(true)
    try {
      // Delete existing
      for (const item of items) {
        await fetch(`/api/admin/navigation?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' })
      }
      // Re-insert defaults
      for (const def of DEFAULT_NAV) {
        await fetch('/api/admin/navigation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(def),
        })
      }
      setStatusMessage({ type: 'success', text: 'Navigation restored to defaults!' })
      await fetchItems()
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Reset failed' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Navigation Links</h1>
          <p className="text-sm text-zinc-400">
            Control the header menu order, visibility, and external destinations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetToDefaults}
            disabled={saving}
            className="px-3.5 py-2 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
          >
            Reset Defaults
          </button>
          <button
            onClick={() =>
              setEditingItem({
                label: '',
                url: '',
                is_external: 0,
                open_new_tab: 0,
                is_visible: 1,
                sort_order: items.length + 1,
              })
            }
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg shadow transition-colors"
          >
            + Add Link
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-lg text-sm border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-red-950/40 border-red-800/60 text-red-300'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-12 text-zinc-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mr-3" />
          Loading navigation...
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="bg-zinc-950 text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">Label</th>
                  <th className="py-3 px-4">URL / Anchor</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500 text-sm">
                      No navigation links configured. Click &ldquo;Reset Defaults&rdquo; to populate default links.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-zinc-850/50 transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-xs text-zinc-500">
                        {item.sort_order || idx + 1}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{item.label}</td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-400">{item.url}</td>
                      <td className="py-3 px-4 text-xs">
                        {item.is_external || item.open_new_tab ? (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            New Tab / External
                          </span>
                        ) : (
                          <span className="text-zinc-500">Internal</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.is_visible
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {item.is_visible ? 'Visible' : 'Hidden'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleMove(idx, 'up')}
                          disabled={idx === 0}
                          title="Move Up"
                          className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded text-zinc-300"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMove(idx, 'down')}
                          disabled={idx === items.length - 1}
                          title="Move Down"
                          className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded text-zinc-300"
                        >
                          ▼
                        </button>
                        <button
                          onClick={() => setEditingItem(item)}
                          className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 rounded text-amber-400 font-medium ml-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-2 py-1 text-xs bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800/50 rounded"
                        >
                          Delete
                        </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">
              {editingItem.id ? 'Edit Navigation Link' : 'Add Navigation Link'}
            </h2>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Label *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.label || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, label: e.target.value })}
                  placeholder="e.g. Products, Studio, About"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  URL / Target *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.url || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  placeholder="e.g. /products, /#workshop, https://..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={editingItem.sort_order ?? 0}
                  onChange={(e) => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingItem.is_visible !== 0 && editingItem.is_visible !== false)}
                    onChange={(e) => setEditingItem({ ...editingItem, is_visible: e.target.checked ? 1 : 0 })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Visible in Header</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingItem.open_new_tab)}
                    onChange={(e) => setEditingItem({ ...editingItem, open_new_tab: e.target.checked ? 1 : 0 })}
                    className="accent-amber-500 rounded"
                  />
                  <span>Open in New Tab</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingItem.is_external)}
                    onChange={(e) => setEditingItem({ ...editingItem, is_external: e.target.checked ? 1 : 0 })}
                    className="accent-amber-500 rounded"
                  />
                  <span>External URL</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold rounded-lg shadow transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
