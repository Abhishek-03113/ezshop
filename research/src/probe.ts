// Probe: does each site serve a headless browser, and what network calls happen on landing?
import { launch, OUT } from "./browser.js";

const target = process.argv[2]!; // e.g. https://www.amazon.in/
const tag = process.argv[3]!;
const { browser, ctx } = await launch({ har: `${OUT}${tag}.har` });
const page = await ctx.newPage();
const calls: string[] = [];
page.on("response", (r) => {
  const t = r.request().resourceType();
  if (t === "xhr" || t === "fetch" || t === "document")
    calls.push(`${r.status()} ${r.request().method()} [${t}] ${r.url().slice(0, 180)}`);
});
const resp = await page.goto(target, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(6000);
console.log("STATUS", resp?.status(), "TITLE", await page.title());
console.log("navigator.webdriver =", await page.evaluate(() => navigator.webdriver));
await page.screenshot({ path: `${OUT}${tag}.png` });
console.log(calls.join("\n"));
await ctx.tracing.stop({ path: `${OUT}${tag}-trace.zip` });
await ctx.close(); await browser.close();
