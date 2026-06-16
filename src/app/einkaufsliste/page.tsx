import { getShoppingList } from '@/lib/data'
import { EmptyState, PageHeader } from '@/components/ui'
import { ShoppingList } from './ShoppingList'

export const dynamic = 'force-dynamic'

export default async function EinkaufslistePage() {
  const items = await getShoppingList()

  return (
    <div>
      <PageHeader title="Einkaufsliste" subtitle="Alle Artikel unter ihrem Sollbestand." />

      {items.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Nichts nachzukaufen"
          hint="Alle Artikel sind auf oder über ihrem Sollbestand."
        />
      ) : (
        <ShoppingList items={items} />
      )}
    </div>
  )
}
