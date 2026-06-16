import Link from 'next/link'

import { getDashboardData, type ExpiringEntry, type ShoppingItem } from '@/lib/data'
import { daysUntil, formatDate, formatExpiryRelative, formatNumber, formatQuantity } from '@/lib/format'
import { expiryLevel } from '@/lib/status'
import { EmptyState, PageHeader, SectionTitle, StatusBadge, Tile } from '@/components/ui'

export const dynamic = 'force-dynamic'

function ExpiringRow({ entry }: { entry: ExpiringEntry }) {
  const days = daysUntil(entry.expiryDate)
  const level = expiryLevel(days)
  return (
    <li>
      <Link
        href={`/vorrat/${entry.itemId}`}
        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{entry.itemName}</p>
          <p className="truncate text-xs text-slate-500">
            {formatQuantity(entry.quantity, entry.unit)}
            {entry.location ? ` · ${entry.location}` : ''}
            {entry.opened ? ' · angebrochen' : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge level={level}>{formatDate(entry.expiryDate)}</StatusBadge>
          <span className="text-xs text-slate-400">{formatExpiryRelative(entry.expiryDate)}</span>
        </div>
      </Link>
    </li>
  )
}

function BuyRow({ item }: { item: ShoppingItem }) {
  return (
    <li>
      <Link
        href={`/vorrat/${item.id}`}
        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
      >
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{item.name}</p>
          <p className="truncate text-xs text-slate-500">
            Bestand {formatNumber(item.currentStock)} / Soll {formatNumber(item.targetStock)} {item.unit}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
          +{formatNumber(item.toBuy)}
        </span>
      </Link>
    </li>
  )
}

export default async function DashboardPage() {
  const { expiring, toBuy, totals } = await getDashboardData()

  return (
    <div>
      <PageHeader title="Übersicht" subtitle="Was bald abläuft und was nachgekauft werden muss." />

      <div className="grid grid-cols-3 gap-3">
        <Tile label="Artikel" value={totals.items} />
        <Tile
          label="Läuft bald ab"
          value={totals.expiringSoon}
          tone={totals.expiringSoon > 0 ? 'warn' : 'ok'}
        />
        <Tile
          label="Unter Soll"
          value={totals.belowTarget}
          tone={totals.belowTarget > 0 ? 'warn' : 'ok'}
        />
      </div>

      <section className="mt-7">
        <SectionTitle action={<span className="text-xs text-slate-400">nächste 60 Tage</span>}>
          Läuft bald ab
        </SectionTitle>
        {expiring.length === 0 ? (
          <EmptyState icon="✅" title="Nichts läuft bald ab" hint="Kein Bestand mit Ablaufdatum in den nächsten 60 Tagen." />
        ) : (
          <ul className="card divide-y divide-slate-100">
            {expiring.map((entry) => (
              <ExpiringRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-7">
        <SectionTitle
          action={
            toBuy.length > 0 ? (
              <Link href="/einkaufsliste" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
                Zur Liste →
              </Link>
            ) : null
          }
        >
          Nachkaufen
        </SectionTitle>
        {toBuy.length === 0 ? (
          <EmptyState icon="🛒" title="Alles auf Soll" hint="Kein Artikel liegt unter seinem Sollbestand." />
        ) : (
          <ul className="card divide-y divide-slate-100">
            {toBuy.map((item) => (
              <BuyRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
