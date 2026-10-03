'use client'

import { useState, useEffect } from 'react'
import { uploadMediaWithLimits } from '@/lib/media/client-resize'

interface Video {
  id: string
  title: string
  description?: string
  external_url?: string
  r2_key?: string
  storage_path?: string
  public_url?: string
  duration_secs?: number
  created_at: number
}

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [durationSecs, setDurationSecs] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [videoUploading, setVideoUploading] = useState(false)

  useEffect(() => {
    fetchVideos()
  }, [])

  async function fetchVideos() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/videos')
      if (res.ok) {
        const data = await res.json()
        setVideos(data.videos || [])
      }
    } catch {}
    setLoading(false)
  }

  async function handleVideoFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setVideoUploading(true)
    setErrorMsg(null)

    try {
      const res = await uploadMediaWithLimits(file, {
        isVideo: true,
        title: file.name.replace(/\.[^/.]+$/, ''),
      })

      if (res.success) {
        fetchVideos()
      } else {
        setErrorMsg(res.error || 'Video upload failed')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Video upload error')
    } finally {
      setVideoUploading(false)
      e.target.value = ''
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)

    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          external_url: externalUrl,
          duration_secs: durationSecs ? Number(durationSecs) : undefined,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setIsOpen(false)
        setTitle('')
        setDescription('')
        setExternalUrl('')
        setDurationSecs('')
        fetchVideos()
      } else {
        setErrorMsg(data.error || 'Failed to register video')
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
            Video Demonstrators
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
            YouTube/Vimeo links & Direct Supabase video uploads (Max 50 MB on free tier)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{
            padding: '10px 18px',
            backgroundColor: '#27272a',
            color: '#fff',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '13px',
            cursor: videoUploading ? 'not-allowed' : 'pointer',
            opacity: videoUploading ? 0.7 : 1,
            border: '1px solid #3f3f46',
          }}>
            {videoUploading ? 'Direct Uploading (Supabase)…' : '📁 Upload MP4/WebM Video'}
            <input
              type="file"
              accept="video/mp4,video/webm"
              disabled={videoUploading}
              onChange={handleVideoFileUpload}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={() => {
              setErrorMsg(null)
              setIsOpen(true)
            }}
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
            + Add External Video (YouTube/Vimeo)
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          color: '#fca5a5',
          fontSize: '13px',
          marginBottom: '20px',
        }}>
          {errorMsg}
        </div>
      )}

      <div style={{
        backgroundColor: '#141418',
        border: '1px solid #27272a',
        borderRadius: '8px',
        overflowX: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #27272a', color: '#a1a1aa', backgroundColor: '#101014' }}>
              <th style={{ padding: '12px 16px' }}>Title</th>
              <th style={{ padding: '12px 16px' }}>Type / URL</th>
              <th style={{ padding: '12px 16px' }}>Duration</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>Loading videos…</td></tr>
            ) : videos.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>No video demonstrations registered. Upload an MP4/WebM video or add a YouTube/Vimeo link.</td></tr>
            ) : (
              videos.map((v) => {
                const targetUrl = v.external_url || v.public_url
                return (
                  <tr key={v.id} style={{ borderBottom: '1px solid #222226' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                      {v.title}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#d4d4d8', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.external_url ? (
                        <a href={v.external_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                          🔗 {v.external_url}
                        </a>
                      ) : (
                        <span style={{ color: '#34d399' }}>🎥 Direct Storage ({v.storage_path || v.r2_key})</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#a1a1aa' }}>
                      {v.duration_secs ? `${v.duration_secs}s` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {targetUrl && (
                        <a
                          href={targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#27272a',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '11px',
                            textDecoration: 'none',
                          }}
                        >
                          Watch ↗
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* External Video Modal */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100, padding: '16px',
        }}>
          <div style={{
            width: '100%', maxWidth: '480px',
            backgroundColor: '#141418', border: '1px solid #27272a',
            borderRadius: '8px', padding: '24px',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: '0 0 16px 0' }}>
              Add Video Link
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

            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#d4d4d8', marginBottom: '6px' }}>Video Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3D Print Time-Lapse & Demonstration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px',
                    backgroundColor: '#0a0a0c', border: '1px solid #3f3f46',
                    borderRadius: '4px', color: '#fff', fontSize: '13px', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#d4d4d8', marginBottom: '6px' }}>External URL (YouTube / Vimeo) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
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
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px',
                    backgroundColor: '#0a0a0c', border: '1px solid #3f3f46',
                    borderRadius: '4px', color: '#fff', fontSize: '13px', boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#d4d4d8', marginBottom: '6px' }}>Duration (Seconds)</label>
                <input
                  type="number"
                  placeholder="e.g. 120"
                  value={durationSecs}
                  onChange={(e) => setDurationSecs(e.target.value ? parseInt(e.target.value, 10) : '')}
                  style={{
                    width: '100%', padding: '8px 12px',
                    backgroundColor: '#0a0a0c', border: '1px solid #3f3f46',
                    borderRadius: '4px', color: '#fff', fontSize: '13px', boxSizing: 'border-box',
                  }}
                />
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
                  {saving ? 'Adding…' : 'Add Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
