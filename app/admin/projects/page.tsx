'use client'

import { useState, useEffect } from 'react'
import { MediaPicker } from '@/components/admin/MediaPicker'

interface Project {
  id: string
  slug: string
  title: string
  subtitle?: string
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

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [search, setSearch] = useState('')

  // Editor Modal State
  const [editingProject, setEditingProject] = useState<any | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
    fetchCategories()
  }, [statusFilter, categoryFilter, search])

  async function fetchProjects() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (categoryFilter !== 'ALL') params.set('category_id', categoryFilter)
      if (search.trim()) params.set('q', search.trim())

      const res = await fetch(`/api/admin/projects?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch {}
    setLoading(false)
  }

  async function fetchCategories() {
    try {
      const res = await fetch('/api/admin/categories?type=project')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories || [])
      }
    } catch {}
  }

  function handleCreate() {
    setEditingProject({
      title: '',
      slug: '',
      subtitle: '',
      description: '',
      category_id: categories[0]?.id || '',
      status: 'DRAFT',
      is_featured: false,
      sort_order: 0,
      featured_image_id: null,
      featured_image_url: null,
    })
    setErrorMsg(null)
    setIsEditorOpen(true)
  }

  async function handleEdit(id: string) {
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/admin/projects/${id}`)
      if (res.ok) {
        const data = await res.json()
        setEditingProject(data.project)
        setIsEditorOpen(true)
      }
    } catch (err: any) {
      alert('Error loading project: ' + err.message)
    }
  }

  async function handleDuplicate(id: string) {
    if (!confirm('Duplicate this project?')) return
    try {
      const res = await fetch(`/api/admin/projects/${id}/duplicate`, { method: 'POST' })
      if (res.ok) fetchProjects()
      else {
        const d = await res.json()
        alert(d.error || 'Duplicate failed')
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleStatusToggle(p: Project, newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    try {
      const res = await fetch(`/api/admin/projects/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...p, status: newStatus }),
      })
      if (res.ok) fetchProjects()
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
  }

  async function handleDelete(p: Project) {
    if (p.status !== 'ARCHIVED') {
      alert('Only ARCHIVED projects can be deleted. Please archive this project first.')
      return
    }
    if (!confirm(`Are you sure you want to permanently delete "${p.title}"?`)) return

    try {
      const res = await fetch(`/api/admin/projects/${p.id}`, { method: 'DELETE' })
      if (res.ok) fetchProjects()
      else {
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
      const isNew = !editingProject.id
      const url = isNew ? '/api/admin/projects' : `/api/admin/projects/${editingProject.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingProject),
      })

      const data = await res.json()
      if (res.ok) {
        setIsEditorOpen(false)
        fetchProjects()
      } else {
        setErrorMsg(data.error || 'Failed to save project')
      }
    } catch (err: any) {
      setErrorMsg('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
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
            Workshop Projects
          </h1>
          <p style={{ fontSize: '13px', color: '#a1a1aa', margin: 0 }}>
            Curated capabilities and demonstrator objects shown on the Workshop Wall
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
          + Add Project
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        marginBottom: '20px',
        padding: '14px',
        backgroundColor: '#141418',
        border: '1px solid #27272a',
        borderRadius: '6px',
      }}>
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#0a0a0c',
            border: '1px solid #27272a',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '13px',
            flex: '1 1 200px',
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#0a0a0c',
            border: '1px solid #27272a',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '13px',
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#0a0a0c',
            border: '1px solid #27272a',
            borderRadius: '4px',
            color: '#fff',
            fontSize: '13px',
          }}
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Projects Table */}
      <div style={{
        backgroundColor: '#141418',
        border: '1px solid #27272a',
        borderRadius: '8px',
        overflowX: 'auto',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #27272a', color: '#a1a1aa', backgroundColor: '#101014' }}>
              <th style={{ padding: '12px 16px' }}>Project</th>
              <th style={{ padding: '12px 16px' }}>Category</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>
                  Loading projects…
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
                  No projects found. Click "+ Add Project" to create one.
                </td>
              </tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #222226' }}>
                  <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#0a0a0c',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52525b' }}>🛠️</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{p.title}</div>
                      <div style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>/{p.slug}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#d4d4d8' }}>
                    {p.category_name || '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor:
                        p.status === 'PUBLISHED' ? 'rgba(74, 222, 128, 0.1)' :
                        p.status === 'ARCHIVED' ? 'rgba(161, 161, 170, 0.1)' :
                        'rgba(250, 204, 21, 0.1)',
                      color:
                        p.status === 'PUBLISHED' ? '#4ade80' :
                        p.status === 'ARCHIVED' ? '#a1a1aa' :
                        '#facc15',
                    }}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(p.id)}
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
                        onClick={() => handleDuplicate(p.id)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'transparent',
                          border: '1px solid #3f3f46',
                          borderRadius: '4px',
                          color: '#d4d4d8',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Duplicate
                      </button>
                      {p.status === 'PUBLISHED' ? (
                        <button
                          onClick={() => handleStatusToggle(p, 'DRAFT')}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            border: '1px solid #facc15',
                            borderRadius: '4px',
                            color: '#facc15',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Unpublish
                        </button>
                      ) : p.status === 'DRAFT' ? (
                        <button
                          onClick={() => handleStatusToggle(p, 'PUBLISHED')}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            border: '1px solid #4ade80',
                            borderRadius: '4px',
                            color: '#4ade80',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Publish
                        </button>
                      ) : null}

                      {p.status !== 'ARCHIVED' ? (
                        <button
                          onClick={() => handleStatusToggle(p, 'ARCHIVED')}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            border: '1px solid #71717a',
                            borderRadius: '4px',
                            color: '#a1a1aa',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete(p)}
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
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Editor Modal */}
      {isEditorOpen && editingProject && (
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
            maxWidth: '700px',
            maxHeight: '90vh',
            backgroundColor: '#141418',
            border: '1px solid #27272a',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>
                {editingProject.id ? 'Edit Project' : 'Create New Project'}
              </h2>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '20px', flex: 1 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#d4d4d8', marginBottom: '6px' }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.title || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#0a0a0c',
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#d4d4d8', marginBottom: '6px' }}>
                    Slug
                  </label>
                  <input
                    type="text"
                    value={editingProject.slug || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, slug: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#0a0a0c',
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#d4d4d8', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={editingProject.category_id || ''}
                    onChange={(e) => setEditingProject({ ...editingProject, category_id: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#0a0a0c',
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  >
                    <option value="">No Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#d4d4d8', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={editingProject.status || 'DRAFT'}
                    onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#0a0a0c',
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '13px',
                    }}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              </div>

              <MediaPicker
                value={editingProject.featured_image_id}
                initialUrl={editingProject.imageUrl || editingProject.featured_image_url}
                onChange={(mediaId, mediaUrl) => {
                  setEditingProject({
                    ...editingProject,
                    featured_image_id: mediaId,
                    featured_image_url: mediaUrl,
                  })
                }}
              />

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#d4d4d8', marginBottom: '6px' }}>
                  Subtitle / Material Finish Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Matte Black / Carbon PETG"
                  value={editingProject.subtitle || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, subtitle: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0a0a0c',
                    border: '1px solid #3f3f46',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#d4d4d8', marginBottom: '6px' }}>
                  Project Description
                </label>
                <textarea
                  rows={4}
                  value={editingProject.description || ''}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#0a0a0c',
                    border: '1px solid #3f3f46',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                borderTop: '1px solid #27272a',
                paddingTop: '16px',
              }}>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: 'transparent',
                    border: '1px solid #3f3f46',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#fff',
                    color: '#000',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving…' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
