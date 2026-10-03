'use client'

import { useState, useEffect } from 'react'
import { uploadMediaWithLimits } from '@/lib/media/client-resize'

interface MediaItem {
  id: string
  key: string
  url: string
  public_url?: string
  storage_path?: string
  filename: string
  mime_type: string
  size_bytes: number
  width?: number
  height?: number
  alt_text?: string
  caption?: string
  created_at: number
}

interface WarningReference {
  type: string
  name: string
  field: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deleteWarning, setDeleteWarning] = useState<{ item: MediaItem; references: WarningReference[] } | null>(null)

  useEffect(() => { fetchMedia() }, [search])

  async function fetchMedia() {
    setLoading(true)
    try {
      const q = search ? `?q=${encodeURIComponent(search)}` : ''
      const res = await fetch(`/api/admin/media${q}`)
      if (res.ok) {
        const data = await res.json()
        setMediaList(data.media || [])
      }
    } catch {}
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const res = await uploadMediaWithLimits(file)
      if (res.success) { fetchMedia() }
      else { setUploadError(res.error || 'Upload failed') }
    } catch (err: any) { setUploadError(err.message) }
    finally { setUploading(false); e.target.value = '' }
  }

  async function handleDeleteClick(item: MediaItem, force = false) {
    try {
      const url = `/api/admin/media/${item.id}${force ? '?force=true' : ''}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json()
      if (res.status === 409 && data.warning) {
        setDeleteWarning({ item, references: data.references || [] })
      } else if (res.ok) {
        setDeleteWarning(null)
        fetchMedia()
      } else { alert(data.error || 'Failed to delete media') }
    } catch (err: any) { alert('Delete error: ' + err.message) }
  }

  return (
    <>
      {/* Header */}
      <div className="ag-page-header">
        <div>
          <h1 className="ag-page-title">Media Library</h1>
          <p className="ag-page-sub">Supabase Storage · falcon-media bucket · Client-side image resizing · 50 MB max</p>
        </div>
        <label className={`ag-btn ag-btn-primary ${uploading ? '' : ''}`} style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}>
          {uploading ? 'Uploading…' : '+ Upload Image'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={handleUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="ag-alert ag-alert-error">Upload Rejected: {uploadError}</div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Filter by filename or alt text…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ag-input"
          style={{ maxWidth: '360px' }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="ag-loading"><span className="ag-spin" />Loading media library…</div>
      ) : mediaList.length === 0 ? (
        <div className="ag-empty">No media assets found. Click "+ Upload Image" to add your first asset.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(196px, 1fr))', gap: '14px' }}>
          {mediaList.map((m) => (
            <div key={m.id} className="ag-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Thumbnail */}
              <div style={{ aspectRatio: '16/10', background: '#18181b', overflow: 'hidden', flexShrink: 0, borderBottom: '1px solid #1f1f23' }}>
                <img src={m.url} alt={m.alt_text || m.filename} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              {/* Info */}
              <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#d4d4d8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.filename}
                </div>
                <div style={{ fontSize: '11px', color: '#52525b' }}>
                  {formatBytes(m.size_bytes)} · {m.mime_type.split('/')[1]?.toUpperCase()}
                  {m.width && m.height ? ` · ${m.width}×${m.height}` : ''}
                </div>
                <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a href={m.url} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}>View ↗</a>
                  <button onClick={() => handleDeleteClick(m, false)} className="ag-btn ag-btn-danger" style={{ padding: '3px 8px', fontSize: '11px' }}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Warning Modal */}
      {deleteWarning && (
        <div className="ag-modal-bg">
          <div className="ag-modal" style={{ maxWidth: '520px', border: '1px solid rgba(239,68,68,0.4)' }}>
            <div className="ag-modal-header" style={{ borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
              <h2 className="ag-modal-title" style={{ color: '#f87171' }}>⚠ Media Currently In Use</h2>
              <button className="ag-modal-close" onClick={() => setDeleteWarning(null)}>✕</button>
            </div>
            <div className="ag-modal-body">
              <p style={{ fontSize: '13px', color: '#d4d4d8', marginBottom: '14px', lineHeight: 1.6 }}>
                <strong>"{deleteWarning.item.filename}"</strong> is referenced by {deleteWarning.references.length} item(s):
              </p>
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', padding: '12px', maxHeight: '140px', overflowY: 'auto', marginBottom: '14px' }}>
                {deleteWarning.references.map((r, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#71717a', marginBottom: '5px' }}>
                    • <strong style={{ color: '#d4d4d8' }}>{r.name}</strong> <span style={{ color: '#52525b' }}>({r.type} → <code style={{ fontFamily: 'monospace' }}>{r.field}</code>)</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: '#52525b' }}>
                Deleting this file will break images in those locations.
              </p>
            </div>
            <div className="ag-modal-footer">
              <button onClick={() => setDeleteWarning(null)} className="ag-btn ag-btn-ghost">Cancel</button>
              <button onClick={() => handleDeleteClick(deleteWarning.item, true)} className="ag-btn ag-btn-danger" style={{ background: '#ef4444', color: '#fff', borderColor: '#ef4444' }}>
                Force Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
