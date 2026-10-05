import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ImportCardView, ImportPillView, type ImportFieldViewProps } from "../src/components/import-field-views.tsx";

const idle: ImportFieldViewProps = {
  url: "",
  onUrlChange: () => {},
  onSubmit: () => {},
  isPending: false,
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
});
