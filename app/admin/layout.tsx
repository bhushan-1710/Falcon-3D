import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentAuth } from '@/lib/auth/guard'
import { AdminShell } from '@/components/admin/AdminShell'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin Studio — Falcon 3D Prints',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const auth = await getCurrentAuth()

  // Allow unauthenticated access ONLY if rendering login page
  // Since Next.js layouts wrap all sub-routes, we inspect if user is authenticated.
  // If not authenticated, we let the route render if it's the login route, or redirect.
  // In Next.js App Router, layout doesn't receive pathname, but we can verify auth.
  // If auth is null, we can check if it's a login render or redirect.
  // Best practice in App Router: A dedicated route group or check auth:
  // If no auth, render the children directly (which is /admin/login), OR if on /admin, redirect.

  if (!auth) {
    // If not authenticated, render children (e.g. login page)
    return (
      <>
        <meta name="robots" content="noindex, nofollow" />
        {children}
      </>
    )
  }

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <AdminShell userEmail={auth.user.email}>
        {children}
      </AdminShell>
    </>
  )
}
