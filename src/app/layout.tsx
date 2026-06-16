import type { Metadata, Viewport } from 'next'

import './globals.css'
import { Nav } from '@/components/Nav'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Vorrat',
  description: 'Notvorrat verwalten: nichts läuft ab, immer genug auf Lager.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Vorrat', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="de" className="h-full antialiased">
      <body className="min-h-full">
        {user ? (
          <div className="flex min-h-dvh flex-col">
            <Nav email={user.email ?? ''} />
            <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-5 md:pb-10">
              {children}
            </main>
          </div>
        ) : (
          <main className="flex min-h-dvh flex-col items-center justify-center px-4">
            {children}
          </main>
        )}
      </body>
    </html>
  )
}
