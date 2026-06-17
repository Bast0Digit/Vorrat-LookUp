import { PageHeader } from '@/components/ui'
import { ImportClient } from './ImportClient'

export const dynamic = 'force-dynamic'

export default function ImportPage() {
  return (
    <div>
      <PageHeader
        title="Import"
        subtitle="Artikel per CSV oder Excel anlegen und aktualisieren."
        action={
          <a href="/import-template.csv" download className="btn-secondary hidden md:inline-flex">
            Vorlage
          </a>
        }
      />

      <p className="mb-4 text-sm text-slate-500">
        Spalten: <code className="text-xs">kategorie, name, einheit, packungsinhalt, basiseinheit, sollbestand,
        bedarf_pro_person_tag, barcode, notiz, menge, mhd, lagerort</code>. Zahlen mit Komma, Datum als
        TT.MM.JJJJ oder JJJJ-MM-TT.{' '}
        <a href="/import-template.csv" download className="font-medium text-emerald-600 underline">
          Vorlage herunterladen
        </a>
        .
      </p>

      <ImportClient />
    </div>
  )
}
