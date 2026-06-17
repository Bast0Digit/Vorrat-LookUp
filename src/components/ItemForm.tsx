'use client'

import { useActionState } from 'react'
import Link from 'next/link'

import { type ActionState, initialActionState } from '@/lib/action-state'
import { BASE_UNITS, UNITS } from '@/lib/constants'

type CategoryOption = { id: string; name: string; icon: string | null }

export type ItemFormValues = {
  name: string
  category_id: string | null
  unit: string
  target_stock: number
  barcode: string | null
  notes: string | null
  pack_size: number
  base_unit: string | null
  daily_use_per_person: number | null
  is_asset: boolean
}

function numToInput(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value).replace('.', ',')
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
          <label htmlFor="unit" className="label">Einheit (Packung/Stück)</label>
          <input
            id="unit"
            name="unit"
            list="units"
            defaultValue={defaultValues?.unit ?? 'Stück'}
            placeholder="Stück"
            className="input"
          />
          <datalist id="units">
            {UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="pack_size" className="label">Packungsinhalt</label>
          <input
            id="pack_size"
            name="pack_size"
            type="text"
            inputMode="decimal"
            defaultValue={numToInput(defaultValues?.pack_size ?? 1)}
            className="input"
          />
          <p className="mt-1 text-xs text-slate-400">Inhalt je Packung, z. B. 500</p>
        </div>
        <div>
          <label htmlFor="base_unit" className="label">Basiseinheit</label>
          <input
            id="base_unit"
            name="base_unit"
            list="base-units"
            defaultValue={defaultValues?.base_unit ?? ''}
            placeholder="g, ml, l, kg …"
            className="input"
          />
          <datalist id="base-units">
            {BASE_UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-slate-400">leer = reine Zähleinheit</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="target_stock" className="label">Sollbestand (Packungen)</label>
          <input
            id="target_stock"
            name="target_stock"
            type="text"
            inputMode="decimal"
            defaultValue={numToInput(defaultValues?.target_stock ?? 0)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="daily_use_per_person" className="label">Bedarf pro Person/Tag</label>
          <input
            id="daily_use_per_person"
            name="daily_use_per_person"
            type="text"
            inputMode="decimal"
            defaultValue={numToInput(defaultValues?.daily_use_per_person)}
            placeholder="in Basiseinheit"
            className="input"
          />
          <p className="mt-1 text-xs text-slate-400">für „reicht noch …“; leer = keine Reichweite</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="is_asset"
            defaultChecked={defaultValues?.is_asset ?? false}
            className="h-4 w-4 rounded border-slate-300"
          />
          Anlage (PV/Speicher: kein MHD/Reichweite)
        </label>
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
