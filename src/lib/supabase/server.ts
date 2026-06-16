import { cookies } from 'next/headers'

import { createServerClient } from '@supabase/ssr'

import type { Database } from './types'

// Server-side Supabase client (Server Components, Route Handlers, Server Actions),
// scoped to the `vorrat` schema. Reads/writes the auth session via cookies.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database, 'vorrat'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'vorrat' },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // `setAll` was called from a Server Component, where cookies are
            // read-only. Safe to ignore when middleware refreshes the session.
          }
        },
      },
    },
  )
}
