# ezshop

Turns Amazon.in product pages into a clean, structured spec sheet.
Research behind the design: `research/FINDINGS.md`.

- `packages/catalog` — shared `ProductSnapshot` schema + page extractors (pure, no I/O).
- `apps/api` — Bun + Hono backend, Postgres storage, Firecrawl import.
- `apps/web` — React + TanStack Router/Query frontend.
- `apps/extension` — MV3 browser extension that captures the open product page.

Commands (repo root): `bun run test`, `bun run typecheck`, `bun run format`,
`bun run db:up`, `bun run dev:api`, `bun run dev:web`, `bun run build:extension`.

## Code rules — always loaded

Invoke the `clean-code` skill at the start of every coding session. Its rules are imported here so they are always in context:

@.claude/skills/clean-code/SKILL.md
