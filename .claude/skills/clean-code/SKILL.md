---
name: clean-code
description: ezshop code style, comment, test, dependency, structure, formatting and logging rules. Load at the start of every coding session in this repo and before writing or reviewing any code here.
---

# ezshop clean code rules

Apply these to every line written or reviewed in this repository.

## Code style

- Functions: 4-20 lines. Split if longer.
- Files: under 500 lines. Split by responsibility.
- One thing per function, one responsibility per module (SRP).
- Names: specific and unique. Avoid `data`, `handler`, `Manager`.
  Prefer names that return <5 grep hits in the codebase.
- Types: explicit. No `any`, no `Dict`, no untyped functions.
- No code duplication. Extract shared logic into a function/module.
- Early returns over nested ifs. Max 2 levels of indentation.
- Exception messages must include the offending value and expected shape.

## Comments

- Keep your own comments. Don't strip them on refactor — they carry
  intent and provenance.
- Write WHY, not WHAT. Skip `// increment counter` above `i++`.
- Docstrings on public functions: intent + one usage example.
- Reference issue numbers / commit SHAs when a line exists because
  of a specific bug or upstream constraint.

## Tests

- Tests run with a single command: `bun run test` (from the repo root).
- Every new function gets a test. Bug fixes get a regression test.
- Mock external I/O (API, DB, filesystem) with named fake classes,
  not inline stubs. Fakes live in `test/fakes/` of each workspace.
- Tests must be F.I.R.S.T: fast, independent, repeatable,
  self-validating, timely.

## Dependencies

- Inject dependencies through constructor/parameter, not global/import.
- Wrap third-party libs behind a thin interface owned by this project
  (e.g. `PageNode` over cheerio/DOM, `HtmlFetcher` over Firecrawl).

## Structure

- Follow the framework's convention (Hono routes, Vite + TanStack Router, MV3 extension).
- Prefer small focused modules over god files.
- Predictable paths: `src/` for code, `test/` for tests, `test/fakes/` for fakes.

## Formatting

- Use the language default formatter: `bun run format` (prettier).
  Don't discuss style beyond that.

## Logging

- Structured JSON when logging for debugging / observability.
- Plain text only for user-facing CLI output.
