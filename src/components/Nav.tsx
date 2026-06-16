'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { signOut } from '@/lib/actions'

type NavItem = { href: string; label: string; icon: string; match: (p: string) => boolean }

const ITEMS: NavItem[] = [
  { href: '/', label: 'Start', icon: '🏠', match: (p) => p === '/' },
  { href: '/vorrat', label: 'Vorrat', icon: '📦', match: (p) => p.startsWith('/vorrat') },
  { href: '/einkaufsliste', label: 'Liste', icon: '🛒', match: (p) => p.startsWith('/einkaufsliste') },
  { href: '/items/new', label: 'Neu', icon: '➕', match: (p) => p.startsWith('/items') },
]

export function Nav({ email }: { email: string }) {
  const pathname = usePathname()

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <span aria-hidden className="text-xl">🥫</span>
            <span>Vorrat</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  item.match(pathname)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

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
      </header>

      {/* Bottom tab bar on mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around">
          {ITEMS.map((item) => {
            const active = item.match(pathname)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                  active ? 'text-emerald-600' : 'text-slate-500'
                }`}
              >
                <span aria-hidden className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
