'use server'

// Mutations (Server Actions) against the `vorrat` schema. Item master data and
// stock batches; plus sign-out. All revalidate the affected pages.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import type { ItemInsert, StockEntryInsert } from '@/lib/supabase/types'
import type { ActionState } from '@/lib/action-state'

function getString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

/** Parse a German-or-English decimal ("1,5" / "1.5"); '' => null. */
function parseDecimal(raw: string): number | null {
  if (raw === '') return null
  const n = Number(raw.replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

function revalidateStock(itemId?: string) {
  revalidatePath('/')
  revalidatePath('/vorrat')
  revalidatePath('/einkaufsliste')
  if (itemId) revalidatePath(`/vorrat/${itemId}`)
}

type ParsedItem = { error?: string; values?: ItemInsert }

function parseItemForm(formData: FormData): ParsedItem {
  const name = getString(formData, 'name')
  if (!name) return { error: 'Name ist erforderlich.' }

  const target = parseDecimal(getString(formData, 'target_stock'))
  if (target !== null && (Number.isNaN(target) || target < 0)) {
    return { error: 'Sollbestand muss eine Zahl ≥ 0 sein.' }
  }

  return {
    values: {
      name,
      category_id: getString(formData, 'category_id') || null,
      unit: getString(formData, 'unit') || 'Stück',
      target_stock: target ?? 0,
      barcode: getString(formData, 'barcode') || null,
      notes: getString(formData, 'notes') || null,
    },
  }
}

export async function createItem(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseItemForm(formData)
  if (parsed.error || !parsed.values) return { ok: false, error: parsed.error ?? 'Ungültige Eingabe.' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('items')
    .insert(parsed.values)
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }

  revalidateStock()
  redirect(`/vorrat/${data.id}`)
}

export async function updateItem(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseItemForm(formData)
  if (parsed.error || !parsed.values) return { ok: false, error: parsed.error ?? 'Ungültige Eingabe.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('items')
    .update({ ...parsed.values, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }

  revalidateStock(id)
  redirect(`/vorrat/${id}`)
}

export async function deleteItem(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw new Error(`Löschen fehlgeschlagen: ${error.message}`)
  revalidateStock()
  redirect('/vorrat')
}

export async function addStockEntry(
  itemId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const quantity = parseDecimal(getString(formData, 'quantity'))
  if (quantity === null || Number.isNaN(quantity) || quantity < 0) {
    return { ok: false, error: 'Menge muss eine Zahl ≥ 0 sein.' }
  }

  const entry: StockEntryInsert = {
    item_id: itemId,
    quantity,
    expiry_date: getString(formData, 'expiry_date') || null,
    location: getString(formData, 'location') || null,
    opened: formData.get('opened') === 'on',
  }

  const supabase = await createClient()
  const { error } = await supabase.from('stock_entries').insert(entry)
  if (error) return { ok: false, error: error.message }

  revalidateStock(itemId)
  return { ok: true, error: null }
}

export async function consumeStockEntry(
  entryId: string,
  itemId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const amount = parseDecimal(getString(formData, 'amount'))
  if (amount === null || Number.isNaN(amount) || amount <= 0) {
    return { ok: false, error: 'Menge muss größer als 0 sein.' }
  }

  const supabase = await createClient()
  const { data: entry, error: readError } = await supabase
    .from('stock_entries')
    .select('quantity')
    .eq('id', entryId)
    .maybeSingle()
  if (readError) return { ok: false, error: readError.message }
  if (!entry) return { ok: false, error: 'Bestand nicht gefunden.' }

  const remaining = Number(entry.quantity) - amount
  const mutation =
    remaining > 0
      ? supabase.from('stock_entries').update({ quantity: remaining }).eq('id', entryId)
      : supabase.from('stock_entries').delete().eq('id', entryId)

  const { error } = await mutation
  if (error) return { ok: false, error: error.message }

  revalidateStock(itemId)
  return { ok: true, error: null }
}

export async function deleteStockEntry(entryId: string, itemId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('stock_entries').delete().eq('id', entryId)
  if (error) throw new Error(`Bestand löschen fehlgeschlagen: ${error.message}`)
  revalidateStock(itemId)
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
