// Inspect what a Flipkart product page actually renders for a headless browser.
import { launch, OUT } from "./browser.js";
const url = process.argv[2] ?? "https://www.flipkart.com/apple-iphone-16-black-128-gb/p/itmb07d67f995271?pid=MOBH4DQFG8NKFRDY";
const { browser, ctx } = await launch();
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(6000);
await page.screenshot({ path: `${OUT}flipkart-pdp.png` });
const txt = (await page.locator("body").innerText()).replace(/\s+/g, " ");
console.log("LEN", txt.length);
for (const kw of ["cart", "Buy", "Notify", "pincode", "Deliver", "Login"]) {
  const i = txt.search(new RegExp(kw, "i")); if (i >= 0) console.log(`[${kw}]`, txt.slice(Math.max(0, i - 80), i + 120));
}
console.log("STATE keys:", await page.evaluate(() => Object.keys(window).filter((k) => /STATE|__|flipkart|FK/i.test(k)).slice(0, 30)));
console.log("clickable w/ cart:", await page.$$eval("*", (els) => els.filter((e) => e.children.length === 0 && /add to cart|buy now|go to cart/i.test(e.textContent ?? "")).map((e) => `${e.tagName}.${e.className}|${e.textContent}|parent=${e.parentElement?.tagName}`).slice(0, 10)));
await browser.close();
