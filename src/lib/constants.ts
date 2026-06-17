// Shared domain constants (UI text in German per project convention).

// Count/pack units offered for an item's `unit` (datalist; free text allowed).
export const UNITS = [
  'Stück',
  'Packung',
  'Flasche',
  'Dose',
  'Glas',
  'Sack',
  'Karton',
  'kg',
  'g',
  'l',
  'ml',
  'Ster',
  'Anlage',
] as const

// Base units for `pack_size` content (`base_unit`, datalist).
export const BASE_UNITS = ['g', 'kg', 'ml', 'l', 'Stück', 'Ster', 'kWh'] as const

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

// Food-expiry view horizon options (days).
export const FOOD_EXPIRY_HORIZONS = [30, 60, 90] as const

// Reach ("reicht noch X Tage") target horizon for the Notvorrats-Dashboard.
export const REACH_TARGET_DAYS = 90
export const REACH_WARN_DAYS = 45

// Suggested default daily water need per person (litres).
export const WATER_DAILY_PER_PERSON = 2.5

// Category names (must match the seeded categories in `vorrat`).
export const CATEGORY_FOOD = 'Lebensmittel'
export const CATEGORY_WATER = 'Wasser'
export const CATEGORY_ENERGY = 'Energie (Strom/Holz)'

// Fallback label/icon for items without a category.
export const NO_CATEGORY_LABEL = 'Ohne Kategorie'
export const NO_CATEGORY_ICON = '📦'
