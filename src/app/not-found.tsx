import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p aria-hidden className="text-5xl">🤔</p>
      <h1 className="mt-4 text-xl font-bold text-slate-900">Nicht gefunden</h1>
      <p className="mt-1 text-sm text-slate-500">
        Diese Seite oder dieser Artikel existiert nicht (mehr).
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        Zur Übersicht
      </Link>
    </div>
  )
}
