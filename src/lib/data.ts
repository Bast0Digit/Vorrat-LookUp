// Read helpers (Server Components / Route Handlers). All access is scoped to the
// `vorrat` schema via the server client. Functions throw on error so the nearest
// error boundary can surface it.

import { createClient } from '@/lib/supabase/server'
import type { Category, Item, StockEntry } from '@/lib/supabase/types'
import { type ItemOverview, normalizeOverview } from '@/lib/domain'
import {
  CATEGORY_ENERGY,
  CATEGORY_FOOD,
  CATEGORY_WATER,
  EXPIRY_WARN_DAYS,
} from '@/lib/constants'
import { isoDateFromToday } from '@/lib/format'
import { itemReachDays, reachDays, reachSummary, type ReachSummary } from '@/lib/reach'

function compareByName(a: string, b: string) {
  return a.localeCompare(b, 'de')
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
  if (error) throw new Error(`Kategorien laden fehlgeschlagen: ${error.message}`)
  return data ?? []
}

export async function getCategoryByName(name: string): Promise<Category | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('name', name)
    .maybeSingle()
  if (error) throw new Error(`Kategorie laden fehlgeschlagen: ${error.message}`)
  return data ?? null
}

export async function getSettings(): Promise<{ householdSize: number }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('settings')
    .select('household_size')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw new Error(`Einstellungen laden fehlgeschlagen: ${error.message}`)
  return { householdSize: data?.household_size ?? 5 }
}

export async function getItemOverviews(): Promise<ItemOverview[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('item_overview').select('*')
  if (error) throw new Error(`Vorrat laden fehlgeschlagen: ${error.message}`)
  return (data ?? []).map(normalizeOverview)
}

export type ItemGroup = {
  category: Category | null
  items: ItemOverview[]
}

/** Items grouped by category, in category sort order; empty groups omitted. */
export async function getItemsGrouped(): Promise<ItemGroup[]> {
  const [categories, overviews] = await Promise.all([
    getCategories(),
    getItemOverviews(),
  ])

  const byCategory = new Map<string | null, ItemOverview[]>()
  for (const o of overviews) {
    const key = o.categoryId
    const list = byCategory.get(key) ?? []
    list.push(o)
    byCategory.set(key, list)
  }

  const groups: ItemGroup[] = []
  for (const category of categories) {
    const items = byCategory.get(category.id)
    if (items && items.length > 0) {
      groups.push({ category, items: items.sort((a, b) => compareByName(a.name, b.name)) })
    }
  }

  const uncategorized = byCategory.get(null)
  if (uncategorized && uncategorized.length > 0) {
    groups.push({
      category: null,
      items: uncategorized.sort((a, b) => compareByName(a.name, b.name)),
    })
  }

  return groups
}

export type ExpiringEntry = {
  id: string
  quantity: number
  expiryDate: string
  location: string | null
  opened: boolean
  itemId: string
  itemName: string
  unit: string
}

/** Stock batches expiring within the warning horizon, soonest first. */
export async function getExpiringEntries(): Promise<ExpiringEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('stock_entries')
    .select('id, quantity, expiry_date, location, opened, item:items(id, name, unit)')
    .not('expiry_date', 'is', null)
    .lte('expiry_date', isoDateFromToday(EXPIRY_WARN_DAYS))
    .order('expiry_date', { ascending: true })
  if (error) throw new Error(`Ablaufdaten laden fehlgeschlagen: ${error.message}`)

  return (data ?? [])
    .filter((row) => row.item && row.expiry_date)
    .map((row) => ({
      id: row.id,
      quantity: Number(row.quantity),
      expiryDate: row.expiry_date as string,
      location: row.location,
      opened: row.opened,
      itemId: row.item!.id,
      itemName: row.item!.name,
      unit: row.item!.unit,
    }))
}

export type ShoppingItem = ItemOverview & { categoryName: string | null }

function buildShoppingItems(
  overviews: ItemOverview[],
  categories: Category[],
): ShoppingItem[] {
  const catName = new Map(categories.map((c) => [c.id, c.name]))
  const order = new Map(categories.map((c, i) => [c.id, i]))

  return overviews
    .filter((o) => o.toBuy > 0 && !o.isAsset)
    .map((o) => ({
      ...o,
      categoryName: o.categoryId ? catName.get(o.categoryId) ?? null : null,
    }))
    .sort((a, b) => {
      const oa = a.categoryId ? order.get(a.categoryId) ?? 999 : 999
      const ob = b.categoryId ? order.get(b.categoryId) ?? 999 : 999
      if (oa !== ob) return oa - ob
      return compareByName(a.name, b.name)
    })
}

