import Link from 'next/link'

import { getEnergyView } from '@/lib/data'
import { formatNumber } from '@/lib/format'
import { EmptyState, PageHeader, SectionTitle } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function EnergiePage() {
  const { assets, supplies } = await getEnergyView()

  if (assets.length === 0 && supplies.length === 0) {
    return (
      <div>
        <PageHeader title="Energie" subtitle="Anlagen und Brennstoff-Vorrat." />
        <EmptyState
          icon="⚡"
          title="Keine Energie-Einträge"
          hint="Lege Artikel in der Kategorie „Energie (Strom/Holz)“ an – z. B. Brennholz oder eine PV-Anlage."
          action={
            <Link href="/items/new" className="btn-primary">
              Energie-Artikel anlegen
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Energie" subtitle="Anlagen (PV/Solar/Speicher) und Brennstoff-Vorrat." />

      <section>
        <SectionTitle>Anlagen</SectionTitle>
        {assets.length === 0 ? (
          <p className="card px-4 py-5 text-center text-sm text-slate-500">Keine Anlagen erfasst.</p>
        ) : (
          <ul className="card divide-y divide-slate-100">
            {assets.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/vorrat/${a.id}`}
                  className="block px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-900">{a.name}</p>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                      Anlage
                    </span>
                  </div>
                  {a.notes ? <p className="mt-0.5 text-xs text-slate-500">{a.notes}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-7">
        <SectionTitle>Vorrat</SectionTitle>
        {supplies.length === 0 ? (
          <p className="card px-4 py-5 text-center text-sm text-slate-500">Kein Brennstoff-Vorrat erfasst.</p>
        ) : (
          <ul className="card divide-y divide-slate-100">
            {supplies.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/vorrat/${s.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{s.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {formatNumber(s.currentStock)} {s.unit}
                      {s.baseUnit && s.baseUnit !== s.unit ? ` · ${formatNumber(s.baseStock)} ${s.baseUnit}` : ''}
                      {s.reachDays !== null ? ` · reicht ~${s.reachDays} T` : ''}
                      {s.notes ? ` · ${s.notes}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-700">
                    {formatNumber(s.currentStock)} {s.unit}
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
