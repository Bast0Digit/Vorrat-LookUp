# Change Request - Vorrat-LookUp v2 (2026-06)

Work order for the Claude Code cloud session. Build **everything below in a single
PR** against `main`. The MVP (item list, dashboard, item detail, shopping list,
email+password auth) already exists - this extends it. Read
[`SCHEMA.sql`](SCHEMA.sql) and [`SPEC.md`](SPEC.md) first.

## Hard rules (unchanged)

- Supabase **schema `vorrat` only**. Never read/write/alter `public` or any other
  schema (it hosts an unrelated intelligence system).
- The `vorrat` types generator only emits `public`; keep
  `src/lib/supabase/types.ts` **hand-written** and in sync with `SCHEMA.sql`.
- German UI, real umlauts, `du`-Form-free neutral product copy. Keep it lean.
- `pnpm build` and `pnpm lint` must pass. Existing patterns: Server Components for
  reads (`src/lib/data.ts`), Server Actions for writes (`src/lib/actions.ts`),
  `ActionState` for form feedback.

## Database (already migrated by the owner - do NOT apply it yourself)

The owner applies migrations to the shared Supabase via MCP. Migrations
`supabase/migrations/0001_units_reach_settings.sql` and `0002_seed_energy_assets.sql`
are in this repo for reference and are/will be live. Your job is the **code** against
this schema. The relevant additions:

- `items.pack_size numeric not null default 1` - content per pack, in `base_unit`.
- `items.base_unit text` - `g | ml | l | kg | Ster | kWh | ...`; `null` = pure count.
- `items.daily_use_per_person numeric` - consumption per person per day in `base_unit`;
  `null` = no reach shown.
- `items.is_asset boolean not null default false` - PV/solar/battery: no MHD, no reach,
  no re-buy.
- `vorrat.settings` (single row, `id=1`): `household_size int default 5`.
- `item_overview` now also exposes `pack_size`, `base_unit`, `daily_use_per_person`,
  `is_asset`, and `base_stock` (= `current_stock * pack_size`, in `base_unit`).
- `consumption_log` already exists (`item_id`, `quantity`, `consumed_at`) - wire it up.

Add the matching fields to the hand-written `types.ts` (`items`, `item_overview`,
new `settings` table) and to the `ItemOverview` domain type + `normalizeOverview`.

## Units & quantity model (the foundation - do this first)

- An **item** carries packaging: `unit` is the count/pack unit (e.g. `Packung`,
  `Flasche`, `Stück`, `Ster`), `pack_size` + `base_unit` describe the content of one
  pack (e.g. Nudeln -> `unit=Packung`, `pack_size=500`, `base_unit=g`). `pack_size=1`
  with `base_unit=null` means a plain countable item.
- A **stock batch** (`stock_entries`) is **N packs that share ONE MHD** -
  `quantity` = number of packs, `expiry_date` = the shared MHD. You never enter packs
  individually: 10 packs of pasta with the same MHD = one batch with `quantity=10`.
- `current_stock` = sum of packs; `base_stock` = `current_stock * pack_size` (e.g.
  10 packs x 500 g = 5000 g). Show stock as packs **and** as base amount where useful.
- Item create/edit form: add `pack_size`, `base_unit` (datalist of common units:
  g, ml, l, kg, Stück, Ster, kWh), `daily_use_per_person`. Parse German decimals
  ("1,5"). Keep `target_stock` in packs/count.

## Reach ("reicht noch ~X Tage") - per person & day

- `householdSize` comes from `vorrat.settings` (default 5).
- For an item with `daily_use_per_person` and `base_unit` set and `is_asset=false`:
  - `dailyHouseholdUse = daily_use_per_person * householdSize` (base_unit/day)
  - `reachDays = floor(base_stock / dailyHouseholdUse)` (guard divide-by-zero)
- Items without `daily_use_per_person` show no reach. Pure helper in `src/lib/`
  (no I/O), unit-testable, reused by views and the dashboard.
- **Settings page** (`/einstellungen`): edit `household_size` (Server Action,
  update the single `settings` row). Show it in the nav.

## +/- stock stepper + consumption logging (same surface)

On the **item detail** page and on each **item-list row**, render a compact stepper
`[ - ]  <stock in packs>  [ + ]`:

- **`-` (entnehmen):** remove **1 pack** from the batch with the **soonest expiry**
  (FIFO; undated batches last). If that batch hits 0, delete it. Write a
  `consumption_log` row (`item_id`, `quantity = 1`). One click = consume one. No
  prompt.
