// Pure status logic shared by the dashboard and item list. No I/O.

import { EXPIRY_SOON_DAYS, EXPIRY_WARN_DAYS } from '@/lib/constants'
import type { ItemOverview } from '@/lib/domain'
import { daysUntil } from '@/lib/format'

export type StatusLevel = 'ok' | 'warn' | 'critical'

export type ItemStatus = {
  level: StatusLevel
  label: string
}

/** Level for an expiry date alone (used for stock-batch badges). */
export function expiryLevel(days: number | null): StatusLevel {
  if (days === null) return 'ok'
  if (days <= EXPIRY_SOON_DAYS) return 'critical' // includes already expired
  if (days <= EXPIRY_WARN_DAYS) return 'warn'
  return 'ok'
}

/** Combined status for an item: stock target vs. nearest expiry. */
export function itemStatus(o: ItemOverview): ItemStatus {
  const days = daysUntil(o.nextExpiry)
  const expired = days !== null && days < 0
  const outOfStock = o.targetStock > 0 && o.currentStock <= 0

  if (expired) return { level: 'critical', label: 'Abgelaufen' }
  if (outOfStock) return { level: 'critical', label: 'Leer' }
  if (days !== null && days <= EXPIRY_SOON_DAYS) {
    return { level: 'critical', label: 'Läuft bald ab' }
  }
  if (o.toBuy > 0) return { level: 'warn', label: 'Unter Soll' }
  if (days !== null && days <= EXPIRY_WARN_DAYS) {
    return { level: 'warn', label: 'Bald fällig' }
  }
  return { level: 'ok', label: 'OK' }
}
