'use server'

// CSV/XLSX inventory import: server-side parse (SheetJS) -> validated preview, then a
// separate commit. Strictly `vorrat` schema. Two-step so nothing is written before the
// user has seen the preview.

import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'

import { createClient } from '@/lib/supabase/server'
import type { ItemUpdate } from '@/lib/supabase/types'
import {
  type ImportFields,
  type ImportRowView,
  type ImportState,
  parseMatrix,
} from '@/lib/import'

const FALLBACK_CATEGORY = 'Sonstiges'

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) {
    const y = value.getUTCFullYear()
    const m = String(value.getUTCMonth() + 1).padStart(2, '0')
    const d = String(value.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return String(value).trim()
}

function toMatrix(buf: Buffer, filename: string): string[][] {
  let workbook: XLSX.WorkBook
  if (/\.csv$/i.test(filename)) {
    let text = buf.toString('utf-8')
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1) // strip UTF-8 BOM
    const firstLine = text.split(/\r?\n/, 1)[0] ?? ''
    const semicolons = (firstLine.match(/;/g) ?? []).length
    const commas = (firstLine.match(/,/g) ?? []).length
    const fieldSep = semicolons >= commas ? ';' : ','
    // No cellDates for CSV: keep German DD.MM.YYYY as text for parseFlexibleDate.
    workbook = XLSX.read(text, { type: 'string', FS: fieldSep })
  } else {
    workbook = XLSX.read(buf, { type: 'buffer', cellDates: true })
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) return []
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '' })
  return rows.map((row) => (Array.isArray(row) ? row.map(cellToString) : []))
}

type CategoryResolution = { id: string | null; label: string }

async function loadResolution() {
  const supabase = await createClient()
  const [{ data: categories, error: catErr }, { data: items, error: itemErr }] = await Promise.all([
    supabase.from('categories').select('id, name'),
    supabase.from('items').select('id, name, category_id'),
  ])
  if (catErr) throw new Error(`Kategorien laden fehlgeschlagen: ${catErr.message}`)
  if (itemErr) throw new Error(`Artikel laden fehlgeschlagen: ${itemErr.message}`)

  const catByLower = new Map((categories ?? []).map((c) => [c.name.toLowerCase(), c]))
  const fallbackId = catByLower.get(FALLBACK_CATEGORY.toLowerCase())?.id ?? null
  const itemByKey = new Map(
    (items ?? []).map((i) => [`${i.name.toLowerCase()}|${i.category_id ?? ''}`, i.id]),
  )

  function resolveCategory(kategorie: string | null): CategoryResolution {
    if (!kategorie) return { id: null, label: 'Ohne Kategorie' }
    const found = catByLower.get(kategorie.toLowerCase())
    if (found) return { id: found.id, label: found.name }
    return { id: fallbackId, label: `${FALLBACK_CATEGORY} (statt "${kategorie}")` }
  }

  function findExisting(name: string, categoryId: string | null): string | undefined {
    return itemByKey.get(`${name.toLowerCase()}|${categoryId ?? ''}`)
  }

  return { resolveCategory, findExisting }
}

function rowDetail(f: ImportFields): string {
  const parts: string[] = []
  if (f.einheit) parts.push(f.einheit)
  if (f.packungsinhalt !== null) {
    parts.push(`Inhalt ${f.packungsinhalt}${f.basiseinheit ? ` ${f.basiseinheit}` : ''}`)
  }
  if (f.sollbestand !== null) parts.push(`Soll ${f.sollbestand}`)
  if (f.bedarf_pro_person_tag !== null) parts.push(`Bedarf ${f.bedarf_pro_person_tag}/P/Tag`)
  if (f.menge !== null && f.menge > 0) {
    parts.push(`+${f.menge} Charge${f.mhd ? ` (MHD ${f.mhd})` : ''}`)
  }
  return parts.join(' · ')
}

