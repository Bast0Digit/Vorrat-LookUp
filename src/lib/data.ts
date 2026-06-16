// Read helpers (Server Components / Route Handlers). All access is scoped to the
// `vorrat` schema via the server client. Functions throw on error so the nearest
// error boundary can surface it.

import { createClient } from '@/lib/supabase/server'
import type { Category, Item, StockEntry } from '@/lib/supabase/types'
import { type ItemOverview, normalizeOverview } from '@/lib/domain'
import { EXPIRY_WARN_DAYS } from '@/lib/constants'
import { isoDateFromToday } from '@/lib/format'

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

/** Items below target (to_buy > 0), with category name, in shop-friendly order. */
export async function getShoppingList(): Promise<ShoppingItem[]> {
  const [overviews, categories] = await Promise.all([
    getItemOverviews(),
    getCategories(),
  ])
  const catName = new Map(categories.map((c) => [c.id, c.name]))
  const order = new Map(categories.map((c, i) => [c.id, i]))

  return overviews
    .filter((o) => o.toBuy > 0)
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

export type DashboardData = {
  expiring: ExpiringEntry[]
  toBuy: ShoppingItem[]
  totals: {
    items: number
    expiringSoon: number
    belowTarget: number
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const [expiring, toBuy, overviews] = await Promise.all([
    getExpiringEntries(),
    getShoppingList(),
    getItemOverviews(),
  ])

  return {
    expiring,
    toBuy,
    totals: {
      items: overviews.length,
      expiringSoon: expiring.length,
      belowTarget: toBuy.length,
    },
  }
}

export type ItemDetail = {
  item: Item
  category: Category | null
  entries: StockEntry[]
  currentStock: number
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

  const [{ data: entries, error: entriesError }, category] = await Promise.all([
    supabase.from('stock_entries').select('*').eq('item_id', id),
    item.category_id
      ? supabase
          .from('categories')
          .select('*')
          .eq('id', item.category_id)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
  ])
  if (entriesError) throw new Error(`Bestände laden fehlgeschlagen: ${entriesError.message}`)

  const list = entries ?? []
  // FIFO: soonest expiry first, undated batches last, then oldest created.
  list.sort((a, b) => {
    if (a.expiry_date && b.expiry_date) {
      return a.expiry_date.localeCompare(b.expiry_date)
    }
    if (a.expiry_date) return -1
    if (b.expiry_date) return 1
    return a.created_at.localeCompare(b.created_at)
  })

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
    currentStock,
    nextExpiry,
    toBuy,
  }
}
