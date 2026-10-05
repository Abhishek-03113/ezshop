import { describe, expect, test } from "bun:test";
import { PageFixtureStore } from "../src/testing/page-fixtures.ts";
import { InMemoryFixtureFiles } from "./fakes/in-memory-fixture-files.ts";

const URL_ = "https://www.amazon.in/dp/B000000001";
const PAGE = `<script>bundle()</script><span id="productTitle">Widget</span>`;

describe("PageFixtureStore", () => {
  test("saves stripped HTML plus the snapshot read from it", async () => {
    const files = new InMemoryFixtureFiles();
    const fixture = await new PageFixtureStore(files).save("amazon.in/widget", URL_, PAGE, new Date(0));
    expect(files.textByPath.get("amazon.in/widget.html")).toBe('<span id="productTitle">Widget</span>');
    expect(fixture.expected.title).toBe("Widget");
  });

  test("lists and reads back saved fixtures", async () => {
    const store = new PageFixtureStore(new InMemoryFixtureFiles());
    const saved = await store.save("amazon.in/widget", URL_, PAGE, new Date(0));
    expect(await store.listNames()).toEqual(["amazon.in/widget"]);
    expect(await store.read("amazon.in/widget")).toEqual(saved);
  });

  test("refresh re-derives the expectation from stored HTML", async () => {
    const files = new InMemoryFixtureFiles();
    const store = new PageFixtureStore(files);
    await store.save("amazon.in/widget", URL_, PAGE, new Date(0));
    files.textByPath.set("amazon.in/widget.html", `<span id="productTitle">Renamed</span>`);
    expect((await store.refresh("amazon.in/widget")).expected.title).toBe("Renamed");
  });

  test("rejects malformed names and records with the offending value", async () => {
    const files = new InMemoryFixtureFiles();
    const store = new PageFixtureStore(files);
    await expect(store.save("Bad Name", URL_, PAGE, new Date(0))).rejects.toThrow('Fixture name "Bad Name" is invalid');
    files.textByPath.set("amazon.in/x.json", "{}");
    await expect(store.read("amazon.in/x")).rejects.toThrow("Fixture amazon.in/x.json is invalid");
  });
});
