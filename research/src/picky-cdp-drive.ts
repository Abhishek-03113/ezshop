// Drives an already-running headed Chromium (debug mode, --remote-debugging-port=9222) with the
// real Picky extension build. Triggers the extension with a real OS keystroke (wtype → Alt+Shift+E,
// the manifest's _execute_action shortcut), so activeTab is granted exactly as on a toolbar click.
// That opens the popup, which captures at once and, with "Open sheet automatically" on, opens the sheet tab.
import { chromium, type Page } from "playwright";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const PRODUCT_URL = process.argv[2] ?? "https://www.amazon.in/dp/B0FQG1YHYR";
const SHOTS = process.argv[3] ?? "/tmp";
const EXT_DIR = process.env.PICKY_EXT_DIR ?? "/home/xcal/workspace/ezshop/apps/extension/dist";
const IMPORT_URL = process.argv[4]; // optional: a second product to import through the web UI (Firecrawl path)
const site = new URL(PRODUCT_URL).hostname.replace(/^www\./, "");
const step = (name: string, detail: unknown = "") => console.log(JSON.stringify({ step: name, detail }));
const screen = (name: string) => execFileSync("grim", [`${SHOTS}/${name}.png`]); // whole-screen capture, like a human sees it

const browser = await chromium.connectOverCDP("http://localhost:9222");
const ctx = browser.contexts()[0]!;
const worker = await runningExtensionWorker();
step("attached", { pages: ctx.pages().map((p) => p.url()), worker: worker.url() });

// Debug mode: the service worker's structured JSON logs, streamed over CDP.
const workerLogs: string[] = [];
worker.on("console", (message) => workerLogs.push(message.text()));

const productTab = await ctx.newPage(); // the product tab, whichever site it is on
await productTab.goto(PRODUCT_URL, { waitUntil: "load", timeout: 60000 });
await productTab.waitForTimeout(3000); // let the page hydrate, as a person would before clicking
await productTab.bringToFront();
step(`${site}.ready`, { title: (await productTab.title()).slice(0, 60) });

// Before the gesture the extension must NOT be able to read the page (activeTab only).
// Resolved while the product tab is still active; later the Picky tab takes focus.
const productTabId = await tabIdOf(productTab);
const before = await worker.evaluate(`chrome.scripting.executeScript({ target: { tabId: ${productTabId} }, func: () => 1 }).then(() => "allowed", (e) => "blocked: " + e.message)`);
step("access.before-gesture", before);

// Skip the first-run screen and keep auto-open on, so the keystroke goes straight to the sheet tab.
// Key and shape: apps/extension/src/settings.ts.
await worker.evaluate(`chrome.storage.local.set({ "picky.settings": { autoOpenSheet: true, firstRunDismissed: true } })`);
step("settings.seeded", "first run dismissed, auto-open on");

// Hyprland 0.56 takes Lua dispatchers.
execFileSync("hyprctl", ["dispatch", 'hl.dsp.focus({ window = "class:chromium" })']);
await productTab.waitForTimeout(500);
screen(`01-${site}-before`);
const newPage = ctx.waitForEvent("page", { timeout: 30000 });
execFileSync("wtype", ["-M", "alt", "-M", "shift", "e", "-m", "shift", "-m", "alt"]);
step("keystroke.sent", "Alt+Shift+E via wtype");
await productTab.waitForTimeout(250);
screen("01b-popup-capturing"); // the action popup, visible until the sheet tab takes focus

const picky: Page = await newPage;
await picky.waitForSelector(".spec-group", { timeout: 30000 });
step("picky.opened", picky.url());
const badge = await worker.evaluate(`chrome.action.getBadgeText({ tabId: ${productTabId} })`);
step("badge.on-product-tab", badge);
await picky.waitForTimeout(800);
screen("02-picky-detail");

