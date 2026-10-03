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

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Delete Warning Dialog State
  const [deleteWarning, setDeleteWarning] = useState<{
    item: MediaItem
    references: WarningReference[]
  } | null>(null)

  useEffect(() => {
    fetchMedia()
  }, [search])

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
      if (res.success) {
        fetchMedia()
      } else {
        setUploadError(res.error || 'Upload failed')
      }
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      // reset file input
      e.target.value = ''
    }
  }

  async function handleDeleteClick(item: MediaItem, force = false) {
    try {
      const url = `/api/admin/media/${item.id}${force ? '?force=true' : ''}`
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json()

      if (res.status === 409 && data.warning) {
        // Media in use! Prompt delete-with-warning modal
        setDeleteWarning({ item, references: data.references || [] })
      } else if (res.ok) {
        setDeleteWarning(null)
        fetchMedia()
      } else {
        alert(data.error || 'Failed to delete media')
      }
    } catch (err: any) {
      alert('Delete error: ' + err.message)
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
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
            Media Library
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
            Stored in Supabase Storage (falcon-media bucket). Client-side image resizing applied. Max file size: 50 MB.
          </p>
        </div>

        <label style={{
          padding: '10px 18px',
          backgroundColor: '#fff',
          color: '#000',
          borderRadius: '6px',
          fontWeight: 600,
          fontSize: '13px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.7 : 1,
        }}>
          {uploading ? 'Processing & Uploading…' : '+ Upload Image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={uploading}
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {uploadError && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          color: '#fca5a5',
          fontSize: '13px',
          marginBottom: '20px',
        }}>
          Upload Rejected: {uploadError}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Filter media by filename or alt text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '8px 12px',
            backgroundColor: '#141418',
            border: '1px solid #27272a',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '13px',
          }}
        />
      </div>

      {/* Media Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#71717a' }}>
            Loading media library…
          </div>
        ) : mediaList.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#71717a' }}>
            No media objects found. Click "+ Upload Image" to upload your first asset.
          </div>
        ) : (
          mediaList.map((m) => (
            <div
              key={m.id}
              style={{
                backgroundColor: '#141418',
                border: '1px solid #27272a',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{
                aspectRatio: '16/10',
                backgroundColor: '#0a0a0c',
                overflow: 'hidden',
                position: 'relative',
              }}>
                <img
                  src={m.url}
                  alt={m.alt_text || m.filename}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#fff',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '4px',
                }}>
                  {m.filename}
                </div>
                <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '8px' }}>
                  {formatBytes(m.size_bytes)} · {m.mime_type.split('/')[1]?.toUpperCase()}
                  {m.width && m.height ? ` · ${m.width}×${m.height}` : ''}
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11px', color: '#38bdf8', textDecoration: 'none' }}
                  >
                    View ↗
                  </a>
                  <button
                    onClick={() => handleDeleteClick(m, false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#f87171',
                      fontSize: '11px',
                      cursor: 'pointer',
                      padding: '4px 6px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete-With-Warning Confirmation Modal */}
      {deleteWarning && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '16px',
        }}>
          <div style={{
            width: '100%', maxWidth: '520px',
            backgroundColor: '#18181b', border: '1px solid #ef4444',
            borderRadius: '8px', padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f87171', margin: '0 0 10px 0' }}>
              ⚠️ Media Currently In Use
            </h2>
            <p style={{ fontSize: '13px', color: '#d4d4d8', margin: '0 0 16px 0', lineHeight: 1.5 }}>
              The file <strong>"{deleteWarning.item.filename}"</strong> is currently referenced by {deleteWarning.references.length} item(s):
            </p>

            <div style={{
              backgroundColor: '#121215',
              border: '1px solid #27272a',
              borderRadius: '6px',
              padding: '12px',
              maxHeight: '160px',
              overflowY: 'auto',
              marginBottom: '20px',
            }}>
              {deleteWarning.references.map((r, i) => (
                <div key={i} style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>
                  • <strong style={{ color: '#fff' }}>{r.name}</strong> ({r.type} → <span style={{ fontFamily: 'monospace' }}>{r.field}</span>)
                </div>
              ))}
            </div>

            <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '0 0 20px 0' }}>
              Deleting this file will break images in those locations. Are you sure you want to force delete it?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setDeleteWarning(null)}
                style={{
                  padding: '8px 16px', backgroundColor: 'transparent',
                  border: '1px solid #3f3f46', borderRadius: '4px', color: '#fff', fontSize: '13px', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClick(deleteWarning.item, true)}
                style={{
                  padding: '8px 18px', backgroundColor: '#ef4444', color: '#fff',
                  border: 'none', borderRadius: '4px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                }}
              >
                Force Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
