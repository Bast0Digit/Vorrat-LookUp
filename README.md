# Vorrat-LookUp

Web app to manage an emergency food & supply stock for a 5-person household over a
3-6 month horizon. Rotate stock (FIFO) so nothing expires, and always know what to
re-buy and by when.

- **Product spec:** [`docs/SPEC.md`](docs/SPEC.md)
- **Agent / contributor guide:** [`AGENTS.md`](AGENTS.md)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres).

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in the Supabase keys
pnpm dev                     # http://localhost:3000
```

## Database

Uses a shared Supabase project, isolated in the `vorrat` schema. The schema is
defined in [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
and is already applied to the live database. The app must never touch other schemas.

## Status

Scaffolded and specced, ready for feature work. Build the MVP per the milestones in
the spec (M1 list -> M2 dashboard -> M3 mutations).
