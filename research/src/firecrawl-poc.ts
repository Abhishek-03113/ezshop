// PoC: scrape Amazon.in / Flipkart pages through a self-hosted Firecrawl (localhost:3002, no LLM),
// then extract structured fields from rawHtml using the selectors validated in FINDINGS.md.
import { writeFileSync } from "node:fs";
import * as cheerio from "cheerio";
import { OUT } from "./browser.js";

const FIRECRAWL = process.env.FIRECRAWL_URL ?? "http://localhost:3002";

interface ScrapeResult {
  success: boolean; error?: string;
  data?: { markdown?: string; rawHtml?: string; links?: string[];
    metadata?: { statusCode?: number; title?: string; sourceURL?: string; url?: string; proxyUsed?: string; error?: string } };
}

async function scrape(url: string, extra: Record<string, unknown> = {}): Promise<{ ms: number; res: ScrapeResult }> {
  const t0 = Date.now();
  const r = await fetch(`${FIRECRAWL}/v2/scrape`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown", "rawHtml"], onlyMainContent: false, timeout: 90000, ...extra }),
  });
  return { ms: Date.now() - t0, res: (await r.json()) as ScrapeResult };
}

const isAmazonChallenge = (html: string) => /bm-verify|triggerInterstitialChallenge|awswaf|captcha/i.test(html) && html.length < 20000;

const parsers = {
  amazonProduct($: cheerio.CheerioAPI) {
    const t = (s: string) => $(s).first().text().replace(/\s+/g, " ").trim() || null;
    return {
      asin: $("input#ASIN").val() ?? null, title: t("#productTitle"),
      // .a-offscreen is sometimes a blank placeholder; fall back to the visible (aria-hidden) price.
      price: t(".priceToPay .a-offscreen") ?? t(".priceToPay [aria-hidden='true']") ?? t("#corePrice_feature_div .a-price .a-offscreen"),
      mrp: t(".basisPrice .a-offscreen"), availability: t("#availability"),
      rating: $("#acrPopover").attr("title") ?? null, reviews: t("#acrCustomerReviewText"),
      offerListingID: (($("input[name='offerListingID']").val() as string | undefined) ?? "").slice(0, 20) || null,
      hasAddToCart: $("#add-to-cart-button").length > 0,
    };
  },
  amazonSearch($: cheerio.CheerioAPI) {
    const items = $('[data-component-type="s-search-result"]').toArray().map((el) => {
      const e = $(el);
      return { asin: e.attr("data-asin"), sponsored: /Sponsored/.test(e.find("h2").attr("aria-label") ?? e.text().slice(0, 300)), title: (e.find("a h2 span").first().text() || e.find("h2").text()).replace(/\s+/g, " ").trim().slice(0, 70),
        price: e.find(".a-price:not(.a-text-price) .a-offscreen").first().text() || null };
    });
    return { count: items.length, sample: items.slice(0, 3) };
  },
  flipkartProduct($: cheerio.CheerioAPI) {
    const ld = $("script[type='application/ld+json']").toArray().flatMap((s) => { try { const j = JSON.parse($(s).text()); return Array.isArray(j) ? j : [j]; } catch { return []; } });
    const p = ld.find((x) => x["@type"] === "Product");
    return p ? { sku: p.sku, name: p.name, price: p.offers?.price, availability: p.offers?.availability, rating: p.aggregateRating?.ratingValue, ratingCount: p.aggregateRating?.ratingCount } : { jsonLd: "missing" };
  },
  flipkartSearch($: cheerio.CheerioAPI) {
    const ids = $("[data-id]").toArray().map((el) => $(el).attr("data-id"));
    return { count: ids.length, sample: ids.slice(0, 3) };
  },
};

const targets: { name: string; url: string; parse: keyof typeof parsers; amazon?: boolean }[] = [
  { name: "amazon-product", url: "https://www.amazon.in/dp/B0CHX9MF1L", parse: "amazonProduct", amazon: true },
  { name: "amazon-search", url: "https://www.amazon.in/s?k=iphone+15", parse: "amazonSearch", amazon: true },
  { name: "flipkart-product", url: "https://www.flipkart.com/apple-iphone-16-black-128-gb/p/itmb07d67f995271?pid=MOBH4DQFG8NKFRDY", parse: "flipkartProduct" },
  { name: "flipkart-search", url: "https://www.flipkart.com/search?q=iphone+15", parse: "flipkartSearch" },
];

const only = process.argv[2];
const extra = process.argv[3] ? JSON.parse(process.argv[3]) : {};
const summary: unknown[] = [];
for (const t of targets.filter((t) => !only || only === "all" || t.name === only)) {
  const { ms, res } = await scrape(t.url, extra);
  const html = res.data?.rawHtml ?? "";
  writeFileSync(`${OUT}firecrawl-${t.name}.html`, html);
  writeFileSync(`${OUT}firecrawl-${t.name}.md`, res.data?.markdown ?? "");
  const row = {
    target: t.name, ms, success: res.success, error: res.error,
    status: res.data?.metadata?.statusCode, title: res.data?.metadata?.title?.slice(0, 60),
    htmlBytes: html.length, mdBytes: res.data?.markdown?.length ?? 0,
    challenged: t.amazon ? isAmazonChallenge(html) : undefined,
    extracted: html ? parsers[t.parse](cheerio.load(html)) : null,
  };
  summary.push(row);
  console.log(JSON.stringify(row, null, 1));
}
writeFileSync(`${OUT}firecrawl-summary.json`, JSON.stringify(summary, null, 2));
