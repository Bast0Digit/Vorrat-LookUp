'use client'

import { useActionState } from 'react'
import Link from 'next/link'

import { type ActionState, initialActionState } from '@/lib/action-state'
import { UNITS } from '@/lib/constants'

type CategoryOption = { id: string; name: string; icon: string | null }

export type ItemFormValues = {
  name: string
  category_id: string | null
  unit: string
  target_stock: number
  barcode: string | null
  notes: string | null
}

export function ItemForm({
  action,
  categories,
  defaultValues,
  submitLabel,
  cancelHref,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>
  categories: CategoryOption[]
  defaultValues?: Partial<ItemFormValues>
  submitLabel: string
  cancelHref: string
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="label">Name *</label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name ?? ''}
          placeholder="z. B. Nudeln, Trinkwasser …"
          className="input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="category_id" className="label">Kategorie</label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={defaultValues?.category_id ?? ''}
            className="input"
          >
            <option value="">— keine —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ''}{c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="unit" className="label">Einheit</label>
          <select id="unit" name="unit" defaultValue={defaultValues?.unit ?? 'Stück'} className="input">
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="target_stock" className="label">Sollbestand (Minimum)</label>
          <input
            id="target_stock"
            name="target_stock"
            type="text"
            inputMode="decimal"
            defaultValue={defaultValues?.target_stock?.toString() ?? '0'}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="barcode" className="label">Barcode</label>
          <input
            id="barcode"
            name="barcode"
            defaultValue={defaultValues?.barcode ?? ''}
            placeholder="optional"
            className="input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="label">Notizen</label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={defaultValues?.notes ?? ''}
          placeholder="optional"
          className="input"
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <div className="flex items-center gap-2">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Speichern …' : submitLabel}
        </button>
        <Link href={cancelHref} className="btn-secondary">Abbrechen</Link>
      </div>
    </form>
  )
}
