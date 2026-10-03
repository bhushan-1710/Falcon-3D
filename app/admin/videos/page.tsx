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

  useEffect(() => { fetchVideos() }, [])

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
      const res = await uploadMediaWithLimits(file, { isVideo: true, title: file.name.replace(/\.[^/.]+$/, '') })
      if (res.success) { fetchVideos() }
      else { setErrorMsg(res.error || 'Video upload failed') }
    } catch (err: any) { setErrorMsg(err.message || 'Video upload error') }
    finally { setVideoUploading(false); e.target.value = '' }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, external_url: externalUrl, duration_secs: durationSecs ? Number(durationSecs) : undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        setIsOpen(false)
        setTitle(''); setDescription(''); setExternalUrl(''); setDurationSecs('')
        fetchVideos()
      } else { setErrorMsg(data.error || 'Failed to register video') }
    } catch (err: any) { setErrorMsg('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  return (
    <>
      {/* Header */}
      <div className="ag-page-header">
        <div>
          <h1 className="ag-page-title">Video Demonstrators</h1>
          <p className="ag-page-sub">YouTube / Vimeo links &amp; direct Supabase video uploads (max 50 MB)</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
          <label className="ag-btn ag-btn-ghost" style={{ cursor: videoUploading ? 'not-allowed' : 'pointer', opacity: videoUploading ? 0.6 : 1 }}>
            {videoUploading ? 'Uploading…' : '↑ Upload MP4/WebM'}
            <input type="file" accept="video/mp4,video/webm" disabled={videoUploading} onChange={handleVideoFileUpload} style={{ display: 'none' }} />
          </label>
          <button onClick={() => { setErrorMsg(null); setIsOpen(true) }} className="ag-btn ag-btn-primary">
            + Add External Link
          </button>
        </div>
      </div>

      {/* Error */}
      {errorMsg && <div className="ag-alert ag-alert-error">{errorMsg}</div>}

      {/* Table */}
      <div className="ag-table-wrap">
        <div className="ag-table-scroll">
          <table className="ag-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type / URL</th>
                <th>Duration</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4}><div className="ag-loading"><span className="ag-spin" />Loading videos…</div></td></tr>
              ) : videos.length === 0 ? (
                <tr><td colSpan={4}><div className="ag-empty">No videos registered. Upload an MP4 or add a YouTube link.</div></td></tr>
              ) : (
                videos.map((v) => {
                  const targetUrl = v.external_url || v.public_url
                  return (
                    <tr key={v.id}>
                      <td className="cell-primary">{v.title}</td>
                      <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.external_url ? (
                          <a href={v.external_url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '12.5px' }}>
                            ↗ {v.external_url}
                          </a>
                        ) : (
                          <span className="ag-badge ag-badge-green">Direct Storage</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px' }}>{v.duration_secs ? `${v.duration_secs}s` : <span style={{ color: '#3f3f46' }}>—</span>}</td>
                      <td className="cell-actions">
                        {targetUrl && (
                          <a href={targetUrl} target="_blank" rel="noreferrer" className="ag-btn ag-btn-ghost" style={{ padding: '4px 12px', fontSize: '12px' }}>
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
      </div>

      {/* Add External Video Modal */}
      {isOpen && (
        <div className="ag-modal-bg">
          <div className="ag-modal" style={{ maxWidth: '460px' }}>
            <div className="ag-modal-header">
              <h2 className="ag-modal-title">Add External Video</h2>
              <button className="ag-modal-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="ag-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {errorMsg && <div className="ag-alert ag-alert-error">{errorMsg}</div>}
                <div>
                  <label className="ag-label">Video Title *</label>
                  <input type="text" required placeholder="e.g. 3D Print Time-Lapse" value={title} onChange={(e) => setTitle(e.target.value)} className="ag-input" />
                </div>
                <div>
                  <label className="ag-label">External URL (YouTube / Vimeo) *</label>
                  <input type="url" required placeholder="https://www.youtube.com/watch?v=..." value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} className="ag-input" />
                </div>
                <div>
                  <label className="ag-label">Description</label>
                  <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="ag-input" style={{ resize: 'vertical' }} />
                </div>
                <div>
                  <label className="ag-label">Duration (seconds)</label>
                  <input type="number" placeholder="e.g. 120" value={durationSecs} onChange={(e) => setDurationSecs(e.target.value ? parseInt(e.target.value, 10) : '')} className="ag-input" />
                </div>
              </div>
              <div className="ag-modal-footer">
                <button type="button" onClick={() => setIsOpen(false)} className="ag-btn ag-btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="ag-btn ag-btn-primary">
                  {saving ? 'Adding…' : 'Add Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
