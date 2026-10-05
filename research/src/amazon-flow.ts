// Amazon.in: autocomplete -> pagination -> product page -> add to cart (guest) -> cart page.
import { writeFileSync } from "node:fs";
import { launch, OUT } from "./browser.js";
import { recordNetwork } from "./recorder.js";

const ASIN = process.argv[2] ?? "B0DGJ7TGDR";
const { browser, ctx } = await launch();
const page = await ctx.newPage();
const net = recordNetwork(page, `${OUT}amazon-net-flow.jsonl`);
const dump: Record<string, unknown> = {};

net.setStep("home");
await page.goto("https://www.amazon.in/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#twotabsearchtextbox");

net.setStep("autocomplete");
await page.click("#twotabsearchtextbox");
await page.keyboard.type("airpods", { delay: 150 });
await page.waitForTimeout(2500);

net.setStep("search-page2");
await page.keyboard.press("Enter");
await page.waitForSelector('[data-component-type="s-search-result"]');
dump.titleProbe = await page.$$eval('[data-component-type="s-search-result"]', (els) =>
  els.slice(0, 4).map((el) => ({
    asin: el.dataset.asin,
    h2: el.querySelector("h2")?.textContent?.trim(),
    h2aria: el.querySelector("h2")?.getAttribute("aria-label"),
    titleRecipe: el.querySelector("[data-cy='title-recipe']")?.textContent?.trim(),
  })));
const next = page.locator("a.s-pagination-next").first();
if (await next.count()) { await next.click(); await page.waitForTimeout(4000); }
dump.page2Url = page.url();

net.setStep("product");
await page.goto(`https://www.amazon.in/dp/${ASIN}`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("#productTitle", { timeout: 30000 });
await page.waitForTimeout(3000);
dump.product = await page.evaluate(() => {
  const t = (s: string) => document.querySelector(s)?.textContent?.replace(/\s+/g, " ").trim() ?? null;
  const v = (s: string) => (document.querySelector(s) as HTMLInputElement | null)?.value ?? null;
  return {
    title: t("#productTitle"),
    price: t("#corePrice_feature_div .a-price .a-offscreen") ?? t(".priceToPay .a-offscreen") ?? t("#corePriceDisplay_desktop_feature_div .a-price .a-offscreen"),
    priceToPayWhole: t(".priceToPay .a-price-whole"),
    mrp: t(".basisPrice .a-offscreen"),
    availability: t("#availability"),
    rating: t("#acrPopover .a-icon-alt") ?? document.querySelector("#acrPopover")?.getAttribute("title"),
    reviewCount: t("#acrCustomerReviewText"),
    brand: t("#bylineInfo"),
    merchant: t("#merchantInfoFeature_feature_div") ?? t("#sellerProfileTriggerId"),
    bullets: [...document.querySelectorAll("#feature-bullets li")].slice(0, 3).map((l) => l.textContent?.trim()),
    images: [...document.querySelectorAll("#altImages img")].length,
    hiddenInputs: {
      ASIN: v("input#ASIN") ?? v("input[name='ASIN']"),
      offerListingID: v("input[name='offerListingID']")?.slice(0, 40),
      merchantID: v("input[name='merchantID']"),
      sessionID: v("input[name='session-id']"),
      csrfLike: [...document.querySelectorAll("#addToCart input[type=hidden]")].map((i) => (i as HTMLInputElement).name),
    },
    addToCartForm: (() => { const f = document.querySelector("#addToCart") as HTMLFormElement | null; return f ? { action: f.getAttribute("action"), method: f.method } : null; })(),
    addToCartBtn: !!document.querySelector("#add-to-cart-button"),
    buyNowBtn: !!document.querySelector("#buy-now-button"),
    jsonLd: document.querySelectorAll("script[type='application/ld+json']").length,
    aStateKeys: [...document.querySelectorAll("script[type='a-state']")].map((s) => s.getAttribute("data-a-state")).slice(0, 25),
    twisterJsonScripts: [...document.querySelectorAll("script")].filter((s) => /dimensionValuesDisplayData|colorToAsin|asinVariationValues/.test(s.textContent ?? "")).length,
  };
});

console.log("PRODUCT", JSON.stringify(dump.product, null, 1));
net.setStep("add-to-cart");
await page.click("#add-to-cart-button", { timeout: 8000 });
await page.waitForTimeout(6000);
dump.afterAddUrl = page.url();
dump.navCartCount = await page.textContent("#nav-cart-count").catch(() => null);
await page.screenshot({ path: `${OUT}amazon-after-add.png` });

net.setStep("cart");
await page.goto("https://www.amazon.in/gp/cart/view.html", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
dump.cart = await page.evaluate(() => {
  const items = [...document.querySelectorAll("[data-name='Active Items'] div[data-asin], #sc-active-cart div[data-asin]")];
  return {
    count: items.length,
    items: items.map((el) => {
      const d = (el as HTMLElement).dataset;
      return {
        dataset: { ...d },
        title: el.querySelector(".sc-product-title, .a-truncate-full")?.textContent?.trim(),
        price: el.querySelector(".sc-product-price, .apex-price-to-pay-value .a-offscreen")?.textContent?.trim(),
        qty: (el.querySelector("[name='quantity'], select[name='quantity']") as HTMLSelectElement | null)?.value
          ?? el.querySelector("[data-a-selector='value'], .sc-quantity-textfield")?.textContent?.trim(),
      };
    }),
    subtotal: document.querySelector("#sc-subtotal-amount-activecart, #sc-subtotal-amount-buybox")?.textContent?.trim(),
    subtotalLabel: document.querySelector("#sc-subtotal-label-activecart")?.textContent?.trim(),
  };
});
await page.screenshot({ path: `${OUT}amazon-cart.png`, fullPage: false });
writeFileSync(`${OUT}amazon-flow.json`, JSON.stringify(dump, null, 2));
console.log(JSON.stringify(dump, null, 2));
await ctx.storageState({ path: `${OUT}amazon-state.json` });
await ctx.tracing.stop({ path: `${OUT}amazon-flow-trace.zip` });
await browser.close();
