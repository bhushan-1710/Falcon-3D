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
    studioName: '',
    contactEmail: '',
    whatsappNumber: '',
    currency: '',
    location: '',
  })
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

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
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
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
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mr-3" />
        Loading studio settings & diagnostics...
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Studio Settings & System</h1>
        <p className="text-sm text-zinc-400">
          Global studio parameters, Cloudflare infrastructure health, and recent audit activity.
        </p>
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

      {/* Infrastructure Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Turso Database</span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                system?.d1 === 'connected' ? 'bg-emerald-400 ring-4 ring-emerald-500/20' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="text-lg font-bold text-white capitalize">{system?.d1 || 'Connected'}</div>
          <p className="text-xs text-zinc-500">Turso (libsql) database in AWS Mumbai (ap-south-1)</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Supabase Storage</span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                system?.r2 === 'connected' ? 'bg-emerald-400 ring-4 ring-emerald-500/20' : 'bg-sky-400'
              }`}
            />
          </div>
          <div className="text-lg font-bold text-white capitalize">{system?.r2 || 'Connected'}</div>
          <p className="text-xs text-zinc-500">Public object storage for catalog imagery & videos</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">Platform</span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
          </div>
          <div className="text-lg font-bold text-white">Vercel (BOM1)</div>
          <p className="text-xs text-zinc-500">Next.js 16 via Vercel Serverless Functions</p>
        </div>
      </div>

      {/* Studio Configuration Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-zinc-800 pb-3">Studio Profile</h2>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Studio Brand Name
              </label>
              <input
                type="text"
                value={settings.studioName || ''}
                onChange={(e) => setSettings({ ...settings, studioName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                WhatsApp Phone Number
              </label>
              <input
                type="text"
                value={settings.whatsappNumber || ''}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Currency Code / Symbol
              </label>
              <input
                type="text"
                value={settings.currency || ''}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                placeholder="INR (₹)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Studio Location
              </label>
              <input
                type="text"
                value={settings.location || ''}
                onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                placeholder="Bangalore, India"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold text-sm rounded-lg shadow transition-colors"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Audit Logs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Recent Admin Activity</h2>
          <span className="text-xs text-zinc-500">Last 25 security & mutation events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-4">Time</th>
                <th className="py-2.5 px-4">Admin</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Target</th>
                <th className="py-2.5 px-4">Target ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-zinc-500">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-850/50">
                    <td className="py-2.5 px-4 text-zinc-400 whitespace-nowrap">
                      {new Date(log.created_at * 1000).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-white font-medium">{log.user_email || 'System'}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[11px] bg-zinc-800 text-amber-400 border border-zinc-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-zinc-400">{log.target_type}</td>
                    <td className="py-2.5 px-4 font-mono text-zinc-500">{log.target_id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
