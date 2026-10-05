// (a) Associates "Add to Cart form" URL contract; (b) Conditions of Use clause on robots/data mining.
import { launch, OUT } from "./browser.js";

const { browser, ctx } = await launch();
const page = await ctx.newPage();
await page.goto("https://www.amazon.in/gp/aws/cart/add.html?ASIN.1=B0CHX9MF1L&Quantity.1=2&ASIN.2=B0DGHZWBYB&Quantity.2=1", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
console.log("ADD.HTML url:", page.url(), "| title:", await page.title());
console.log("ADD.HTML text:", (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 600));
await page.screenshot({ path: `${OUT}amazon-addhtml.png` });
const cont = page.locator("input[name='add'], input[value='Continue'], #a-autoid-0 input, input[type='submit']").first();
if (await cont.count()) { await cont.click(); await page.waitForTimeout(4000); }
await page.goto("https://www.amazon.in/gp/cart/view.html");
console.log("CART AFTER add.html:", await page.$$eval("#sc-active-cart div[data-asin]", (els) => els.map((e) => `${(e as HTMLElement).dataset.asin} x${(e as HTMLElement).dataset.quantity}`)));

await page.goto("https://www.amazon.in/gp/help/customer/display.html?nodeId=200545940", { waitUntil: "domcontentloaded" });
const tos = await page.locator("body").innerText();
for (const kw of ["robots", "data mining", "data gathering", "agent", "automated"]) {
  let i = tos.toLowerCase().indexOf(kw);
  if (i >= 0) console.log(`\nTOS[${kw}]:`, tos.slice(Math.max(0, i - 300), i + 300).replace(/\s+/g, " "));
}
await browser.close();
