'use client'

import { useActionState } from 'react'

import { commitImport, parseImport } from '@/lib/import-actions'
import { initialImportState } from '@/lib/import'

const ACTION_BADGE: Record<string, string> = {
  create: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  update: 'bg-sky-50 text-sky-700 ring-sky-200',
  invalid: 'bg-red-50 text-red-700 ring-red-200',
}
const ACTION_LABEL: Record<string, string> = {
  create: 'Neu',
  update: 'Update',
  invalid: 'Fehler',
}

export function ImportClient() {
  const [parseState, parseAction, parsing] = useActionState(parseImport, initialImportState)
  const [commitState, commitAction, committing] = useActionState(commitImport, initialImportState)

  const hasPreview = parseState.rows.length > 0
  const validCount = parseState.valid.length

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-5">
        <form action={parseAction} className="flex flex-col gap-3">
          <div>
            <label htmlFor="file" className="label">CSV- oder XLSX-Datei</label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".csv,.xlsx"
              required
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-white hover:file:bg-emerald-700"
            />
          </div>
          <button type="submit" className="btn-primary self-start" disabled={parsing}>
            {parsing ? 'Wird gelesen …' : 'Vorschau erstellen'}
          </button>
        </form>
        {parseState.error ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{parseState.error}</p>
        ) : null}
      </div>

      {commitState.committed ? (
        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          <p className="font-medium">Import übernommen ✓</p>
          <p className="mt-1">
            {commitState.committed.created} neu · {commitState.committed.updated} aktualisiert ·{' '}
            {commitState.committed.batches} Chargen.
          </p>
          {commitState.error ? <p className="mt-1 text-red-700">{commitState.error}</p> : null}
        </div>
      ) : null}

      {hasPreview && !commitState.committed ? (
        <div className="card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-800">Vorschau</h2>
            <p className="text-xs text-slate-500">
              {parseState.summary.create} neu · {parseState.summary.update} Update ·{' '}
              {parseState.summary.invalid} Fehler
            </p>
          </div>

          <ul className="divide-y divide-slate-100">
            {parseState.rows.map((row) => (
              <li key={row.line} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${ACTION_BADGE[row.action]}`}
                  >
                    {ACTION_LABEL[row.action]}
                  </span>
                  <span className="font-medium text-slate-800">{row.name}</span>
                  <span className="text-xs text-slate-400">Zeile {row.line} · {row.categoryLabel}</span>
                </div>
                {row.detail ? <p className="mt-0.5 pl-1 text-xs text-slate-500">{row.detail}</p> : null}
                {row.errors.length > 0 ? (
                  <ul className="mt-1 pl-1 text-xs text-red-600">
                    {row.errors.map((e, i) => (
                      <li key={`${row.line}-${i}`}>• {e}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>

          <form action={commitAction} className="mt-4 border-t border-slate-200 pt-4">
            <input type="hidden" name="payload" value={JSON.stringify(parseState.valid)} />
            <button type="submit" className="btn-primary" disabled={committing || validCount === 0}>
              {committing ? 'Wird übernommen …' : `${validCount} Zeile(n) übernehmen`}
            </button>
            {validCount === 0 ? (
              <p className="mt-2 text-xs text-slate-400">Keine fehlerfreien Zeilen zum Übernehmen.</p>
            ) : null}
          </form>
        </div>
      ) : null}
    </div>
  )
}
