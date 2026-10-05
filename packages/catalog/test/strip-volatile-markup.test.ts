import { describe, expect, test } from "bun:test";
import { stripVolatileMarkup } from "../src/testing/strip-volatile-markup.ts";

describe("stripVolatileMarkup", () => {
  test("drops code, styles and noscript but keeps JSON-LD", () => {
    const html = `<script src="a.js"></script><style>p{}</style><noscript>x</noscript><script type="application/ld+json">{"a":1}</script><p>k</p>`;
    expect(stripVolatileMarkup(html)).toBe(`<script type="application/ld+json">{"a":1}</script><p>k</p>`);
  });
});
