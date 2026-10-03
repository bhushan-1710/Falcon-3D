'use client'

import React, { useState, useEffect } from 'react'

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<'hero' | 'process' | 'about' | 'contact' | 'products_page'>('hero')
  const [sections, setSections] = useState<Record<string, any>>({})
  const [defaults, setDefaults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchContent()
  }, [])

  async function fetchContent() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/content')
      if (res.ok) {
        const data = await res.json()
        setSections(data.sections || {})
        setDefaults(data.defaults || {})
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleFieldChange(section: string, key: string, val: any) {
    setSections((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [key]: val,
      },
    }))
  }

  function handleStageChange(index: number, key: string, val: string) {
    const curStages = [...(sections.process?.stages || defaults.process?.stages || [])]
    curStages[index] = { ...curStages[index], [key]: val }
    handleFieldChange('process', 'stages', curStages)
  }

  function handleReset(section: string) {
    if (!confirm(`Reset ${section} copy to original default values?`)) return
    if (defaults[section]) {
      setSections((prev) => ({
        ...prev,
        [section]: JSON.parse(JSON.stringify(defaults[section])),
      }))
    }
  }

  async function handleSave(section: string) {
    setSaving(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: section,
          content: sections[section],
        }),
      })

      if (res.ok) {
        setStatusMessage({ type: 'success', text: `Saved "${section}" content successfully!` })
        setTimeout(() => setStatusMessage(null), 4000)
      } else {
        const data = await res.json()
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save' })
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-zinc-400">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mr-3" />
        Loading website content...
      </div>
    )
  }

  const currentData = sections[activeTab] || defaults[activeTab] || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Website Content</h1>
          <p className="text-sm text-zinc-400">
            Edit live website copy. Changes appear directly on public pages or fall back to defaults safely.
          </p>
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        {[
          { key: 'hero', label: 'Hero Section' },
          { key: 'process', label: 'Process' },
          { key: 'about', label: 'About & Philosophy' },
          { key: 'contact', label: 'Contact / Final CTA' },
          { key: 'products_page', label: 'Products Page' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-amber-500 text-black shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850 bg-zinc-900 border border-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6 shadow-xl">
        {activeTab === 'hero' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Headline (H1)
              </label>
              <input
                type="text"
                value={currentData.h1 || ''}
                onChange={(e) => handleFieldChange('hero', 'h1', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Support Line
              </label>
              <textarea
                rows={2}
                value={currentData.supportLine || ''}
                onChange={(e) => handleFieldChange('hero', 'supportLine', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Secondary Line
              </label>
              <input
                type="text"
                value={currentData.secondaryLine || ''}
                onChange={(e) => handleFieldChange('hero', 'secondaryLine', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  value={currentData.ctaPrimary || ''}
                  onChange={(e) => handleFieldChange('hero', 'ctaPrimary', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Secondary Button Text
                </label>
                <input
                  type="text"
                  value={currentData.ctaSecondary || ''}
                  onChange={(e) => handleFieldChange('hero', 'ctaSecondary', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'process' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Section Heading
                </label>
                <input
                  type="text"
                  value={currentData.heading || ''}
                  onChange={(e) => handleFieldChange('process', 'heading', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Turnaround Highlight
                </label>
                <input
                  type="text"
                  value={currentData.turnaround || ''}
                  onChange={(e) => handleFieldChange('process', 'turnaround', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">
                Process Stages
              </label>
              <div className="space-y-4">
                {(currentData.stages || []).map((stage: any, idx: number) => (
                  <div key={idx} className="p-4 bg-zinc-950 border border-zinc-800/80 rounded-lg space-y-2">
                    <span className="text-xs font-mono text-amber-500">Stage {idx + 1}</span>
                    <input
                      type="text"
                      placeholder="Title"
                      value={stage.title || ''}
                      onChange={(e) => handleStageChange(idx, 'title', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                    <textarea
                      placeholder="Description"
                      rows={2}
                      value={stage.description || ''}
                      onChange={(e) => handleStageChange(idx, 'description', e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Heading
              </label>
              <input
                type="text"
                value={currentData.heading || ''}
                onChange={(e) => handleFieldChange('about', 'heading', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Kinetic Eyebrow / Subline
              </label>
              <input
                type="text"
                value={currentData.kinetic || ''}
                onChange={(e) => handleFieldChange('about', 'kinetic', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Philosophy Body Text
              </label>
              <textarea
                rows={4}
                value={currentData.body || ''}
                onChange={(e) => handleFieldChange('about', 'body', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Owner / Sign-off Name
                </label>
                <input
                  type="text"
                  value={currentData.ownerName || ''}
                  onChange={(e) => handleFieldChange('about', 'ownerName', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Owner Title
                </label>
                <input
                  type="text"
                  value={currentData.ownerTitle || ''}
                  onChange={(e) => handleFieldChange('about', 'ownerTitle', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Section Heading
              </label>
              <input
                type="text"
                value={currentData.heading || ''}
                onChange={(e) => handleFieldChange('contact', 'heading', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Supporting Copy
              </label>
              <textarea
                rows={3}
                value={currentData.supportingCopy || ''}
                onChange={(e) => handleFieldChange('contact', 'supportingCopy', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Primary CTA Text
                </label>
                <input
                  type="text"
                  value={currentData.ctaPrimary || ''}
                  onChange={(e) => handleFieldChange('contact', 'ctaPrimary', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  WhatsApp CTA Text
                </label>
                <input
                  type="text"
                  value={currentData.ctaWhatsapp || ''}
                  onChange={(e) => handleFieldChange('contact', 'ctaWhatsapp', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products_page' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Hero Eyebrow
              </label>
              <input
                type="text"
                value={currentData.heroEyebrow || ''}
                onChange={(e) => handleFieldChange('products_page', 'heroEyebrow', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Hero Headline
              </label>
              <input
                type="text"
                value={currentData.heroHeadline || ''}
                onChange={(e) => handleFieldChange('products_page', 'heroHeadline', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                Hero Subline
              </label>
              <textarea
                rows={2}
                value={currentData.heroSubline || ''}
                onChange={(e) => handleFieldChange('products_page', 'heroSubline', e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Enquire CTA Button
                </label>
                <input
                  type="text"
                  value={currentData.ctaEnquire || ''}
                  onChange={(e) => handleFieldChange('products_page', 'ctaEnquire', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Custom Build CTA Button
                </label>
                <input
                  type="text"
                  value={currentData.ctaCustom || ''}
                  onChange={(e) => handleFieldChange('products_page', 'ctaCustom', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Empty Catalog Title
                </label>
                <input
                  type="text"
                  value={currentData.emptyTitle || ''}
                  onChange={(e) => handleFieldChange('products_page', 'emptyTitle', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Empty Catalog Text
                </label>
                <input
                  type="text"
                  value={currentData.emptyText || ''}
                  onChange={(e) => handleFieldChange('products_page', 'emptyText', e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={() => handleReset(activeTab)}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSave(activeTab)}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg shadow transition-colors flex items-center gap-2"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