step("ui.summary", {
  title: (await picky.getByRole("heading", { level: 1 }).innerText()).slice(0, 60),
  price: await picky.locator(".price").first().innerText(),
  availability: await picky.locator(".availability").innerText().catch(() => null),
  groups: await picky.locator(".spec-group h3").allInnerTexts(),
  highlights: await picky.locator(".highlights li").count(),
});

await picky.getByLabel("Find a spec").fill("battery");
step("ui.filter.battery", await picky.locator(".spec-group dt").allInnerTexts());
await picky.waitForTimeout(400);
screen("03-filter-battery");
await picky.getByLabel("Find a spec").fill("zzz-nothing");
step("ui.filter.none", await picky.locator(".spec-sheet .empty-state strong").innerText());
await picky.getByRole("button", { name: "Clear search" }).click();

const thumbs = picky.locator(".gallery-thumbs button");
await thumbs.nth(2).click();
step("ui.gallery", { pressed: await thumbs.nth(2).getAttribute("aria-pressed"), main: await picky.locator(".gallery-main img").getAttribute("src") });
const overflow = await picky.evaluate(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
step("ui.horizontal-overflow-px", overflow);
const brokenImages = await picky.evaluate(`[...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src)`);
step("ui.broken-images", brokenImages);

await picky.getByRole("link", { name: "Library" }).click();
await picky.waitForSelector(".product-card");
step("ui.list", await picky.locator(".product-card-title").allInnerTexts());
await picky.getByRole("button", { name: "Flipkart", exact: true }).click();
step("ui.list.filter-flipkart", await picky.locator(".product-card-title").count());
await picky.getByRole("button", { name: "All", exact: true }).click();
if (IMPORT_URL) {
  await picky.getByLabel("Add a product by link").fill(IMPORT_URL);
  await picky.getByRole("button", { name: "Add", exact: true }).click();
  await picky.waitForURL(/\/products\//, { timeout: 120000 });
  await picky.waitForSelector(".spec-group");
  step("ui.import.firecrawl", { url: picky.url(), title: (await picky.getByRole("heading", { level: 1 }).innerText()).slice(0, 60), groups: await picky.locator(".spec-group h3").allInnerTexts() });
  await picky.waitForTimeout(800);
  screen("05-imported-detail");
  await picky.getByRole("link", { name: "Library" }).click();
  await picky.waitForSelector(".product-card");
}
await picky.getByLabel("Add a product by link").fill("https://example.com/not-a-shop");
await picky.getByRole("button", { name: "Add", exact: true }).click();
step("ui.import.unsupported", await picky.locator(".form-error").innerText());
await picky.waitForTimeout(400);
screen("04-list-import-error");

step("worker.logs", workerLogs);
await browser.close(); // disconnects only; the user's Chromium keeps running

async function tabIdOf(page: Page): Promise<number> {
  const url = page.url();
  return worker.evaluate(`chrome.tabs.query({}).then(ts => (ts.find(t => t.url === ${JSON.stringify(url)}) || ts.find(t => t.active)).id)`) as Promise<number>;
}

// MV3 service workers stop after ~30 s idle; start ours through CDP so the run doesn't depend on timing.
async function runningExtensionWorker() {
  const isOurs = (w: { url(): string }) => w.url().endsWith("/background.js");
  const running = ctx.serviceWorkers().find(isOurs);
  if (running) return running;
  const page = ctx.pages()[0] ?? (await ctx.newPage());
  const session = await ctx.newCDPSession(page);
  await session.send("ServiceWorker.enable");
  const started = ctx.waitForEvent("serviceworker", { predicate: isOurs, timeout: 15000 });
  await session.send("ServiceWorker.startWorker", { scopeURL: `chrome-extension://${unpackedExtensionId(EXT_DIR)}/` });
  return started;
}

// Chromium derives an unpacked extension's id from its absolute path: sha256, first 16 bytes, hex digits mapped 0-f → a-p.
function unpackedExtensionId(path: string): string {
  const hex = createHash("sha256").update(path).digest("hex").slice(0, 32);
  return [...hex].map((digit) => String.fromCharCode(97 + Number.parseInt(digit, 16))).join("");
}
