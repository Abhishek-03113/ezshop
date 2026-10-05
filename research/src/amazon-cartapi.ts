// Read cart contents through data.amazon.in after adding an item; compare with cart page DOM.
import { launch, OUT } from "./browser.js";
import { recordNetwork } from "./recorder.js";
import { readFileSync } from "node:fs";

const ASIN = process.argv[2] ?? "B0CHX9MF1L";
const { browser, ctx } = await launch();
const page = await ctx.newPage();
recordNetwork(page, `${OUT}amazon-net-cartapi.jsonl`);
await page.goto(`https://www.amazon.in/dp/${ASIN}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#add-to-cart-button");
const tokens = await page.evaluate(() => ({
  endpoint: document.querySelector("[data-cart-aapi-endpoint]")?.getAttribute("data-cart-aapi-endpoint"),
  csrf: document.querySelector("[data-csrf-add-cart]")?.getAttribute("data-csrf-add-cart"),
  slate: document.querySelector("meta[name='encrypted-slate-token']")?.getAttribute("content"),
}));
console.log("TOKENS FROM DOM:", { ...tokens, csrf: tokens.csrf?.slice(0, 12), slate: tokens.slate?.slice(0, 12) });
await page.click("#add-to-cart-button");
await page.waitForTimeout(5000);
const results = await page.evaluate(async ({ endpoint, csrf, slate }) => {
  const H = (t: string) => ({ accept: `application/vnd.com.amazon.api+json; type="${t}"`, "x-api-csrf-token": csrf!, "x-amzn-encrypted-slate-token": slate! });
  const out: unknown[] = [];
  for (const [path, type] of [
    ["/cart/summary?cartTypes=RETAIL", "cart.summary/v1"],
    ["/cart/carts/retail", "cart/v1"],
    ["/cart/carts/retail/items", "collection(cart.item/v1)/v1"],
  ] as const) {
    try {
      const r = await fetch(endpoint + path, { credentials: "include", headers: H(type) });
      out.push({ path, status: r.status, body: (await r.text()).slice(0, 700) });
    } catch (e) { out.push({ path, error: String(e) }); }
  }
  return out;
}, tokens);
console.log(JSON.stringify(results, null, 1));
const add = readFileSync(`${OUT}amazon-net-cartapi.jsonl`, "utf8").trim().split("\n").map((l) => JSON.parse(l)).find((r) => r.method === "POST" && /cart\/carts\/retail\/items/.test(r.url));
console.log("ADD RESPONSE:", add?.status, add?.bodySample?.slice(0, 900));
await page.goto("https://www.amazon.in/gp/cart/view.html");
console.log("CART PAGE ASINs:", await page.$$eval("#sc-active-cart div[data-asin]", (els) => els.map((e) => `${(e as HTMLElement).dataset.asin} x${(e as HTMLElement).dataset.quantity}`)));
await browser.close();
