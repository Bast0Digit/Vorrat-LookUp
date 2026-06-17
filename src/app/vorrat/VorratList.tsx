'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import type { ItemGroup } from '@/lib/data'
import type { ItemOverview } from '@/lib/domain'
import { NO_CATEGORY_ICON, NO_CATEGORY_LABEL } from '@/lib/constants'
import { formatDate, formatNumber } from '@/lib/format'
import { itemReachDays } from '@/lib/reach'
import { itemStatus } from '@/lib/status'
import { EmptyState, StatusDot } from '@/components/ui'
import { Stepper } from '@/components/Stepper'

const ALL = 'all'

function subline(item: ItemOverview, householdSize: number): string {
  const parts = [`${formatNumber(item.currentStock)}/${formatNumber(item.targetStock)} ${item.unit}`]
  if (item.baseUnit) parts.push(`${formatNumber(item.baseStock)} ${item.baseUnit}`)
  if (item.nextExpiry) parts.push(`MHD ${formatDate(item.nextExpiry)}`)
  const reach = itemReachDays(item, householdSize)
  if (reach !== null) parts.push(`reicht ~${reach} T`)
  return parts.join(' · ')
}

export function VorratList({
  groups,
  householdSize,
}: {
  groups: ItemGroup[]
  householdSize: number
}) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>(ALL)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups
      .filter((g) => category === ALL || (g.category?.id ?? 'none') === category)
      .map((g) => ({
        ...g,
        items: q ? g.items.filter((i) => i.name.toLowerCase().includes(q)) : g.items,
      }))
      .filter((g) => g.items.length > 0)
  }, [groups, query, category])

  const totalShown = filtered.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <input
          type="search"
          placeholder="Artikel suchen …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input"
        />
        <div className="flex flex-wrap gap-2">
          <Chip active={category === ALL} onClick={() => setCategory(ALL)}>
            Alle
          </Chip>
          {groups.map((g) => {
            const id = g.category?.id ?? 'none'
            return (
              <Chip key={id} active={category === id} onClick={() => setCategory(id)}>
                <span aria-hidden>{g.category?.icon ?? NO_CATEGORY_ICON}</span>{' '}
                {g.category?.name ?? NO_CATEGORY_LABEL}
              </Chip>
            )
          })}
        </div>
      </div>

      {totalShown === 0 ? (
        <EmptyState icon="🔍" title="Keine Treffer" hint="Andere Suche oder Kategorie versuchen." />
      ) : (
        <div className="flex flex-col gap-6">
          {filtered.map((g) => (
            <section key={g.category?.id ?? 'none'}>
              <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-slate-700">
                <span aria-hidden>{g.category?.icon ?? NO_CATEGORY_ICON}</span>
                {g.category?.name ?? NO_CATEGORY_LABEL}
                <span className="text-xs font-normal text-slate-400">({g.items.length})</span>
              </h2>
              <ul className="card divide-y divide-slate-100">
                {g.items.map((item) => {
                  const status = itemStatus(item)
                  return (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <Link
                        href={`/vorrat/${item.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-70"
                      >
                        <StatusDot level={status.level} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{item.name}</p>
                          <p className="truncate text-xs text-slate-500">{subline(item, householdSize)}</p>
                        </div>
                      </Link>
                      {item.isAsset ? (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                          Anlage
                        </span>
                      ) : (
                        <Stepper itemId={item.id} packs={item.currentStock} unit={item.unit} />
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
        active
          ? 'bg-emerald-600 text-white'
          : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}
