'use client'

import { useActionState } from 'react'

import { updateHouseholdSize } from '@/lib/actions'
import { initialActionState } from '@/lib/action-state'

export function HouseholdForm({ householdSize }: { householdSize: number }) {
  const [state, action, pending] = useActionState(updateHouseholdSize, initialActionState)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="household_size" className="label">Personen im Haushalt</label>
        <input
          id="household_size"
          name="household_size"
          type="number"
          min={1}
          step={1}
          defaultValue={householdSize}
          className="input max-w-[8rem]"
        />
        <p className="mt-1 text-xs text-slate-400">
          Grundlage für die Reichweite („reicht noch ~X Tage“).
        </p>
      </div>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Gespeichert.</p>
      ) : null}

      <button type="submit" className="btn-primary self-start" disabled={pending}>
        {pending ? 'Speichern …' : 'Speichern'}
      </button>
    </form>
  )
}
