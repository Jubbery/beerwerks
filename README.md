# Flower Shop Beer Werks

Website for Flower Shop Beer Werks — a small-batch brewery and taproom at
3501 Delgany St, Denver, CO 80216, run by head brewer Jacob Sabo and
operations manager Ava Olmstead.

Replaces the current Squarespace site. Seven public views plus a
password-gated owner dashboard where the owners edit menus, hours, events and
the homepage banner without a developer.

## Status

Pre-implementation. The design handoff has landed and the build is planned;
no application code yet.

- **[docs/PLAN.md](docs/PLAN.md)** — stack decisions, architecture, security,
  phasing and open questions. Settled so far: Next.js (App Router) +
  TypeScript on Vercel, Neon Postgres, plain CSS over the handoff's token
  layer.
- **[docs/design-handoff/](docs/design-handoff/)** — the design package:
  the written spec (`README.md`), the Modernist token sheet
  (`design-system/`), and a working HTML prototype of all seven views
  (`design/`).

The prototype opens directly in a browser. It is a **design reference**, not
code to ship.