export async function parseImport(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Bitte eine .csv- oder .xlsx-Datei auswählen.', rows: [], valid: [], summary: { create: 0, update: 0, invalid: 0 } }
  }

  let matrix: string[][]
  try {
    const buf = Buffer.from(await file.arrayBuffer())
    matrix = toMatrix(buf, file.name)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unbekannter Fehler'
    return { ok: false, error: `Datei konnte nicht gelesen werden: ${message}`, rows: [], valid: [], summary: { create: 0, update: 0, invalid: 0 } }
  }

  const { rows, headerError } = parseMatrix(matrix)
  if (headerError) {
    return { ok: false, error: headerError, rows: [], valid: [], summary: { create: 0, update: 0, invalid: 0 } }
  }
  if (rows.length === 0) {
    return { ok: false, error: 'Keine Datenzeilen gefunden.', rows: [], valid: [], summary: { create: 0, update: 0, invalid: 0 } }
  }

  const { resolveCategory, findExisting } = await loadResolution()

  const views: ImportRowView[] = []
  const valid: ImportFields[] = []
  let create = 0
  let update = 0
  let invalid = 0

  for (const row of rows) {
    const { fields, errors, line } = row
    const { id: categoryId, label } = resolveCategory(fields.kategorie)

    if (errors.length > 0) {
      invalid++
      views.push({ line, name: fields.name || '(ohne Name)', categoryLabel: label, action: 'invalid', detail: rowDetail(fields), errors })
      continue
    }

    const existing = findExisting(fields.name, categoryId)
    const action: 'create' | 'update' = existing ? 'update' : 'create'
    if (existing) update++
    else create++
    valid.push(fields)
    views.push({ line, name: fields.name, categoryLabel: label, action, detail: rowDetail(fields), errors: [] })
  }

  return {
    ok: invalid === 0,
    error: invalid > 0 ? `${invalid} Zeile(n) mit Fehlern - nur fehlerfreie Zeilen werden übernommen.` : null,
    rows: views,
    valid,
    summary: { create, update, invalid },
  }
}

export async function commitImport(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const payload = formData.get('payload')
  let fieldsList: ImportFields[]
  try {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : null
    if (!Array.isArray(parsed)) throw new Error('leer')
    fieldsList = parsed as ImportFields[]
  } catch {
    return { ok: false, error: 'Keine gültigen Daten zum Übernehmen.', rows: [], valid: [], summary: { create: 0, update: 0, invalid: 0 } }
  }
  if (fieldsList.length === 0) {
    return { ok: false, error: 'Keine Zeilen zum Übernehmen.', rows: [], valid: [], summary: { create: 0, update: 0, invalid: 0 } }
  }

  const supabase = await createClient()
  const { resolveCategory, findExisting } = await loadResolution()

  let created = 0
  let updated = 0
  let batches = 0
  const errors: string[] = []

  for (const f of fieldsList) {
    if (!f.name) continue
    const { id: categoryId } = resolveCategory(f.kategorie)
    const existingId = findExisting(f.name, categoryId)

    let itemId = existingId
    if (existingId) {
      const update: ItemUpdate = { updated_at: new Date().toISOString() }
      if (f.einheit) update.unit = f.einheit
      if (f.packungsinhalt !== null) update.pack_size = f.packungsinhalt
      if (f.basiseinheit) update.base_unit = f.basiseinheit
      if (f.sollbestand !== null) update.target_stock = f.sollbestand
      if (f.bedarf_pro_person_tag !== null) update.daily_use_per_person = f.bedarf_pro_person_tag
      if (f.barcode) update.barcode = f.barcode
      if (f.notiz) update.notes = f.notiz
      const { error } = await supabase.from('items').update(update).eq('id', existingId)
      if (error) {
        errors.push(`${f.name}: ${error.message}`)
        continue
      }
      updated++
    } else {
      const { data, error } = await supabase
        .from('items')
        .insert({
          name: f.name,
          category_id: categoryId,
          unit: f.einheit ?? 'Stück',
          pack_size: f.packungsinhalt ?? 1,
          base_unit: f.basiseinheit,
          target_stock: f.sollbestand ?? 0,
          daily_use_per_person: f.bedarf_pro_person_tag,
          barcode: f.barcode,
          notes: f.notiz,
        })
        .select('id')
        .single()
      if (error || !data) {
        errors.push(`${f.name}: ${error?.message ?? 'konnte nicht angelegt werden'}`)
        continue
      }
      itemId = data.id
      created++
    }

    if (itemId && f.menge !== null && f.menge > 0) {
      const { error } = await supabase
        .from('stock_entries')
        .insert({ item_id: itemId, quantity: f.menge, expiry_date: f.mhd, location: f.lagerort })
      if (error) errors.push(`${f.name} (Charge): ${error.message}`)
      else batches++
    }
  }

  revalidatePath('/')
  revalidatePath('/vorrat')
  revalidatePath('/einkaufsliste')
  revalidatePath('/wasser')
  revalidatePath('/energie')
  revalidatePath('/lebensmittel-ablauf')

  return {
    ok: errors.length === 0,
    error: errors.length > 0 ? errors.slice(0, 5).join(' · ') : null,
    rows: [],
    valid: [],
    summary: { create: created, update: updated, invalid: 0 },
    committed: { created, updated, batches },
  }
}
