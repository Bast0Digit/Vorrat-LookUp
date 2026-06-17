# Vorrat-LookUp - Product Spec

Goals and context are in [`PROJECT-BRIEF.md`](PROJECT-BRIEF.md). This file is the
feature and data-model specification the build follows.

## Users & auth

- Email + **password** login (Supabase `signInWithPassword`; magic link was dropped due
  to redirect issues). One shared household account - every logged-in member sees and
  edits the same data. No per-user separation, no public signup.

## v2 (2026-06) - in active scope

The features below were the original "Phase 2" and are now being built in one PR. The
full work order is in [`CHANGE-REQUEST-2026-06.md`](CHANGE-REQUEST-2026-06.md):
packaging/units model, per-person reach ("reicht noch ~X Tage"), `+/-` stock stepper
with consumption logging, Excel/CSV import, dedicated Wasser/Energie/Lebensmittel-Ablauf
views, household settings, and a Notvorrats-Dashboard. The data model below reflects the
v2 schema (see [`SCHEMA.sql`](SCHEMA.sql)).

## Data model (already exists in schema `vorrat`)

The schema is **already created and exposed** in Supabase - exact DDL in
[`SCHEMA.sql`](SCHEMA.sql). Build against it; generate types from the live schema.
**All objects live in the `vorrat` schema**, never in `public`.

- **categories** - `name`, `icon`, `sort_order`. Seed with: Lebensmittel, Wasser,
  Hygiene, Medizin & Erste Hilfe, Energie (Strom/Holz), Garten & Saatgut, Sonstiges.
- **items** - product master data: `name`, `category_id`, `unit` (count/pack unit),
  `barcode?`, `target_stock` (minimum, in packs), `notes`, plus v2: `pack_size`
  (content per pack), `base_unit` (g/ml/l/kg/Ster/kWh), `daily_use_per_person`
  (for reach), `is_asset` (PV/solar/battery), timestamps.
- **stock_entries** - one row per batch/lot = **N packs sharing one MHD**: `item_id`,
  `quantity` (packs), `expiry_date?`, `location`, `opened`. Enables FIFO + per-batch
  expiry without entering packs individually.
- **consumption_log** - exists; every `-` (entnehmen) writes a row (`item_id`,
  `quantity`, `consumed_at`), quantity in packs.
- **settings** - single row, `household_size` (for the reach calculation).
- **item_overview** (view, `security_invoker`) - per item: `current_stock` (packs),
  `base_stock` (= current_stock x pack_size), `next_expiry`, `to_buy`, plus the v2
  item columns.

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

## v2 details

See [`CHANGE-REQUEST-2026-06.md`](CHANGE-REQUEST-2026-06.md) for the full spec of the
units model, reach, `+/-` stepper + consumption logging, Excel/CSV import, the
Wasser/Energie/Lebensmittel-Ablauf views, household settings, and the
Notvorrats-Dashboard.

## Phase 3 (later)

- Barcode/EAN scan on mobile -> prefill name via OpenFoodFacts (`items.barcode` exists).
- Burn-rate reach from the actual `consumption_log` (vs the planned per-person rate).
- Dedicated Garten view (sowing/harvest calendar).

## Acceptance criteria (MVP done)

A family member can log in, add items with a target stock, add stock batches with
expiry dates, and immediately see on the dashboard what expires soon and what to
re-buy. The shopping list reflects items below target. `pnpm build` passes.
