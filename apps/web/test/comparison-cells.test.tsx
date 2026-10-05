import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { MatrixCell, MatrixRow } from "../src/components/comparison-cells.tsx";

describe("MatrixCell", () => {
  test("a missing spec renders a muted dash", () => {
    const html = renderToString(<MatrixCell cell={{ text: null, isBest: false }} markBest pill="Best" />);
    expect(html).toContain('class="mx-value none">—<');
  });

  test("the best value is bold with a pill while 'Mark best values' is on", () => {
    const html = renderToString(<MatrixCell cell={{ text: "96 W", isBest: true }} markBest pill="Best" />);
    expect(html).toContain('class="mx-value best"');
    expect(html).toContain('<span class="best-pill">Best</span>');
  });

  test("turning the switch off removes the emphasis", () => {
    const html = renderToString(<MatrixCell cell={{ text: "96 W", isBest: true }} markBest={false} pill="Best" />);
    expect(html).not.toContain("best");
  });

  test("a null pill bolds without a badge", () => {
    const html = renderToString(<MatrixCell cell={{ text: "4.5", isBest: true }} markBest pill={null} />);
    expect(html).toContain("mx-value best");
    expect(html).not.toContain("best-pill");
  });
});

describe("MatrixRow", () => {
  test("renders the label then one cell per product", () => {
    const cells = [
      { text: "1", isBest: false },
      { text: "2", isBest: false },
    ];
    const html = renderToString(<MatrixRow label="Weight" cells={cells} markBest pill="Best" />);
    expect(html).toContain('role="rowheader" class="mx-label">Weight<');
    expect(html.match(/role="cell"/g)).toHaveLength(2);
  });
});
