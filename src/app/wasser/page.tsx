import Link from 'next/link'

import { getWaterView } from '@/lib/data'
import { REACH_TARGET_DAYS, REACH_WARN_DAYS, WATER_DAILY_PER_PERSON } from '@/lib/constants'
import { formatNumber } from '@/lib/format'
import { EmptyState, PageHeader, Tile } from '@/components/ui'

export const dynamic = 'force-dynamic'

function tone(days: number | null): 'neutral' | 'ok' | 'warn' | 'critical' {
  if (days === null) return 'neutral'
  if (days >= REACH_TARGET_DAYS) return 'ok'
  if (days >= REACH_WARN_DAYS) return 'warn'
  return 'critical'
}

export default async function WasserPage() {
  const { totalLitres, reachDays, householdSize, items } = await getWaterView()
  const reachTone = tone(reachDays)

  return (
    <div>
      <PageHeader title="Wasser" subtitle={`Trinkwasservorrat für ${householdSize} Personen.`} />

      <div className="grid grid-cols-3 gap-3">
        <Tile label="Liter gesamt" value={formatNumber(totalLitres)} />
        <Tile
          label="Reicht ~Tage"
          value={reachDays !== null ? reachDays : '—'}
          tone={reachTone === 'neutral' ? 'neutral' : reachTone}
        />
        <Tile label="Personen" value={householdSize} />
      </div>

      {reachDays !== null && reachDays < REACH_WARN_DAYS ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Wasservorrat reicht nur ~{reachDays} Tage – unter dem Zielhorizont von {REACH_TARGET_DAYS} Tagen.
        </p>
      ) : null}

      <section className="mt-7">
        <h2 className="mb-2 px-1 text-sm font-semibold text-slate-700">Wasser-Artikel</h2>
        {items.length === 0 ? (
          <EmptyState
            icon="💧"
            title="Noch kein Wasser erfasst"
            hint={`Lege einen Artikel in der Kategorie Wasser an (Basiseinheit l, Bedarf ${formatNumber(
              WATER_DAILY_PER_PERSON,
            )} l pro Person/Tag).`}
            action={
              <Link href="/items/new" className="btn-primary">
                Wasser-Artikel anlegen
              </Link>
            }
          />
        ) : (
          <ul className="card divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/vorrat/${item.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{item.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {formatNumber(item.currentStock)} {item.unit}
                      {item.baseUnit === 'l' ? ` · ${formatNumber(item.baseStock)} l` : ''}
                      {item.reachDays !== null ? ` · reicht ~${item.reachDays} T` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
                    {item.baseUnit === 'l' ? `${formatNumber(item.baseStock)} l` : `${formatNumber(item.currentStock)} ${item.unit}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
