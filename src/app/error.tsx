'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="py-16 text-center">
      <p aria-hidden className="text-5xl">⚠️</p>
      <h1 className="mt-4 text-xl font-bold text-slate-900">Etwas ist schiefgelaufen</h1>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{error.message}</p>
      <button type="button" onClick={reset} className="btn-primary mt-6">
        Erneut versuchen
      </button>
    </div>
  )
}
