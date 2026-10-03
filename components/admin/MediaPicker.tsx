'use client'

import { useState, useEffect } from 'react'

import { uploadMediaWithLimits } from '@/lib/media/client-resize'

export interface SelectedMedia {
  id: string
  url: string
  filename?: string
  altText?: string
}

interface MediaPickerProps {
  value?: string | null // media ID
  initialUrl?: string | null
  onChange: (mediaId: string | null, mediaUrl?: string) => void
  label?: string
}

export function MediaPicker({ value, initialUrl, onChange, label = 'Featured Image' }: MediaPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library')
  const [mediaList, setMediaList] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null)

  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      fetchMedia()
    }
  }, [isOpen, activeTab, search])

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const res = await uploadMediaWithLimits(file)
      if (res.success && res.data) {
        const url = res.data.public_url || res.data.url
        onChange(res.data.id, url)
        setPreviewUrl(url)
        setIsOpen(false)
      } else {
        alert(res.error || 'Upload failed')
      }
    } catch (err: any) {
      alert('Upload error: ' + err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  function handleSelect(item: any) {
    onChange(item.id, item.url)
    setPreviewUrl(item.url)
    setIsOpen(false)
  }

  function handleClear() {
    onChange(null, undefined)
    setPreviewUrl(null)
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#d4d4d8', marginBottom: '6px' }}>
        {label}
      </label>

      {/* Selected Preview Box */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px',
        backgroundColor: '#141418',
        border: '1px solid #27272a',
        borderRadius: '6px',
      }}>
        {previewUrl ? (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '4px',
            overflow: 'hidden',
            backgroundColor: '#0a0a0c',
            flexShrink: 0,
            border: '1px solid #3f3f46',
          }}>
            <img src={previewUrl} alt="Selected" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '4px',
            backgroundColor: '#1f1f23',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#71717a',
            fontSize: '18px',
            flexShrink: 0,
          }}>
            🖼️
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', color: value ? '#fff' : '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value ? `Media ID: ${value}` : 'No image selected'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {value ? 'Change' : 'Select'}
          </button>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                padding: '6px 10px',
                backgroundColor: 'transparent',
                border: '1px solid #ef4444',
                borderRadius: '4px',
                color: '#f87171',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Modal Picker */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '80vh',
            backgroundColor: '#141418',
            border: '1px solid #27272a',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Header & Tabs */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: activeTab === 'library' ? '#fff' : '#a1a1aa',
                    backgroundColor: activeTab === 'library' ? '#27272a' : 'transparent',
                  }}
                >
                  Media Library
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    color: activeTab === 'upload' ? '#fff' : '#a1a1aa',
                    backgroundColor: activeTab === 'upload' ? '#27272a' : 'transparent',
                  }}
                >
                  Upload New
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#a1a1aa',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Tab: Library */}
            {activeTab === 'library' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, padding: '16px' }}>
                <input
                  type="text"
                  placeholder="Search media by filename..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#0a0a0c',
                    border: '1px solid #27272a',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '13px',
                    marginBottom: '16px',
                  }}
                />

                <div style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                  gap: '12px',
                }}>
                  {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', color: '#71717a' }}>
                      Loading media…
                    </div>
                  ) : mediaList.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', color: '#71717a' }}>
                      No media found. Upload one!
                    </div>
                  ) : (
                    mediaList.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelect(m)}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: value === m.id ? '2px solid #3b82f6' : '1px solid #27272a',
                          backgroundColor: '#0a0a0c',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                      >
                        <img src={m.url} alt={m.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          padding: '3px 4px',
                          fontSize: '10px',
                          color: '#e4e4e7',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {m.filename}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Upload */}
            {activeTab === 'upload' && (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>☁️</div>
                <h3 style={{ fontSize: '15px', color: '#fff', margin: '0 0 6px 0' }}>Upload Image to R2</h3>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 20px 0' }}>
                  Supported formats: WebP, JPEG, PNG, AVIF (Max 15MB). SVG strictly disallowed.
                </p>
                <label style={{
                  padding: '10px 20px',
                  backgroundColor: '#fff',
                  color: '#000',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.7 : 1,
                }}>
                  {uploading ? 'Validating & Uploading…' : 'Choose Image File'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    disabled={uploading}
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
