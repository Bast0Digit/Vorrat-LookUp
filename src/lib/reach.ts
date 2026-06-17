// Reach ("reicht noch ~X Tage") - pure helpers, no I/O. Unit-testable and reused by
// the dashboard and the Wasser/Energie views. Only a type import (erased at runtime),
// so this module can be exercised directly by the test runner.

import type { ItemOverview } from '@/lib/domain'

/** Household consumption per day in base_unit. */
export function dailyHouseholdUse(dailyUsePerPerson: number, householdSize: number): number {
  return dailyUsePerPerson * householdSize
}

/**
 * Reach in whole days for a base-unit stock. Returns `null` when it cannot be
 * computed (no per-person need, non-positive need, or non-positive household).
 */
export function reachDays(
  baseStock: number,
  dailyUsePerPerson: number | null,
  householdSize: number,
): number | null {
  if (dailyUsePerPerson === null || dailyUsePerPerson <= 0) return null
  if (householdSize <= 0) return null
  const perDay = dailyHouseholdUse(dailyUsePerPerson, householdSize)
  if (perDay <= 0) return null
  return Math.floor(baseStock / perDay)
}

/** Reach for an overview item; `null` for assets or items without a per-person need. */
export function itemReachDays(item: ItemOverview, householdSize: number): number | null {
  if (item.isAsset) return null
  return reachDays(item.baseStock, item.dailyUsePerPerson, householdSize)
}

export type ReachBreakdown = { categoryName: string; days: number }
export type ReachSummary = {
  minDays: number | null // bottleneck reach across all reach-bearing items
  breakdown: ReachBreakdown[] // minimum reach per category, soonest first
}

/**
 * Minimum reach across non-asset items that have a reach (the bottleneck resource),
 * plus the minimum reach per category for a breakdown.
 */
export function reachSummary(
  items: { item: ItemOverview; categoryName: string }[],
  householdSize: number,
): ReachSummary {
  const perCategory = new Map<string, number>()
  let minDays: number | null = null

  for (const { item, categoryName } of items) {
    const days = itemReachDays(item, householdSize)
    if (days === null) continue
    minDays = minDays === null ? days : Math.min(minDays, days)
    const prev = perCategory.get(categoryName)
    perCategory.set(categoryName, prev === undefined ? days : Math.min(prev, days))
  }

  const breakdown = [...perCategory.entries()]
    .map(([categoryName, days]) => ({ categoryName, days }))
    .sort((a, b) => a.days - b.days)

  return { minDays, breakdown }
}
