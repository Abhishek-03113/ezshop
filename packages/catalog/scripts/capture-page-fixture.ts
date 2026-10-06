// Turns a product page saved from the browser (Ctrl+S, "Webpage, HTML only") into a catalog test fixture.
// Usage: bun run fixtures:capture <product-url> <slug> <saved-page.html>
//   e.g. bun run fixtures:capture "https://www.flipkart.com/…/p/itm…?pid=…" iphone-17-white-256gb ~/Downloads/page.html
// The fixture lands in packages/catalog/test/fixtures/<source>/<slug>.{html,json} and is picked up
// by the generic fixture test automatically.
import { findSiteExtractor, describeSupportedProductUrls } from "../src/index.ts";
import { DirectoryFixtureFiles, PAGE_FIXTURES_DIR, PageFixtureStore } from "../src/testing/index.ts";

const [url, slug, htmlPath] = Bun.argv.slice(2);
if (url === undefined || slug === undefined || htmlPath === undefined) {
  console.error("Usage: bun run fixtures:capture <product-url> <slug> <saved-page.html>");
  process.exit(1);
}
const extractor = findSiteExtractor(url);
if (extractor === null) {
  console.error(`Unsupported URL ${url}; expected ${describeSupportedProductUrls()}`);
  process.exit(1);
}

const store = new PageFixtureStore(new DirectoryFixtureFiles(PAGE_FIXTURES_DIR));
const fixture = await store.save(`${extractor.source}/${slug}`, url, await Bun.file(htmlPath).text(), new Date());
const specCount = fixture.expected.specGroups.reduce((total, group) => total + group.specs.length, 0);
console.log(`Saved ${fixture.name}: "${fixture.expected.title}"`);
console.log(
  `  ${fixture.expected.specGroups.length} spec groups, ${specCount} specs, ${fixture.expected.images.length} images`,
);
