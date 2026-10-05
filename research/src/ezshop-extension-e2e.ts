// E2E check for the ezshop extension: load the unpacked build in Chromium, open a live Amazon.in
// product page, run the same two executeScript steps as ChromeBrowserPort, post to the local API,
// then screenshot the resulting ezshop page.
import { chromium } from "playwright";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EXT = process.env.EZSHOP_EXT_DIR ?? "/home/xcal/workspace/ezshop/apps/extension/dist";
const PRODUCT = process.argv[2] ?? "https://www.amazon.in/dp/B0FQG1YHYR";
const SHOTS = process.argv[3] ?? "/tmp";

const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "ezshop-e2e-")), {
  headless: true,
  executablePath: "/usr/bin/chromium",
  args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--disable-blink-features=AutomationControlled"],
  locale: "en-IN",
  timezoneId: "Asia/Kolkata",
  viewport: { width: 1366, height: 900 },
});
const worker = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent("serviceworker"));
const page = await ctx.newPage();
await page.goto(PRODUCT, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForSelector("#productTitle", { timeout: 30000 });

// Passed as a string: tsx injects __name() helpers into serialized functions, which the worker lacks.
const outcome: any = await worker.evaluate(`(async () => {
  const [tab] = await chrome.tabs.query({ url: "https://www.amazon.in/*" }); // needs the e2e manifest's amazon.in host permission
  const tabId = tab.id;
  await chrome.scripting.executeScript({ target: { tabId }, files: ["page-capture.js"] });
  const [injection] = await chrome.scripting.executeScript({ target: { tabId }, func: () => globalThis.ezshopCapturePage() });
  const capture = injection.result;
  if (!capture.ok) return { capture };
  const response = await fetch("http://localhost:8787/api/snapshots", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(capture.snapshot) });
  const body = await response.json();
  const s = capture.snapshot;
  return { status: response.status, id: body.product && body.product.id, error: body.message, title: s.title, price: s.price, rating: s.rating,
    groups: s.specGroups.map((g) => g.title + ":" + g.specs.length), highlights: s.highlights.length, images: s.images.length };
})()`);
console.log(JSON.stringify(outcome, null, 1));
if (outcome.id) {
  const app = await ctx.newPage();
  await app.goto(`http://localhost:5173/products/${outcome.id}`);
  await app.waitForSelector(".spec-group");
  await app.screenshot({ path: `${SHOTS}/ezshop-detail.png`, fullPage: true });
  await app.goto("http://localhost:5173/");
  await app.waitForSelector(".product-card");
  await app.screenshot({ path: `${SHOTS}/ezshop-list.png` });
}
await ctx.close();