/** Items below target (to_buy > 0, assets excluded), grouped shop-friendly. */
export async function getShoppingList(): Promise<ShoppingItem[]> {
  const [overviews, categories] = await Promise.all([
    getItemOverviews(),
    getCategories(),
  ])
  return buildShoppingItems(overviews, categories)
}

export type DashboardData = {
  expiring: ExpiringEntry[]
  toBuy: ShoppingItem[]
  reach: ReachSummary
  householdSize: number
  totals: {
    items: number
    expiringSoon: number
    belowTarget: number
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const [expiring, overviews, categories, settings] = await Promise.all([
    getExpiringEntries(),
    getItemOverviews(),
    getCategories(),
    getSettings(),
  ])

  const catName = new Map(categories.map((c) => [c.id, c.name]))
  const toBuy = buildShoppingItems(overviews, categories)
  const reach = reachSummary(
    overviews.map((o) => ({
      item: o,
      categoryName: o.categoryId ? catName.get(o.categoryId) ?? 'Ohne Kategorie' : 'Ohne Kategorie',
    })),
    settings.householdSize,
  )

  return {
    expiring,
    toBuy,
    reach,
    householdSize: settings.householdSize,
    totals: {
      items: overviews.length,
      expiringSoon: expiring.length,
      belowTarget: toBuy.length,
    },
  }
}

// --- Dedicated views ---------------------------------------------------------

async function overviewsForCategory(name: string): Promise<{
  category: Category | null
  items: ItemOverview[]
}> {
  const [category, overviews] = await Promise.all([
    getCategoryByName(name),
    getItemOverviews(),
  ])
  if (!category) return { category: null, items: [] }
  return {
    category,
    items: overviews
      .filter((o) => o.categoryId === category.id)
      .sort((a, b) => compareByName(a.name, b.name)),
  }
}

export type WaterView = {
  householdSize: number
  totalLitres: number
  reachDays: number | null
  items: (ItemOverview & { reachDays: number | null })[]
}

export async function getWaterView(): Promise<WaterView> {
  const [{ items }, settings] = await Promise.all([
    overviewsForCategory(CATEGORY_WATER),
    getSettings(),
  ])

  const totalLitres = items
    .filter((o) => o.baseUnit === 'l')
    .reduce((sum, o) => sum + o.baseStock, 0)

  // Household daily litres = sum of per-person needs across water items * size.
  const dailyPerPerson = items.reduce((sum, o) => sum + (o.dailyUsePerPerson ?? 0), 0)
  const reach = reachDays(totalLitres, dailyPerPerson > 0 ? dailyPerPerson : null, settings.householdSize)

  return {
    householdSize: settings.householdSize,
    totalLitres,
    reachDays: reach,
    items: items.map((o) => ({ ...o, reachDays: itemReachDays(o, settings.householdSize) })),
  }
}

export type EnergyAsset = { id: string; name: string; unit: string; notes: string | null }
export type EnergySupply = ItemOverview & { notes: string | null; reachDays: number | null }
export type EnergyView = {
  assets: EnergyAsset[]
  supplies: EnergySupply[]
}

export async function getEnergyView(): Promise<EnergyView> {
  const { category, items } = await overviewsForCategory(CATEGORY_ENERGY)
  const settings = await getSettings()

  // Notes live on `items`, not on the overview - fetch them for this category.
  const notesById = new Map<string, string | null>()
  if (category) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('items')
      .select('id, notes')
      .eq('category_id', category.id)
    if (error) throw new Error(`Energie laden fehlgeschlagen: ${error.message}`)
    for (const row of data ?? []) notesById.set(row.id, row.notes)
  }

  const assets: EnergyAsset[] = items
    .filter((o) => o.isAsset)
    .map((o) => ({ id: o.id, name: o.name, unit: o.unit, notes: notesById.get(o.id) ?? null }))

  const supplies: EnergySupply[] = items
    .filter((o) => !o.isAsset)
    .map((o) => ({
      ...o,
      notes: notesById.get(o.id) ?? null,
      reachDays: itemReachDays(o, settings.householdSize),
    }))

  return { assets, supplies }
}

