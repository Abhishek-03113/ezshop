# Amazon.in & Flipkart — integration research (2026-10-05)

All claims below were observed live with Playwright 1.63 driving headless Chromium 152
(`src/*.ts`, run with `npx tsx`), or taken from primary-source docs (linked). Raw evidence
(HAR-style JSONL network logs, traces, screenshots) is in `out/`. Open any trace with
`npx playwright show-trace out/<name>-trace.zip`.

Tested from an Indian residential IP, as a guest (no login). Sample size: ~10 Amazon and
~6 Flipkart browser sessions. No CAPTCHA was hit in that sample, but that is not a guarantee at scale.

---

## 1. Official APIs: what actually exists

| | Amazon | Flipkart |
|---|---|---|
| Product/catalog API | **Creators API** (PA-API 5 is retired; old endpoint now returns 404 `InternalFailure`, verified). Ops: `SearchItems`, `GetItems`, `GetVariations`, `GetBrowseNodes`. India supported. OAuth 2.0 client-credentials. | **Affiliate API 1.0**: product feeds, delta feeds, top-selling feeds, keyword search, product lookup. Auth headers `Fk-Affiliate-Id` / `Fk-Affiliate-Token`. Endpoint is live (`401 Invalid Headers` without creds, verified). |
| Eligibility | Associates account **+ ≥10 qualifying sales in the last 30 days** | Flipkart affiliate account + API token |
| Cart / order API | **None** (not in Creators API docs) | **None** (not in Affiliate API docs) |
| Associates "add to cart" URL | `/gp/aws/cart/add.html?ASIN.1=…&Quantity.1=…` now redirects to `/associates/addtocart` **behind sign-in** (verified). Usable only as a deep link in a user's own logged-in browser. | — |

Conclusion: **neither company exposes a public cart/checkout HTTP API.** Official APIs cover catalog data only, and are gated behind affiliate programs.

## 2. Bot protection (verified)

* **Amazon**: plain `curl` (even with a Chrome UA) gets a 1.3 KB interstitial: meta-refresh with a one-shot
  `bm-verify=` token plus `triggerInterstitialChallenge()`. These are the markers of Akamai Bot Manager.
  The first browser navigation also got **HTTP 202 + an AWS WAF challenge** (`*.token.awswaf.com/.../inputs`, `/mp_verify`),
  which Chromium solved automatically before reloading with 200. **You need a real JS engine to reach any Amazon page.**
* **Flipkart**: plain `curl` gets full SSR HTML (product pages ~200 KB, including JSON-LD). Akamai cookies (`ak_bmsc`, `bm_sv`)
  are set in the browser. The internal API rate-limits cookie-less callers (see §4).
* `--disable-blink-features=AutomationControlled` made `navigator.webdriver === false` in our runs.

## 3. Amazon.in

### Search (`/s?k=…`): server-rendered HTML, not JSON
* The first results page is a full HTML document. Pagination and filtering use `POST /s/query?k=…&page=N`, which returns
  Amazon's streaming format (`application/json-amazonui-streaming`: JSON chunks separated by `&&&` containing HTML fragments).
* Autocomplete is clean JSON: `GET /suggestions?prefix=<q>&limit=11&alias=aps&site-variant=desktop&version=3&…`.

DOM hooks that worked (`src/amazon-search.ts`):

| Field | Selector |
|---|---|
| Result card | `[data-component-type="s-search-result"]` (has `data-asin`, `data-index`, `data-uuid`) |
| Title | `h2` **is sometimes only the brand** ("Apple"). Use `[data-cy="title-recipe"]` / `h2[aria-label]` |
| Price / MRP | `.a-price:not(.a-text-price) .a-offscreen` / `.a-price.a-text-price .a-offscreen` |
| Rating | `[aria-label*="out of 5"]` |
| Sponsored | `.puis-sponsored-label-text` (sponsored cards **duplicate organic ASINs**, so dedupe) |

### Product page (`/dp/<ASIN>`): **no JSON-LD** (0 blocks)
| Field | Selector |
|---|---|
| Title | `#productTitle` |
| Price | `.priceToPay .a-offscreen` / `#corePrice_feature_div .a-price .a-offscreen` |
| MRP | `.basisPrice .a-offscreen` |
| Availability | `#availability` |
| Rating / count | `#acrPopover` `title` attr / `#acrCustomerReviewText` |
| Seller | `#merchantInfoFeature_feature_div` |
| IDs for cart | `input#ASIN`, `input[name=offerListingID]`, `input[name=merchantID]` |
| Add-to-cart | `#add-to-cart-button` (**absent** on listings with no buy box, e.g. B0DGJ7TGDR) |
| Variations | `script[type=a-state]` keys `desktop-twister-*`, plus inline scripts with `dimensionValuesDisplayData` |

### Add to cart: internal JSON API (`src/amazon-dataapi.ts`, `src/amazon-cartapi.ts`)
Clicking `#add-to-cart-button` does **not** post the form. It calls:

