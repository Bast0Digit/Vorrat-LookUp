'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { consumeOnePack, refillOnePack } from '@/lib/actions'
import { initialActionState } from '@/lib/action-state'

function MinusButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      aria-label="Eine Packung entnehmen"
      disabled={disabled || pending}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
    >
      −
    </button>
  )
}

export function Stepper({
  itemId,
  packs,
  unit,
  defaultLocation,
}: {
  itemId: string
  packs: number
  unit: string
  defaultLocation?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [state, refillAction, refilling] = useActionState(
    refillOnePack.bind(null, itemId),
    initialActionState,
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    // Clear the MHD/location inputs after a successful refill (DOM reset only;
    // no setState in the effect).
    if (state.ok) formRef.current?.reset()
  }, [state])

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <form action={consumeOnePack.bind(null, itemId)}>
          <MinusButton disabled={packs <= 0} />
        </form>
        <span className="min-w-[3rem] text-center text-sm font-semibold tabular-nums text-slate-900">
          {packs} {unit}
        </span>
        <button
          type="button"
          aria-label="Eine Packung nachfüllen"
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          +
        </button>
      </div>

      {open ? (
        <form
          ref={formRef}
          action={refillAction}
          className="flex flex-wrap items-center justify-end gap-1.5 rounded-lg bg-slate-50 p-2"
        >
          <label className="flex items-center gap-1 text-xs text-slate-500">
            MHD
            <input
              type="date"
              name="expiry_date"
              className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-emerald-500"
            />
          </label>
          <input
            name="location"
            defaultValue={defaultLocation ?? ''}
            placeholder="Lagerort"
            className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-emerald-500"
          />
          <button type="submit" className="btn-primary px-3 py-1 text-xs" disabled={refilling}>
            {refilling ? '…' : '+1 hinzufügen'}
          </button>
        </form>
      ) : null}

      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
    </div>
  )
}