export type FoodExpiryEntry = ExpiringEntry

/** Food-category batches with an expiry within the horizon, soonest first. */
export async function getFoodExpiry(horizonDays: number): Promise<FoodExpiryEntry[]> {
  const supabase = await createClient()
  const category = await getCategoryByName(CATEGORY_FOOD)
  if (!category) return []

  const { data: itemRows, error: itemErr } = await supabase
    .from('items')
    .select('id')
    .eq('category_id', category.id)
  if (itemErr) throw new Error(`Lebensmittel laden fehlgeschlagen: ${itemErr.message}`)
  const ids = (itemRows ?? []).map((r) => r.id)
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('stock_entries')
    .select('id, quantity, expiry_date, location, opened, item:items(id, name, unit)')
    .in('item_id', ids)
    .not('expiry_date', 'is', null)
    .lte('expiry_date', isoDateFromToday(horizonDays))
    .order('expiry_date', { ascending: true })
  if (error) throw new Error(`Lebensmittel-Ablauf laden fehlgeschlagen: ${error.message}`)

  return (data ?? [])
    .filter((row) => row.item && row.expiry_date)
    .map((row) => ({
      id: row.id,
      quantity: Number(row.quantity),
      expiryDate: row.expiry_date as string,
      location: row.location,
      opened: row.opened,
      itemId: row.item!.id,
      itemName: row.item!.name,
      unit: row.item!.unit,
    }))
}

export type ConsumptionEntry = { id: string; quantity: number; consumedAt: string }

export async function getConsumptionLog(
  itemId: string,
  limit = 10,
): Promise<ConsumptionEntry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('consumption_log')
    .select('*')
    .eq('item_id', itemId)
    .order('consumed_at', { ascending: false })
    .limit(limit)
  if (error) throw new Error(`Verbrauch laden fehlgeschlagen: ${error.message}`)
  return (data ?? []).map((r) => ({
    id: r.id,
    quantity: Number(r.quantity),
    consumedAt: r.consumed_at,
  }))
}

export type ItemDetail = {
  item: Item
  category: Category | null
  entries: StockEntry[]
  consumption: ConsumptionEntry[]
  currentStock: number
  baseStock: number
  nextExpiry: string | null
  toBuy: number
}

/** Full detail for one item: master data, its batches and derived status. */
export async function getItemDetail(id: string): Promise<ItemDetail | null> {
  const supabase = await createClient()

  const { data: item, error: itemError } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (itemError) throw new Error(`Artikel laden fehlgeschlagen: ${itemError.message}`)
  if (!item) return null

  const [{ data: entries, error: entriesError }, category, consumption] = await Promise.all([
    supabase.from('stock_entries').select('*').eq('item_id', id),
    item.category_id
      ? supabase
          .from('categories')
          .select('*')
          .eq('id', item.category_id)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
    getConsumptionLog(id),
  ])
  if (entriesError) throw new Error(`Bestände laden fehlgeschlagen: ${entriesError.message}`)

  const list = sortBatchesFifo(entries ?? [])
  const currentStock = list.reduce((sum, e) => sum + Number(e.quantity), 0)
  const dated = list
    .map((e) => e.expiry_date)
    .filter((d): d is string => !!d)
    .sort((a, b) => a.localeCompare(b))
  const nextExpiry = dated[0] ?? null
  const toBuy = Math.max(Number(item.target_stock) - currentStock, 0)

  return {
    item,
    category,
    entries: list,
    consumption,
    currentStock,
    baseStock: currentStock * Number(item.pack_size),
    nextExpiry,
    toBuy,
  }
}

/** FIFO order: soonest expiry first, undated batches last, then oldest created. */
export function sortBatchesFifo(entries: StockEntry[]): StockEntry[] {
  return [...entries].sort((a, b) => {
    if (a.expiry_date && b.expiry_date) return a.expiry_date.localeCompare(b.expiry_date)
    if (a.expiry_date) return -1
    if (b.expiry_date) return 1
    return a.created_at.localeCompare(b.created_at)
  })
}
