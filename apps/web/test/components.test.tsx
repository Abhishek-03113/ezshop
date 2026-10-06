import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HighlightList } from "../src/components/highlight-list.tsx";
import { ImageGallery } from "../src/components/image-gallery.tsx";
import { PriceBlock } from "../src/components/price-block.tsx";
import { PriceCard } from "../src/components/price-card.tsx";
import { ProductSummary } from "../src/components/product-summary.tsx";
import { RatingNote } from "../src/components/rating-note.tsx";
import { SourceLink } from "../src/components/source-link.tsx";
import { SpecGroupCard } from "../src/components/spec-group-card.tsx";
import { SpecGroupNav } from "../src/components/spec-group-nav.tsx";
import { SpecSheet } from "../src/components/spec-sheet.tsx";
import { StoreFilterControl } from "../src/components/store-filter.tsx";
import { inr, makeSnapshot } from "./fakes/product-fixtures.ts";

const group = { title: "At a glance", specs: [{ label: "Brand", value: "Apple" }] };
const noop = () => {};

describe("PriceBlock", () => {
  test("shows M.R.P. and the savings chip only when discounted", () => {
    const discounted = renderToStaticMarkup(<PriceBlock price={inr(28926)} listPrice={inr(34990)} />);
    expect(discounted).toContain("17% off · save ₹6,064");
    expect(discounted).toContain("<s>₹34,990</s>");
    expect(renderToStaticMarkup(<PriceBlock price={inr(90)} listPrice={null} />)).not.toContain("M.R.P.");
    expect(renderToStaticMarkup(<PriceBlock price={null} listPrice={null} />)).toContain("Price not shown");
  });
});

describe("PriceCard", () => {
  test("shows availability dot, word and the capture caveat", () => {
    const html = renderToStaticMarkup(<PriceCard snapshot={makeSnapshot()} />);
    expect(html).toContain("availability-dot in-stock");
    expect(html).toContain("<strong>In stock</strong>");
    expect(html).toContain("Prices change often — capture again to refresh.");
  });

  test("omits availability when the page had none", () => {
    const html = renderToStaticMarkup(<PriceCard snapshot={makeSnapshot({ availability: null, price: null })} />);
    expect(html).not.toContain("availability-dot");
    expect(html).toContain("Price not shown");
  });
});

describe("SpecGroupCard", () => {
  test("renders label/value rows in a description list with an anchor id", () => {
    const html = renderToStaticMarkup(<SpecGroupCard group={group} />);
    expect(html).toContain('id="group-at-a-glance"');
    expect(html).toContain("<dt>Brand</dt><dd>Apple</dd>");
  });
});

describe("SpecGroupNav", () => {
  test("links each group with its count, and renders nothing for no groups", () => {
    const html = renderToStaticMarkup(<SpecGroupNav groups={[group]} />);
    expect(html).toContain('href="#group-at-a-glance"');
    expect(html).toContain('<span class="count">1</span>');
    expect(renderToStaticMarkup(<SpecGroupNav groups={[]} />)).toBe("");
  });
});

describe("spec group highlight", () => {
  test("a highlighted card carries the highlighted class, others do not", () => {
    expect(renderToStaticMarkup(<SpecGroupCard group={group} highlighted />)).toContain("card spec-group highlighted");
    expect(renderToStaticMarkup(<SpecGroupCard group={group} />)).toContain('class="card spec-group"');
  });

  test("only the active group's chip is marked current", () => {
    const other = { ...group, title: "More" };
    const html = renderToStaticMarkup(<SpecGroupNav groups={[group, other]} activeAnchor="group-more" />);
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    expect(html).toMatch(/aria-current="true"[^>]*>More/);
  });
});

describe("SpecSheet", () => {
  test("shows the size summary, search box and one card per group", () => {
    const html = renderToStaticMarkup(<SpecSheet groups={[group, { ...group, title: "More" }]} />);
    expect(html).toContain("2 specs in 2 groups");
    expect(html).toContain('type="search"');
    expect(html.match(/class="card spec-group"/g)).toHaveLength(2);
    expect(html).not.toContain("No specs match");
  });
});

describe("HighlightList", () => {
  test("renders headings when present and nothing for an empty list", () => {
    const html = renderToStaticMarkup(<HighlightList highlights={[{ heading: "iOS", text: "Liquid Glass" }]} />);
    expect(html).toContain("<strong>iOS </strong>");
    expect(html).toContain("<h2");
    expect(renderToStaticMarkup(<HighlightList highlights={[]} />)).toBe("");
  });
});

describe("RatingNote", () => {
  test("renders 'N out of 5 · count ratings', or nothing", () => {
    const html = renderToStaticMarkup(<RatingNote rating={{ average: 4.4, count: 17240 }} />);
    expect(html).toContain("<strong>4.4</strong>");
    expect(html).toContain("out of 5 · 17,240 ratings");
    expect(renderToStaticMarkup(<RatingNote rating={{ average: 5, count: 1 }} />)).toContain("1 rating<");
    expect(renderToStaticMarkup(<RatingNote rating={null} />)).toBe("");
  });
});

describe("ImageGallery", () => {
  test("shows thumbnail buttons only for several images, and a placeholder for none", () => {
    expect(renderToStaticMarkup(<ImageGallery images={["https://a/1.jpg"]} alt="x" />)).not.toContain("gallery-thumbs");
    const several = renderToStaticMarkup(<ImageGallery images={["https://a/1.jpg", "https://a/2.jpg"]} alt="x" />);
    expect(several).toContain('aria-pressed="true"');
    expect(several).toContain('aria-label="Image 2"');
    expect(renderToStaticMarkup(<ImageGallery images={[]} alt="x" />)).toContain("No product image");
  });
});

describe("SourceLink", () => {
  test("names the store it opens", () => {
    const html = renderToStaticMarkup(<SourceLink source="flipkart.com" url="https://www.flipkart.com/p/x" />);
    expect(html).toContain("View on Flipkart");
    expect(html).toContain('href="https://www.flipkart.com/p/x"');
  });
});

describe("StoreFilterControl", () => {
  test("marks only the selected segment as pressed", () => {
    const html = renderToStaticMarkup(<StoreFilterControl selected="flipkart.com" onSelect={noop} />);
    expect(html).toContain('aria-pressed="true">Flipkart</button>');
    expect(html).toContain('aria-pressed="false">All</button>');
    expect(html).toContain('aria-pressed="false">Amazon.in</button>');
  });
});

describe("ProductSummary", () => {
  test("copes with a product that has no price, rating, images, highlights or brand", () => {
    const bare = makeSnapshot({
      price: null,
      listPrice: null,
      availability: null,
      rating: null,
      images: [],
      highlights: [],
      brand: null,
    });
    const html = renderToStaticMarkup(<ProductSummary snapshot={bare} />);
    expect(html).toContain("Price not shown");
    expect(html).toContain("No product image");
    expect(html).not.toContain("rating-note");
    expect(html).not.toContain("Highlights");
    expect(html).not.toContain("summary-brand");
  });
});
