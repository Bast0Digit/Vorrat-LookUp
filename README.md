# Vorrat-LookUp

Web app to manage an emergency food & supply stock for a 5-person household over a
3-6 month horizon. Rotate stock (FIFO) so nothing expires, and always know what to
re-buy and by when.

## Stack

Next.js 16 (App Router, `src/`) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
Supabase (Postgres) via `@supabase/supabase-js` + `@supabase/ssr`. Package manager:
**pnpm**.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the Supabase anon key
pnpm dev                     # http://localhost:3000
```

Environment variables (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - project URL (browser-safe)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon/publishable key (browser-safe)
- `SUPABASE_SERVICE_ROLE_KEY` - server-only, not used by the MVP

### Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Reach-helper unit tests (Node `node:test`) |

## Auth

Supabase **email + password**. Closed app: there is no public sign-up - users are
created in the Supabase dashboard (Authentication → Users). One shared household:
every authenticated user sees and edits the same stock. Unauthenticated requests are
redirected to `/login` by the Next.js proxy (`src/proxy.ts`).

## Database

Shared Supabase project, isolated in the **`vorrat`** schema. The app touches **only**
`vorrat` (the `supabase-js` client is scoped with `db: { schema: 'vorrat' }`) and never
the `public` schema. The schema already exists in Supabase; this app builds against it.

> The Supabase type generator only emits the `public` schema, so the `vorrat` types in
> `src/lib/supabase/types.ts` are maintained by hand to mirror the live schema (see
> `docs/SCHEMA.sql`). Update them via a migration under `supabase/migrations/` if the
> schema ever changes.

## Project structure

```
src/
  app/                 # routes: dashboard, vorrat, item detail, wasser, energie,
                       #         lebensmittel-ablauf, einkaufsliste, import,
                       #         einstellungen, login, auth
  components/          # Nav, forms, +/- stepper, status/UI primitives
  lib/
    supabase/          # browser/server clients, session helper, hand-written types
    data.ts            # read helpers (Server Components)
    actions.ts         # mutations (Server Actions)
    import.ts          # pure CSV/XLSX parsing + validation
    import-actions.ts  # server-side import (SheetJS) parse/preview/commit
    reach.ts           # pure reach helper (+ reach.test.ts)
    parse.ts           # German decimal/date parsing
    domain.ts status.ts format.ts constants.ts
  proxy.ts             # auth gate + Supabase session refresh
```

## Features (MVP, M1-M3)

- **Übersicht** - tiles + "Läuft bald ab" (next 60 days) + "Nachkaufen" (below target).
- **Vorrat** - items grouped by category, search and category filter, status dots.
- **Artikel-Detail** - edit master data, add stock batches, consume/delete batches
  (FIFO: soonest expiry first), delete item.
- **Einkaufsliste** - everything below target, checkable, copy as plain text.
- PWA manifest for mobile install; responsive layout.

## v2 (units, reach, import, views)

- **Packaging model** - items carry `pack_size` + `base_unit` (e.g. Nudeln: 1 Packung =
  500 g); a stock batch is N packs sharing one MHD. Stock shows packs **and** base amount.
- **Reach** - "reicht noch ~X Tage" from `daily_use_per_person` × household size
  (`/einstellungen`). Pure helper in `lib/reach.ts` (unit-tested). The home dashboard shows
  the bottleneck reach with a per-resource breakdown.
- **+/- stepper** - on the item detail and each list row: `-` consumes one pack FIFO
  (logs to `consumption_log`), `+` adds one pack asking only for the new MHD and merges
  same-MHD batches. Item detail shows a short consumption history.
- **Import** (`/import`) - bulk create/update from `.csv` **and** `.xlsx` (SheetJS):
  parse + validate → preview → confirm → commit; upsert by name within category; German
  decimals and `DD.MM.YYYY`/ISO dates. Template at `public/import-template.csv`.
- **Views** - `/wasser` (litres + reach), `/energie` (Anlagen vs Brennstoff-Vorrat),
  `/lebensmittel-ablauf` (food expiry, 30/60/90-day horizon).

## Documentation

- Goals & context: [`docs/PROJECT-BRIEF.md`](docs/PROJECT-BRIEF.md)
- Feature & data-model spec: [`docs/SPEC.md`](docs/SPEC.md)
- Build rules for the agent: [`AGENTS.md`](AGENTS.md)
- DB schema reference: [`docs/SCHEMA.sql`](docs/SCHEMA.sql)
