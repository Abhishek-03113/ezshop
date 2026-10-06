// E2E check for the Picky extension: load the unpacked build in headless Chromium, open a live product page,
// then drive the REAL capture path: the popup's "picky-capture" port into the service worker (runCaptureFlow,
// badge, settings), exactly as popup.ts does. Screenshots the popup and the resulting Picky pages.
//
// A scripted run can't press the toolbar button, so it never gets activeTab. Instead this copies
// apps/extension/dist to a temp dir and grants the product's origin as a host permission (PICKY_EXT_DIR overrides).
// Usage: npx tsx src/picky-extension-e2e.ts [product-url] [screenshot-dir]
import { chromium, type BrowserContext, type Page, type Worker } from "playwright";
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DIST = "/home/xcal/workspace/ezshop/apps/extension/dist";
const WEB = process.env.PICKY_WEB_URL ?? "http://localhost:5173";
const PRODUCT = process.argv[2] ?? "https://www.amazon.in/dp/B09XS7JWHH";
const SHOTS = process.argv[3] ?? "/tmp";
const SETTINGS_KEY = "picky.settings"; // apps/extension/src/settings.ts

interface SavedSummary {
  productId: string;
  title: string;
  priceText: string | null;
  specCount: number;
  groupCount: number;
}
type CaptureOutcome = { kind: "saved"; summary: SavedSummary } | { kind: "unsupported" } | { kind: "failed"; message: string };
interface CaptureRun {
  phases: string[];
  outcome: CaptureOutcome;
}

const step = (name: string, detail: unknown = "") => console.log(JSON.stringify({ step: name, detail }));
const fail = (message: string): never => {
  throw new Error(message);
};

const extDir = process.env.PICKY_EXT_DIR ?? extensionCopyWithHostAccess(PRODUCT);
const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), "picky-e2e-")), {
  headless: true,
  executablePath: "/usr/bin/chromium",
  args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`, "--disable-blink-features=AutomationControlled"],
  locale: "en-IN",
  timezoneId: "Asia/Kolkata",
  viewport: { width: 1366, height: 900 },
});
try {
  await run(ctx);
} finally {
  await ctx.close();
}

async function run(ctx: BrowserContext): Promise<void> {
  const worker = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent("serviceworker"));
  const popupUrl = new URL("popup.html", worker.url()).href;
  const productTab = await openProduct(ctx);
  const productTabId = await tabIdOf(worker, productTab.url());

  await writeSettings(worker, { autoOpenSheet: false, firstRunDismissed: false });
  const popup = await openPopup(ctx, popupUrl, "Got it");
  await popup.screenshot({ path: `${SHOTS}/popup-01-welcome.png` });
  step("popup.first-run", "welcome shown, no capture started");

  const saved = await captureViaPort(popup, { id: productTabId, url: productTab.url() });
  step("capture.saved", saved);
  if (saved.outcome.kind !== "saved") fail(`expected a saved outcome, got ${JSON.stringify(saved.outcome)}`);
  const summary = (saved.outcome as { summary: SavedSummary }).summary;
  step("badge.on-product-tab", await worker.evaluate(`chrome.action.getBadgeText({ tabId: ${productTabId} })`));

  await writeSettings(worker, { autoOpenSheet: false, firstRunDismissed: true });
  await popup.bringToFront();
  await popup.reload(); // the popup's own tab is the active one, so it must report "no product"
  await popup.getByText("No product on this page").waitFor({ timeout: 15000 });
  await popup.screenshot({ path: `${SHOTS}/popup-02-unsupported.png` });
  step("popup.unsupported", "shown for a non-product tab");

  await checkSpecSheet(ctx, summary);
  await checkAutoOpen(ctx, worker, popup, { id: productTabId, url: productTab.url() });
}

async function openProduct(ctx: BrowserContext): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(PRODUCT, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000); // let the page hydrate
  step("product.ready", (await page.title()).slice(0, 60));
  return page;
}

async function openPopup(ctx: BrowserContext, popupUrl: string, expectedText: string): Promise<Page> {
  const popup = await ctx.newPage();
  await popup.setViewportSize({ width: 360, height: 560 });
  await popup.goto(popupUrl);
  await popup.getByText(expectedText).waitFor({ timeout: 15000 });
  return popup;
}

// Same request popup-controller sends; the worker answers with progress events and one outcome.
async function captureViaPort(extensionPage: Page, tab: { id: number; url: string }): Promise<CaptureRun> {
  return extensionPage.evaluate(
    `new Promise((resolve) => {
      const phases = [];
      const port = chrome.runtime.connect({ name: "picky-capture" });
      port.onMessage.addListener((event) => {
        if (event.type === "progress") phases.push(event.phase);
        if (event.type === "outcome") { port.disconnect(); resolve({ phases, outcome: event.outcome }); }
      });
      port.postMessage({ type: "capture", tab: ${JSON.stringify(tab)} });
    })`,
  ) as Promise<CaptureRun>;
}

async function checkSpecSheet(ctx: BrowserContext, summary: SavedSummary): Promise<void> {
  const app = await ctx.newPage();
  await app.goto(`${WEB}/products/${summary.productId}`);
  await app.waitForSelector(".spec-group");
  const availability = await app.locator(".availability").innerText().catch(() => "");
  step("web.detail", {
    title: (await app.getByRole("heading", { level: 1 }).innerText()).slice(0, 60),
    price: await app.locator(".price").first().innerText(),
    groups: await app.locator(".spec-group h3").count(),
    availability,
  });
  // Regression: Amazon's #availability nests a <script>; its JSON used to leak into the snapshot.
  if (availability.includes("{")) fail(`availability contains script JSON: ${availability.slice(0, 80)}`);
  const overflow = await app.evaluate(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
  if (Number(overflow) > 0) fail(`spec sheet scrolls sideways by ${overflow}px`);
  await app.screenshot({ path: `${SHOTS}/picky-detail.png`, fullPage: true });
  await app.goto(`${WEB}/`);
  await app.waitForSelector(".product-card");
  await app.screenshot({ path: `${SHOTS}/picky-list.png` });
  await app.close();
}

async function checkAutoOpen(ctx: BrowserContext, worker: Worker, popup: Page, tab: { id: number; url: string }): Promise<void> {
  await writeSettings(worker, { autoOpenSheet: true, firstRunDismissed: true });
  const opened = ctx.waitForEvent("page", { predicate: (page) => page.url().includes("/products/"), timeout: 60000 });
  const [run, sheet] = await Promise.all([captureViaPort(popup, tab), opened]);
  step("capture.auto-open", { outcome: run.outcome.kind, opened: sheet.url() });
}

async function writeSettings(worker: Worker, settings: { autoOpenSheet: boolean; firstRunDismissed: boolean }): Promise<void> {
  await worker.evaluate(`chrome.storage.local.set(${JSON.stringify({ [SETTINGS_KEY]: settings })})`);
}

async function tabIdOf(worker: Worker, url: string): Promise<number> {
  return worker.evaluate(`chrome.tabs.query({}).then((tabs) => tabs.find((t) => t.url === ${JSON.stringify(url)}).id)`) as Promise<number>;
}

function extensionCopyWithHostAccess(productUrl: string): string {
  const dir = mkdtempSync(join(tmpdir(), "picky-ext-"));
  cpSync(DIST, dir, { recursive: true });
  const manifestPath = join(dir, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { host_permissions: string[] };
  manifest.host_permissions.push(`${new URL(productUrl).origin}/*`);
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  return dir;
}
