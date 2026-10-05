import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { HighlightList } from "../src/components/highlight-list.tsx";
import { ImageGallery } from "../src/components/image-gallery.tsx";
import { PriceBlock } from "../src/components/price-block.tsx";
import { RatingNote } from "../src/components/rating-note.tsx";
import { SpecGroupTable } from "../src/components/spec-group-table.tsx";
import { SpecSheet } from "../src/components/spec-sheet.tsx";

const inr = (amount: number) => ({ amount, currency: "INR" });
const group = { title: "At a glance", specs: [{ label: "Brand", value: "Apple" }] };

describe("PriceBlock", () => {
  test("shows M.R.P. and discount only when discounted", () => {
    expect(renderToStaticMarkup(<PriceBlock price={inr(90)} listPrice={inr(100)} />)).toContain("−10%");
    expect(renderToStaticMarkup(<PriceBlock price={inr(90)} listPrice={null} />)).not.toContain("M.R.P.");
    expect(renderToStaticMarkup(<PriceBlock price={null} listPrice={null} />)).toContain("Price not shown");
  });
});

describe("SpecGroupTable", () => {
  test("renders a row per spec and marks the featured group", () => {
    const html = renderToStaticMarkup(<SpecGroupTable group={group} featured />);
    expect(html).toContain('<th scope="row">Brand</th><td>Apple</td>');
    expect(html).toContain("spec-group featured");
  });
});

describe("SpecSheet", () => {
  test("features the first group and counts specs in the filter placeholder", () => {
    const html = renderToStaticMarkup(<SpecSheet groups={[group, { ...group, title: "More" }]} />);
    expect(html).toContain("Filter 2 specs");
    expect(html.match(/featured/g)).toHaveLength(1);
  });
});

describe("HighlightList", () => {
  test("renders headings when present and nothing for an empty list", () => {
    expect(renderToStaticMarkup(<HighlightList highlights={[{ heading: "iOS", text: "Liquid Glass" }]} />)).toContain(
      "<strong>iOS</strong>",
    );
    expect(renderToStaticMarkup(<HighlightList highlights={[]} />)).toBe("");
  });
});

describe("RatingNote", () => {
  test("renders a quiet rating line, or nothing", () => {
    expect(renderToStaticMarkup(<RatingNote rating={{ average: 4.7, count: 1753 }} />)).toContain(
      "4.7 / 5 from 1,753 ratings",
    );
    expect(renderToStaticMarkup(<RatingNote rating={null} />)).toBe("");
  });
});

describe("ImageGallery", () => {
  test("shows thumbnails only for several images, and a placeholder for none", () => {
    expect(renderToStaticMarkup(<ImageGallery images={["https://a/1.jpg"]} alt="x" />)).not.toContain("gallery-thumbs");
    expect(renderToStaticMarkup(<ImageGallery images={["https://a/1.jpg", "https://a/2.jpg"]} alt="x" />)).toContain(
      'aria-pressed="true"',
    );
    expect(renderToStaticMarkup(<ImageGallery images={[]} alt="x" />)).toContain("No image");
  });
});