- **`+` (nachfüllen):** add **1 pack**. Prompt for **only the new MHD** (date input;
  location optional, default to the item's most recent batch location). If an
  **existing batch has the same `expiry_date` (and location)**, increment its
  `quantity` instead of creating a duplicate; otherwise create a new batch with
  `quantity=1`. This is the "consume one, re-buy one with a new MHD" loop.
- Keep the existing per-batch consume/delete on the detail page, but route consume
  through the same logic so it also writes `consumption_log`.
- Show a small **consumption history** on the item detail (last ~10 `consumption_log`
  rows, date + amount).
- All these mutations `revalidatePath` the affected pages (`/`, `/vorrat`,
  `/vorrat/[id]`, the new views, `/einkaufsliste`).

## Excel/CSV import (bulk add / update inventory)

A new page `/import` that bulk-creates or updates items (and optionally an initial
batch) from an uploaded file. Accept **`.csv` and `.xlsx`** (use SheetJS `xlsx`,
Apache-2.0 - acceptable; parse server-side in a Server Action / Route Handler).

- **Columns** (header row, German; auto-detect `,` or `;` delimiter; UTF-8). The
  canonical template is [`import-template.csv`](import-template.csv) - the page must
  offer it as a download:

  | Spalte | Pflicht | Bedeutung |
  |---|---|---|
  | `kategorie` | – | Name einer bestehenden Kategorie (sonst -> `Sonstiges`, Hinweis). |
  | `name` | ja | Artikelname. |
  | `einheit` | – | Zähl-/Packungseinheit (Default `Stück`). |
  | `packungsinhalt` | – | Inhalt je Packung (`pack_size`, Default `1`). |
  | `basiseinheit` | – | `g`/`ml`/`l`/`kg`/`Ster`/`kWh` (`base_unit`). |
  | `sollbestand` | – | `target_stock` in Packungen (Default `0`). |
  | `bedarf_pro_person_tag` | – | `daily_use_per_person` in Basiseinheit. |
  | `barcode` | – | optional. |
  | `notiz` | – | optional. |
  | `menge` | – | Anfangsbestand in Packungen -> legt eine Charge an. |
  | `mhd` | – | MHD der Charge (`TT.MM.JJJJ` oder `JJJJ-MM-TT`). |
  | `lagerort` | – | Lagerort der Charge. |

- **Behaviour:** match an existing item by `name` (case-insensitive) within the same
  `kategorie`. If found -> update the non-empty master fields and, if `menge>0`, add a
  **new** batch. If not found -> create the item, and if `menge>0` add a batch.
- **Two-step UX:** parse + validate -> show a **preview table** (rows to create /
  update + per-row errors with line numbers) -> user confirms -> commit. Never write
  on a partial/invalid parse without showing the preview first.
- Numbers accept German decimals; dates accept both formats above. Empty cells = unset.

## Dedicated views + Notvorrats-Dashboard

Add these as their own routes and to the nav.

- **`/wasser` (Wasser):** items in category *Wasser*. Show total **litres**
  (`base_stock` where `base_unit=l`), **reach in days** for the household, and a
  warning when reach is below a target horizon. Suggest `daily_use_per_person = 2.5`
  (l) as the default hint for new water items.
- **`/energie` (Energie):** items in category *Energie (Strom/Holz)*, split into
  **Anlagen** (`is_asset=true`: Photovoltaik-Anlage, Solaranlage, Batteriespeicher -
  list with notes/capacity, no reach) and **Vorrat** (`is_asset=false`: Brennholz -
  quantity in Ster, optional heating reach if `daily_use_per_person` set). These four
  items are seeded; the view must render them sensibly even with quantity 0.
- **`/lebensmittel-ablauf` (Bald ablaufende Lebensmittel):** batches in category
  *Lebensmittel* with an expiry date, soonest first, with a horizon selector
  (30/60/90 days). This is the food-focused expiry list (the dashboard keeps its
  cross-category "Läuft bald ab" section).
- **Notvorrats-Dashboard:** extend the home page with a prominent block
  **"Vorrat reicht für ~X Tage"** = the **minimum** `reachDays` across all non-asset
  items that have a reach (the bottleneck resource decides). Show a per-resource
  breakdown (e.g. Wasser X Tage, Lebensmittel Y Tage) and colour against a target
  horizon (default 90 days; ok/warn/critical). Keep the existing expiring + re-buy
  sections below it.

## Navigation

Extend the nav with: Übersicht, Vorrat, Wasser, Energie, Ablauf (Lebensmittel),
Einkaufsliste, Import, Einstellungen. Keep it usable on mobile (it is a PWA).

## Acceptance criteria

- Create an item with packaging (e.g. Nudeln, Packung, 500 g) and a per-person daily
  need; add a batch of N packs with one MHD; the item shows current packs, base
  amount and reach in days.
- The `-`/`+` stepper consumes FIFO (writing `consumption_log`) and refills asking
  only for the new MHD, merging same-MHD batches.
- Import a CSV **and** an XLSX from the template: preview shows correct creates/updates
  and errors; confirming writes them; re-importing the same file updates, not
  duplicates.
- `/wasser`, `/energie`, `/lebensmittel-ablauf` render correctly (energie incl. the
  four seeded items); the home dashboard shows "reicht für ~X Tage" with a breakdown.
- Household size is editable under `/einstellungen` and changes the reach everywhere.
- `pnpm build` + `pnpm lint` pass. No access outside schema `vorrat`.
