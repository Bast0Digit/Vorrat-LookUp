# Vorrat-LookUp - Product Spec

## Goal

Manage an emergency food and supply stock for a 5-person household over a 3-6 month
horizon. Two problems to solve at once:

1. **Nothing should expire unused** - surface what runs out soon so it gets consumed
   in time (FIFO rotation).
2. **Always enough on hand** - track a target (minimum) stock per item and show what
   to re-buy and by when.

End users are the family, German UI, used on phone and desktop. Hosted later on a
Mac Mini behind Cloudflare; for development it runs locally against Supabase Cloud.

## Users & auth

- Email magic-link login (Supabase Auth). One shared household stock - every logged-in
  member sees and edits the same data. No per-user separation in the MVP.

## Data model (schema `vorrat`, already migrated)

- **categories** - Lebensmittel, Wasser, Hygiene, Medizin, Energie (Strom/Holz),
  Garten & Saatgut, Sonstiges. (`name`, `icon`, `sort_order`)
- **items** - product master data: `name`, `category_id`, `unit`, `barcode?`,
  `target_stock` (minimum we want to keep), `notes`.
- **stock_entries** - one row per batch/lot: `item_id`, `quantity`, `expiry_date?`,
  `location`, `opened`. Multiple entries per item enable FIFO + per-batch expiry.
- **consumption_log** - phase 2, table already exists.
- **item_overview** (view) - per item: `current_stock` (sum of entries),
  `next_expiry` (earliest expiry), `to_buy` (max(target - current, 0)).

## Core screens (MVP)

1. **Dashboard** (home)
   - "Läuft bald ab": entries expiring within 30 / 60 days, sorted by date.
   - "Nachkaufen": items where `to_buy > 0`, with the gap to target.
   - Small summary tiles (total items, soon-to-expire count, below-target count).
2. **Vorrat (item list)**
   - Grouped by category. Per item: name, current stock vs target, next expiry,
     a status dot (ok / expiring / below target).
   - Filter by category, search by name.
3. **Item detail / edit**
   - Edit master data (name, category, unit, target_stock, notes).
   - List its stock batches; add a batch (quantity, expiry, location); consume or
     delete a batch (FIFO: suggest oldest expiry first).
4. **Einkaufsliste**
   - All items with `to_buy > 0` as a checkable list, with quantity to buy.
     Copy/export as plain text for the shopping trip.

## Milestones

- **M1 - Data layer + list.** Supabase helpers, auth gate, item list grouped by
  category reading from `item_overview`. Read-only first.
- **M2 - Dashboard.** Expiring-soon and below-target sections + summary tiles.
- **M3 - Mutations.** Add/edit items, add/consume/delete stock batches, shopping list.
- **M4 - Polish.** Empty states, loading, mobile layout, installable PWA, optional
  push reminder for expiring items.

Ship M1-M3 as the usable MVP.

## Phase 2 (not now, keep in mind)

- Barcode/EAN scan on mobile -> prefill name via OpenFoodFacts.
- Consumption logging + simple burn-rate estimate -> "reicht noch ~X Tage".
- Target-stock calculator from persons x daily need x days.
- Dedicated views for Wasser (liters/person/day), Energie (Holz/Strom), Garten
  (sowing/harvest calendar).

## Non-goals (MVP)

- No multi-household / multi-tenant separation.
- No native app (PWA only).
- No barcode scanning yet.

## Acceptance criteria (MVP done)

- A family member can log in, add items with target stock, add stock batches with
  expiry dates, and immediately see on the dashboard what expires soon and what to
  re-buy. The shopping list reflects items below target. `pnpm build` passes.
