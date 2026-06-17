import { type NextRequest } from 'next/server'

import { updateSession } from '@/lib/supabase/middleware'

// Next.js 16 proxy (formerly "middleware"): refreshes the Supabase session and
// gates unauthenticated access on every matched request.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Run on all routes except Next internals and static assets.
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|csv)$).*)',
  ],
}
