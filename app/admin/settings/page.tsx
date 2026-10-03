'use client'

import React, { useState, useEffect } from 'react'

interface SystemInfo {
  d1: string
  r2: string
  users: number
  framework: string
  adapter: string
}

interface StudioSettings {
  studioName: string
  contactEmail: string
  whatsappNumber: string
  currency: string
  location: string
}

interface AuditLog {
  id: string
  action: string
  target_type: string
  target_id: string
  details?: string
  created_at: number
  user_email?: string
}

export default function AdminSettingsPage() {
  const [system, setSystem] = useState<SystemInfo | null>(null)
  const [settings, setSettings] = useState<StudioSettings>({
    studioName: '', contactEmail: '', whatsappNumber: '', currency: '', location: '',
  })
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => { fetchSettings() }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        setSystem(data.system || null)
        setSettings(data.settings || {})
        setAuditLogs(data.auditLogs || [])
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'Studio settings saved successfully!' })
        setTimeout(() => setStatusMessage(null), 3000)
        await fetchSettings()
      } else {
        const data = await res.json()
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save settings' })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving settings' })
    } finally { setSaving(false) }
  }

  if (loading) {
    return <div className="ag-loading"><span className="ag-spin" />Loading studio settings &amp; diagnostics…</div>
  }

  const SERVICE_HEALTH = [
    {
      label: 'Turso Database',
      status: system?.d1 === 'connected' ? 'connected' : 'connecting',
      statusCls: system?.d1 === 'connected' ? 'green' : 'yellow',
      value: system?.d1 || 'Connected',
      note: 'libsql · AWS ap-south-1 (Mumbai)',
    },
    {
      label: 'Supabase Storage',
      status: system?.r2 === 'connected' ? 'connected' : 'connected',
      statusCls: 'green',
      value: system?.r2 || 'Connected',
      note: 'falcon-media bucket · public reads',
    },
    {
      label: 'Hosting Platform',
      status: 'active',
      statusCls: 'green',
      value: 'Vercel (BOM1)',
      note: 'Next.js 16 · Serverless Functions',
    },
  ]

  return (
    <>
      {/* Header */}
      <div className="ag-page-header">
        <div>
          <h1 className="ag-page-title">Studio Settings</h1>
          <p className="ag-page-sub">Global configuration, infrastructure health, and audit activity.</p>
        </div>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className={`ag-alert ${statusMessage.type === 'success' ? 'ag-alert-success' : 'ag-alert-error'}`}>
          {statusMessage.text}
        </div>
      )}

      {/* Health cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {SERVICE_HEALTH.map((s) => (
          <div key={s.label} className="ag-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#52525b' }}>{s.label}</span>
              <span className={`ag-status-dot ${s.statusCls}`} />
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f4f4f5', marginBottom: '4px', textTransform: 'capitalize' }}>{s.value}</div>
            <p style={{ fontSize: '11.5px', color: '#3f3f46', margin: 0 }}>{s.note}</p>
          </div>
        ))}
      </div>

      {/* Studio Profile form */}
      <div className="ag-card-lg" style={{ padding: '24px', marginBottom: '28px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#f4f4f5', margin: '0 0 20px 0', paddingBottom: '14px', borderBottom: '1px solid #1f1f23' }}>
          Studio Profile
        </h2>
        <form onSubmit={handleSaveSettings}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="ag-label">Studio Brand Name</label>
              <input
                type="text"
                value={settings.studioName || ''}
                onChange={(e) => setSettings({ ...settings, studioName: e.target.value })}
                className="ag-input"
                placeholder="Falcon 3D Prints"
              />
            </div>
            <div>
              <label className="ag-label">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="ag-input"
                placeholder="hello@falcon3d.com"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label className="ag-label">WhatsApp Number</label>
              <input
                type="text"
                value={settings.whatsappNumber || ''}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className="ag-input"
              />
            </div>
            <div>
              <label className="ag-label">Currency</label>
              <input
                type="text"
                value={settings.currency || ''}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="INR (₹)"
                className="ag-input"
              />
            </div>
            <div>
              <label className="ag-label">Studio Location</label>
              <input
                type="text"
                value={settings.location || ''}
                onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                placeholder="Bangalore, India"
                className="ag-input"
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={saving} className="ag-btn ag-btn-primary">
              {saving ? 'Saving…' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Audit Logs */}
      <div className="ag-table-wrap">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #1f1f23', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#d4d4d8', margin: 0 }}>Recent Admin Activity</h2>
          <span style={{ fontSize: '11px', color: '#3f3f46' }}>Last 25 events</span>
        </div>
        <div className="ag-table-scroll">
          <table className="ag-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Target Type</th>
                <th>Target ID</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr><td colSpan={5}><div className="ag-empty">No activity logs recorded yet.</div></td></tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '12px' }}>
                      {new Date(log.created_at * 1000).toLocaleString()}
                    </td>
                    <td className="cell-primary" style={{ fontSize: '12px' }}>{log.user_email || 'System'}</td>
                    <td>
                      <span className="ag-badge ag-badge-yellow" style={{ fontFamily: 'monospace', fontSize: '11px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>{log.target_type}</td>
                    <td className="cell-mono" style={{ fontSize: '11px' }}>{log.target_id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
