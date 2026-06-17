import Link from 'next/link'

import { getItemsGrouped, getSettings } from '@/lib/data'
import { EmptyState, PageHeader } from '@/components/ui'
import { VorratList } from './VorratList'

export const dynamic = 'force-dynamic'

export default async function VorratPage() {
  const [groups, { householdSize }] = await Promise.all([getItemsGrouped(), getSettings()])

  return (
    <div>
      <PageHeader
        title="Vorrat"
        subtitle="Alle Artikel nach Kategorie."
        action={
          <Link href="/items/new" className="btn-primary hidden md:inline-flex">
            + Artikel
          </Link>
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon="📦"
          title="Noch kein Artikel"
          hint="Lege deinen ersten Vorratsartikel an, um Bestände und Ablaufdaten zu verfolgen."
          action={
            <Link href="/items/new" className="btn-primary">
              Ersten Artikel anlegen
            </Link>
          }
        />
      ) : (
        <VorratList groups={groups} householdSize={householdSize} />
      )}
    </div>
  )
}
