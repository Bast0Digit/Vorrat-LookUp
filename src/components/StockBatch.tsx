'use client'

import { useActionState } from 'react'

import { consumeStockEntry, deleteStockEntry } from '@/lib/actions'
import { initialActionState } from '@/lib/action-state'
import { daysUntil, formatDate, formatExpiryRelative, formatNumber } from '@/lib/format'
import { expiryLevel } from '@/lib/status'
import { StatusBadge } from '@/components/ui'
import { ConfirmForm, SubmitButton } from '@/components/ConfirmForm'

export type BatchData = {
  id: string
  quantity: number
  expiry_date: string | null
  location: string | null
  opened: boolean
}

export function StockBatch({
  entry,
  itemId,
  unit,
}: {
  entry: BatchData
  itemId: string
  unit: string
}) {
  const [state, consumeAction, pending] = useActionState(
    consumeStockEntry.bind(null, entry.id, itemId),
    initialActionState,
  )
  const level = expiryLevel(daysUntil(entry.expiry_date))

  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">
            {formatNumber(entry.quantity)} {unit}
            {entry.opened ? <span className="ml-2 text-xs text-amber-600">angebrochen</span> : null}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {entry.expiry_date
              ? `Haltbar bis ${formatDate(entry.expiry_date)} · ${formatExpiryRelative(entry.expiry_date)}`
              : 'kein Haltbarkeitsdatum'}
            {entry.location ? ` · ${entry.location}` : ''}
          </p>
        </div>
        {entry.expiry_date ? <StatusBadge level={level}>{formatDate(entry.expiry_date)}</StatusBadge> : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <form action={consumeAction} className="flex items-center gap-1.5">
          <input
            name="amount"
            type="text"
            inputMode="decimal"
            defaultValue={formatNumber(entry.quantity)}
            aria-label="Menge zum Verbrauchen"
            className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
          <button type="submit" className="btn-secondary px-3 py-1 text-xs" disabled={pending}>
            {pending ? '…' : 'Verbrauchen'}
          </button>
        </form>

        <ConfirmForm
          action={deleteStockEntry.bind(null, entry.id, itemId)}
          message="Diese Charge wirklich löschen?"
        >
          <SubmitButton className="btn-danger px-3 py-1 text-xs">Löschen</SubmitButton>
        </ConfirmForm>
      </div>

      {state.error ? <p className="mt-1 text-xs text-red-600">{state.error}</p> : null}
    </li>
  )
}
