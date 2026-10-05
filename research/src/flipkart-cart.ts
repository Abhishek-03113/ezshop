// Flipkart: locate icon-only Add-to-cart, click it, capture network, then read /viewcart.
import { writeFileSync } from "node:fs";
import { launch, OUT } from "./browser.js";
import { recordNetwork } from "./recorder.js";

const url = process.argv[2] ?? "https://www.flipkart.com/apple-iphone-16-black-128-gb/p/itmb07d67f995271?pid=MOBH4DQFG8NKFRDY";
const { browser, ctx } = await launch();
const page = await ctx.newPage();
const net = recordNetwork(page, `${OUT}flipkart-net-cart.jsonl`);
net.setStep("product");
await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);

// Accessibility view of the buy bar: the cart button sits immediately before "Buy with EMI".
const buyBar = await page.evaluate(() => {
  const emi = [...document.querySelectorAll("div")].find((d) => d.children.length === 0 && /Buy with EMI/.test(d.textContent ?? ""));
  let bar: Element | null | undefined = emi;
  for (let i = 0; i < 6 && bar && !(bar.textContent ?? "").includes("Buy now"); i++) bar = bar.parentElement;
  const nodes = bar ? [...bar.querySelectorAll("*")] : [];
  return nodes.filter((n) => n.getAttribute("role") || n.getAttribute("aria-label") || n.getAttribute("tabindex") || n.tagName === "svg" || n.tagName === "IMG" || n.getAttribute("data-testid"))
    .map((n) => ({ tag: n.tagName, role: n.getAttribute("role"), aria: n.getAttribute("aria-label"), tabindex: n.getAttribute("tabindex"), testid: n.getAttribute("data-testid"), alt: n.getAttribute("alt"), src: n.getAttribute("src")?.slice(0, 90), text: (n.textContent ?? "").trim().slice(0, 40) }));
});
console.log("BUY BAR", JSON.stringify(buyBar, null, 1));
const snap = await page.locator("body").ariaSnapshot();
console.log("ARIA (cart-ish lines):\n" + snap.split("\n").filter((l) => /cart|buy|emi/i.test(l)).join("\n"));

net.setStep("add-to-cart");
// Icon-only button with no accessible name: find it geometrically, left of "Buy with EMI".
const emiBox = await page.getByText("Buy with EMI", { exact: true }).first().boundingBox();
if (!emiBox) throw new Error("buy bar not found");
const x = emiBox.x - 40, y = emiBox.y + emiBox.height / 2;
const hit = await page.evaluate(({ x, y }) => {
  let el = document.elementFromPoint(x, y) as HTMLElement | null;
  const chain: string[] = [];
  for (let i = 0; el && i < 5; i++, el = el.parentElement) chain.push(`${el.tagName} role=${el.getAttribute("role")} tabindex=${el.getAttribute("tabindex")} aria=${el.getAttribute("aria-label")} cursor=${getComputedStyle(el).cursor} html=${el.outerHTML.slice(0, 160)}`);
  return chain;
}, { x, y });
console.log("ELEMENT AT CART ICON:\n" + hit.join("\n"));
await page.mouse.click(x, y);
const clicked = `mouse(${x},${y})`;
console.log("CLICKED via", clicked || "none");
await page.waitForTimeout(6000);
console.log("URL after add:", page.url());
await page.screenshot({ path: `${OUT}flipkart-after-add.png` });

net.setStep("cart");
await page.goto("https://www.flipkart.com/viewcart", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(5000);
await page.screenshot({ path: `${OUT}flipkart-cart.png` });
const cartText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
console.log("CART TEXT:", cartText.slice(0, 1200));
console.log("CART product links:", await page.$$eval("a[href*='/p/']", (as) => [...new Set(as.map((a) => a.getAttribute("href")!.slice(0, 120)))].slice(0, 5)));
writeFileSync(`${OUT}flipkart-cart.txt`, cartText);
await ctx.storageState({ path: `${OUT}flipkart-state.json` });
await ctx.tracing.stop({ path: `${OUT}flipkart-cart-trace.zip` });
await browser.close();
