// Pure parsing helpers for German user input. No I/O - unit-testable, shared by
// Server Actions (form parsing) and the CSV/XLSX import.

/**
 * Parse a German-or-English decimal ("1,5" / "1.5"). Thousands separators are not
 * supported (household quantities don't need them).
 * @returns `null` for empty input, `NaN` for invalid input, otherwise the number.
 */
export function parseDecimal(raw: string): number | null {
  const t = raw.trim()
  if (t === '') return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

/** Result of a flexible date parse: empty, invalid, or an ISO `YYYY-MM-DD` string. */
export type DateParse =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'date'; iso: string }

function isoFromParts(y: number, m: number, d: number): DateParse {
  if (m < 1 || m > 12 || d < 1 || d > 31) return { kind: 'invalid' }
  const date = new Date(Date.UTC(y, m - 1, d))
  // Reject overflow like 31.02. (JS would roll it into March).
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return { kind: 'invalid' }
  }
  const mm = String(m).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return { kind: 'date', iso: `${y}-${mm}-${dd}` }
}

/**
 * Parse a date in `DD.MM.YYYY` or `YYYY-MM-DD` (also tolerates `D.M.YYYY` and
 * `YYYY/MM/DD`). Returns a discriminated result so callers can tell empty from invalid.
 */
export function parseFlexibleDate(raw: string): DateParse {
  const t = raw.trim()
  if (t === '') return { kind: 'empty' }

  const dmy = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dmy) return isoFromParts(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]))

  const ymd = t.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (ymd) return isoFromParts(Number(ymd[1]), Number(ymd[2]), Number(ymd[3]))

  return { kind: 'invalid' }
}
