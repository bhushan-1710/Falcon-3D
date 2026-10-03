import { NextRequest, NextResponse } from 'next/server'
import { getDB } from '@/lib/cloudflare/context'
import { verifyAdminRequest } from '@/lib/auth/guard'
import { logActivity } from '@/lib/auth'
import { hero, process as processCopy, about, finalCta, productsPage } from '@/lib/content'

export const dynamic = 'force-dynamic'

const DEFAULT_SECTIONS: Record<string, any> = {
  hero: {
    h1: hero.h1,
    supportLine: hero.supportLine,
    secondaryLine: hero.secondaryLine,
    ctaPrimary: hero.ctaPrimary,
    ctaSecondary: hero.ctaSecondary,
  },
  process: {
    heading: processCopy.heading,
    turnaround: processCopy.turnaround,
    stages: processCopy.stages,
  },
  about: {
    heading: about.heading,
    kinetic: about.kinetic,
    body: about.body,
    ownerName: about.ownerName,
    ownerTitle: about.ownerTitle,
  },
  contact: {
    heading: finalCta.heading,
    supportingCopy: finalCta.supportingCopy,
    ctaPrimary: finalCta.ctaPrimary,
    ctaWhatsapp: finalCta.ctaWhatsapp,
  },
  products_page: {
    heroEyebrow: productsPage.heroEyebrow,
    heroHeadline: productsPage.heroHeadline,
    heroSubline: productsPage.heroSubline,
    ctaEnquire: productsPage.ctaEnquire,
    ctaCustom: productsPage.ctaCustom,
    emptyTitle: productsPage.emptyTitle,
    emptyText: productsPage.emptyText,
  },
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    const res = await db.prepare('SELECT section_key, content_json, updated_at FROM website_content').all<any>()
    const sections: Record<string, any> = { ...DEFAULT_SECTIONS }

    if (res.results) {
      for (const row of res.results) {
        try {
          const parsed = JSON.parse(row.content_json)
          sections[row.section_key] = {
            ...(DEFAULT_SECTIONS[row.section_key] || {}),
            ...parsed,
          }
        } catch {}
      }
    }

    return NextResponse.json({ sections, defaults: DEFAULT_SECTIONS })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch content' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await verifyAdminRequest(request)
    if (!authCheck.success) return authCheck.response

    const body = await request.json()
    const { section_key, content } = body

    if (!section_key || !content || typeof content !== 'object') {
      return NextResponse.json({ error: 'section_key and content object are required' }, { status: 400 })
    }

    const db = await getDB()
    if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })

    // Validate that values are strings/arrays, not arbitrary code
    const validatedJson = JSON.stringify(content)

    await db.prepare(`
      INSERT INTO website_content (section_key, content_json, updated_at)
      VALUES (?, ?, unixepoch())
      ON CONFLICT(section_key) DO UPDATE SET
        content_json = excluded.content_json,
        updated_at = unixepoch()
    `).bind(section_key, validatedJson).run()

    await logActivity(authCheck.user.id, 'content.update', 'website_content', section_key)

    return NextResponse.json({ success: true, section_key, content })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update content' },
      { status: 500 }
    )
  }
}
