// Shared domain constants (UI text in German per project convention).

// Units offered when creating/editing an item.
export const UNITS = [
  'Stück',
  'Packung',
  'kg',
  'g',
  'l',
  'ml',
  'Dose',
  'Flasche',
  'Glas',
] as const

// Storage location suggestions for stock batches.
export const LOCATIONS = [
  'Keller',
  'Garage',
  'Speisekammer',
  'Küche',
  'Abstellraum',
  'Dachboden',
] as const

// Expiry horizons (days) used by the dashboard and status indicators.
export const EXPIRY_SOON_DAYS = 30
export const EXPIRY_WARN_DAYS = 60

// Fallback label/icon for items without a category.
export const NO_CATEGORY_LABEL = 'Ohne Kategorie'
export const NO_CATEGORY_ICON = '📦'
