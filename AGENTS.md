# AGENTS.md - Vorrat-LookUp

Instructions for the Claude Code cloud session that builds this app.

> **This repo currently contains only documentation.** There is no app code yet.
> Your job is to build the app from scratch following the spec. Read this file,
> [`docs/PROJECT-BRIEF.md`](docs/PROJECT-BRIEF.md) and [`docs/SPEC.md`](docs/SPEC.md)
> before writing code.

## What this is

A small web app to manage an emergency food/supply stock for a 5-person household
over a 3-6 month horizon: rotate stock (FIFO) so nothing expires, and always know
what to re-buy and by when. Full scope in the spec.

## Tech stack (use exactly this)

- **Next.js 16** (App Router, `src/` dir), **React 19**, **TypeScript** (strict)
- **Tailwind CSS v4**
- **Supabase** (Postgres) via `@supabase/supabase-js` + `@supabase/ssr`
- Package manager: **pnpm**

## Step 0 - scaffold

The repo is intentionally empty of code. Create the Next.js app **in place** (the
working directory already has `.git`, `AGENTS.md`, `docs/`, etc., so scaffold into a
temp dir and copy in, or use a tool that tolerates a non-empty dir):

```bash
pnpm create next-app@latest <tmp> --ts --tailwind --app --src-dir --eslint \
  --import-alias "@/*" --use-pnpm --no-turbopack --yes
# then move the generated files into this repo (keep the existing docs and .gitignore)
```

Then add `@supabase/supabase-js` and `@supabase/ssr`. Keep `.env.example`, the docs,
`CLAUDE.md` and `AGENTS.md`.

## Database

- **Shared Supabase project.** This app uses **only the `vorrat` schema**.
- **Never read, write, or alter anything outside `vorrat`** - the same project hosts
  an unrelated intelligence system in `public`. Do not touch it.
- The schema does **not exist yet**. Create it as a Supabase migration per the data
  model in the spec. After creating the schema, it must be added to the project's
  **Exposed schemas** (Supabase Dashboard > Project Settings > API) so the JS client
  can reach it.
- Scope the Supabase client to the schema: `createClient(url, key, { db: { schema: 'vorrat' } })`.
- Generate DB types with the Supabase CLI and keep them in `src/lib/supabase/types.ts`.

## Auth model (MVP)

- Supabase Auth, **email magic link only**. No OAuth providers.
- One shared household: every authenticated user sees the same stock. RLS = authenticated
  full access, anonymous none. No per-user ownership in the MVP.

## Conventions

- TypeScript strict, avoid `any`. Server Components by default; Client Components only
  for interactivity. Data access via helpers in `src/lib/supabase/`.
- UI text in German (end users), code/comments/identifiers in English.
- Real umlauts (ä, ö, ü, ß), normal hyphens only.
- Tailwind utilities; no extra UI library unless the spec calls for it.

## Security - hard rules

- **Never commit secrets.** Keys come from `.env.local` (gitignored) or the cloud
  session environment. `.env.example` holds placeholders only.
- The `service_role` key is server-only; never ship it to the client bundle.
- No real household data in commits or fixtures.

## Definition of done (per task)

- `pnpm build` passes, `pnpm lint` clean.
- Feature works against the `vorrat` schema (verify in the browser).
- No access to schemas other than `vorrat`. Small, focused commits.

## Build order

Follow the milestones in the spec: M1 schema + list -> M2 dashboard -> M3 mutations ->
M4 polish/PWA. Ship M1-M3 as the MVP.
