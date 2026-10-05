import { describe, expect, test } from "bun:test";
import { FakeProductsClient } from "./fakes/fake-products-client.ts";
import { makeProduct, makeSummary } from "./fakes/product-fixtures.ts";
import { renderAppAt } from "./fakes/render-app.tsx";

const populated = () =>
  new FakeProductsClient(
    [makeSummary(), makeSummary({ id: "p2", source: "flipkart.com", title: "Apple iPhone 17", price: null })],
    [makeProduct("p1")],
  );

describe("library route", () => {
  test("shows the welcome screen with the injected extension URL when the library is empty", async () => {
    const html = await renderAppAt("/", new FakeProductsClient());
    expect(html).toContain("Welcome to ezshop");
    expect(html).toContain('href="https://store.example/ezshop"');
    expect(html).toContain("Install and pin");
    expect(html).not.toContain("sample spec sheet");
  });

  test("shows the card grid, count and store filter when products exist", async () => {
    const html = await renderAppAt("/", populated());
    expect(html).toContain("2 products · newest first");
    expect(html).toContain('aria-pressed="true">All</button>');
    expect(html).toContain("Amazon.in");
    expect(html).toContain("Flipkart");
    expect(html).toContain("Apple iPhone 17");
    expect(html).toContain("Paste a product link to add it");
  });

  test("prefills the import field from ?import= without calling the API during render", async () => {
    const client = populated();
    const html = await renderAppAt(`/?import=${encodeURIComponent("https://www.amazon.in/dp/B0FQG1YHYR")}`, client);
    expect(html).toContain('value="https://www.amazon.in/dp/B0FQG1YHYR"');
    expect(client.importedUrls).toEqual([]);
  });

  test("prefills the welcome card from ?import= too", async () => {
    const html = await renderAppAt(
      `/?import=${encodeURIComponent("https://www.flipkart.com/p/x")}`,
      new FakeProductsClient(),
    );
    expect(html).toContain('value="https://www.flipkart.com/p/x"');
  });

  test("ignores an ?import= value that is not an http(s) URL", async () => {
    const html = await renderAppAt("/?import=javascript:alert(1)", populated());
    expect(html).not.toContain("javascript:alert");
  });
});

describe("product route", () => {
  test("renders back link, source pill, price card and specs", async () => {
    const html = await renderAppAt("/products/p1", populated());
    expect(html).toContain("Library");
    expect(html).toContain("View on Amazon.in");
    expect(html).toContain("17% off · save ₹6,064");
    expect(html).toContain("2 specs in 2 groups");
  });
});
