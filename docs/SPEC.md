# Vorrat-LookUp - Product Spec

Goals and context are in [`PROJECT-BRIEF.md`](PROJECT-BRIEF.md). This file is the
feature and data-model specification the build follows.

## Users & auth

- Email magic-link login (Supabase Auth). One shared household stock - every logged-in
  member sees and edits the same data. No per-user separation in the MVP.

## Data model (already exists in schema `vorrat`)

The schema is **already created and exposed** in Supabase - exact DDL in
[`SCHEMA.sql`](SCHEMA.sql). Build against it; generate types from the live schema.
**All objects live in the `vorrat` schema**, never in `public`.

- **categories** - `name`, `icon`, `sort_order`. Seed with: Lebensmittel, Wasser,
  Hygiene, Medizin & Erste Hilfe, Energie (Strom/Holz), Garten & Saatgut, Sonstiges.
- **items** - product master data: `name`, `category_id`, `unit` (Stück/kg/l/Packung),
  `barcode?`, `target_stock` (minimum we want to keep), `notes`, timestamps.
- **stock_entries** - one row per batch/lot: `item_id`, `quantity`, `expiry_date?`,
  `location` (Keller/Garage/...), `opened`. Multiple entries per item enable FIFO +
  per-batch expiry.
- **consumption_log** - phase 2, create the table now: `item_id`, `quantity`,
  `consumed_at`.
- **item_overview** (view, `security_invoker`) - per item: `current_stock`
  (sum of entries), `next_expiry` (earliest expiry), `to_buy`
  (max(target_stock - current_stock, 0)).

RLS: enable on all tables. MVP policy = authenticated users have full access,
anonymous users none (shared household). Tighten later if needed.

## Core screens (MVP)

1. **Dashboard** (home)
   - "Läuft bald ab": entries expiring within 30 / 60 days, sorted by date.
   - "Nachkaufen": items where `to_buy > 0`, with the gap to target.
   - Summary tiles (total items, soon-to-expire count, below-target count).
2. **Vorrat (item list)**
   - Grouped by category. Per item: name, current stock vs target, next expiry,
     status dot (ok / expiring / below target). Filter by category, search by name.
3. **Item detail / edit**
   - Edit master data; list stock batches; add a batch (quantity, expiry, location);
     consume or delete a batch (FIFO: suggest oldest expiry first).
4. **Einkaufsliste**
   - All items with `to_buy > 0` as a checkable list with quantity to buy.
     Copy/export as plain text for the shopping trip.

## Milestones

- **M1 - Data layer + list.** Supabase client helpers (schema already exists),
  generated types, auth gate, item list grouped by category from `item_overview`
  (read-only).
- **M2 - Dashboard.** Expiring-soon and below-target sections + summary tiles.
- **M3 - Mutations.** Add/edit items, add/consume/delete stock batches, shopping list.
- **M4 - Polish.** Empty/loading states, mobile layout, installable PWA, optional push
  reminder for expiring items.

Ship M1-M3 as the usable MVP.

## Phase 2 (later)

- Barcode/EAN scan on mobile -> prefill name via OpenFoodFacts.
- Consumption logging + burn-rate estimate -> "reicht noch ~X Tage".
- Target-stock calculator from persons x daily need x days.
- Dedicated views for Wasser (l/person/day), Energie (Holz/Strom), Garten
  (sowing/harvest calendar).

## Acceptance criteria (MVP done)

A family member can log in, add items with a target stock, add stock batches with
expiry dates, and immediately see on the dashboard what expires soon and what to
re-buy. The shopping list reflects items below target. `pnpm build` passes.
