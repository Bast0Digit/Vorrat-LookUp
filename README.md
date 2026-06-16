# Vorrat-LookUp

Web app to manage an emergency food & supply stock for a 5-person household over a
3-6 month horizon. Rotate stock (FIFO) so nothing expires, and always know what to
re-buy and by when.

> **Status: specification only.** This repo contains the docs and project context.
> The app itself is built from scratch by a Claude Code cloud session per the spec.

## Start here

- **Goals & context:** [`docs/PROJECT-BRIEF.md`](docs/PROJECT-BRIEF.md)
- **Feature & data-model spec:** [`docs/SPEC.md`](docs/SPEC.md)
- **Build instructions for the agent:** [`AGENTS.md`](AGENTS.md)

## Stack (target)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase (Postgres).

## Database

Shared Supabase project, isolated in the **`vorrat`** schema. The app must never touch
other schemas. See `AGENTS.md` for the hard rules.
