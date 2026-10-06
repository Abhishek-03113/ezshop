import { describe, expect, test } from "bun:test";
import { FakeComparisonsClient } from "./fakes/fake-comparisons-client.ts";
import { FakeProductsClient } from "./fakes/fake-products-client.ts";
import { inr, makeProduct, makeSummary } from "./fakes/product-fixtures.ts";
import { renderAppAt } from "./fakes/render-app.tsx";

const populated = () =>
  new FakeProductsClient(
    [makeSummary(), makeSummary({ id: "p2", source: "flipkart.com", title: "Apple iPhone 17", price: null })],
    [makeProduct("p1")],
  );

describe("library route", () => {
  test("shows the welcome screen with the injected extension URL when the library is empty", async () => {
    const html = await renderAppAt("/", new FakeProductsClient());
    expect(html).toContain("Welcome to Picky");
    expect(html).toContain('href="https://store.example/picky"');
    expect(html).toContain("Install and pin");
    expect(html).not.toContain("sample spec sheet");
  });

  test("shows the card grid, count and store filter when products exist", async () => {
    const html = await renderAppAt("/", populated());
    expect(html).toContain("2 products in 1 group");
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

describe("library search and grouping", () => {
  test("?q= asks the server and shows the matching caption", async () => {
    const client = populated();
    const html = await renderAppAt("/?q=iphone", client);
    expect(client.listedQueries).toContain("iphone");
    expect(html).toContain("1 product matching “iphone”");
    expect(html).toContain('value="iphone"');
  });

  test("a search with no hits keeps the library, not the welcome screen", async () => {
    const html = await renderAppAt("/?q=zzz", populated());
    expect(html).toContain("No products match “zzz”.");
    expect(html).not.toContain("Welcome to Picky");
  });

  test("?group=brand sections by brand and ?group=none is one flat list", async () => {
    expect(await renderAppAt("/?group=brand", populated())).toContain("<h2>Sony</h2>");
    const flat = await renderAppAt("/?group=none", populated());
    expect(flat).toContain("2 products · newest first");
    expect(flat).not.toContain("group-header");
  });

  test("a group's action opens the comparison that already holds exactly its products", async () => {
    const both = [makeProduct("p1"), makeProduct("p2")];
    const html = await renderAppAt(
      "/",
      populated(),
      new FakeComparisonsClient([{ id: "c9", name: "Cans", products: both }]),
    );
    expect(html).toContain("Open comparison");
    expect(html).toContain('href="/comparisons/c9"');
    expect(html).not.toContain("Compare all 2");
  });
});

describe("comparison routes", () => {
  const seeded = () =>
    new FakeComparisonsClient([
      {
        id: "c1",
        name: "Cans",
        products: [makeProduct("p1"), makeProduct("p2", { title: "Bose QC", brand: "Bose", price: inr(27900) })],
      },
    ]);

  test("/comparisons shows the empty state when nothing is saved", async () => {
    const html = await renderAppAt("/comparisons", populated());
    expect(html).toContain("No comparisons yet");
    expect(html).toContain("New comparison");
  });

  test("/comparisons lists every comparison as a card instead of redirecting to the latest", async () => {
    const html = await renderAppAt("/comparisons", populated(), seeded());
    expect(html).toContain('href="/comparisons/c1"');
    expect(html).toContain("Cans");
    expect(html).toContain("2 products · Updated");
    expect(html).toContain("New comparison");
    expect(html).not.toContain("No comparisons yet");
  });

  test("the compare page renders sidebar, toolbar and a matrix with a Lowest price pill", async () => {
    const html = await renderAppAt("/comparisons/c1", populated(), seeded());
    expect(html).toContain('aria-label="Comparisons"');
    expect(html).toContain("All comparisons");
    expect(html).toContain("Differences");
    expect(html).toContain("Mark best values");
    expect(html).toContain("Lowest");
    expect(html).toContain("Search Flipkart");
    expect(html).toContain('href="/products/p1"');
  });

  test("an empty comparison invites adding products", async () => {
    const html = await renderAppAt(
      "/comparisons/c1",
      populated(),
      new FakeComparisonsClient([{ id: "c1", name: "Empty", products: [] }]),
    );
    expect(html).toContain("No products yet");
  });
});

describe("product page comparisons", () => {
  test("lists every comparison as a checkbox, checked where the product is a member", async () => {
    const comparisons = new FakeComparisonsClient([
      { id: "c1", name: "Cans", products: [makeProduct("p1")] },
      { id: "c2", name: "Travel", products: [] },
    ]);
    const html = await renderAppAt("/products/p1", populated(), comparisons);
    expect(html).toContain("In comparisons");
    expect(html).toMatch(/<input type="checkbox" checked=""[^>]*\/><span>Cans<\/span>/);
    expect(html).toMatch(/<input type="checkbox"(?! checked)[^>]*\/><span>Travel<\/span>/);
    expect(html).toContain("New comparison");
    expect(html).toContain("Comparisons<span");
  });
});
