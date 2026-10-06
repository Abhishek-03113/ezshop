import { describe, expect, test } from "bun:test";
import { DirectoryFixtureFiles, PAGE_FIXTURES_DIR, PageFixtureStore } from "@picky/catalog/testing";
import { Window } from "happy-dom";
import { capturePage } from "../src/capture-page.ts";

function documentFrom(html: string): Document {
  const window = new Window({ settings: { disableJavaScriptEvaluation: true, disableCSSFileLoading: true } });
  window.document.write(html);
  return window.document as unknown as Document;
}

const store = new PageFixtureStore(new DirectoryFixtureFiles(PAGE_FIXTURES_DIR));
const fixtures = await Promise.all((await store.listNames()).map((name) => store.read(name)));

describe("capturePage", () => {
  test.each(fixtures.map((fixture) => [fixture.name, fixture] as const))(
    "captures %s from a live DOM",
    (_name, fixture) => {
      const result = capturePage(documentFrom(fixture.html), fixture.url, new Date(fixture.capturedAt));
      expect(result).toEqual({ ok: true, snapshot: fixture.expected });
    },
  );

  test("returns the extractor's message instead of throwing", () => {
    const result = capturePage(documentFrom("<p>challenge</p>"), fixtures[0]?.url ?? "", new Date(0));
    expect(result).toEqual({ ok: false, message: expect.stringContaining("expected a product detail page") });
  });
});
