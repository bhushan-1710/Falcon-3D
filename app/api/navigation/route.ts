import { NextResponse } from 'next/server'
import { getNavItems } from '@/lib/data/navigation'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const items = await getNavItems()
    return NextResponse.json({ items })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch navigation' },
      { status: 500 }
    )
  }
}
