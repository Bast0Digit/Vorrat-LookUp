// Pure parsing + validation for the CSV/XLSX inventory import. No I/O - the Server
// Action (import-actions.ts) reads the file and resolves categories/items against the
// DB; this module turns a raw string matrix into validated, typed rows.

import { parseDecimal, parseFlexibleDate } from '@/lib/parse'

// Canonical German column headers (see docs/import-template.csv).
export const IMPORT_HEADERS = [
  'kategorie',
  'name',
  'einheit',
  'packungsinhalt',
  'basiseinheit',
  'sollbestand',
  'bedarf_pro_person_tag',
  'barcode',
  'notiz',
  'menge',
  'mhd',
  'lagerort',
] as const

export type ImportHeader = (typeof IMPORT_HEADERS)[number]

/** Validated, typed values for one import row (before category resolution). */
export type ImportFields = {
  kategorie: string | null
  name: string
  einheit: string | null
  packungsinhalt: number | null
  basiseinheit: string | null
  sollbestand: number | null
  bedarf_pro_person_tag: number | null
  barcode: string | null
  notiz: string | null
  menge: number | null
  mhd: string | null // ISO YYYY-MM-DD
  lagerort: string | null
}

export type ParsedRow = {
  line: number // 1-based source line (header = 1, first data row = 2)
  fields: ImportFields
  errors: string[]
}

export type ParseResult = {
  rows: ParsedRow[]
  headerError: string | null
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_')
}

function optionalText(raw: string): string | null {
  const t = raw.trim()
  return t === '' ? null : t
}

function num(
  raw: string,
  label: string,
  errors: string[],
  { min, gtZero }: { min?: number; gtZero?: boolean } = {},
): number | null {
  const parsed = parseDecimal(raw)
  if (parsed === null) return null
  if (Number.isNaN(parsed)) {
    errors.push(`${label}: keine gültige Zahl ("${raw.trim()}")`)
    return null
  }
  if (gtZero && parsed <= 0) {
    errors.push(`${label}: muss größer als 0 sein`)
    return null
  }
  if (min !== undefined && parsed < min) {
    errors.push(`${label}: muss ≥ ${min} sein`)
    return null
  }
  return parsed
}

function validateRecord(record: Record<string, string>, line: number): ParsedRow {
  const errors: string[] = []
  const get = (key: ImportHeader) => record[key] ?? ''

  const name = get('name').trim()
  if (name === '') errors.push('Name fehlt (Pflichtfeld)')

  let mhd: string | null = null
  const mhdParse = parseFlexibleDate(get('mhd'))
  if (mhdParse.kind === 'invalid') {
    errors.push(`MHD: ungültiges Datum ("${get('mhd').trim()}"), erwartet TT.MM.JJJJ oder JJJJ-MM-TT`)
  } else if (mhdParse.kind === 'date') {
    mhd = mhdParse.iso
  }

  const fields: ImportFields = {
    kategorie: optionalText(get('kategorie')),
    name,
    einheit: optionalText(get('einheit')),
    packungsinhalt: num(get('packungsinhalt'), 'Packungsinhalt', errors, { gtZero: true }),
    basiseinheit: optionalText(get('basiseinheit')),
    sollbestand: num(get('sollbestand'), 'Sollbestand', errors, { min: 0 }),
    bedarf_pro_person_tag: num(get('bedarf_pro_person_tag'), 'Bedarf pro Person/Tag', errors, { min: 0 }),
    barcode: optionalText(get('barcode')),
    notiz: optionalText(get('notiz')),
    menge: num(get('menge'), 'Menge', errors, { min: 0 }),
    mhd,
    lagerort: optionalText(get('lagerort')),
  }

  return { line, fields, errors }
}

/**
 * Turn a raw string matrix (first row = headers) into validated rows. Unknown
 * columns are ignored; fully empty rows are skipped.
 */
export function parseMatrix(matrix: string[][]): ParseResult {
  if (matrix.length === 0) return { rows: [], headerError: 'Die Datei ist leer.' }

  const headers = matrix[0].map(normalizeHeader)
  if (!headers.includes('name')) {
    return { rows: [], headerError: 'Kopfzeile ohne Spalte "name" - bitte die Vorlage verwenden.' }
  }

  const rows: ParsedRow[] = []
  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i]
    if (!cells || cells.every((c) => c.trim() === '')) continue
    const record: Record<string, string> = {}
    headers.forEach((h, idx) => {
      record[h] = (cells[idx] ?? '').trim()
    })
    rows.push(validateRecord(record, i + 1))
  }

  return { rows, headerError: null }
}

// --- Shapes shared with the import page (useActionState) ---------------------

export type ImportRowView = {
  line: number
  name: string
  categoryLabel: string
  action: 'create' | 'update' | 'invalid'
  detail: string
  errors: string[]
}

export type ImportState = {
  ok: boolean
  error: string | null
  rows: ImportRowView[]
  valid: ImportFields[]
  summary: { create: number; update: number; invalid: number }
  committed?: { created: number; updated: number; batches: number }
}

export const initialImportState: ImportState = {
  ok: false,
  error: null,
  rows: [],
  valid: [],
  summary: { create: 0, update: 0, invalid: 0 },
}
