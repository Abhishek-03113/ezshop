import { join } from "node:path";
import { z } from "zod";
import { extractProductSnapshot } from "../extract/extract-product.ts";
import { parseHtmlPage } from "../page/cheerio-page.ts";
import { ProductSnapshotSchema, type ProductSnapshot } from "../product-snapshot.ts";
import type { FixtureFiles } from "./fixture-files.ts";
import { stripVolatileMarkup } from "./strip-volatile-markup.ts";

/** Where captured pages live: test/fixtures/<source>/<slug>.html + <slug>.json. */
export const PAGE_FIXTURES_DIR = join(import.meta.dir, "../../test/fixtures");

const FIXTURE_NAME = /^[a-z0-9.-]+\/[a-z0-9-]+$/;

const PageFixtureRecordSchema = z.object({
  url: z.url(),
  capturedAt: z.iso.datetime(),
  expected: ProductSnapshotSchema,
});
type PageFixtureRecord = z.infer<typeof PageFixtureRecordSchema>;

/** A captured product page and the snapshot ezshop is expected to read from it. */
export interface PageFixture extends PageFixtureRecord {
  name: string;
  html: string;
}

/**
 * Captured pages used as data-driven tests: every fixture is checked by the same generic test,
 * so adding a product or a site means capturing a page, not writing assertions.
 *
 * @example await new PageFixtureStore(new DirectoryFixtureFiles(PAGE_FIXTURES_DIR)).listNames()
 */
export class PageFixtureStore {
  constructor(private readonly files: FixtureFiles) {}

  async listNames(): Promise<string[]> {
    return (await this.files.listFiles()).filter((path) => path.endsWith(".json")).map((path) => path.slice(0, -5));
  }

  async read(name: string): Promise<PageFixture> {
    const record = parseFixtureRecord(name, await this.files.readText(`${requireFixtureName(name)}.json`));
    return { name, html: await this.files.readText(`${name}.html`), ...record };
  }

  /** Stores a freshly captured page and records what the extractors read from it today. */
  async save(name: string, url: string, html: string, capturedAt: Date): Promise<PageFixture> {
    const strippedHtml = stripVolatileMarkup(html);
    await this.files.writeText(`${requireFixtureName(name)}.html`, strippedHtml);
    return this.writeExpectation(name, url, strippedHtml, capturedAt.toISOString());
  }

  /** Re-derives the expected snapshot after an intended extractor change. Review the diff! */
  async refresh(name: string): Promise<PageFixture> {
    const fixture = await this.read(name);
    return this.writeExpectation(name, fixture.url, fixture.html, fixture.capturedAt);
  }

  private async writeExpectation(name: string, url: string, html: string, capturedAt: string): Promise<PageFixture> {
    const record: PageFixtureRecord = { url, capturedAt, expected: readSnapshotFromHtml(html, url, capturedAt) };
    await this.files.writeText(`${name}.json`, `${JSON.stringify(record, null, 2)}\n`);
    return { name, html, ...record };
  }
}

/**
 * Runs the production extractor over stored HTML, the way the API does for Firecrawl pages.
 *
 * @example readSnapshotFromHtml(fixture.html, fixture.url, fixture.capturedAt)
 */
export function readSnapshotFromHtml(html: string, url: string, capturedAt: string): ProductSnapshot {
  return extractProductSnapshot(parseHtmlPage(html), url, new Date(capturedAt));
}

function requireFixtureName(name: string): string {
  if (FIXTURE_NAME.test(name)) return name;
  throw new Error(
    `Fixture name "${name}" is invalid; expected "<source>/<slug>" like "flipkart.com/iphone-17-white-256gb"`,
  );
}

function parseFixtureRecord(name: string, json: string): PageFixtureRecord {
  const parsed = PageFixtureRecordSchema.safeParse(JSON.parse(json));
  if (parsed.success) return parsed.data;
  throw new Error(
    `Fixture ${name}.json is invalid (${parsed.error.issues[0]?.message}); expected {url, capturedAt, expected}`,
  );
}
