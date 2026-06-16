import { notFound } from 'next/navigation'

import { getCategories, getItemDetail } from '@/lib/data'
import { deleteItem, updateItem } from '@/lib/actions'
import { formatDate, formatNumber } from '@/lib/format'
import { itemStatus } from '@/lib/status'
import { AddStockForm } from '@/components/AddStockForm'
import { StockBatch } from '@/components/StockBatch'
import { ItemForm } from '@/components/ItemForm'
import { ConfirmForm, SubmitButton } from '@/components/ConfirmForm'
import { BackLink, SectionTitle, StatusBadge, Tile } from '@/components/ui'
import { NO_CATEGORY_ICON, NO_CATEGORY_LABEL } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [detail, categories] = await Promise.all([getItemDetail(id), getCategories()])
  if (!detail) notFound()

  const { item, category, entries, currentStock, nextExpiry, toBuy } = detail
  const status = itemStatus({
    id: item.id,
    name: item.name,
    categoryId: item.category_id,
    unit: item.unit,
    targetStock: Number(item.target_stock),
    currentStock,
    nextExpiry,
    toBuy,
  })

  return (
    <div>
      <BackLink href="/vorrat">Vorrat</BackLink>

      <div className="mb-5 mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{item.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {category ? `${category.icon ?? NO_CATEGORY_ICON} ${category.name}` : `${NO_CATEGORY_ICON} ${NO_CATEGORY_LABEL}`}
          </p>
        </div>
        <StatusBadge level={status.level}>{status.label}</StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label={`Bestand (${item.unit})`} value={formatNumber(currentStock)} />
        <Tile label={`Soll (${item.unit})`} value={formatNumber(Number(item.target_stock))} />
        <Tile label="Nachkaufen" value={formatNumber(toBuy)} tone={toBuy > 0 ? 'warn' : 'ok'} />
        <Tile label="Nächstes MHD" value={nextExpiry ? formatDate(nextExpiry) : '—'} />
      </div>

      {item.notes ? (
        <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">{item.notes}</p>
      ) : null}

      <section className="mt-7">
        <SectionTitle>Bestand hinzufügen</SectionTitle>
        <div className="card p-4">
          <AddStockForm itemId={id} unit={item.unit} />
        </div>
      </section>

      <section className="mt-7">
        <SectionTitle action={<span className="text-xs text-slate-400">FIFO · ältestes zuerst</span>}>
          Chargen ({entries.length})
        </SectionTitle>
        {entries.length === 0 ? (
          <p className="card px-4 py-6 text-center text-sm text-slate-500">
            Noch kein Bestand erfasst. Füge oben die erste Charge hinzu.
          </p>
        ) : (
          <ul className="card divide-y divide-slate-100">
            {entries.map((e) => (
              <StockBatch
                key={e.id}
                itemId={id}
                unit={item.unit}
                entry={{
                  id: e.id,
                  quantity: Number(e.quantity),
                  expiry_date: e.expiry_date,
                  location: e.location,
                  opened: e.opened,
                }}
              />
            ))}
          </ul>
        )}
      </section>

      <details className="card mt-7 p-5">
        <summary className="cursor-pointer font-medium text-slate-700">Stammdaten bearbeiten</summary>
        <div className="mt-4">
          <ItemForm
            action={updateItem.bind(null, id)}
            categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))}
            defaultValues={{
              name: item.name,
              category_id: item.category_id,
              unit: item.unit,
              target_stock: Number(item.target_stock),
              barcode: item.barcode,
              notes: item.notes,
            }}
            submitLabel="Speichern"
            cancelHref={`/vorrat/${id}`}
          />
          <div className="mt-5 border-t border-slate-200 pt-4">
            <ConfirmForm
              action={deleteItem.bind(null, id)}
              message="Artikel inklusive aller Bestände wirklich löschen?"
            >
              <SubmitButton className="btn-danger" pendingLabel="Löschen …">
                Artikel löschen
              </SubmitButton>
            </ConfirmForm>
          </div>
        </div>
      </details>
    </div>
  )
}