```
POST https://data.amazon.in/api/marketplaces/A21TJRUUN4KGV/cart/carts/retail/items
accept:        application/vnd.com.amazon.api+json; type="cart.add-items/v1"
content-type:  application/vnd.com.amazon.api+json; type="cart.add-items.request/v1"
x-api-csrf-token:              <from [data-csrf-add-cart] attr on the PDP>
x-amzn-encrypted-slate-token:  <from <meta name="encrypted-slate-token">>
cookie:        session-id, ubid-acbin, session-token, …
body: {"items":[{"asin":"B0CHX9MF1L","offerListingId":"<input[name=offerListingID]>",
        "customerVisiblePrice":{"amount":89900,"currencyCode":"INR","displayString":"₹89,900.00"}}]}
→ 200 {"type":"cart.add-items/v1","entity":{"count":{"entity":{"items":1}},
        "items":[{"id":"<uuid>","quantity":1,"responseMessage":{"summary":"Added to cart"}}]}}
```
Also observed: `GET …/products/<ASIN>` (product/v2 JSON) and `GET …/cart/summary?cartTypes=RETAIL`.
The API base URL is in the DOM as `[data-cart-aapi-endpoint]`.

Validation:
* In-page `fetch` with the tokens returns **200**. Without the tokens the CORS preflight fails (`Failed to fetch`).
* **Out-of-browser replay from Node** with the browser's cookies and tokens returns **200**. Without cookies it returns **404**. Without `Accept-Language` it returns **406** ("locale not supported").
* The API has **no cart-read route**: `GET …/cart/carts/retail` and `…/items` return `404 "No route found"`. `cart/summary` returned `[]` for a guest even with one item in the cart.
  Error payloads reference `https://api.amazon.com/shop` (which returns 403 publicly).

### Cart page (`/gp/cart/view.html`): **best data surface on Amazon**
Each line item is `#sc-active-cart div[data-asin]` with structured attributes:
`data-asin, data-itemid, data-price="89900", data-quantity, data-outofstock, data-producttitle,
data-encoded-offering, data-subtotal='{"numberOfItems":1,"subtotal":{"code":"INR","amount":89900.00}}'`.
Cart subtotal: `#sc-subtotal-amount-activecart`. Header badge: `#nav-cart-count` (stale until reload; it showed 0 right after the add).
Guest cart works with no login (verified: add, then the item shows on the cart page).

## 4. Flipkart

### Search
* Cards: `[data-id]` = **product ID / FSN** (e.g. `MOBH4DQFG8NKFRDY`). Links `a[href*="/p/itm"]` carry `pid=` and `lid=` (listing ID).
* JSON-LD `ItemList` on the search page.
* CSS classes are **hashed / React-Native-Web atomic** (`v1zwn21n`, `css-146c3p1 r-dnmrzs …`). **Do not use them as selectors.**
* `window.__INITIAL_STATE__` exists in curl'd SSR HTML but is **undefined after hydration** in the browser. The app uses
  React Router (`__staticRouterHydrationData`) plus React Native Web.

### Product page: **schema.org JSON-LD is the most stable hook**
`script[type="application/ld+json"]` → `Product` with `name, sku (=FSN), brand, image[], aggregateRating{ratingValue,ratingCount,reviewCount},
offers{price, priceCurrency, availability (InStock/OutOfStock), shippingDetails, hasMerchantReturnPolicy}, review[]`.
Available to **plain curl** too (verified: `price 69900, InStock`).

### Add to cart: **requires login** (verified)
* The add-to-cart control is an **icon-only button with no accessible name, aria-label or alt**. Role/text locators can't find it,
  so we had to target it by position (left of "Buy with EMI").
* Clicking it as a guest opens "Log in to complete your shopping" (phone OTP) and fetches `pageUri:/login?…sourceContext=buy_now`.
  `/viewcart` as a guest shows "Missing Cart items? Login". **No guest cart.**

### Internal API: "Rome" server-driven UI (`src/flipkart-rome.ts`)
```
POST https://1.rome.api.flipkart.com/api/4/page/fetch
headers: x-user-agent: "<UA> FKUA/website/42/website/Desktop", origin/referer flipkart.com, cookies
body: {"pageUri":"/viewcart" | "/<slug>/p/<itm>?pid=<FSN>", "pageContext":{…}}
```
The whole page (product, cart, login) is returned as widget "slots" (`ATLAS_WIDGET`, …). Also seen: `POST /4/user/state`.
* No `x-user-agent` → **403**. With `x-user-agent` but no cookies → **429** "Rate limit exceeded". With browser cookies → **200**, 835 KB JSON
  (`pageContext.productId`, `listingId`, rating breakdown…).

## 5. Terms of Service (primary text, verified)
* **Amazon.in Conditions of Use** (read via browser): the licence excludes "any collection and use of any product listings, descriptions,
  or prices … or any use of data mining, robots, or similar data gathering and extraction tools."
  robots.txt also disallows `/gp/cart`.
* **Flipkart Terms of Use**: "You shall not use any 'deep-link', 'page-scrape', 'robot', 'spider' or other automatic device … to access,
  acquire, copy or monitor any portion of the Platform". robots.txt disallows `/viewcart`.

