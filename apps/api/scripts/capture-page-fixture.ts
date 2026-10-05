// Captures a live product page through Firecrawl as a catalog test fixture.
// Usage: bun run fixtures:capture <product-url> <slug>
//   e.g. bun run fixtures:capture "https://www.flipkart.com/…/p/itm…?pid=…" iphone-17-white-256gb
// The fixture lands in packages/catalog/test/fixtures/<source>/<slug>.{html,json} and is picked up
// by the generic fixture test automatically.
import { findSiteExtractor, describeSupportedProductUrls } from "@ezshop/catalog";
import { DirectoryFixtureFiles, PAGE_FIXTURES_DIR, PageFixtureStore } from "@ezshop/catalog/testing";
import { FirecrawlHtmlFetcher } from "../src/scraping/firecrawl-html-fetcher.ts";

const [url, slug] = Bun.argv.slice(2);
if (url === undefined || slug === undefined) {
  console.error("Usage: bun run fixtures:capture <product-url> <slug>");
  process.exit(1);
}
const extractor = findSiteExtractor(url);
if (extractor === null) {
  console.error(`Unsupported URL ${url}; expected ${describeSupportedProductUrls()}`);
  process.exit(1);
}

const fetcher = new FirecrawlHtmlFetcher(Bun.env.FIRECRAWL_URL ?? "http://localhost:3002", fetch);
const store = new PageFixtureStore(new DirectoryFixtureFiles(PAGE_FIXTURES_DIR));
const fixture = await store.save(`${extractor.source}/${slug}`, url, await fetcher.fetchHtml(url), new Date());
const specCount = fixture.expected.specGroups.reduce((total, group) => total + group.specs.length, 0);
console.log(`Saved ${fixture.name}: "${fixture.expected.title}"`);
console.log(
  `  ${fixture.expected.specGroups.length} spec groups, ${specCount} specs, ${fixture.expected.images.length} images`,
);
