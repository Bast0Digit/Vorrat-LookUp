import { getCategories } from '@/lib/data'
import { createItem } from '@/lib/actions'
import { ItemForm } from '@/components/ItemForm'
import { BackLink, PageHeader } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function NewItemPage() {
  const categories = await getCategories()

  return (
    <div>
      <BackLink href="/vorrat">Vorrat</BackLink>
      <div className="mt-3">
        <PageHeader title="Neuer Artikel" subtitle="Stammdaten und Sollbestand festlegen." />
      </div>
      <div className="card p-5">
        <ItemForm
          action={createItem}
          categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))}
          submitLabel="Anlegen"
          cancelHref="/vorrat"
        />
      </div>
    </div>
  )
}
