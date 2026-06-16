<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md - Vorrat-LookUp

Instructions for any AI agent (Claude Code cloud session, etc.) working in this repo.
Read this fully before writing code. The full product scope is in [`docs/SPEC.md`](docs/SPEC.md).

## What this is

A small web app to manage an emergency food/supply stock for a 5-person household
over a 3-6 month horizon. Core value: **rotate stock (FIFO) so nothing expires, and
always know what to re-buy and by when.** See the spec for the full feature list.

## Tech stack (already scaffolded - do not change)

- Next.js 16 (App Router, `src/` dir), React 19, TypeScript (strict)
- Tailwind CSS v4
- Supabase (Postgres) via `@supabase/supabase-js` + `@supabase/ssr`
- Package manager: **pnpm**

## First steps in a fresh session

1. `pnpm install`
2. Copy env: `cp .env.example .env.local` and fill the values (see below).
3. `pnpm dev` and confirm the app boots at http://localhost:3000
4. `pnpm build` must pass before you consider any task done.

## Database

- Shared Supabase project. **This app only uses the `vorrat` schema.**
- **Never read, write, or alter anything outside the `vorrat` schema** - the same
  project hosts an unrelated intelligence system in `public`. Do not touch it.
- Schema is defined in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
  and is already applied to the live database.
- The Supabase JS client must target the `vorrat` schema:
  `createClient(url, key, { db: { schema: 'vorrat' } })`. Helpers are in
  `src/lib/supabase/`.
- Generated DB types live in `src/lib/supabase/types.ts`. If you change the schema,
  add a new numbered migration (`0002_*.sql`), never edit `0001_init.sql`.

## Auth model (MVP)

- Supabase Auth, **email magic link only**. No OAuth providers.
- One shared household: every authenticated user sees the same stock. RLS already
  enforces "authenticated = full access, anonymous = none". Do not add per-user
  ownership in the MVP.

## Conventions

- TypeScript strict, no `any` unless truly unavoidable (justify with a comment).
- Server Components by default; use Client Components only for interactivity.
- Data access through the helpers in `src/lib/supabase/`, never inline `createClient`.
- Keep UI in German (end-user language), code/comments/identifiers in English.
- Tailwind utility classes; no extra UI library unless the spec calls for it.
- Real umlauts (ä, ö, ü, ß) in UI text, normal hyphens only.

## Security - hard rules

- **Never commit secrets.** Keys come from `.env.local` (gitignored) or the cloud
  session's environment. `.env.example` only holds placeholders.
- The `service_role` key is server-only; never expose it to the client bundle.
- No real customer/household data in commits or fixtures.

## Definition of done (per task)

- `pnpm build` passes, `pnpm lint` is clean.
- The feature works against the live `vorrat` schema (verify in the browser).
- No access to schemas other than `vorrat`.
- Small, focused commits with clear messages.

## Build order (suggested)

Follow the milestones in [`docs/SPEC.md`](docs/SPEC.md): M1 data layer + list, M2
dashboard (expiring soon / below target / shopping list), M3 add/edit items and
stock batches, M4 polish + PWA. Ship M1-M3 as the MVP.
