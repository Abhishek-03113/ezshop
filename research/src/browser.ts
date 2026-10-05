import { chromium, type Browser, type BrowserContext } from "playwright";

export const OUT = new URL("../out/", import.meta.url).pathname;

export async function launch(opts: { har?: string } = {}): Promise<{ browser: Browser; ctx: BrowserContext }> {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH ?? "/usr/bin/chromium",
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const ctx = await browser.newContext({
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    viewport: { width: 1366, height: 900 },
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
    ...(opts.har ? { recordHar: { path: opts.har, content: "embed" as const } } : {}),
  });
  // tsx/esbuild emits __name() helpers inside functions we serialize into page.evaluate
  await ctx.addInitScript("window.__name = (f) => f");
  await ctx.tracing.start({ screenshots: true, snapshots: true });
  return { browser, ctx };
}
