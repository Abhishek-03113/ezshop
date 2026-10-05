// Can Flipkart's internal Rome page API be called from plain Node (no browser)? Which headers matter?
import { readFileSync } from "node:fs";
import { OUT } from "./browser.js";

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36";
const state = JSON.parse(readFileSync(`${OUT}flipkart-state.json`, "utf8")) as { cookies: { name: string; value: string; domain: string }[] };
const cookie = state.cookies.filter((c) => c.domain.includes("flipkart.com")).map((c) => `${c.name}=${c.value}`).join("; ");
const pageUri = "/apple-iphone-16-black-128-gb/p/itmb07d67f995271?pid=MOBH4DQFG8NKFRDY";

async function call(label: string, headers: Record<string, string>) {
  const r = await fetch("https://1.rome.api.flipkart.com/api/4/page/fetch", {
    method: "POST", body: JSON.stringify({ pageUri, pageContext: { fetchSeoData: true } }),
    headers: { "content-type": "application/json", origin: "https://www.flipkart.com", referer: "https://www.flipkart.com/", "user-agent": UA, ...headers },
  });
  const t = await r.text();
  console.log(`\n[${label}] HTTP ${r.status} ${t.length}B`, t.slice(0, 200).replace(/\s+/g, " "));
  return t;
}
const xua = { "x-user-agent": `${UA} FKUA/website/42/website/Desktop` };
await call("no x-user-agent, no cookies", {});
await call("x-user-agent, no cookies", xua);
const body = await call("x-user-agent + browser cookies", { ...xua, cookie });

// What does the server-driven payload look like? Find price / product data paths.
try {
  const j = JSON.parse(body);
  const slots = j?.RESPONSE?.slots ?? [];
  console.log("\nslots:", slots.length, "widget types:", [...new Set(slots.map((s: any) => s?.widget?.type))].slice(0, 25));
  const seo = j?.RESPONSE?.pageData?.seoData ?? j?.RESPONSE?.pageData?.pageContext;
  console.log("pageData keys:", Object.keys(j?.RESPONSE?.pageData ?? {}));
  console.log("pageContext sample:", JSON.stringify(j?.RESPONSE?.pageData?.pageContext ?? {}).slice(0, 900));
  void seo;
} catch (e) { console.log("parse error", String(e)); }

// Locate pricing / stock fields inside pageContext.
const ctxObj = JSON.parse(body)?.RESPONSE?.pageData?.pageContext ?? {};
console.log("\npageContext keys:", Object.keys(ctxObj));
console.log("pricing:", JSON.stringify(ctxObj.pricing ?? {}).slice(0, 500));
console.log("titles:", JSON.stringify(ctxObj.titles ?? {}), "| productId:", ctxObj.productId, "| listingId:", ctxObj.listingId);
console.log("trackingDataV2 sample:", JSON.stringify(ctxObj.trackingDataV2 ?? {}).slice(0, 300));
