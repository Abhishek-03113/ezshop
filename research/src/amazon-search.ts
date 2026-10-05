// Amazon.in: search results — what does the DOM expose, and are results loaded via XHR?
import { launch, OUT } from "./browser.js";
import { recordNetwork } from "./recorder.js";

const { browser, ctx } = await launch();
const page = await ctx.newPage();
const net = recordNetwork(page, `${OUT}amazon-net-search.jsonl`);
net.setStep("home");
await page.goto("https://www.amazon.in/", { waitUntil: "domcontentloaded" });
await page.waitForSelector("#twotabsearchtextbox", { timeout: 30000 });
net.setStep("search");
await page.fill("#twotabsearchtextbox", "iphone 15");
await page.keyboard.press("Enter");
await page.waitForSelector('[data-component-type="s-search-result"]', { timeout: 30000 });
await page.waitForTimeout(3000);

const results = await page.$$eval('[data-component-type="s-search-result"]', (els) =>
  els.slice(0, 8).map((el) => ({
    asin: el.getAttribute("data-asin"),
    index: el.getAttribute("data-index"),
    uuid: el.getAttribute("data-uuid"),
    title: el.querySelector("h2")?.textContent?.trim(),
    href: el.querySelector("a.a-link-normal[href*='/dp/'], h2 a, a[href*='/dp/']")?.getAttribute("href")?.slice(0, 120),
    price: el.querySelector(".a-price:not(.a-text-price) .a-offscreen")?.textContent,
    mrp: el.querySelector(".a-price.a-text-price .a-offscreen")?.textContent,
    rating: el.querySelector("[aria-label*='out of 5 stars'], i[class*='a-icon-star'] span")?.textContent?.trim() ??
            el.querySelector("[aria-label*='out of 5']")?.getAttribute("aria-label"),
    sponsored: !!el.querySelector(".puis-sponsored-label-text, [aria-label*='Sponsored']"),
    img: el.querySelector("img.s-image")?.getAttribute("src"),
  })));
console.log("RESULT COUNT", await page.locator('[data-component-type="s-search-result"]').count());
console.log(JSON.stringify(results, null, 1));
console.log("URL", page.url());
console.log("nav-cart-count:", await page.textContent("#nav-cart-count").catch(() => null));
await ctx.storageState({ path: `${OUT}amazon-state.json` });
await ctx.tracing.stop({ path: `${OUT}amazon-search-trace.zip` });
await browser.close();
