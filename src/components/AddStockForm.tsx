'use client'

import { useActionState, useEffect, useRef } from 'react'

import { addStockEntry } from '@/lib/actions'
import { initialActionState } from '@/lib/action-state'
import { LOCATIONS } from '@/lib/constants'

export function AddStockForm({ itemId, unit }: { itemId: string; unit: string }) {
  const [state, formAction, pending] = useActionState(
    addStockEntry.bind(null, itemId),
    initialActionState,
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="quantity" className="label">Menge ({unit}) *</label>
          <input
            id="quantity"
            name="quantity"
            type="text"
            inputMode="decimal"
            required
            placeholder="z. B. 6"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="expiry_date" className="label">Haltbar bis</label>
          <input id="expiry_date" name="expiry_date" type="date" className="input" />
        </div>
      </div>

      <div className="grid grid-cols-2 items-end gap-3">
        <div>
          <label htmlFor="location" className="label">Lagerort</label>
          <input id="location" name="location" list="locations" placeholder="z. B. Keller" className="input" />
          <datalist id="locations">
            {LOCATIONS.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </div>
        <label className="flex items-center gap-2 py-2 text-sm text-slate-700">
          <input type="checkbox" name="opened" className="h-4 w-4 rounded border-slate-300" />
          angebrochen
        </label>
      </div>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}

      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? 'Hinzufügen …' : '+ Bestand hinzufügen'}
      </button>
    </form>
  )
}
