import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { buildShadowStylesheet } from "../../src/quicklook/shadow-css.ts";

const SRC = join(import.meta.dir, "../../src");
const read = (relative: string): Promise<string> => Bun.file(join(SRC, relative)).text();

describe("Quick Look shadow stylesheet with the spec sheet", () => {
  test("keeps tokens first, then Quick Look's rules, then the spec sheet's", async () => {
    const sheet = buildShadowStylesheet(
      ":root{--a:1}",
      await read("quicklook/quicklook.css"),
      await read("popup/spec-sheet.css"),
      await read("popup/spec-sheet-wide.css"),
    );
    expect(sheet.indexOf(":host{--a:1}")).toBe(0);
    expect(sheet.indexOf(".layer")).toBeLessThan(sheet.indexOf(".spec-view .spec-sheet-tools"));
    expect(sheet).toContain("container-type: inline-size");
    expect(sheet).toContain("@container (min-width: 720px)");
  });

  test("spec rules never target the dialog's .card class", async () => {
    const specCss = (await read("popup/spec-sheet.css")) + (await read("popup/spec-sheet-wide.css"));
    const rulesOnly = specCss.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(rulesOnly).not.toMatch(/\.card\b/);
  });
});