Server-side headless scraping or cart automation therefore violates both ToS, and fights two bot-management layers (AWS WAF + Akamai on Amazon, Akamai on Flipkart).

## 6. What this means for ezshop

1. **Catalog data, legitimately**: Amazon Creators API (needs 10 sales / 30 days) and the Flipkart Affiliate API. Both give affiliate revenue as well.
2. **Cart / user-specific data**: only reachable inside the **user's own logged-in browser** (Flipkart has no guest cart; Amazon's cart lives in the session).
   The realistic architecture is a **browser extension / content script** that reads the DOM hooks above *on the user's behalf*, while they browse:
   * Amazon cart: `#sc-active-cart div[data-asin]` dataset (structured, no parsing needed).
   * Amazon PDP: `input#ASIN`, `offerListingID`, price selectors. Flipkart PDP: JSON-LD.
   * Actions such as "add to cart" go best through deep links / the site's own UI, not replayed internal APIs.
3. **Avoid** building on `data.amazon.in` or `rome.api.flipkart.com`. They are undocumented, token- and cookie-bound, versioned by media type,
   rate-limited, and explicitly off-limits under ToS.

### Not verified (open items)
* Creators API rate limits and data-caching rules (not stated on the pages fetched).
* Flipkart's cart-page DOM and cart Rome payload for a **logged-in** user. That needs a real account session
  (`npx playwright codegen --save-storage=out/flipkart-auth.json https://www.flipkart.com` and a manual OTP login).
* Behaviour at volume (CAPTCHA thresholds), mobile web/app APIs, and amazon.com (vs .in).

---

## 7. Firecrawl self-hosted PoC (2026-10-05)

Setup: `ezshop/firecrawl/` (upstream commit `4244638`), prebuilt `ghcr.io/firecrawl/*` images, plus
`docker-compose.override.yaml` and `.env` tuned for an 8 GB machine. Client: `src/firecrawl-poc.ts` (Firecrawl `rawHtml` → cheerio → the §3/§4 selectors).

**No AI model is needed.** `/v2/scrape` and `/v2/crawl` with `markdown | html | rawHtml | links | screenshot` use Playwright plus HTML parsing only.
An LLM (`OPENAI_API_KEY`, an OpenAI-compatible `OPENAI_BASE_URL`, or `OLLAMA_BASE_URL` + `MODEL_NAME`) is only reached by the
`json`/extract, query/summary, smart-scrape, branding and deep-research code paths (verified in `apps/api/src`).

### Results (3 rounds × 4 targets, desktop UA pinned)
| Target | Result | Latency | Fields extracted |
|---|---|---|---|
| Amazon PDP `/dp/B0CHX9MF1L` | 3/3 HTTP 200, no challenge page | 4.6–5.3 s | ASIN, title, price, MRP, availability, rating, reviews, offerListingID |
| Amazon search | 3/3 | 2.9–4.4 s | 18 results: ASIN, title, price, sponsored flag |
| Flipkart PDP | 3/3 | 2.9–3.2 s | JSON-LD: SKU, name, price, availability, rating, ratingCount |
| Flipkart search | 3/3 | 3.3–3.6 s | 24 `data-id` product IDs |

### Gotchas found
* **Random user agent per request.** playwright-service uses `new UserAgent()` (the `user-agents` npm package), so Amazon sometimes serves its
  **mobile site** (`<html class="a-mobile a-ios">`, no `#productTitle`). Fix: pass `"headers": {"User-Agent": "<desktop Chrome>"}` on every scrape.
* **Amazon markup varies between responses**: `.priceToPay .a-offscreen` was a blank placeholder in Firecrawl's copy, so the parser falls back to
  `.priceToPay [aria-hidden=true]`. Search titles: use `a h2 span` (`h2` text includes the brand and "Sponsored").
* **`actions` (click/type/wait) are unsupported self-hosted**: `SCRAPE_ACTIONS_NOT_SUPPORTED … require Fire Engine`. Every scrape is a fresh, stateless
  browser context, so **Firecrawl cannot add to cart, log in, or read a user's cart.** It is a read-only catalog scraper.

### Memory (measured with `docker stats`)
| Container | Default limit | PoC limit | Observed peak |
|---|---|---|---|
| api (6 Node processes × ~390 MB RSS) | 8 GB | 2.25 GB | 1.9 GB at boot, 1.8 GB while scraping |
| playwright-service | 4 GB | 1 GB | 443 MB |
| rabbitmq (`3-alpine`, no management UI) | none | 320 MB | 195 MB |
| nuq-postgres | none | 256 MB | 100 MB |
| redis | none | 96 MB | 17 MB |
| **Total** | | **≈3.9 GB** | **≈2.55 GB** |

Notes: `NUQ_WORKER_COUNT` defaults to **5** extra Node processes (not exposed in the compose file); the PoC sets 1. The first attempts with
a 192 MB Node heap and a 1.5 GB container cap died with V8 out-of-memory (exit 134) and the cgroup OOM kill (exit 137). The `extract-worker` (~400 MB) is
dead weight without an LLM, but the harness always starts it.

Run / stop: `cd firecrawl && docker compose up -d api` / `docker compose down`.
