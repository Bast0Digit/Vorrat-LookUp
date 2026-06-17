# Project Brief - Vorrat-LookUp

> This repo is the **specification** for the app. It is built from scratch by a
> Claude Code cloud session. This brief captures the goals, decisions and context
> behind the project so the build has everything it needs.

## What we are building

A small web app to manage an **emergency food & supply stock** for a 5-person
household over a 3-6 month horizon.

Two problems to solve at once:

1. **Nothing should expire unused** - surface what runs out soon so it gets consumed
   in time (FIFO rotation).
2. **Always enough on hand** - track a target (minimum) stock per item and show what
   to re-buy and by when.

Beyond food: water, garden/self-grown produce, and energy reserves (electricity,
firewood) as their own categories.

## Who it is for

The family (5 people). German UI. Used on phone and laptop. Later hosted on a Mac
Mini behind Cloudflare; during development it runs locally against Supabase Cloud.

## Scope decisions

- **This is the "simple" of the two sibling projects** (see Strategy). Keep it lean.
  A clean CRUD + two calculations (FIFO rotation, target-vs-current) is the core.
- Auth: Supabase email + **password** (magic link was dropped due to redirect issues),
  one shared household account (every logged-in member sees the same stock). No
  per-user separation, no OAuth, no public signup.
- Mobile-installable PWA, but a clean responsive layout is enough.

## v2 (2026-06)

The MVP shipped (list, dashboard, item detail, shopping list, password auth, deployed
on the Mac Mini behind `vorrat.tradlergo.app`). v2 adds a packaging/units model,
per-person reach ("reicht noch ~X Tage"), a `+/-` stock stepper with consumption
logging, Excel/CSV bulk import, dedicated Wasser/Energie/Lebensmittel-Ablauf views,
household settings, and a Notvorrats-Dashboard. Full work order:
[`CHANGE-REQUEST-2026-06.md`](CHANGE-REQUEST-2026-06.md).

## Strategy / context

This project is one of **two sibling apps** developed in parallel, each in its own
repo, each in its own Claude Code cloud session:

- **Vorrat-LookUp** (this repo) - the simpler one.
- **Lernapp** - a gamified learning app (larger, more moving parts).

Both apps share **one Supabase project** (the owner only has room for two projects on
the free plan, and one is already used by an unrelated "Information-Intelligence"
system). To stay isolated:

- This app lives entirely in its own **`vorrat`** Postgres schema.
- It must **never** read, write or alter anything in the `public` schema or any other
  schema - that is the intelligence system's data.

See [`AGENTS.md`](../AGENTS.md) for the hard rules and [`SPEC.md`](SPEC.md) for the
feature and data-model details.

## Out of scope (MVP)

- Multi-household / multi-tenant separation
- Native app (PWA only)
- Barcode scanning (phase 2)
