// Validate Amazon's internal data.amazon.in API: token origin, in-page calls, out-of-browser replay.
import { launch, OUT } from "./browser.js";
import { recordNetwork } from "./recorder.js";

const ASIN = process.argv[2] ?? "B0CHX9MF1L";
const MKT = "A21TJRUUN4KGV"; // amazon.in marketplace id (observed in captured traffic)
const API = `https://data.amazon.in/api/marketplaces/${MKT}`;
const { browser, ctx } = await launch();
const page = await ctx.newPage();
let captured: Record<string, string> | null = null;
page.on("request", async (r) => {
  if (r.url().startsWith(API) && !captured) captured = await r.allHeaders();
});
recordNetwork(page, `${OUT}amazon-net-dataapi.jsonl`);
await page.goto(`https://www.amazon.in/dp/${ASIN}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#productTitle");
await page.waitForTimeout(2500);

// 1) Where are the tokens in the page?
const html = await page.content();
const origin = await page.evaluate(() => {
  const hits: string[] = [];
  for (const s of document.querySelectorAll("script")) {
    const t = s.textContent ?? "";
    for (const k of ["csrfToken", "x-api-csrf-token", "slateToken", "encryptedSlateToken", "anti-csrftoken-a2z"]) {
      const i = t.indexOf(k);
      if (i >= 0) hits.push(`${s.type || "script"}${s.getAttribute("data-a-state") ?? ""} :: ${t.slice(Math.max(0, i - 60), i + 60).replace(/\s+/g, " ")}`);
    }
  }
  const metas = [...document.querySelectorAll("meta[name*='csrf'], meta[name*='encrypted']")].map((m) => `${m.getAttribute("name")}=${m.getAttribute("content")?.slice(0, 20)}…`);
  return { hits: hits.slice(0, 12), metas };
});
console.log("TOKEN ORIGIN", JSON.stringify(origin, null, 1));

// Trigger the cart add so the page itself issues a data.amazon.in call we can copy headers from.
await page.click("#add-to-cart-button", { timeout: 10000 });
await page.waitForTimeout(5000);
if (!captured) throw new Error("no data.amazon.in request captured");
const h = captured as Record<string, string>;
const csrf = h["x-api-csrf-token"]!, slate = h["x-amzn-encrypted-slate-token"]!;
const ci = html.indexOf(csrf);
console.log("CSRF CONTEXT:", html.slice(Math.max(0, ci - 200), ci).replace(/\s+/g, " "));
console.log("csrf token present in HTML:", html.includes(csrf), "| slate present in HTML:", html.includes(slate));

// 2) In-page fetch (same origin/session)
const inPage = await page.evaluate(async ({ API, csrf, slate, ASIN }) => {
  const call = async (path: string, accept: string, withTokens = true) => {
    try {
      const r = await fetch(API + path, {
        credentials: "include",
        headers: { accept, ...(withTokens ? { "x-api-csrf-token": csrf, "x-amzn-encrypted-slate-token": slate } : {}) },
      });
      return { path, withTokens, status: r.status, body: (await r.text()).slice(0, 900) };
    } catch (e) { return { path, withTokens, error: String(e) }; }
  };
  return [
    await call("/cart/summary?cartTypes=RETAIL", 'application/vnd.com.amazon.api+json; type="cart.summary/v1"'),
    await call("/cart/summary?cartTypes=RETAIL", 'application/vnd.com.amazon.api+json; type="cart.summary/v1"', false),
    await call(`/products/${ASIN}`, 'application/vnd.com.amazon.api+json; type="collection(product/v2)/v1"; expand="productImages(product.product-images/v2)"'),
  ];
}, { API, csrf, slate, ASIN });
console.log("IN-PAGE", JSON.stringify(inPage, null, 1));

// 3) Out-of-browser replay from Node with the same cookies + headers
const cookies = (await ctx.cookies("https://data.amazon.in")).map((c) => `${c.name}=${c.value}`).join("; ");
for (const withCookies of [true, false]) {
  const r = await fetch(`${API}/cart/summary?cartTypes=RETAIL`, {
    headers: {
      accept: 'application/vnd.com.amazon.api+json; type="cart.summary/v1"',
      "x-api-csrf-token": csrf, "x-amzn-encrypted-slate-token": slate,
      origin: "https://www.amazon.in", referer: "https://www.amazon.in/", "accept-language": "en-IN",
      "user-agent": h["user-agent"]!, ...(withCookies ? { cookie: cookies } : {}),
    },
  });
  console.log(`NODE REPLAY cookies=${withCookies}:`, r.status, (await r.text()).slice(0, 400));
}
await ctx.storageState({ path: `${OUT}amazon-state.json` });
await browser.close();
