'use server'

// Mutations (Server Actions) against the `vorrat` schema: item master data, stock
// batches, the +/- pack stepper with consumption logging, household settings, and
// sign-out. All revalidate the affected pages.

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import type { ItemInsert, StockEntry, StockEntryInsert } from '@/lib/supabase/types'
import type { ActionState } from '@/lib/action-state'
import { parseDecimal } from '@/lib/parse'

function getString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function revalidateStock(itemId?: string) {
  revalidatePath('/')
  revalidatePath('/vorrat')
  revalidatePath('/einkaufsliste')
  revalidatePath('/wasser')
  revalidatePath('/energie')
  revalidatePath('/lebensmittel-ablauf')
  if (itemId) revalidatePath(`/vorrat/${itemId}`)
}

/** FIFO order: soonest expiry first, undated batches last, then oldest created. */
function fifo(a: Pick<StockEntry, 'expiry_date' | 'created_at'>, b: Pick<StockEntry, 'expiry_date' | 'created_at'>) {
  if (a.expiry_date && b.expiry_date) return a.expiry_date.localeCompare(b.expiry_date)
  if (a.expiry_date) return -1
  if (b.expiry_date) return 1
  return a.created_at.localeCompare(b.created_at)
}

type ParsedItem = { error?: string; values?: ItemInsert }

function parseItemForm(formData: FormData): ParsedItem {
  const name = getString(formData, 'name')
  if (!name) return { error: 'Name ist erforderlich.' }

  const target = parseDecimal(getString(formData, 'target_stock'))
  if (target !== null && (Number.isNaN(target) || target < 0)) {
    return { error: 'Sollbestand muss eine Zahl ≥ 0 sein.' }
  }

  const packSize = parseDecimal(getString(formData, 'pack_size'))
  if (packSize !== null && (Number.isNaN(packSize) || packSize <= 0)) {
    return { error: 'Packungsinhalt muss eine Zahl > 0 sein.' }
  }

  const daily = parseDecimal(getString(formData, 'daily_use_per_person'))
  if (daily !== null && (Number.isNaN(daily) || daily < 0)) {
    return { error: 'Bedarf pro Person/Tag muss eine Zahl ≥ 0 sein.' }
  }

  return {
    values: {
      name,
      category_id: getString(formData, 'category_id') || null,
      unit: getString(formData, 'unit') || 'Stück',
      target_stock: target ?? 0,
      barcode: getString(formData, 'barcode') || null,
      notes: getString(formData, 'notes') || null,
      pack_size: packSize ?? 1,
      base_unit: getString(formData, 'base_unit') || null,
      daily_use_per_person: daily,
      is_asset: formData.get('is_asset') === 'on',
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

/** Consume a given amount from a specific batch (FIFO surface routes here too). */
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

  const consumed = Math.min(amount, Number(entry.quantity))
  const remaining = Number(entry.quantity) - consumed
  const mutation =
    remaining > 0
      ? supabase.from('stock_entries').update({ quantity: remaining }).eq('id', entryId)
      : supabase.from('stock_entries').delete().eq('id', entryId)

  const { error } = await mutation
  if (error) return { ok: false, error: error.message }

  await supabase.from('consumption_log').insert({ item_id: itemId, quantity: consumed })
  revalidateStock(itemId)
  return { ok: true, error: null }
}

/** `-` : remove one pack from the soonest-expiring batch (FIFO) and log it. */
export async function consumeOnePack(itemId: string): Promise<void> {
  const supabase = await createClient()
  const { data: entries, error } = await supabase
    .from('stock_entries')
    .select('*')
    .eq('item_id', itemId)
  if (error) throw new Error(`Entnehmen fehlgeschlagen: ${error.message}`)

  const target = (entries ?? []).filter((e) => Number(e.quantity) > 0).sort(fifo)[0]
  if (!target) return // nothing in stock - no-op

  const remaining = Number(target.quantity) - 1
  const mutation =
    remaining > 0
      ? supabase.from('stock_entries').update({ quantity: remaining }).eq('id', target.id)
      : supabase.from('stock_entries').delete().eq('id', target.id)

  const { error: mutationError } = await mutation
  if (mutationError) throw new Error(`Entnehmen fehlgeschlagen: ${mutationError.message}`)

  await supabase.from('consumption_log').insert({ item_id: itemId, quantity: 1 })
  revalidateStock(itemId)
}

/** `+` : add one pack with a new MHD, merging into a same-MHD/location batch. */
export async function refillOnePack(
  itemId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const expiry = getString(formData, 'expiry_date') || null

  const supabase = await createClient()
  const { data: entries, error } = await supabase
    .from('stock_entries')
    .select('*')
    .eq('item_id', itemId)
  if (error) return { ok: false, error: error.message }
  const list = entries ?? []

  let location = getString(formData, 'location') || null
  if (location === null) {
    const recent = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    location = recent?.location ?? null
  }

  const match = list.find(
    (e) => (e.expiry_date ?? null) === expiry && (e.location ?? null) === location,
  )

  if (match) {
    const { error: e } = await supabase
      .from('stock_entries')
      .update({ quantity: Number(match.quantity) + 1 })
      .eq('id', match.id)
    if (e) return { ok: false, error: e.message }
  } else {
    const { error: e } = await supabase
      .from('stock_entries')
      .insert({ item_id: itemId, quantity: 1, expiry_date: expiry, location })
    if (e) return { ok: false, error: e.message }
  }

  revalidateStock(itemId)
  return { ok: true, error: null }
}

export async function deleteStockEntry(entryId: string, itemId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase.from('stock_entries').delete().eq('id', entryId)
  if (error) throw new Error(`Bestand löschen fehlgeschlagen: ${error.message}`)
  revalidateStock(itemId)
}

export async function updateHouseholdSize(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const n = parseDecimal(getString(formData, 'household_size'))
  if (n === null || Number.isNaN(n) || !Number.isInteger(n) || n < 1) {
    return { ok: false, error: 'Haushaltsgröße muss eine ganze Zahl ≥ 1 sein.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('settings')
    .upsert({ id: 1, household_size: n, updated_at: new Date().toISOString() })
  if (error) return { ok: false, error: error.message }

  // Reach depends on household size - refresh everywhere it is shown.
  revalidatePath('/')
  revalidatePath('/wasser')
  revalidatePath('/energie')
  revalidatePath('/vorrat')
  revalidatePath('/einstellungen')
  return { ok: true, error: null }
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
