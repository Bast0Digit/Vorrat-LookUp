'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { signOut } from '@/lib/actions'

type NavItem = { href: string; label: string; icon: string; match: (p: string) => boolean }

const ITEMS: NavItem[] = [
  { href: '/', label: 'Übersicht', icon: '🏠', match: (p) => p === '/' },
  { href: '/vorrat', label: 'Vorrat', icon: '📦', match: (p) => p.startsWith('/vorrat') || p.startsWith('/items') },
  { href: '/wasser', label: 'Wasser', icon: '💧', match: (p) => p.startsWith('/wasser') },
  { href: '/energie', label: 'Energie', icon: '⚡', match: (p) => p.startsWith('/energie') },
  { href: '/lebensmittel-ablauf', label: 'Ablauf', icon: '⏳', match: (p) => p.startsWith('/lebensmittel-ablauf') },
  { href: '/einkaufsliste', label: 'Liste', icon: '🛒', match: (p) => p.startsWith('/einkaufsliste') },
  { href: '/import', label: 'Import', icon: '📥', match: (p) => p.startsWith('/import') },
  { href: '/einstellungen', label: 'Einstellungen', icon: '⚙️', match: (p) => p.startsWith('/einstellungen') },
]

export function Nav({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <span aria-hidden className="text-xl">🥫</span>
          <span>Vorrat</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="hidden max-w-[12rem] truncate text-xs text-slate-400 sm:inline">
            {email}
          </span>
          <form action={signOut}>
            <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
              Abmelden
            </button>
          </form>
        </div>
      </div>

      <nav className="mx-auto max-w-3xl overflow-x-auto px-2 pb-2">
        <div className="flex min-w-max items-center gap-1">
          {ITEMS.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
