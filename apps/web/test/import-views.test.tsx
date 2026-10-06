import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ImportCardView, ImportPillView, type ImportFieldViewProps } from "../src/components/import-field-views.tsx";

const idle: ImportFieldViewProps = {
  url: "",
  onUrlChange: () => {},
  onSubmit: () => {},
  isPending: false,
  isUnavailable: false,
  errorMessage: null,
};

describe("import field views", () => {
  test("pill has the app-bar copy and an Add button", () => {
    const html = renderToStaticMarkup(<ImportPillView {...idle} />);
    expect(html).toContain("Paste a product link to add it");
    expect(html).toContain(">Add</button>");
  });

  test("card has the welcome copy and lists the supported stores", () => {
    const html = renderToStaticMarkup(<ImportCardView {...idle} />);
    expect(html).toContain("Paste a product link");
    expect(html).toContain("Get specs");
    expect(html).toContain("Amazon.in and Flipkart product pages");
  });

  test("pending disables the button and an error is announced", () => {
    const html = renderToStaticMarkup(<ImportCardView {...idle} isPending errorMessage="Unsupported product URL" />);
    expect(html).toContain("disabled");
    expect(html).toContain("Reading page…");
    expect(html).toContain('role="alert"');
    expect(html).toContain("Unsupported product URL");
  });

  test("unavailable card greys out the field and points to the extension", () => {
    const html = renderToStaticMarkup(<ImportCardView {...idle} isUnavailable />);
    expect(html).toContain("is-unavailable");
    expect(html).toMatch(/<input[^>]*disabled/);
    expect(html).toMatch(/<button[^>]*disabled/);
    expect(html).toContain("Use the ezshop extension on a product page");
    expect(html).not.toContain("Amazon.in and Flipkart product pages");
  });

  test("unavailable pill disables the field and explains why on hover", () => {
    const html = renderToStaticMarkup(<ImportPillView {...idle} isUnavailable />);
    expect(html).toContain('class="import-pill is-unavailable"');
    expect(html).toContain("Add products with the extension");
    expect(html).toMatch(/<input[^>]*disabled/);
    expect(html).toContain("isn&#x27;t set up on this server");
  });
});
