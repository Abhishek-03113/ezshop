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
bun run dev:landing      # http://localhost:5174 (landing page for first-time users)
bun run build:extension  # → apps/extension/dist
```

Load the extension: `chrome://extensions` → Developer mode → **Load unpacked** → `apps/extension/dist` (Chrome 120+).
Click the ezshop toolbar button (or press **Alt+Shift+E**) on any page to open **Quick Look**: a temporary overlay
of your last-used comparison, drawn over the page. On a product page, that page appears as a highlighted
**This page** column you can compare before saving. Press **Return** (or click **Add**) to add it, **←/→** to switch
comparison, and **Esc** or click outside to close. On pages the extension can't script (`chrome://`, the web store),
the button opens the classic capture popup instead.

To save a product without opening it, right-click a product link on Amazon.in or Flipkart → **Add to ezshop** →
pick a comparison, **Library only** or **New comparison…**. **Alt+click** on a product link adds it to the
last-used comparison. The page is fetched with your cookies and parsed in an offscreen document. Toasts on the
page show progress (with **Quick Look** / **Undo**), and the toolbar badge counts links still loading.

Point the extension at another stack with `EZSHOP_API_URL=… EZSHOP_WEB_URL=… bun run build:extension`;
the API host permission in the built manifest follows `EZSHOP_API_URL`.
After rebuilding, click **Reload** on the extension in `chrome://extensions`: Chromium can keep running the
previously installed service worker even after a restart with the same profile.

Build-time links (Vite env vars):

| Var | Used by | Default |
|---|---|---|
| `VITE_EZSHOP_WEB_URL` | landing ("Open app", paste-a-link) | `http://localhost:5173` |
| `VITE_EZSHOP_EXTENSION_URL` | landing and web "Add to Chrome" | landing: `#how`, web: Chrome Web Store search |

The web app accepts `/?import=<url-encoded product URL>`: it prefills the import field, imports once and opens
the new spec sheet. The landing page's paste-a-link form uses this.

UI design (Apple HIG tokens, extension popup, web app, landing): https://claude.ai/artifact/KxVDZQoovX8Ju9PyHvZYzj

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
| GET | `/api/products?q=` | | Summaries, newest first; `q` searches title, brand, category and specs |
| GET | `/api/products/:id` | | Full snapshot |
| GET | `/api/products/:id/comparisons` | | Comparisons containing the product |
| GET / POST | `/api/comparisons` | `{ "name", "productIds"? }` | List (newest first) / create |
| GET / PATCH / DELETE | `/api/comparisons/:id` | `{ "name" }` | Detail with products / rename / delete |
| PUT / DELETE | `/api/comparisons/:id/products/:productId` | | Add (idempotent) / remove a product |
