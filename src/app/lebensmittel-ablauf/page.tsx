import Link from 'next/link'

import { getFoodExpiry } from '@/lib/data'
import { FOOD_EXPIRY_HORIZONS } from '@/lib/constants'
import { daysUntil, formatDate, formatExpiryRelative, formatQuantity } from '@/lib/format'
import { expiryLevel } from '@/lib/status'
import { EmptyState, PageHeader, StatusBadge } from '@/components/ui'

export const dynamic = 'force-dynamic'

function parseHorizon(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value)
  return (FOOD_EXPIRY_HORIZONS as readonly number[]).includes(n) ? n : 30
}

export default async function FoodExpiryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const horizon = parseHorizon(params.h)
  const entries = await getFoodExpiry(horizon)

  return (
    <div>
      <PageHeader title="Bald ablaufende Lebensmittel" subtitle="Nach MHD, frühestes zuerst." />

      <div className="mb-4 flex gap-2">
        {FOOD_EXPIRY_HORIZONS.map((h) => (
          <Link
            key={h}
            href={`/lebensmittel-ablauf?h=${h}`}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              h === horizon
                ? 'bg-emerald-600 text-white'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {h} Tage
          </Link>
        ))}
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Nichts läuft bald ab"
          hint={`Keine Lebensmittel mit MHD in den nächsten ${horizon} Tagen.`}
        />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {entries.map((entry) => {
            const level = expiryLevel(daysUntil(entry.expiryDate))
            return (
              <li key={entry.id}>
                <Link
                  href={`/vorrat/${entry.itemId}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{entry.itemName}</p>
                    <p className="truncate text-xs text-slate-500">
                      {formatQuantity(entry.quantity, entry.unit)}
                      {entry.location ? ` · ${entry.location}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge level={level}>{formatDate(entry.expiryDate)}</StatusBadge>
                    <span className="text-xs text-slate-400">{formatExpiryRelative(entry.expiryDate)}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
