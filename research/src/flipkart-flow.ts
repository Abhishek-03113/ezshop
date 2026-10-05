// Flipkart: home -> autocomplete -> search -> product -> add to cart (guest) -> cart, with network + state capture.
import { writeFileSync } from "node:fs";
import { launch, OUT } from "./browser.js";
import { recordNetwork } from "./recorder.js";

const { browser, ctx } = await launch();
const page = await ctx.newPage();
const net = recordNetwork(page, `${OUT}flipkart-net-flow.jsonl`);
const dump: Record<string, unknown> = {};

net.setStep("home");
await page.goto("https://www.flipkart.com/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
dump.homeTitle = await page.title();
await page.keyboard.press("Escape"); // login modal, if shown
const box = page.locator("input[name='q']").first();
net.setStep("autocomplete");
await box.click();
await page.keyboard.type("iphone 15", { delay: 150 });
await page.waitForTimeout(2500);
net.setStep("search");
await page.keyboard.press("Enter");
await page.waitForLoadState("domcontentloaded");
await page.waitForTimeout(4000);
dump.searchUrl = page.url();
dump.searchDom = await page.evaluate(() => {
  const cards = [...document.querySelectorAll("[data-id]")];
  return {
    cardsWithDataId: cards.length,
    sample: cards.slice(0, 5).map((c) => ({
      dataId: c.getAttribute("data-id"),
      tag: c.tagName, cls: c.className,
      link: c.querySelector("a[href*='/p/']")?.getAttribute("href")?.slice(0, 140),
      text: (c as HTMLElement).innerText.replace(/\s+/g, " ").slice(0, 200),
    })),
    hasInitialState: typeof (window as any).__INITIAL_STATE__,
    initialStateTopKeys: Object.keys((window as any).__INITIAL_STATE__ ?? {}).slice(0, 40),
    jsonLd: [...document.querySelectorAll("script[type='application/ld+json']")].map((s) => (s.textContent ?? "").slice(0, 200)),
  };
});
console.log("SEARCH", JSON.stringify(dump.searchDom, null, 1));
const links = [...new Set(await page.$$eval("a[href*='/p/itm']", (as) => as.map((a) => a.getAttribute("href")!)))];
net.setStep("product");
for (const href of links.slice(0, 8)) {
  await page.goto(new URL(href, "https://www.flipkart.com").toString(), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const inStock = await page.evaluate(() => /InStock/.test([...document.querySelectorAll("script[type='application/ld+json']")].map((s) => s.textContent).join("")));
  console.log("TRY", href.slice(0, 80), "inStock:", inStock);
  if (inStock) break;
}
dump.productUrl = page.url();
dump.product = await page.evaluate(() => {
  const ld = [...document.querySelectorAll("script[type='application/ld+json']")].map((s) => { try { return JSON.parse(s.textContent ?? ""); } catch { return "unparseable"; } });
  const buttons = [...document.querySelectorAll("button, li button, div[role=button]")].map((b) => (b as HTMLElement).innerText.trim()).filter((t) => /cart|buy/i.test(t));
  return {
    title: document.querySelector("h1")?.textContent?.trim(),
    h1Class: document.querySelector("h1")?.className,
    jsonLd: ld,
    buttons,
    metaOg: [...document.querySelectorAll("meta[property^='og:'], meta[name='twitter:data1']")].map((m) => `${m.getAttribute("property") ?? m.getAttribute("name")}=${m.getAttribute("content")?.slice(0, 80)}`),
    pidInUrl: new URL(location.href).searchParams.get("pid"),
  };
});
console.log("PRODUCT", JSON.stringify({ ...(dump.product as object), jsonLd: "(omitted)" }, null, 1));

net.setStep("add-to-cart");
const atc = page.getByRole("button", { name: /add to cart/i }).first();
if (await atc.count()) { await atc.click(); } else { await page.getByText(/add to cart/i).first().click(); }
await page.waitForTimeout(6000);
dump.afterAddUrl = page.url();

net.setStep("cart");
if (!/viewcart/.test(page.url())) await page.goto("https://www.flipkart.com/viewcart", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
dump.cartText = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 1500);
await page.screenshot({ path: `${OUT}flipkart-cart.png` });
writeFileSync(`${OUT}flipkart-flow.json`, JSON.stringify(dump, null, 2));
console.log(JSON.stringify({ ...dump, product: undefined }, null, 1));
await ctx.storageState({ path: `${OUT}flipkart-state.json` });
await ctx.tracing.stop({ path: `${OUT}flipkart-flow-trace.zip` });
await browser.close();
