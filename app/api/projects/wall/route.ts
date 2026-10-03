import { NextResponse } from 'next/server'
import { getWallProjects } from '@/lib/data/projects'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const wallProjects = await getWallProjects()
    return NextResponse.json({ projects: wallProjects })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch wall projects' },
      { status: 500 }
    )
  }
}
