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
    return <div className="ag-loading"><span className="ag-spin" />Loading website content…</div>
  }

  const currentData = sections[activeTab] || defaults[activeTab] || {}

  return (
    <>
      {/* Header */}
      <div className="ag-page-header">
        <div>
          <h1 className="ag-page-title">Website Content</h1>
          <p className="ag-page-sub">Edit live copy. Changes appear on public pages or fall back to defaults safely.</p>
        </div>
      </div>

      {statusMessage && (
        <div className={`ag-alert ${statusMessage.type === 'success' ? 'ag-alert-success' : 'ag-alert-error'}`}>
          {statusMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="ag-tabs">
        {[
          { key: 'hero', label: 'Hero' },
          { key: 'process', label: 'Process' },
          { key: 'about', label: 'About' },
          { key: 'contact', label: 'Contact CTA' },
          { key: 'products_page', label: 'Products Page' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`ag-tab ${activeTab === tab.key ? 'active' : ''}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Form */}
      <div className="ag-card-lg" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeTab === 'hero' && (
          <>
            <div>
              <label className="ag-label">Headline (H1)</label>
              <input type="text" value={currentData.h1 || ''} onChange={(e) => handleFieldChange('hero', 'h1', e.target.value)} className="ag-input" />
            </div>
            <div>
              <label className="ag-label">Support Line</label>
              <textarea rows={2} value={currentData.supportLine || ''} onChange={(e) => handleFieldChange('hero', 'supportLine', e.target.value)} className="ag-input" style={{ resize: 'vertical' }} />
            </div>
            <div>
              <label className="ag-label">Secondary Line</label>
              <input type="text" value={currentData.secondaryLine || ''} onChange={(e) => handleFieldChange('hero', 'secondaryLine', e.target.value)} className="ag-input" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="ag-label">Primary Button Text</label>
                <input type="text" value={currentData.ctaPrimary || ''} onChange={(e) => handleFieldChange('hero', 'ctaPrimary', e.target.value)} className="ag-input" />
              </div>
              <div>
                <label className="ag-label">Secondary Button Text</label>
                <input type="text" value={currentData.ctaSecondary || ''} onChange={(e) => handleFieldChange('hero', 'ctaSecondary', e.target.value)} className="ag-input" />
              </div>
            </div>
          </>
        )}

        {activeTab === 'process' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="ag-label">Section Heading</label>
                <input type="text" value={currentData.heading || ''} onChange={(e) => handleFieldChange('process', 'heading', e.target.value)} className="ag-input" />
              </div>
              <div>
                <label className="ag-label">Turnaround Highlight</label>
                <input type="text" value={currentData.turnaround || ''} onChange={(e) => handleFieldChange('process', 'turnaround', e.target.value)} className="ag-input" />
              </div>
            </div>
            <div>
              <label className="ag-label" style={{ marginBottom: '12px' }}>Process Stages</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(currentData.stages || []).map((stage: any, idx: number) => (
                  <div key={idx} style={{ padding: '14px 16px', background: '#0d0d10', border: '1px solid #1f1f23', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#f59e0b', fontWeight: 600 }}>Stage {idx + 1}</span>
                    <input type="text" placeholder="Title" value={stage.title || ''} onChange={(e) => handleStageChange(idx, 'title', e.target.value)} className="ag-input" />
                    <textarea placeholder="Description" rows={2} value={stage.description || ''} onChange={(e) => handleStageChange(idx, 'description', e.target.value)} className="ag-input" style={{ resize: 'vertical' }} />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'about' && (
          <>
            <div><label className="ag-label">Heading</label><input type="text" value={currentData.heading || ''} onChange={(e) => handleFieldChange('about', 'heading', e.target.value)} className="ag-input" /></div>
            <div><label className="ag-label">Kinetic Eyebrow / Subline</label><input type="text" value={currentData.kinetic || ''} onChange={(e) => handleFieldChange('about', 'kinetic', e.target.value)} className="ag-input" /></div>
            <div><label className="ag-label">Philosophy Body Text</label><textarea rows={4} value={currentData.body || ''} onChange={(e) => handleFieldChange('about', 'body', e.target.value)} className="ag-input" style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div><label className="ag-label">Owner / Sign-off Name</label><input type="text" value={currentData.ownerName || ''} onChange={(e) => handleFieldChange('about', 'ownerName', e.target.value)} className="ag-input" /></div>
              <div><label className="ag-label">Owner Title</label><input type="text" value={currentData.ownerTitle || ''} onChange={(e) => handleFieldChange('about', 'ownerTitle', e.target.value)} className="ag-input" /></div>
            </div>
          </>
        )}

        {activeTab === 'contact' && (
          <>
            <div><label className="ag-label">Section Heading</label><input type="text" value={currentData.heading || ''} onChange={(e) => handleFieldChange('contact', 'heading', e.target.value)} className="ag-input" /></div>
            <div><label className="ag-label">Supporting Copy</label><textarea rows={3} value={currentData.supportingCopy || ''} onChange={(e) => handleFieldChange('contact', 'supportingCopy', e.target.value)} className="ag-input" style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div><label className="ag-label">Primary CTA Text</label><input type="text" value={currentData.ctaPrimary || ''} onChange={(e) => handleFieldChange('contact', 'ctaPrimary', e.target.value)} className="ag-input" /></div>
              <div><label className="ag-label">WhatsApp CTA Text</label><input type="text" value={currentData.ctaWhatsapp || ''} onChange={(e) => handleFieldChange('contact', 'ctaWhatsapp', e.target.value)} className="ag-input" /></div>
            </div>
          </>
        )}

        {activeTab === 'products_page' && (
          <>
            <div><label className="ag-label">Hero Eyebrow</label><input type="text" value={currentData.heroEyebrow || ''} onChange={(e) => handleFieldChange('products_page', 'heroEyebrow', e.target.value)} className="ag-input" /></div>
            <div><label className="ag-label">Hero Headline</label><input type="text" value={currentData.heroHeadline || ''} onChange={(e) => handleFieldChange('products_page', 'heroHeadline', e.target.value)} className="ag-input" /></div>
            <div><label className="ag-label">Hero Subline</label><textarea rows={2} value={currentData.heroSubline || ''} onChange={(e) => handleFieldChange('products_page', 'heroSubline', e.target.value)} className="ag-input" style={{ resize: 'vertical' }} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div><label className="ag-label">Enquire CTA Button</label><input type="text" value={currentData.ctaEnquire || ''} onChange={(e) => handleFieldChange('products_page', 'ctaEnquire', e.target.value)} className="ag-input" /></div>
              <div><label className="ag-label">Custom Build CTA Button</label><input type="text" value={currentData.ctaCustom || ''} onChange={(e) => handleFieldChange('products_page', 'ctaCustom', e.target.value)} className="ag-input" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', paddingTop: '12px', borderTop: '1px solid #1f1f23' }}>
              <div><label className="ag-label">Empty Catalog Title</label><input type="text" value={currentData.emptyTitle || ''} onChange={(e) => handleFieldChange('products_page', 'emptyTitle', e.target.value)} className="ag-input" /></div>
              <div><label className="ag-label">Empty Catalog Text</label><input type="text" value={currentData.emptyText || ''} onChange={(e) => handleFieldChange('products_page', 'emptyText', e.target.value)} className="ag-input" /></div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid #1f1f23' }}>
          <button type="button" onClick={() => handleReset(activeTab)} className="ag-btn ag-btn-ghost">
            Reset to Defaults
          </button>
          <button type="button" disabled={saving} onClick={() => handleSave(activeTab)} className="ag-btn ag-btn-primary">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}
