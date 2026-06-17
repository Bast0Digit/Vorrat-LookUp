import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { ItemOverview } from './domain.ts'
import { itemReachDays, reachDays, reachSummary } from './reach.ts'

function item(p: Partial<ItemOverview>): ItemOverview {
  return {
    id: 'x',
    name: 'x',
    categoryId: null,
    unit: 'Stück',
    targetStock: 0,
    packSize: 1,
    baseUnit: null,
    dailyUsePerPerson: null,
    isAsset: false,
    currentStock: 0,
    baseStock: 0,
    nextExpiry: null,
    toBuy: 0,
    ...p,
  }
}

test('reachDays: 5000 g at 75 g/person/day for 5 people = 13 days', () => {
  assert.equal(reachDays(5000, 75, 5), 13) // floor(5000 / 375)
})

test('reachDays: no per-person need -> null', () => {
  assert.equal(reachDays(5000, null, 5), null)
})

test('reachDays: guards zero/negative need and household', () => {
  assert.equal(reachDays(5000, 0, 5), null)
  assert.equal(reachDays(5000, 75, 0), null)
  assert.equal(reachDays(5000, -1, 5), null)
})

test('reachDays: empty stock -> 0 days (not null)', () => {
  assert.equal(reachDays(0, 75, 5), 0)
})

test('itemReachDays: assets never have a reach', () => {
  assert.equal(itemReachDays(item({ isAsset: true, baseStock: 999, dailyUsePerPerson: 10 }), 5), null)
})

test('itemReachDays: computes from base stock', () => {
  assert.equal(itemReachDays(item({ baseStock: 60, dailyUsePerPerson: 2.5 }), 4), 6) // floor(60/10)
})

test('reachSummary: bottleneck = minimum reach, with per-category breakdown', () => {
  const water = item({ baseStock: 30, dailyUsePerPerson: 2.5 }) // 30 / 12.5 = 2 days
  const food = item({ baseStock: 5000, dailyUsePerPerson: 75 }) // 5000 / 375 = 13 days
  const asset = item({ isAsset: true, baseStock: 100, dailyUsePerPerson: 99 }) // ignored
  const noReach = item({ baseStock: 100 }) // no dailyUse -> ignored

  const summary = reachSummary(
    [
      { item: water, categoryName: 'Wasser' },
      { item: food, categoryName: 'Lebensmittel' },
      { item: asset, categoryName: 'Energie' },
      { item: noReach, categoryName: 'Hygiene' },
    ],
    5,
  )

  assert.equal(summary.minDays, 2)
  assert.deepEqual(summary.breakdown, [
    { categoryName: 'Wasser', days: 2 },
    { categoryName: 'Lebensmittel', days: 13 },
  ])
})

test('reachSummary: no reach items -> minDays null', () => {
  const summary = reachSummary([{ item: item({}), categoryName: 'Hygiene' }], 5)
  assert.equal(summary.minDays, null)
  assert.deepEqual(summary.breakdown, [])
})
