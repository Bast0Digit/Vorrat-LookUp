// App-level domain shapes derived from the DB types, plus normalization that turns
// the (nullable) `item_overview` view rows into a clean, non-null model.

import type { ItemOverviewRow } from '@/lib/supabase/types'

export type ItemOverview = {
  id: string
  name: string
  categoryId: string | null
  unit: string
  targetStock: number
  currentStock: number
  nextExpiry: string | null
  toBuy: number
}

export function normalizeOverview(row: ItemOverviewRow): ItemOverview {
  return {
    id: row.id ?? '',
    name: row.name ?? '',
    categoryId: row.category_id ?? null,
    unit: row.unit ?? 'Stück',
    targetStock: Number(row.target_stock ?? 0),
    currentStock: Number(row.current_stock ?? 0),
    nextExpiry: row.next_expiry ?? null,
    toBuy: Number(row.to_buy ?? 0),
  }
}
