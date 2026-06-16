// German-locale formatting helpers and date math (date-only, timezone-safe).

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const numberFormatter = new Intl.NumberFormat('de-DE', {
  maximumFractionDigits: 2,
})

/** Format an ISO date string (YYYY-MM-DD or full ISO) as dd.MM.yyyy. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return dateFormatter.format(date)
}

/** Format a quantity with German decimals and no trailing zeros (e.g. 1,5). */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '0'
  return numberFormatter.format(value)
}

/** Quantity with unit, e.g. "2 Stück" / "1,5 kg". */
export function formatQuantity(
  value: number | null | undefined,
  unit: string | null | undefined,
): string {
  const qty = formatNumber(value)
  return unit ? `${qty} ${unit}` : qty
}

/** Midnight (local) of an ISO date, for whole-day comparisons. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Whole days from today until the given date. Negative = already in the past.
 * Returns null for missing/invalid input.
 */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const msPerDay = 24 * 60 * 60 * 1000
  const diff = startOfDay(date).getTime() - startOfDay(new Date()).getTime()
  return Math.round(diff / msPerDay)
}

/** Human-readable German relative expiry text, e.g. "in 5 Tagen", "heute". */
export function formatExpiryRelative(iso: string | null | undefined): string {
  const days = daysUntil(iso)
  if (days === null) return 'kein Datum'
  if (days < 0) {
    const abs = Math.abs(days)
    return abs === 1 ? 'seit 1 Tag abgelaufen' : `seit ${abs} Tagen abgelaufen`
  }
  if (days === 0) return 'heute'
  if (days === 1) return 'morgen'
  return `in ${days} Tagen`
}

/** ISO date (YYYY-MM-DD) for `offsetDays` from today - handy for queries. */
export function isoDateFromToday(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}
