import { describe, expect, test } from "bun:test";
import { buildShadowStylesheet, tokensForShadowRoot } from "../../src/quicklook/shadow-css.ts";

describe("shadow css", () => {
  test("re-targets every :root (including inside media queries) to :host", () => {
    const css = ":root { --a: 1; }\n@media (prefers-color-scheme: dark) { :root { --a: 2; } }";
    expect(tokensForShadowRoot(css)).not.toContain(":root");
    expect(tokensForShadowRoot(css).match(/:host/g)).toHaveLength(2);
  });
  test("puts tokens before the surface's own rules", () => {
    const sheet = buildShadowStylesheet(":root{--a:1}", ".card{color:var(--a)}");
    expect(sheet.indexOf(":host")).toBeLessThan(sheet.indexOf(".card"));
  });
});
