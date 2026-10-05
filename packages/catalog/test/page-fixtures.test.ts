import { describe, expect, test } from "bun:test";
import { extractProductSnapshot } from "../src/extract/extract-product.ts";
import { wrapDomDocument } from "../src/page/dom-page.ts";
import { ProductSnapshotSchema } from "../src/product-snapshot.ts";
import { DirectoryFixtureFiles } from "../src/testing/fixture-files.ts";
import { PAGE_FIXTURES_DIR, PageFixtureStore, readSnapshotFromHtml } from "../src/testing/page-fixtures.ts";
import { domFromHtml } from "./support/dom-from-html.ts";

// Golden tests over every captured page in test/fixtures/<source>/. Add one with
// `bun run fixtures:capture <url> <slug>`; after an intended extractor change, `bun run fixtures:refresh`.
const store = new PageFixtureStore(new DirectoryFixtureFiles(PAGE_FIXTURES_DIR));
const fixtures = await Promise.all((await store.listNames()).map((name) => store.read(name)));

test("there is at least one fixture per supported source", () => {
  expect(new Set(fixtures.map((fixture) => fixture.expected.source))).toEqual(new Set(["amazon.in", "flipkart.com"]));
});

describe.each(fixtures.map((fixture) => [fixture.name, fixture] as const))("fixture %s", (_name, fixture) => {
  test("server path (cheerio) reads the expected snapshot", () => {
    expect(readSnapshotFromHtml(fixture.html, fixture.url, fixture.capturedAt)).toEqual(fixture.expected);
  });

  test("extension path (live DOM) reads the same snapshot", () => {
    const page = wrapDomDocument(domFromHtml(fixture.html));
    expect(extractProductSnapshot(page, fixture.url, new Date(fixture.capturedAt))).toEqual(fixture.expected);
  });

  test("expected snapshot is valid and not degenerate", () => {
    expect(ProductSnapshotSchema.safeParse(fixture.expected).success).toBe(true);
    expect(fixture.expected.price).not.toBeNull();
    expect(fixture.expected.images.length).toBeGreaterThan(0);
    expect(fixture.expected.specGroups.length).toBeGreaterThan(0);
  });
});
