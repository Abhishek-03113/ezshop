# ezshop

Product pages on Amazon.in and Flipkart bury the specs under offers, financing and reviews. ezshop pulls the
product information out and shows it as a clean, grouped spec sheet.

```
 Amazon.in tab ──(extension: live DOM)──┐
                                         ├─► @ezshop/catalog extractor ─► API (Hono) ─► Postgres ─► web (React)
 pasted URL ────(API: Firecrawl rawHtml)─┘
```

Both paths run the **same extractor** (`packages/catalog`) over a `PageNode` interface:
the extension adapts the live DOM, and the API adapts cheerio.

## Run it

Prereqs: Bun ≥ 1.4, Docker, and a self-hosted Firecrawl on :3002 (only needed for "Import by URL"; setup in `infra/firecrawl/README.md`).

```bash
bun install
cp .env.example .env
bun run db:up            # Postgres 17 on 127.0.0.1:5433, capped at 192 MB
bun run dev:api          # http://localhost:8787 (applies migrations on start)
bun run dev:web          # http://localhost:5173
bun run build:extension  # → apps/extension/dist
```

Load the extension: `chrome://extensions` → Developer mode → **Load unpacked** → `apps/extension/dist`.
Open an Amazon.in or Flipkart product page and click the ezshop toolbar button (or press **Alt+Shift+E**).
The badge shows `…` while working, `✓` on success, `!` on failure and `?` on a page it can't read.
On success the spec sheet opens in a new tab.

Point the extension at another stack with `EZSHOP_API_URL=… EZSHOP_WEB_URL=… bun run build:extension`;
the API host permission in the built manifest follows `EZSHOP_API_URL`.
After rebuilding, click **Reload** on the extension in `chrome://extensions`: Chromium can keep running the
previously installed service worker even after a restart with the same profile.

## Supported sites

| Site | Identity, price, rating, images | Specs |
|---|---|---|
| amazon.in | Page widgets (Amazon ships no JSON-LD) | Overview, `#tech`, product-detail tables, expander sections, detail bullets |
| flipkart.com | schema.org JSON-LD | "Specifications" sections (layout hooks, not hashed classes) |

To add a site, implement `SiteExtractor` (`packages/catalog/src/extract/site-extractor.ts`), list it in
`SITE_EXTRACTORS`, add its id to `PRODUCT_SOURCES`, and capture fixtures for it. The API, web app and extension pick it up from there.

## Fixtures

Tests don't assert values for specific products. Every captured page in `packages/catalog/test/fixtures/<source>/`
(`<slug>.html` plus `<slug>.json` with its URL and expected snapshot) runs through the same generic tests:
the server path (cheerio), the extension path (DOM), schema validity and the API import.

```bash
bun run fixtures:capture "<product-url>" <slug>   # scrape via Firecrawl, store HTML + expected snapshot
bun run fixtures:refresh                          # re-derive expectations after an intended extractor change; review the diff
```

## Develop

| Command | What |
|---|---|
| `bun run test` | All tests (Postgres integration tests run when `EZSHOP_TEST_DATABASE_URL` is set, as `.env` does) |
| `bun run typecheck` | `tsc` in every workspace |
| `bun run format` | prettier |
| `bun run fixtures:capture` / `fixtures:refresh` | see Fixtures |

Code rules live in `.claude/skills/clean-code/SKILL.md`, which `CLAUDE.md` loads into every Claude Code session.

## API

| Method | Path | Body | |
|---|---|---|---|
| POST | `/api/snapshots` | `ProductSnapshot` | From the extension; validated by zod, upserted by (source, ASIN) |
| POST | `/api/imports` | `{ "url": "…" }` | Scrape the URL via Firecrawl, then extract it |
| GET | `/api/products` | | Summaries, newest first |
| GET | `/api/products/:id` | | Full snapshot |
